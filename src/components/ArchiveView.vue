<script setup lang="ts">
import { ref } from 'vue';
import type { Card, ISODate } from '../domain/types';
import { reflectionCount, latestEntry } from '../domain/card';
import { formatFullDate } from '../lib/date';

defineProps<{ cards: Card[]; todayDate: ISODate }>();
const emit = defineEmits<{ reopen: [id: string] }>();

const expanded = ref<Set<string>>(new Set());
function toggle(id: string): void {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}
</script>

<template>
  <div class="archive">
    <header class="archive-head">
      <h2>归档 · 已解决</h2>
      <p class="hint">标记为阶段性解决的问题收纳于此，可随时恢复。</p>
    </header>

    <ul v-if="cards.length" class="arch-list">
      <li v-for="c in cards" :key="c.id" class="arch-item" :class="{ open: expanded.has(c.id) }">
        <button class="arch-summary" type="button" @click="toggle(c.id)">
          <span class="chevron" aria-hidden="true">{{ expanded.has(c.id) ? '▾' : '▸' }}</span>
          <span class="body">
            <span class="q">{{ c.question }}</span>
            <span class="meta">
              <span class="count">反思 {{ reflectionCount(c) }} 次</span>
              <span class="dot">·</span>
              <span class="solved">{{
                c.resolvedAt ? formatFullDate(c.resolvedAt) + ' 解决' : '解决日期未知'
              }}</span>
            </span>
            <span v-if="latestEntry(c)" class="preview">{{ latestEntry(c)!.thought }}</span>
          </span>
        </button>

        <div v-if="expanded.has(c.id)" class="arch-detail">
          <ol v-if="c.entries.length" class="timeline">
            <li v-for="e in c.entries" :key="e.date" class="entry">
              <div class="entry-date">{{ formatFullDate(e.date) }}</div>
              <div class="entry-body">
                <p class="thought">{{ e.thought }}</p>
                <p v-if="e.nextAction" class="next-action">→ {{ e.nextAction }}</p>
              </div>
            </li>
          </ol>
          <p v-else class="empty-history">这张卡没有反思记录就直接解决了。</p>
          <div class="arch-actions">
            <button class="reopen" type="button" @click="emit('reopen', c.id)">恢复进行中</button>
          </div>
        </div>
      </li>
    </ul>

    <p v-else class="empty">还没有已解决的卡片。</p>
  </div>
</template>

<style scoped>
.archive {
  max-width: 720px;
  margin: 0 auto;
  padding: 22px 24px 56px;
}
.archive-head h2 {
  font-size: 18px;
  margin: 0;
}
.hint {
  margin: 4px 0 16px;
  font-size: 12px;
  color: var(--ink-soft);
}
.arch-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.arch-item {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  overflow: hidden;
}
.arch-summary {
  width: 100%;
  display: flex;
  gap: 8px;
  text-align: left;
  border: none;
  background: transparent;
  padding: 10px 12px;
}
.arch-summary:hover {
  background: #faf7f3;
}
.chevron {
  flex: none;
  color: var(--ink-soft);
  font-size: 12px;
  padding-top: 2px;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.q {
  font-size: 15px;
  color: var(--ink);
  line-height: 1.35;
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
.preview {
  font-size: 12px;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.arch-detail {
  padding: 4px 14px 14px 30px;
  border-top: 1px solid var(--line);
}
.timeline {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  border-left: 2px solid var(--line);
}
.entry {
  position: relative;
  padding: 0 0 18px 18px;
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
  border: 2px solid var(--resolved);
}
.entry-date {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  margin-bottom: 6px;
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
  margin: 12px 0 0;
}
.arch-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
.reopen {
  font-size: 12px;
  padding: 4px 12px;
}
.empty {
  color: var(--ink-soft);
  font-size: 13px;
  padding: 40px 12px;
  text-align: center;
}
</style>
