import type { ISODate } from '../domain/types';
import type { HeatmapAggregate } from '../domain/card';
import { eachDayInclusive, weekdayIndex } from './date.ts';

/** 色阶四档：0=无反思、1=1 次、2=2 次、3=3 次及以上。 */
export type HeatLevel = 0 | 1 | 2 | 3;

export interface HeatCell {
  date: ISODate;
  count: number;
  level: HeatLevel;
}

export interface HeatGrid {
  /** firstDate..today 每日一格（按日升序）。 */
  cells: HeatCell[];
  /** 首日所在列之前的空格数 = weekdayIndex(firstDate)，用于周日起首对齐。 */
  leadingBlanks: number;
  /** 单日最大反思数。 */
  max: number;
  /** 反思条目总数。 */
  total: number;
  /** 无任何反思记录。 */
  empty: boolean;
}

/** count → 固定四档色阶。 */
function levelOf(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

/**
 * 把热力聚合铺成「从首条反思至今」的日历网格。
 * 窗口 = firstDate..today（自适应滚动）；无反思则 empty=true、cells 空。
 */
export function buildHeatGrid(agg: HeatmapAggregate, today: ISODate): HeatGrid {
  if (agg.firstDate === null) {
    return { cells: [], leadingBlanks: 0, max: 0, total: 0, empty: true };
  }
  // 窗口结尾取 max(today, lastDate)，避免本机日期早于数据时丢格。
  const end = today >= agg.firstDate ? today : agg.firstDate;
  const days = eachDayInclusive(agg.firstDate, end);
  let max = 0;
  const cells: HeatCell[] = days.map((date) => {
    const count = agg.counts[date] ?? 0;
    if (count > max) max = count;
    return { date, count, level: levelOf(count) };
  });
  return {
    cells,
    leadingBlanks: weekdayIndex(agg.firstDate),
    max,
    total: agg.total,
    empty: agg.total === 0,
  };
}
