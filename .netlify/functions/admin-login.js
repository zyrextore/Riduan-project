import crypto from 'node:crypto';
import { issueSession } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const password = String(body.password || '');
  const expected = String(process.env.ZYREX_ADMIN_PASSWORD || '');
  if (!expected || !process.env.ZYREX_ADMIN_SESSION_SECRET) return res.status(503).json({ ok:false, error:'Admin authentication is not configured' });
  const a = crypto.createHash('sha256').update(password).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a,b)) return res.status(401).json({ ok:false, error:'Password salah' });
  issueSession(res);
  return res.status(200).json({ ok:true });
}
