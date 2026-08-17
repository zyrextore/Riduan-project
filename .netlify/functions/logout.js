import { clearCustomerSession } from './_customer_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  clearCustomerSession(res);
  return res.status(200).json({ ok: true });
}
