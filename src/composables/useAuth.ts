import { ref } from 'vue';

/** 当前登录用户（自建后端，仅暴露邮箱）。 */
export interface AuthUser {
  email: string;
}

// 模块级单例：认证态全局唯一真源，多处 useAuth() 共享。
const user = ref<AuthUser | null>(null);
const ready = ref(false);
const authDisabled = ref(false); // dev：后端无认证（Vite 中间件回 authDisabled）
const loading = ref(false);
const error = ref<string | null>(null);

let initialized = false;

/** 探测 /api/auth/me：决定是否需要登录 / 是否已登录 / dev 免认证。 */
async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const body = (await res.json()) as {
        authDisabled?: boolean;
        user?: AuthUser;
      };
      if (body.authDisabled) authDisabled.value = true;
      else if (body.user) user.value = body.user;
    }
    // 401 等 → 保持未登录，显示登录页
  } catch {
    // 网络异常 → 视为未登录
  } finally {
    ready.value = true;
  }
}

async function postJson(url: string, payload: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** 认证 composable：响应式态 + 登录/注册/退出。自建后端，弃 Supabase。 */
export function useAuth() {
  void init();

  async function signIn(email: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await postJson('/api/auth/login', {
        email: email.trim(),
        password,
      });
      if (!res.ok) {
        error.value = '登录失败：邮箱或密码不正确。';
        return false;
      }
      const body = (await res.json()) as { user: AuthUser };
      user.value = body.user;
      return true;
    } catch {
      error.value = '登录失败：网络异常，请稍后重试。';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(
    email: string,
    password: string,
    invite: string,
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await postJson('/api/auth/register', {
        email: email.trim(),
        password,
        invite: invite.trim(),
      });
      if (!res.ok) {
        error.value =
          res.status === 403
            ? '创建失败：邀请码无效或注册已关闭。'
            : res.status === 409
              ? '创建失败：该邮箱已注册，请直接登录。'
              : res.status === 400
                ? '创建失败：邮箱格式不正确，或密码少于 8 位。'
                : '创建失败：请稍后重试。';
        return false;
      }
      const body = (await res.json()) as { user: AuthUser };
      user.value = body.user;
      return true;
    } catch {
      error.value = '创建失败：网络异常，请稍后重试。';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function signOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      user.value = null;
    }
  }

  return { user, ready, authDisabled, loading, error, signIn, register, signOut };
}
