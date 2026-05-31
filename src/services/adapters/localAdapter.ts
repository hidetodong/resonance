import type { AppData } from '../../domain/types';
import type { StorageAdapter } from '../storage';

/** 生产 / 静态适配器：浏览器 localStorage。可静态部署（Vercel）、手机开 URL 即用。 */
const KEY = 'resonance:data';
const EMPTY: AppData = { version: 1, cards: [] };

export class LocalAdapter implements StorageAdapter {
  async load(): Promise<AppData> {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    try {
      const data = JSON.parse(raw) as Partial<AppData> | null;
      if (!data || !Array.isArray(data.cards)) return EMPTY;
      return { version: 1, cards: data.cards };
    } catch {
      return EMPTY;
    }
  }

  async save(data: AppData): Promise<void> {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
}
