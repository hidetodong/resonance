<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { signIn, loading, error } = useAuth();
const email = ref('');
const password = ref('');

async function submit() {
  if (!email.value.trim() || !password.value) return;
  await signIn(email.value, password.value);
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="submit">
      <h1 class="brand">Resonance · 睿所纳思</h1>
      <p class="tagline">登录以查看你的反思</p>

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
          autocomplete="current-password"
          placeholder="••••••••"
        />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button
        class="primary"
        type="submit"
        :disabled="loading || !email.trim() || !password"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>

      <p class="note">仅限站主访问 · 无开放注册</p>
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
.note {
  margin: 16px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--ink-soft);
}
</style>
