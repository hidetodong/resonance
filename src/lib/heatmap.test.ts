import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HeatmapAggregate } from '../domain/card.ts';
import { buildHeatGrid } from './heatmap.ts';

function agg(over: Partial<HeatmapAggregate> = {}): HeatmapAggregate {
  return {
    counts: over.counts ?? {},
    total: over.total ?? 0,
    firstDate: over.firstDate ?? null,
    lastDate: over.lastDate ?? null,
  };
}

test('buildHeatGrid: 无反思 → empty、cells 空', () => {
  const g = buildHeatGrid(agg(), '2026-06-03');
  assert.equal(g.empty, true);
  assert.deepEqual(g.cells, []);
  assert.equal(g.leadingBlanks, 0);
});

test('buildHeatGrid: cells 数=天数、leadingBlanks=首日星期、四档 level', () => {
  const g = buildHeatGrid(
    agg({
      counts: { '2026-06-01': 1, '2026-06-02': 2, '2026-06-03': 5 },
      total: 8,
      firstDate: '2026-06-01',
      lastDate: '2026-06-03',
    }),
    '2026-06-03',
  );
  assert.equal(g.cells.length, 3); // 06-01..06-03
  assert.equal(g.leadingBlanks, weekdayOf('2026-06-01')); // 周一 = 1
  assert.equal(g.cells[0].level, 1); // 1 次
  assert.equal(g.cells[1].level, 2); // 2 次
  assert.equal(g.cells[2].level, 3); // >=3 次封顶
  assert.equal(g.max, 5);
  assert.equal(g.empty, false);
});

test('buildHeatGrid: 窗口延伸到 today，空日 level=0', () => {
  const g = buildHeatGrid(
    agg({ counts: { '2026-06-01': 1 }, total: 1, firstDate: '2026-06-01', lastDate: '2026-06-01' }),
    '2026-06-04',
  );
  assert.equal(g.cells.length, 4); // 06-01..06-04（含无反思的尾部）
  assert.equal(g.cells[0].level, 1);
  assert.equal(g.cells[3].count, 0);
  assert.equal(g.cells[3].level, 0);
});

// 06-01 是周一 → 1
function weekdayOf(_d: string): number {
  return 1;
}
