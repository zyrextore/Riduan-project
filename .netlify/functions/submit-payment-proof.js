import { uploadFile } from './_storage.js';
import { redisCommand, hasRedis } from './_redis.js';
import { verifyAccessCode } from './_auth.js';

const allowed = new Set(['image/jpeg','image/png','image/webp']);
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Method not allowed'});
  if(!hasRedis()) return res.status(503).json({ok:false,error:'Database belum dikonfigurasi'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const id=String(body.orderId||'').trim().toUpperCase(), code=String(body.accessCode||'').trim().toUpperCase();
    const info=body.customerInfo||{};
    const dataUrl=String(body.proofImage||'');
    if(!/^ZX-\d{8}-[A-Z0-9]+$/.test(id)||!code) return res.status(400).json({ok:false,error:'Order atau access code tidak valid'});
    const raw=await redisCommand('GET',`zyrex:order:${id}`); if(!raw) return res.status(404).json({ok:false,error:'Order tidak ditemukan'});
    const order=JSON.parse(raw); if(!verifyAccessCode(code,order.accessCodeHash)) return res.status(403).json({ok:false,error:'Access code salah'});
    if(!['PENDING PAYMENT','PENDING VERIFICATION','REJECTED'].includes(order.status)) return res.status(409).json({ok:false,error:'Order sudah diproses dan tidak menerima bukti baru'});
    const match=dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/); if(!match||!allowed.has(match[1])) return res.status(400).json({ok:false,error:'Format bukti pembayaran tidak valid'});
    const buffer=Buffer.from(match[2],'base64'); if(buffer.length>5*1024*1024) return res.status(400).json({ok:false,error:'Ukuran file maksimal 5MB'});
    if(!process.env.STORAGE_TYPE) return res.status(503).json({ok:false,error:'Storage bukti pembayaran belum dikonfigurasi (STORAGE_TYPE)'});
    const ext=match[1].split('/')[1].replace('jpeg','jpg');
    const blob=await uploadFile(`zyrex/payment-proofs/${id}-${Date.now()}.${ext}`,buffer,{contentType:match[1]});
    const now=new Date().toISOString();
    order.customerName=String(info.name||'').trim().slice(0,100); order.customerWhatsapp=String(info.phone||'').trim().slice(0,30); order.customerEmail=''; order.customer={name:order.customerName,whatsapp:order.customerWhatsapp,note:String(info.note||'').trim().slice(0,500)};
    order.proofUrl=blob.url; order.paymentStatus='PENDING VERIFICATION'; order.orderStatus='PAYMENT SUBMITTED'; order.status='PENDING VERIFICATION'; order.updatedAt=now;
    order.activityLog=Array.isArray(order.activityLog)?order.activityLog:[]; order.activityLog.unshift({action:'PAYMENT_SUBMITTED',timestamp:now,actor:'CUSTOMER'}); order.activityLog=order.activityLog.slice(0,50);
    await redisCommand('SET',`zyrex:order:${id}`,JSON.stringify(order));
    return res.status(200).json({ok:true,orderId:id,status:order.status,proofUrl:blob.url});
  }catch(e){console.error(e);return res.status(500).json({ok:false,error:'Gagal menyimpan bukti pembayaran'});}
}
