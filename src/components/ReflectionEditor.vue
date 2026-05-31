<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Card, ISODate, ReflectionDraft } from '../domain/types';
import { findTodayEntry } from '../domain/card';

const props = defineProps<{ card: Card; todayDate: ISODate }>();
const emit = defineEmits<{ save: [draft: ReflectionDraft] }>();

const thought = ref('');
const nextAction = ref('');

const todayEntry = computed(() => findTodayEntry(props.card, props.todayDate));
const hasToday = computed(() => todayEntry.value !== undefined);

function syncFromCard() {
  thought.value = todayEntry.value?.thought ?? '';
  nextAction.value = todayEntry.value?.nextAction ?? '';
}

// 切换卡片或当日条目变化（保存后）时，把草稿重置为已保存内容
watch(() => props.card.id, syncFromCard, { immediate: true });
watch(todayEntry, syncFromCard);

const canSave = computed(() => thought.value.trim().length > 0);
const dirty = computed(
  () =>
    thought.value.trim() !== (todayEntry.value?.thought ?? '') ||
    nextAction.value.trim() !== (todayEntry.value?.nextAction ?? ''),
);

function save() {
  if (!canSave.value) return;
  emit('save', { thought: thought.value, nextAction: nextAction.value });
}
</script>

<template>
  <div class="editor">
    <label class="field">
      <span class="field-label">想法 <em>必填</em></span>
      <textarea v-model="thought" rows="3" placeholder="对这个问题，今天的理解 / 现状审视…" />
    </label>

    <label class="field">
      <span class="field-label">明天就能开始的简单行动</span>
      <textarea v-model="nextAction" rows="2" placeholder="一个明天可落地的小动作（可留空）" />
    </label>

    <div class="editor-actions">
      <span class="hint">{{ hasToday ? '已写 · 可继续编辑覆盖' : '每天回顾一次' }}</span>
      <button class="primary" :disabled="!canSave || !dirty" @click="save">
        {{ hasToday ? '保存修改' : '保存今天的反思' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
}
.field {
  display: block;
  margin-bottom: 10px;
}
.field-label {
  display: block;
  font-size: 12px;
  color: var(--ink-soft);
  margin-bottom: 4px;
}
.field-label em {
  font-style: normal;
  color: var(--accent);
}
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.hint {
  font-size: 12px;
  color: var(--ink-soft);
}
</style>
