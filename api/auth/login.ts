import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyPassword,
  signSession,
  sessionCookie,
  sessionExp,
  requireEnv,
  DUMMY_HASH,
} from '../../lib/server/auth';
import { readBody, isSecure } from '../../lib/server/http';
import { ensureSchema, findUserByEmail } from '../../lib/server/db';

interface Body {
  email?: string;
  password?: string;
}

/** POST /api/auth/login {email,password} → 200 {user} + Set-Cookie | 401。 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { email, password } = readBody<Body>(req);
  const e = (email ?? '').trim().toLowerCase();
  if (!e || !password) {
    res.status(400).json({ error: 'missing credentials' });
    return;
  }
  try {
    await ensureSchema();
    const user = await findUserByEmail(e);
    // 用户不存在也跑一次校验，抹平时序差，避免暴露邮箱是否注册。
    const ok = user
      ? verifyPassword(password, user.password_hash)
      : (verifyPassword(password, DUMMY_HASH), false);
    if (!user || !ok) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
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
