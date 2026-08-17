import { redisCommand, hasRedis } from './_redis.js';
import { getCustomerEmail } from './_customer_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const email = getCustomerEmail(req);
  if (!email || !hasRedis()) return res.status(200).json({ ok: false });

  const raw = await redisCommand('GET', `zx:user:${email}`);
  if (!raw) return res.status(200).json({ ok: false });
  const user = JSON.parse(raw);
  return res.status(200).json({ ok: true, user: { name: user.name, email: user.email } });
}
