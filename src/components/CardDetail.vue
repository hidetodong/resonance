<script setup lang="ts">
import { computed } from 'vue';
import type { Card, CardType, ISODate, ReflectionDraft } from '../domain/types';
import { CARD_TYPES, CARD_TYPE_LABELS, historicalEntries } from '../domain/card';
import { formatDate, formatFullDate } from '../lib/date';
import ReflectionEditor from './ReflectionEditor.vue';

const props = defineProps<{ card: Card; todayDate: ISODate }>();
const emit = defineEmits<{
  save: [draft: ReflectionDraft];
  resolve: [];
  reopen: [];
  remove: [];
  'set-type': [type: CardType];
}>();

const history = computed(() => historicalEntries(props.card, props.todayDate));
const isResolved = computed(() => props.card.status === 'resolved');
// 已解决卡：整条时间线只读（含当日条目），按时间倒序，不再显示可编辑「今天」节点。
const timelineEntries = computed(() =>
  isResolved.value ? props.card.entries.slice().reverse() : history.value,
);
</script>

<template>
  <div class="detail">
    <header class="detail-head">
      <div class="title-row">
        <h2 class="question">{{ card.question }}</h2>
        <span class="status" :class="card.status">{{
          isResolved ? '阶段性解决' : '进行中'
        }}</span>
      </div>
      <div class="detail-toolbar">
        <div class="type-switch" role="group" aria-label="卡片类型">
          <button
            v-for="t in CARD_TYPES"
            :key="t"
            type="button"
            class="seg"
            :class="{ active: card.type === t }"
            @click="emit('set-type', t)"
          >
            {{ CARD_TYPE_LABELS[t] }}
          </button>
        </div>
        <button
          v-if="!isResolved"
          type="button"
          class="primary btn-resolve"
          @click="emit('resolve')"
        >
          标记阶段性解决
        </button>
        <button v-else type="button" class="btn-reopen" @click="emit('reopen')">
          恢复进行中
        </button>
      </div>
    </header>

    <ol class="timeline">
      <li v-if="!isResolved" class="entry today">
        <div class="entry-date">今天 · {{ formatDate(todayDate) }}</div>
        <ReflectionEditor
          :card="card"
          :today-date="todayDate"
          @save="emit('save', $event)"
        />
      </li>
      <li v-for="e in timelineEntries" :key="e.date" class="entry">
        <div class="entry-date">{{ formatFullDate(e.date) }}</div>
        <div class="entry-body">
          <p class="thought">{{ e.thought }}</p>
          <p v-if="e.nextAction" class="next-action">→ {{ e.nextAction }}</p>
        </div>
      </li>
    </ol>
    <p v-if="!timelineEntries.length" class="empty-history">
      {{ isResolved ? '这张卡没有反思记录就直接解决了。' : '还没有更早的反思——这条时间线从今天开始。' }}
    </p>

    <footer class="detail-foot">
      <button class="remove-link" @click="emit('remove')">删除这张卡片</button>
    </footer>
  </div>
</template>

<style scoped>
.detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 28px 56px;
}
.detail-head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}
.question {
  font-size: 20px;
  margin: 0;
  line-height: 1.35;
  min-width: 0;
}
.status {
  flex: none;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--ink-soft);
}
.status.open {
  color: var(--pending);
  border-color: #e7c9a8;
  background: #fbf2e8;
}
.status.resolved {
  color: var(--resolved);
  border-color: #bcd6c7;
  background: #eef5f0;
}
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
.btn-resolve {
  padding: 4px 16px;
  font-weight: 600;
  border-radius: 8px;
}
.btn-resolve::before {
  content: '✓';
  margin-right: 6px;
  font-size: 13px;
}
.btn-reopen {
  padding: 4px 16px;
  border-radius: 8px;
}
.type-switch {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px;
  gap: 2px;
}
.type-switch .seg {
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 999px;
}
.type-switch .seg.active {
  background: var(--accent);
  color: #fff;
}
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 2px solid var(--line);
}
.entry {
  position: relative;
  padding: 0 0 22px 20px;
}
.entry::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--panel);
  border: 2px solid var(--accent);
}
.entry.today::before {
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.entry-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 6px;
}
.entry.today > .entry-date {
  color: var(--accent);
}
.entry-body {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
}
.thought {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
.next-action {
  margin: 8px 0 0;
  color: var(--accent);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.empty-history {
  color: var(--ink-soft);
  font-size: 13px;
  margin: 0 0 0 20px;
}
.detail-foot {
  margin-top: 28px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: center;
}
.remove-link {
  border-color: transparent;
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  padding: 4px 10px;
}
.remove-link:hover:not(:disabled) {
  color: var(--danger);
  border-color: var(--danger);
}

@media (max-width: 720px) {
  .detail {
    padding: 6px 16px 48px;
  }
  .question {
    font-size: 18px;
  }
}
</style>
