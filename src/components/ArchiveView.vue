<script setup lang="ts">
import type { Card, ISODate } from '../domain/types';
import { reflectionCount, latestEntry } from '../domain/card';
import { formatFullDate } from '../lib/date';

defineProps<{ cards: Card[]; selectedId: string | null; todayDate: ISODate }>();
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <div class="archive">
    <p v-if="cards.length" class="arch-hint">已解决 · {{ cards.length }}</p>

    <ul v-if="cards.length" class="arch-list">
      <li v-for="c in cards" :key="c.id">
        <button
          type="button"
          class="arch-item"
          :class="{ selected: c.id === selectedId }"
          @click="emit('select', c.id)"
        >
          <span class="q">{{ c.question }}</span>
          <span v-if="latestEntry(c)" class="preview">{{ latestEntry(c)!.thought }}</span>
          <span class="meta">
            <span>反思 {{ reflectionCount(c) }} 次</span>
            <span class="dot">·</span>
            <span class="solved">{{
              c.resolvedAt ? formatFullDate(c.resolvedAt) + ' 解决' : '解决日期未知'
            }}</span>
          </span>
        </button>
      </li>
    </ul>

    <p v-else class="empty">还没有已解决的卡片。</p>
  </div>
</template>

<style scoped>
.arch-hint {
  font-size: 12px;
  color: var(--ink-soft);
  margin: 10px 12px 6px;
}
.arch-list {
  list-style: none;
  margin: 0;
  padding: 0 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.arch-item {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 9px 11px;
}
.arch-item:hover {
  border-color: var(--accent);
}
.arch-item.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.q {
  font-weight: 600;
  line-height: 1.35;
  color: var(--ink);
}
.preview {
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.meta {
  font-size: 12px;
  color: var(--ink-soft);
  display: flex;
  gap: 6px;
  align-items: center;
}
.solved {
  color: var(--resolved);
}
.dot {
  opacity: 0.5;
}
.empty {
  color: var(--ink-soft);
  font-size: 13px;
  padding: 40px 12px;
  text-align: center;
}
</style>
