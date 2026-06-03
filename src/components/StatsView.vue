<script setup lang="ts">
import { computed } from 'vue';
import type { ISODate } from '../domain/types';
import type { SolveStats } from '../domain/card';
import type { HeatGrid } from '../lib/heatmap';
import ReflectionHeatmap from './ReflectionHeatmap.vue';

const props = defineProps<{
  grid: HeatGrid;
  stats: SolveStats;
  todayDate: ISODate;
}>();

const avgText = computed(() => props.stats.average.toFixed(1));
function barWidth(cards: number): string {
  if (props.stats.maxCards === 0) return '0%';
  return `${Math.round((cards / props.stats.maxCards) * 100)}%`;
}
</script>

<template>
  <div class="stats">
    <ReflectionHeatmap :grid="grid" :today-date="todayDate" />

    <section class="solve">
      <h3>反思几次才解决</h3>

      <template v-if="stats.resolvedCount > 0">
        <div class="kpi">
          <span class="num">{{ avgText }}</span>
          <span class="unit">次</span>
          <span class="caption">平均反思后解决 · 共 {{ stats.resolvedCount }} 张已解决</span>
        </div>

        <ul class="hist">
          <li v-for="b in stats.distribution" :key="b.reflections" class="row">
            <span class="label">{{ b.reflections }} 次</span>
            <span class="track">
              <span class="bar" :style="{ width: barWidth(b.cards) }" />
            </span>
            <span class="freq">{{ b.cards }}</span>
          </li>
        </ul>
      </template>

      <p v-else class="empty">暂无足够已解决卡片——解决一个问题后，这里会显示反思次数的分布。</p>
    </section>
  </div>
</template>

<style scoped>
.stats {
  max-width: 720px;
  margin: 0 auto;
  padding: 22px 24px 56px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.solve h3 {
  font-size: 15px;
  margin: 0 0 12px;
}
.kpi {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.num {
  font-size: 34px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}
.unit {
  font-size: 16px;
  color: var(--accent);
}
.caption {
  font-size: 12px;
  color: var(--ink-soft);
  margin-left: 8px;
}
.hist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  flex: none;
  width: 44px;
  font-size: 12px;
  color: var(--ink-soft);
  text-align: right;
}
.track {
  flex: 1;
  height: 16px;
  background: var(--heat-0);
  border-radius: 4px;
  overflow: hidden;
}
.bar {
  display: block;
  height: 100%;
  min-width: 3px;
  background: var(--accent);
  border-radius: 4px;
}
.freq {
  flex: none;
  width: 20px;
  font-size: 12px;
  color: var(--ink-soft);
}
.empty {
  color: var(--ink-soft);
  font-size: 13px;
  padding: 8px 0;
  line-height: 1.6;
}
</style>
