import { redisCommand, hasRedis } from './_redis.js';
import { hashPassword, issueCustomerSession, normalizeEmail } from './_customer_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (!hasRedis()) return res.status(503).json({ ok: false, error: 'Akun belum dikonfigurasi di server (Redis belum tersambung).' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const name = String(body.name || '').trim().slice(0, 80);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!name) return res.status(400).json({ ok: false, error: 'Nama wajib diisi.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Email tidak valid.' });
  if (password.length < 6) return res.status(400).json({ ok: false, error: 'Password minimal 6 karakter.' });

  const key = `zx:user:${email}`;
  const existing = await redisCommand('GET', key);
  if (existing) return res.status(409).json({ ok: false, error: 'Email sudah terdaftar. Coba login.' });

  const user = { name, email, pass: hashPassword(password), createdAt: Date.now() };
  await redisCommand('SET', key, JSON.stringify(user));

  issueCustomerSession(res, email);
  return res.status(200).json({ ok: true, user: { name, email } });
}
