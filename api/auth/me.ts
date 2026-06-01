import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, requireEnv } from '../_lib/auth';

/** GET /api/auth/me → {user:{email}} | 401。（dev 由 Vite 中间件回 {authDisabled:true}） */
export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const session = getSession(req, requireEnv('SESSION_SECRET'));
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.status(200).json({ user: { email: session.email } });
}
