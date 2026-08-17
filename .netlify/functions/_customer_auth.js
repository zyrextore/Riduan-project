import crypto from 'node:crypto';

const cookieName = 'zyrex_customer_session';
const secret = () => process.env.ZYREX_CUSTOMER_SESSION_SECRET || process.env.ZYREX_ADMIN_SESSION_SECRET || '';
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('hex');

// ---- password hashing (scrypt, built into Node — no extra dependency needed) ----
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex'), b = Buffer.from(check, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- session cookie (signed, HttpOnly). Payload carries the user's email. ----
export function issueCustomerSession(res, email) {
  if (!secret()) throw new Error('Customer session secret is not configured');
  const payload = `${email}:${Date.now()}:${crypto.randomBytes(12).toString('hex')}`;
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
}

export function clearCustomerSession(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function getCustomerEmail(req) {
  if (!secret()) return null;
  const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`));
  if (!cookie) return null;
  const token = decodeURIComponent(cookie.slice(cookieName.length + 1));
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  let payload;
  try { payload = Buffer.from(encoded, 'base64url').toString('utf8'); } catch { return null; }
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const [email, createdRaw] = payload.split(':');
  const created = Number(createdRaw);
  if (!Number.isFinite(created) || Date.now() - created > 30 * 24 * 60 * 60 * 1000) return null;
  return email || null;
}

export function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
