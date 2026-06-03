<script setup lang="ts">
import type { GroupedCards } from '../domain/card';
import type { ISODate } from '../domain/types';
import CardListItem from './CardListItem.vue';

const props = defineProps<{
  grouped: GroupedCards;
  selectedId: string | null;
  todayDate: ISODate;
}>();
const emit = defineEmits<{ select: [id: string] }>();

// 卡片视图只展示进行中两组；已解决卡片归档到「归档」视图。
const isEmpty = () =>
  props.grouped.pending.length === 0 &&
  props.grouped.reflectedToday.length === 0;
</script>

<template>
  <div class="list">
    <section v-if="grouped.pending.length">
      <h3 class="group-title pending">今日待回顾 · {{ grouped.pending.length }}</h3>
      <CardListItem
        v-for="c in grouped.pending"
        :key="c.id"
        :card="c"
        :today-date="todayDate"
        :selected="c.id === selectedId"
        @select="emit('select', $event)"
      />
    </section>

    <section v-if="grouped.reflectedToday.length">
      <h3 class="group-title">进行中 · 今日已反思</h3>
      <CardListItem
        v-for="c in grouped.reflectedToday"
        :key="c.id"
        :card="c"
        :today-date="todayDate"
        :selected="c.id === selectedId"
        @select="emit('select', $event)"
      />
    </section>

    <p v-if="isEmpty()" class="empty">还没有进行中的卡片。在右下角写下第一个问题吧。</p>
  </div>
</template>

<style scoped>
.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px 16px;
}
section {
  margin-bottom: 14px;
}
.group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: none;
  margin: 8px 6px 4px;
  letter-spacing: 0.02em;
}
.group-title.pending {
  color: var(--pending);
}
.group-title.resolved {
  color: var(--resolved);
}
.empty {
  color: var(--ink-soft);
  font-size: 13px;
  padding: 24px 12px;
  text-align: center;
  line-height: 1.6;
}
</style>
