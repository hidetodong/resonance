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
  DEFAULT_CARD_TYPE,
  CARD_TYPE_LABELS,
} from './card.ts';

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
