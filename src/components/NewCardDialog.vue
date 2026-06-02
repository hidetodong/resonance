<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { CardType } from '../domain/types';
import { CARD_TYPES, CARD_TYPE_LABELS, DEFAULT_CARD_TYPE } from '../domain/card';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ create: [question: string, type: CardType]; cancel: [] }>();

const text = ref('');
const type = ref<CardType>(DEFAULT_CARD_TYPE);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// 打开时清空、复位类型并自动聚焦
watch(
  () => props.open,
  (open) => {
    if (open) {
      text.value = '';
      type.value = DEFAULT_CARD_TYPE;
      nextTick(() => inputRef.value?.focus());
    }
  },
);

function submit() {
  const q = text.value.trim();
  if (!q) return;
  emit('create', q, type.value);
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
      <div class="type-pick" role="group" aria-label="卡片类型">
        <button
          v-for="t in CARD_TYPES"
          :key="t"
          type="button"
          class="seg"
          :class="{ active: type === t }"
          @click="type = t"
        >
          {{ CARD_TYPE_LABELS[t] }}
        </button>
      </div>
      <p class="type-hint">
        {{ type === 'reflection' ? '审视已存在的现状 / 旧问题' : '面向新的问题或新想法' }}
      </p>
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
.type-pick {
  display: inline-flex;
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px;
  gap: 2px;
}
.seg {
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  padding: 4px 16px;
  border-radius: 999px;
}
.seg.active {
  background: var(--accent);
  color: #fff;
}
.type-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
