<script setup lang="ts">
import type { CardTypeFilter } from '../domain/card';
import { CARD_TYPE_LABELS } from '../domain/card';

const props = defineProps<{
  current: CardTypeFilter;
  counts: Record<CardTypeFilter, number>;
}>();
const emit = defineEmits<{ change: [filter: CardTypeFilter] }>();

const options: { value: CardTypeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'reflection', label: CARD_TYPE_LABELS.reflection },
  { value: 'thinking', label: CARD_TYPE_LABELS.thinking },
];
</script>

<template>
  <div class="filter" role="group" aria-label="按类型筛选">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="chip"
      :class="{ active: current === o.value }"
      @click="emit('change', o.value)"
    >
      {{ o.label }}
      <span class="n">{{ props.counts[o.value] }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  gap: 6px;
  padding: 8px 14px 4px;
}
.chip {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.chip:hover:not(:disabled) {
  border-color: var(--accent);
}
.chip.active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.n {
  font-size: 11px;
  opacity: 0.7;
}
</style>
