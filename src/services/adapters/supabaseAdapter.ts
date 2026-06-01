import type { AppData } from '../../domain/types';
import type { StorageAdapter } from '../storage';
import { supabase } from '../supabase';

/**
 * Supabase 云端存储：每个用户一行 jsonb（app_data.data 持有整包 AppData）。
 *
 * 表结构与 RLS（见 README / .ai/TECH_PLAN.md）：
 *   app_data(
 *     user_id uuid primary key references auth.users(id) on delete cascade,
 *     data jsonb not null default '{"version":1,"cards":[]}',
 *     updated_at timestamptz not null default now()
 *   )
 *   RLS: auth.uid() = user_id（select / insert / update）
 *
 * 需已登录；uid 取自当前会话。单行 jsonb 契合「整包 load/save」接口，拆表留作未来优化。
 */
const TABLE = 'app_data';
const EMPTY: AppData = { version: 1, cards: [] };

export class SupabaseAdapter implements StorageAdapter {
  private async uid(): Promise<string> {
    if (!supabase) throw new Error('Supabase 未配置。');
    const { data } = await supabase.auth.getUser();
    const id = data.user?.id;
    if (!id) throw new Error('未登录，无法访问云端数据。');
    return id;
  }

  async load(): Promise<AppData> {
    if (!supabase) throw new Error('Supabase 未配置。');
    const userId = await this.uid();
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`加载云端数据失败：${error.message}`);
    const payload = (data?.data ?? null) as Partial<AppData> | null;
    if (!payload || !Array.isArray(payload.cards)) return EMPTY;
    return { version: 1, cards: payload.cards };
  }

  async save(appData: AppData): Promise<void> {
    if (!supabase) throw new Error('Supabase 未配置。');
    const userId = await this.uid();
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, data: appData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
    if (error) throw new Error(`保存到云端失败：${error.message}`);
  }
}
