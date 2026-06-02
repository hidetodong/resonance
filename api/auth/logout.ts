import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCookie } from '../_lib/auth.js';
import { isSecure } from '../_lib/http.js';

/** POST /api/auth/logout → 200 + 清 Cookie。 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  res.setHeader('Set-Cookie', clearCookie(isSecure(req)));
  res.status(200).json({ ok: true });
}
