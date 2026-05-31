import type { AppData } from '../../domain/types';
import type { StorageAdapter } from '../storage';

/** dev 适配器：经 Vite dev 中间件读写本地 data/cards.json。 */
const ENDPOINT = '/api/cards';
const EMPTY: AppData = { version: 1, cards: [] };

export class FileAdapter implements StorageAdapter {
  async load(): Promise<AppData> {
    const res = await fetch(ENDPOINT);
    if (!res.ok) throw new Error(`加载失败: HTTP ${res.status}`);
    const data = (await res.json()) as Partial<AppData> | null;
    if (!data || !Array.isArray(data.cards)) return EMPTY;
    return { version: 1, cards: data.cards };
  }

  async save(data: AppData): Promise<void> {
    const res = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`保存失败: HTTP ${res.status}`);
  }
}
