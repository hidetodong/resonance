import type { AppData } from '../../domain/types';
import type { StorageAdapter } from '../storage';

/**
 * 预留：Supabase 云端存储适配器（接入跨设备同步时实现，本轮仅占位）。
 *
 * 目标表结构（单用户起步，后续可加 auth + RLS）：
 *   cards(id uuid primary key, question text, created_at date, status text)
 *   reflection_entries(
 *     card_id uuid references cards(id) on delete cascade,
 *     date date, thought text, next_action text,
 *     primary key (card_id, date)
 *   )
 *
 * 启用方式：
 *   1. 接入 supabase-js 客户端（环境变量注入 url / anon key）。
 *   2. load：联表聚合为 AppData（cards + 各自 entries 按 date 升序）。
 *   3. save：对 cards / reflection_entries 做 upsert，并删除已不存在的行。
 *   4. 在 services/storage.ts 的 createStorage() 中替换为 new SupabaseAdapter()。
 */
const NOT_IMPLEMENTED =
  'SupabaseAdapter 尚未实现：本轮仅预留接口。接入时请按文件头注释建表并实现 load/save。';

export class SupabaseAdapter implements StorageAdapter {
  async load(): Promise<AppData> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async save(_data: AppData): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
