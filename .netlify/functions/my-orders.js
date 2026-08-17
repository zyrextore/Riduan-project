import { redisCommand, hasRedis } from './_redis.js';
import { getCustomerEmail } from './_customer_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const email = getCustomerEmail(req);
  if (!email) return res.status(401).json({ ok: false, error: 'Belum login.' });
  if (!hasRedis()) return res.status(503).json({ ok: false, error: 'Riwayat order belum dikonfigurasi di server.' });

  try {
    const ids = await redisCommand('LRANGE', `zx:user-orders:${email}`, 0, 49) || [];
    const orders = [];
    for (const id of ids) {
      const raw = await redisCommand('GET', `zyrex:order:${id}`);
      if (!raw) continue;
      const o = JSON.parse(raw);
      orders.push({ orderId: o.orderId, status: o.status, total: o.total, itemCount: (o.items || []).length, createdAt: o.createdAt });
    }
    return res.status(200).json({ ok: true, orders });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Gagal mengambil riwayat order.' });
  }
}
