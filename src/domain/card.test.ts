import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AppData, Card } from './types.ts';
import {
  createCard,
  isCardType,
  coerceCardType,
  normalizeAppData,
  setCardType,
  filterCardsByType,
  countByType,
  markResolved,
  reopen,
  sortArchived,
  buildHeatmap,
  buildSolveStats,
  DEFAULT_CARD_TYPE,
  CARD_TYPE_LABELS,
} from './card.ts';
import type { ReflectionEntry } from './types.ts';

const TODAY = '2026-06-02';

/** 构造一张「合法」卡片。 */
function card(over: Partial<Card> = {}): Card {
  return {
    id: over.id ?? 'c1',
    question: over.question ?? 'q',
    createdAt: over.createdAt ?? TODAY,
    status: over.status ?? 'open',
    type: over.type ?? 'reflection',
    entries: over.entries ?? [],
  };
}

/** 模拟旧数据：缺 type 字段（增量6 之前的卡片）。 */
function legacyCard(): Card {
  return {
    id: 'old',
    question: '如何提高看书的效率',
    createdAt: '2026-05-31',
    status: 'open',
    entries: [],
  } as unknown as Card;
}

test('createCard: 默认类型 reflection、trim、初始态', () => {
  const c = createCard('  怎样保持专注  ', TODAY);
  assert.equal(c.question, '怎样保持专注');
  assert.equal(c.type, 'reflection');
  assert.equal(c.type, DEFAULT_CARD_TYPE);
  assert.equal(c.status, 'open');
  assert.deepEqual(c.entries, []);
});

test('createCard: 可显式指定 thinking', () => {
  const c = createCard('期权怎么定价', TODAY, 'thinking');
  assert.equal(c.type, 'thinking');
});

test('isCardType: 仅 reflection/thinking 为真', () => {
  assert.equal(isCardType('reflection'), true);
  assert.equal(isCardType('thinking'), true);
  assert.equal(isCardType('other'), false);
  assert.equal(isCardType(undefined), false);
  assert.equal(isCardType(null), false);
  assert.equal(isCardType(1), false);
});

test('coerceCardType: 合法保留、缺失/非法兜默认', () => {
  assert.equal(coerceCardType('thinking'), 'thinking');
  assert.equal(coerceCardType('reflection'), 'reflection');
  assert.equal(coerceCardType(undefined), DEFAULT_CARD_TYPE);
  assert.equal(coerceCardType('garbage'), DEFAULT_CARD_TYPE);
  assert.equal(coerceCardType(42), DEFAULT_CARD_TYPE);
});

test('normalizeAppData: 旧卡缺 type 兜默认、合法保留、脏值兜默认', () => {
  const dirty = { ...card({ id: 'd' }), type: 'weird' } as unknown as Card;
  const data: AppData = {
    version: 1,
    cards: [legacyCard(), card({ id: 'ok', type: 'thinking' }), dirty],
  };
  const out = normalizeAppData(data);
  assert.equal(out.version, 1);
  assert.equal(out.cards[0].type, DEFAULT_CARD_TYPE); // 旧卡补默认
  assert.equal(out.cards[1].type, 'thinking'); // 合法保留
  assert.equal(out.cards[2].type, DEFAULT_CARD_TYPE); // 脏值兜底
  // 不丢卡、不改其它字段
  assert.equal(out.cards.length, 3);
  assert.equal(out.cards[0].question, '如何提高看书的效率');
});

test('normalizeAppData: cards 非数组兜空、version 恒 1', () => {
  const bad = { version: 1, cards: undefined } as unknown as AppData;
  const out = normalizeAppData(bad);
  assert.deepEqual(out, { version: 1, cards: [] });
});

test('setCardType: 不可变更新，原对象不变', () => {
  const a = card({ type: 'reflection' });
  const b = setCardType(a, 'thinking');
  assert.equal(b.type, 'thinking');
  assert.equal(a.type, 'reflection'); // 原对象未被改
  assert.notEqual(a, b);
});

test('filterCardsByType: all 全返、按类型过滤', () => {
  const cards = [
    card({ id: 'r1', type: 'reflection' }),
    card({ id: 't1', type: 'thinking' }),
    card({ id: 'r2', type: 'reflection' }),
  ];
  assert.equal(filterCardsByType(cards, 'all').length, 3);
  assert.deepEqual(
    filterCardsByType(cards, 'reflection').map((c) => c.id),
    ['r1', 'r2'],
  );
  assert.deepEqual(
    filterCardsByType(cards, 'thinking').map((c) => c.id),
    ['t1'],
  );
});

test('countByType: all=总数、分类型计数', () => {
  const cards = [
    card({ id: 'r1', type: 'reflection' }),
    card({ id: 't1', type: 'thinking' }),
    card({ id: 'r2', type: 'reflection' }),
  ];
  assert.deepEqual(countByType(cards), { all: 3, reflection: 2, thinking: 1 });
  assert.deepEqual(countByType([]), { all: 0, reflection: 0, thinking: 0 });
});

