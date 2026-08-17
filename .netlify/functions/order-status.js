import { redisCommand, hasRedis } from './_redis.js';
import { verifyAccessCode } from './_auth.js';
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
  const id=String(req.query?.id||'').trim().toUpperCase(), token=String(req.query?.token||'').trim().toUpperCase();
  if(!id||!token)return res.status(400).json({ok:false,error:'Order ID dan access code wajib diisi'});
  if(!hasRedis())return res.status(503).json({ok:false,error:'Cloud order storage belum dikonfigurasi'});
  try{const raw=await redisCommand('GET',`zyrex:order:${id}`);if(!raw)return res.status(404).json({ok:false,error:'Order tidak ditemukan'});const order=JSON.parse(raw);if(!verifyAccessCode(token,order.accessCodeHash))return res.status(403).json({ok:false,error:'Access code salah'});delete order.accessCodeHash;return res.status(200).json({ok:true,order});}catch(e){console.error(e);return res.status(500).json({ok:false,error:'Order lookup failed'});}
}
