import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  hashPassword,
  signSession,
  sessionCookie,
  sessionExp,
  safeEqual,
  requireEnv,
} from '../_lib/auth.js';
import { readBody, isSecure } from '../_lib/http.js';
import { ensureSchema, findUserByEmail, createUser } from '../_lib/db.js';

interface Body {
  email?: string;
  password?: string;
  invite?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** POST /api/auth/register {email,password,invite} → 200 {user}+Cookie | 403 | 409 | 400。 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const secret = process.env.REGISTER_SECRET;
  if (!secret) {
    res.status(403).json({ error: 'registration disabled' });
    return;
  }
  const { email, password, invite } = readBody<Body>(req);
  if (!invite || !safeEqual(invite, secret)) {
    res.status(403).json({ error: 'invalid invite code' });
    return;
  }
  const e = (email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(e)) {
    res.status(400).json({ error: 'invalid email' });
    return;
  }
  if (!password || password.length < MIN_PASSWORD) {
    res.status(400).json({ error: 'weak password' });
    return;
  }
  try {
    await ensureSchema();
    if (await findUserByEmail(e)) {
      res.status(409).json({ error: 'email exists' });
      return;
    }
    const user = await createUser(e, hashPassword(password));
    const token = signSession(
      { uid: user.id, email: user.email, exp: sessionExp() },
      requireEnv('SESSION_SECRET'),
    );
    res.setHeader('Set-Cookie', sessionCookie(token, isSecure(req)));
    res.status(200).json({ user: { email: user.email } });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
}
