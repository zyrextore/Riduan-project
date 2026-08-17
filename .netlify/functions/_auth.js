import crypto from 'node:crypto';

const cookieName = 'zyrex_admin_session';
const secret = () => process.env.ZYREX_ADMIN_SESSION_SECRET || '';
const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('hex');

export function issueSession(res) {
  if (!secret()) throw new Error('Admin session secret is not configured');
  const payload = `${Date.now()}:${crypto.randomBytes(18).toString('hex')}`;
  const token = `${payload}.${sign(payload)}`;
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

export function isAdmin(req) {
  if (!secret()) return false;
  const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`));
  if (!cookie) return false;
  const token = decodeURIComponent(cookie.slice(cookieName.length + 1));
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const created = Number(payload.split(':')[0]);
  return Number.isFinite(created) && Date.now() - created < 8 * 60 * 60 * 1000;
}

export function hashAccessCode(code) { return hash(String(code).trim().toUpperCase()); }
export function verifyAccessCode(code, storedHash) { return hashAccessCode(code) === String(storedHash || ''); }
