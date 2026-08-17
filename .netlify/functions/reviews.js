import { redisCommand, hasRedis } from './_redis.js';
import { getCustomerEmail } from './_customer_auth.js';

const validPid = (p) => /^[a-z0-9-]{1,60}$/.test(String(p || ''));

export default async function handler(req, res) {
  if (!hasRedis()) return res.status(503).json({ ok: false, error: 'Review belum dikonfigurasi di server.' });

  if (req.method === 'GET') {
    const pid = String(req.query?.product || '');
    if (!validPid(pid)) return res.status(400).json({ ok: false, error: 'Produk tidak valid.' });
    const raw = await redisCommand('LRANGE', `zx:reviews:${pid}`, 0, 99) || [];
    const reviews = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
    const count = reviews.length;
    const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
    return res.status(200).json({ ok: true, avg, count, reviews });
  }

  if (req.method === 'POST') {
    const email = getCustomerEmail(req);
    if (!email) return res.status(401).json({ ok: false, error: 'Login dulu untuk kasih ulasan.' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const pid = String(body.product || '');
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating || 0))));
    const comment = String(body.comment || '').trim().slice(0, 400);
    const name = String(body.name || 'Pembeli ZYREX').trim().slice(0, 60);
    if (!validPid(pid)) return res.status(400).json({ ok: false, error: 'Produk tidak valid.' });
    if (!rating) return res.status(400).json({ ok: false, error: 'Rating wajib diisi (1-5).' });

    // one review per account per product: remove any prior review from this email first
    const existingRaw = await redisCommand('LRANGE', `zx:reviews:${pid}`, 0, 99) || [];
    const existing = existingRaw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
    const filtered = existing.filter(r => r.email !== email);
    const entry = { email, name, rating, comment, createdAt: new Date().toISOString() };
    filtered.unshift(entry);
    await redisCommand('DEL', `zx:reviews:${pid}`);
    for (const r of filtered.slice(0, 100).reverse()) {
      await redisCommand('RPUSH', `zx:reviews:${pid}`, JSON.stringify(r));
    }
    return res.status(200).json({ ok: true, review: entry });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
