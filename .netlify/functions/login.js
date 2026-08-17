import { redisCommand, hasRedis } from './_redis.js';
import { verifyPassword, issueCustomerSession, normalizeEmail } from './_customer_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!hasRedis()) return res.status(503).json({ ok: false, error: 'Akun belum dikonfigurasi di server (Redis belum tersambung).' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  const raw = await redisCommand('GET', `zx:user:${email}`);
  if (!raw) return res.status(401).json({ ok: false, error: 'Email atau password salah.' });
  const user = JSON.parse(raw);
  if (!verifyPassword(password, user.pass)) return res.status(401).json({ ok: false, error: 'Email atau password salah.' });

  issueCustomerSession(res, email);
  return res.status(200).json({ ok: true, user: { name: user.name, email: user.email } });
}