test('CARD_TYPE_LABELS: 反思 / 探索', () => {
  assert.equal(CARD_TYPE_LABELS.reflection, '反思');
  assert.equal(CARD_TYPE_LABELS.thinking, '探索');
});

// ---- 增量7：resolvedAt / 归档 / 统计 ----

function entry(date: string, thought = 't'): ReflectionEntry {
  return { date, thought, nextAction: '' };
}

test('markResolved: 置 resolved 且记录 resolvedAt=今日', () => {
  const a = card({ status: 'open' });
  const b = markResolved(a, TODAY);
  assert.equal(b.status, 'resolved');
  assert.equal(b.resolvedAt, TODAY);
  assert.equal(a.status, 'open'); // 原对象不变
  assert.equal(a.resolvedAt, undefined);
});

test('reopen: 回 open 且清除 resolvedAt', () => {
  const a = markResolved(card(), TODAY);
  const b = reopen(a);
  assert.equal(b.status, 'open');
  assert.equal(b.resolvedAt, undefined);
});

test('normalizeAppData: resolvedAt 字符串保留、缺失/脏值兜 undefined', () => {
  const withDate = { ...card({ id: 'r' }), status: 'resolved', resolvedAt: '2026-06-01' } as Card;
  const dirty = { ...card({ id: 'd' }), status: 'resolved', resolvedAt: 123 } as unknown as Card;
  const data: AppData = { version: 1, cards: [withDate, dirty, legacyCard()] };
  const out = normalizeAppData(data);
  assert.equal(out.cards[0].resolvedAt, '2026-06-01'); // 合法保留
  assert.equal(out.cards[1].resolvedAt, undefined); // 脏值兜底
  assert.equal(out.cards[2].resolvedAt, undefined); // 旧卡缺失
  assert.equal(out.cards.length, 3); // 不丢卡
});

test('sortArchived: 仅 resolved、解决日降序、缺失排后', () => {
  const cards = [
    { ...card({ id: 'open' }), status: 'open' } as Card,
    { ...card({ id: 'a' }), status: 'resolved', resolvedAt: '2026-05-20' } as Card,
    { ...card({ id: 'b' }), status: 'resolved', resolvedAt: '2026-06-01' } as Card,
    { ...card({ id: 'noDate', createdAt: '2026-05-10' }), status: 'resolved' } as Card,
  ];
  const out = sortArchived(cards);
  assert.deepEqual(out.map((c) => c.id), ['b', 'a', 'noDate']); // open 被滤除、新解决在前、无日期排后
});

test('buildHeatmap: 跨卡同日累加、total、首尾日', () => {
  const cards = [
    card({ id: 'c1', entries: [entry('2026-05-30'), entry('2026-06-01')] }),
    card({ id: 'c2', entries: [entry('2026-06-01'), entry('2026-06-02')] }),
  ];
  const h = buildHeatmap(cards);
  assert.equal(h.counts['2026-06-01'], 2); // 两卡同日累加
  assert.equal(h.counts['2026-05-30'], 1);
  assert.equal(h.total, 4);
  assert.equal(h.firstDate, '2026-05-30');
  assert.equal(h.lastDate, '2026-06-02');
});

test('buildHeatmap: 无反思 → 空聚合', () => {
  const h = buildHeatmap([card(), card({ id: 'c2' })]);
  assert.deepEqual(h.counts, {});
  assert.equal(h.total, 0);
  assert.equal(h.firstDate, null);
  assert.equal(h.lastDate, null);
});

test('buildSolveStats: 均值/分布/maxCards，含 0 次直接解决', () => {
  const mk = (id: string, n: number, status: Card['status'] = 'resolved'): Card =>
    card({ id, status, entries: Array.from({ length: n }, (_, i) => entry(`2026-05-${10 + i}`)) });
  const cards = [
    mk('a', 1),
    mk('b', 2),
    mk('c', 2),
    mk('d', 3),
    mk('z0', 0), // 0 次直接解决，计入
    mk('open5', 5, 'open'), // 进行中不计入
  ];
  const s = buildSolveStats(cards);
  assert.equal(s.resolvedCount, 5);
  assert.equal(s.average, (1 + 2 + 2 + 3 + 0) / 5); // 1.6
  assert.deepEqual(s.distribution, [
    { reflections: 0, cards: 1 },
    { reflections: 1, cards: 1 },
    { reflections: 2, cards: 2 },
    { reflections: 3, cards: 1 },
  ]);
  assert.equal(s.maxCards, 2);
});

test('buildSolveStats: 无已解决卡 → 空态', () => {
  const s = buildSolveStats([card({ status: 'open' })]);
  assert.deepEqual(s, { resolvedCount: 0, average: 0, distribution: [], maxCards: 0 });
});
