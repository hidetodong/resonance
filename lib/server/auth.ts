import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

/**
 * 认证安全核心（纯函数，无 IO，可单测）：
 * - 密码：scrypt + 随机盐，校验走 timingSafeEqual。
 * - 会话：HMAC-SHA256 签名令牌（含 exp），承载于 httpOnly Cookie。
 * 不引第三方认证库，仅用 node:crypto。
 */

const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 天
const COOKIE_NAME = 'rsn_session';

/** 用户不存在时仍跑一次校验以抹平时序差（避免邮箱存在性侧信道）。 */
export const DUMMY_HASH = `scrypt$${'0'.repeat(SALT_BYTES * 2)}$${'0'.repeat(
  SCRYPT_KEYLEN * 2,
)}`;

export interface SessionPayload {
  uid: string;
  email: string;
  /** 过期时刻（Unix 秒）。 */
  exp: number;
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function sessionExp(): number {
  return nowSec() + SESSION_TTL_SEC;
}

/** 生成 "scrypt$<saltHex>$<hashHex>"。 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** 定时安全校验密码；格式异常或不匹配一律 false。 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/** 签发会话令牌 "<b64url(payload)>.<b64url(hmac)>"。 */
export function signSession(payload: SessionPayload, secret: string): string {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** 校验令牌：签名不符 / 过期 / 解析失败 → null。 */
export function verifySession(
  token: string,
  secret: string,
): SessionPayload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(body).digest();
  let got: Buffer;
  try {
    got = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8'),
    ) as SessionPayload;
    if (
      typeof payload.uid !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp < nowSec()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** 解析 Cookie 头为键值对。 */
export function parseCookie(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/** 组装会话 Set-Cookie；Secure 仅在 https 置位。 */
export function sessionCookie(token: string, secure: boolean): string {
  return cookieString(token, SESSION_TTL_SEC, secure);
}

/** 清除会话 Cookie。 */
export function clearCookie(secure: boolean): string {
  return cookieString('', 0, secure);
}

function cookieString(token: string, maxAge: number, secure: boolean): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/** 从请求取会话；无 Cookie / 无效 → null。身份只从此派生，绝不取请求体。 */
export function getSession(
  req: VercelRequest,
  secret: string,
): SessionPayload | null {
  const token = parseCookie(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  return verifySession(token, secret);
}

/** 定时安全的字符串相等（邀请码比较）。 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** 读必需 env，缺失即抛。 */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
