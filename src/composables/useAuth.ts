import { ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// 模块级单例：认证态全局唯一真源，多处调用 useAuth() 共享。
const user = ref<User | null>(null);
const ready = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

let initialized = false;

function init(): void {
  if (initialized) return;
  initialized = true;
  if (!supabase) {
    ready.value = true; // 未配置 Supabase：无需认证，直接就绪
    return;
  }
  supabase.auth.getSession().then(({ data }) => {
    user.value = data.session?.user ?? null;
    ready.value = true;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });
}

/** 认证 composable：响应式 user/ready/loading/error + 登录/退出。 */
export function useAuth() {
  init();

  async function signIn(email: string, password: string): Promise<boolean> {
    if (!supabase) return false;
    loading.value = true;
    error.value = null;
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    loading.value = false;
    if (err) {
      error.value = '登录失败：邮箱或密码不正确。';
      return false;
    }
    return true;
  }

  async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
    user.value = null;
  }

  return { user, ready, loading, error, signIn, signOut };
}
