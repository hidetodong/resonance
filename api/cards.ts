import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, requireEnv } from '../lib/server/auth';
import { readBody } from '../lib/server/http';
import { ensureSchema, loadData, saveData } from '../lib/server/db';
import type { AppData } from '../src/domain/types';

/**
 * GET  /api/cards → 200 AppData
 * PUT  /api/cards (body: AppData) → 200 {ok:true}
 * 均需有效会话 Cookie；身份只从会话派生，按 user_id 行隔离；无会话 → 401。
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const session = getSession(req, requireEnv('SESSION_SECRET'));
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    await ensureSchema();
    if (req.method === 'GET') {
      const data = await loadData(session.uid);
      res.status(200).json(data);
      return;
    }
    if (req.method === 'PUT') {
      const body = readBody<Partial<AppData>>(req);
      if (!body || !Array.isArray(body.cards)) {
        res.status(400).json({ error: 'invalid body' });
        return;
      }
      await saveData(session.uid, { version: 1, cards: body.cards });
      res.status(200).json({ ok: true });
      return;
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
}
