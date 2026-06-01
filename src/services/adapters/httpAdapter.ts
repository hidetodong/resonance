import type { AppData } from '../../domain/types';
import type { StorageAdapter } from '../storage';
import { AuthError } from '../authError';

/**
 * 统一存储适配器：读写 `/api/cards`（GET/PUT，带 Cookie）。
 * - `pnpm dev`：由 Vite 中间件应答（本地 data/cards.json，免登录）。
 * - `vercel dev` / 线上：由 Vercel 函数应答（认证 + Neon Postgres）。
 * 401 → 抛 AuthError，供上层回登录页。
 */
const ENDPOINT = '/api/cards';
const EMPTY: AppData = { version: 1, cards: [] };

export class HttpAdapter implements StorageAdapter {
  async load(): Promise<AppData> {
    const res = await fetch(ENDPOINT, { credentials: 'include' });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error(`加载失败: HTTP ${res.status}`);
    const data = (await res.json()) as Partial<AppData> | null;
    if (!data || !Array.isArray(data.cards)) return EMPTY;
    return { version: 1, cards: data.cards };
  }

  async save(data: AppData): Promise<void> {
    const res = await fetch(ENDPOINT, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 401) throw new AuthError();
    if (!res.ok) throw new Error(`保存失败: HTTP ${res.status}`);
  }
}
