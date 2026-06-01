import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** 是否已配置 Supabase。配了才启用登录 + 云端存储；否则本地回退（文件 / localStorage）。 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Supabase 客户端单例；未配置时为 null（纯本地形态不需要）。
 * anon key 前端公开属预期，数据隔离由 RLS 保证。
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url as string, anonKey as string)
  : null;
