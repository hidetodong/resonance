<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { signIn, register, loading, error } = useAuth();

type Mode = 'login' | 'register';
const mode = ref<Mode>('login');
const email = ref('');
const password = ref('');
const invite = ref('');

const isRegister = computed(() => mode.value === 'register');
const canSubmit = computed(
  () =>
    !!email.value.trim() &&
    !!password.value &&
    (!isRegister.value || !!invite.value.trim()),
);

async function submit() {
  if (!canSubmit.value) return;
  if (isRegister.value) {
    await register(email.value, password.value, invite.value);
  } else {
    await signIn(email.value, password.value);
  }
}

function toggleMode() {
  mode.value = isRegister.value ? 'login' : 'register';
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="submit">
      <h1 class="brand">Resonance · 睿所纳思</h1>
      <p class="tagline">
        {{ isRegister ? '凭邀请码创建你的账号' : '登录以查看你的反思' }}
      </p>

      <label class="field">
        <span class="label">邮箱</span>
        <input
          v-model="email"
          type="email"
          autocomplete="username"
          placeholder="you@example.com"
        />
      </label>

      <label class="field">
        <span class="label">密码</span>
        <input
          v-model="password"
          type="password"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          :placeholder="isRegister ? '至少 8 位' : '••••••••'"
        />
      </label>

      <label v-if="isRegister" class="field">
        <span class="label">邀请码</span>
        <input
          v-model="invite"
          type="password"
          autocomplete="off"
          placeholder="站主设置的注册邀请码"
        />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="primary" type="submit" :disabled="loading || !canSubmit">
        {{
          loading
            ? isRegister
              ? '创建中…'
              : '登录中…'
            : isRegister
              ? '创建账号'
              : '登录'
        }}
      </button>

      <button class="switch" type="button" @click="toggleMode">
        {{ isRegister ? '已有账号？去登录' : '首次创建账号（需邀请码）' }}
      </button>

      <p class="note">仅限站主访问 · 注册需邀请码</p>
    </form>
  </div>
</template>

<style scoped>
.login {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: min(360px, 100%);
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 28px 26px;
  display: flex;
  flex-direction: column;
}
.brand {
  margin: 0;
  font-size: 19px;
  letter-spacing: 0.04em;
  color: var(--accent);
}
.tagline {
  margin: 6px 0 20px;
  font-size: 13px;
  color: var(--ink-soft);
}
.field {
  display: block;
  margin-bottom: 12px;
}
.label {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  margin-bottom: 4px;
}
.error {
  margin: 2px 0 10px;
  color: var(--danger);
  font-size: 13px;
}
.primary {
  margin-top: 6px;
  padding: 9px;
  font-size: 14px;
}
.switch {
  margin-top: 10px;
  border-color: transparent;
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  padding: 4px;
}
.switch:hover:not(:disabled) {
  color: var(--accent);
  border-color: transparent;
}
.note {
  margin: 14px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--ink-soft);
}
</style>
