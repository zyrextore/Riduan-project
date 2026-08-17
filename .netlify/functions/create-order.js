import crypto from 'node:crypto';
import { redisCommand, hasRedis } from './_redis.js';
import { hashAccessCode } from './_auth.js';
import { getCustomerEmail } from './_customer_auth.js';

const makeId = () => `ZX-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const makeAccessCode = () => crypto.randomBytes(6).toString('hex').toUpperCase();

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const items=Array.isArray(body.items)?body.items.map(x=>({name:String(x.name||'').slice(0,120),price:Number(x.price||0),qty:Math.max(1,Math.min(99,Number(x.qty||1))) })).filter(x=>x.name&&Number.isFinite(x.price)&&x.price>=0):[];
    if(!items.length) return res.status(400).json({ok:false,error:'Cart kosong'});
    const total=items.reduce((s,x)=>s+x.price*x.qty,0);
    if(Number(body.total)!==total) return res.status(400).json({ok:false,error:'Total order tidak valid'});
    const orderId=makeId(); const accessCode=makeAccessCode(); const now=new Date().toISOString();
    const ownerEmail=getCustomerEmail(req)||'';
    const order={orderId,invoiceId:`INV-${orderId}`,ownerEmail,customerName:'',customerEmail:'',customerWhatsapp:'',items,total,paymentMethod:'QRIS',paymentStatus:'PENDING',orderStatus:'ORDER CREATED',status:'PENDING PAYMENT',proofUrl:null,accessCodeHash:hashAccessCode(accessCode),createdAt:now,updatedAt:now,activityLog:[{action:'ORDER_CREATED',timestamp:now,actor:'CUSTOMER'}]};
    let storage='local';
    if(hasRedis()) {
      try {
        await redisCommand('SET',`zyrex:order:${orderId}`,JSON.stringify(order));
        if(ownerEmail){
          await redisCommand('LPUSH',`zx:user-orders:${ownerEmail}`,orderId);
          await redisCommand('LTRIM',`zx:user-orders:${ownerEmail}`,0,49);
        }
        storage='cloud';
      } catch (redisError) {
        console.error('ZYREX Redis unavailable; continuing in local mode', redisError);
      }
    }
    return res.status(201).json({ok:true,storage,order:{...order,accessCode}});
  }catch(e){console.error(e);return res.status(500).json({ok:false,error:'Gagal membuat order'});}
}
