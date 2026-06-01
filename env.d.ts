/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 项目 URL（配置后启用登录 + 云端数据） */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase 公开 anon key（前端可见，靠 RLS 兜底） */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
