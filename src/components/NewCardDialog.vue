<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ create: [question: string]; cancel: [] }>();

const text = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

// 打开时清空并自动聚焦
watch(
  () => props.open,
  (open) => {
    if (open) {
      text.value = '';
      nextTick(() => inputRef.value?.focus());
    }
  },
);

function submit() {
  const q = text.value.trim();
  if (!q) return;
  emit('create', q);
}
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      @keydown.esc="emit('cancel')"
    >
      <h2 class="title">新建一个问题</h2>
      <textarea
        ref="inputRef"
        v-model="text"
        rows="3"
        placeholder="写下一个尚未解决的问题…"
        aria-label="新问题"
        @keydown.meta.enter="submit"
        @keydown.ctrl.enter="submit"
      />
      <div class="actions">
        <button @click="emit('cancel')">取消</button>
        <button class="primary" :disabled="!text.trim()" @click="submit">
          新建
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(40, 35, 30, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}
.dialog {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px 22px;
  width: min(440px, 92vw);
}
.title {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--accent);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
