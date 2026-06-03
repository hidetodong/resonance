<script setup lang="ts">
import type { ISODate } from '../domain/types';
import type { HeatGrid } from '../lib/heatmap';
import { formatFullDate } from '../lib/date';

const props = defineProps<{ grid: HeatGrid; todayDate: ISODate }>();

function cellTitle(date: ISODate, count: number): string {
  return `${formatFullDate(date)} · 反思 ${count} 次`;
}
</script>

<template>
  <section class="heat">
    <div class="heat-head">
      <h3>反思热力图</h3>
      <span v-if="!grid.empty" class="total">{{ grid.total }} 次反思</span>
    </div>

    <template v-if="!grid.empty">
      <div class="grid-wrap">
        <div class="grid">
          <span
            v-for="n in props.grid.leadingBlanks"
            :key="'b' + n"
            class="cell blank"
            aria-hidden="true"
          />
          <span
            v-for="c in props.grid.cells"
            :key="c.date"
            class="cell"
            :class="'lv' + c.level"
            :title="cellTitle(c.date, c.count)"
          />
        </div>
      </div>
      <div class="legend">
        <span>少</span>
        <span class="cell lv0" />
        <span class="cell lv1" />
        <span class="cell lv2" />
        <span class="cell lv3" />
        <span>多</span>
      </div>
    </template>

    <p v-else class="empty">还没有反思记录，开始你的第一次反思吧。</p>
  </section>
</template>

<style scoped>
.heat-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.heat-head h3 {
  font-size: 15px;
  margin: 0 0 10px;
}
.total {
  font-size: 12px;
  color: var(--ink-soft);
}
.grid-wrap {
  overflow-x: auto;
  padding-bottom: 4px;
}
.grid {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  grid-auto-columns: 13px;
  gap: 3px;
  width: max-content;
}
.cell {
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--heat-0);
}
.cell.blank {
  background: transparent;
}
.cell.lv0 {
  background: var(--heat-0);
}
.cell.lv1 {
  background: var(--heat-1);
}
.cell.lv2 {
  background: var(--heat-2);
}
.cell.lv3 {
  background: var(--heat-3);
}
.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--ink-soft);
}
.legend .cell {
  width: 11px;
  height: 11px;
}
.empty {
  color: var(--ink-soft);
  font-size: 13px;
  padding: 16px 0;
}
</style>
