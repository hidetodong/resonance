import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, weekdayIndex, eachDayInclusive } from './date.ts';

test('addDays: 正常 / 跨月 / 跨年 / 负数', () => {
  assert.equal(addDays('2026-06-03', 1), '2026-06-04');
  assert.equal(addDays('2026-05-31', 1), '2026-06-01'); // 跨月
  assert.equal(addDays('2026-12-31', 1), '2027-01-01'); // 跨年
  assert.equal(addDays('2026-06-03', -3), '2026-05-31'); // 负数跨月
  assert.equal(addDays('2026-06-03', 0), '2026-06-03');
});

test('weekdayIndex: 0=周日 … 6=周六', () => {
  assert.equal(weekdayIndex('2026-06-07'), 0); // 周日
  assert.equal(weekdayIndex('2026-06-08'), 1); // 周一
  assert.equal(weekdayIndex('2026-06-03'), 3); // 周三
});

test('eachDayInclusive: 含两端、跨月、from>to 空', () => {
  assert.deepEqual(eachDayInclusive('2026-06-01', '2026-06-03'), [
    '2026-06-01',
    '2026-06-02',
    '2026-06-03',
  ]);
  assert.equal(eachDayInclusive('2026-05-30', '2026-06-02').length, 4); // 跨月
  assert.deepEqual(eachDayInclusive('2026-06-03', '2026-06-03'), ['2026-06-03']); // 单日
  assert.deepEqual(eachDayInclusive('2026-06-05', '2026-06-01'), []); // 逆序
});
