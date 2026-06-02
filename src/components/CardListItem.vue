<script setup lang="ts">
import { computed } from 'vue';
import type { Card, ISODate } from '../domain/types';
import {
  CARD_TYPE_LABELS,
  lastReflectedDate,
  latestEntry,
  needsReviewToday,
  reflectionCount,
} from '../domain/card';
import { reviewFreshness } from '../lib/date';

const props = defineProps<{ card: Card; selected: boolean; todayDate: ISODate }>();
const emit = defineEmits<{ select: [id: string] }>();

const count = computed(() => reflectionCount(props.card));
const pending = computed(() => needsReviewToday(props.card, props.todayDate));
const freshness = computed(() =>
  reviewFreshness(lastReflectedDate(props.card), props.todayDate),
);
const preview = computed(() => latestEntry(props.card)?.thought ?? '');
</script>

<template>
  <button class="item" :class="{ selected }" @click="emit('select', card.id)">
    <div class="row1">
      <span class="q">{{ card.question }}</span>
      <span v-if="pending" class="badge">待回顾</span>
    </div>
    <p v-if="preview" class="preview">{{ preview }}</p>
    <div class="meta">
      <span class="type-tag" :class="card.type">{{ CARD_TYPE_LABELS[card.type] }}</span>
      <span class="dot">·</span>
      <span>反思 {{ count }} 次</span>
      <span class="dot">·</span>
      <span :class="{ stale: pending && count > 0 }">{{ freshness }}</span>
    </div>
  </button>
</template>

<style scoped>
.item {
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 11px;
  margin: 1px 0;
  background: transparent;
}
.item:hover {
  background: var(--accent-soft);
  border-color: transparent;
}
.item.selected {
  background: var(--accent-soft);
  border-color: var(--accent);
}
.row1 {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}
.q {
  font-weight: 600;
  line-height: 1.35;
}
.badge {
  flex: none;
  font-size: 11px;
  color: #fff;
  background: var(--pending);
  padding: 1px 7px;
  border-radius: 999px;
}
.preview {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  gap: 4px;
}
.type-tag {
  font-weight: 600;
}
.type-tag.reflection {
  color: var(--accent);
}
.type-tag.thinking {
  color: #3a7ca5;
}
.dot {
  opacity: 0.5;
}
.meta .stale {
  color: var(--pending);
}
</style>
