import type {
  AppData,
  Card,
  CardType,
  ISODate,
  ReflectionDraft,
  ReflectionEntry,
} from './types';

/** 既有无类型卡、新建未指定时的默认类型。 */
export const DEFAULT_CARD_TYPE: CardType = 'reflection';

/** 全部卡片类型（按展示顺序）。 */
export const CARD_TYPES: readonly CardType[] = ['reflection', 'thinking'];

/** 类型展示名（中文文案单一真源，组件不写死）。 */
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  reflection: '反思',
  thinking: '探索',
};

/** 列表筛选维度：某一类型，或「全部」。 */
export type CardTypeFilter = CardType | 'all';

/** 是否合法卡片类型。 */
export function isCardType(v: unknown): v is CardType {
  return v === 'reflection' || v === 'thinking';
}

/** 把任意值收敛为合法类型；缺失 / 非法 → 默认类型。 */
export function coerceCardType(v: unknown): CardType {
  return isCardType(v) ? v : DEFAULT_CARD_TYPE;
}

/** 新建一张卡片，初始状态「进行中」、无反思条目；未指定类型则用默认。 */
export function createCard(
  question: string,
  today: ISODate,
  type: CardType = DEFAULT_CARD_TYPE,
): Card {
  return {
    id: crypto.randomUUID(),
    question: question.trim(),
    createdAt: today,
    status: 'open',
    type,
    entries: [],
  };
}

/**
 * 读边界归一：对来自持久化的整包数据，补齐每张卡缺失 / 非法的 type 为默认。
 * dev（Vite 中间件读文件）与 prod（Neon）数据都经 useCards.load 调用此处，
 * 是「既有无 type 数据无损读取」的唯一兜底点；写回沿用整包 jsonb 自然带上。
 */
export function normalizeAppData(data: AppData): AppData {
  const cards = Array.isArray(data.cards) ? data.cards : [];
  return {
    version: 1,
    cards: cards.map((c) => ({
      ...c,
      type: coerceCardType((c as { type?: unknown }).type),
    })),
  };
}

/** 设置卡片类型（不可变更新）。 */
export function setCardType(card: Card, type: CardType): Card {
  return { ...card, type };
}

/** 查找当日反思条目（不存在返回 undefined）。 */
export function findTodayEntry(card: Card, today: ISODate): ReflectionEntry | undefined {
  return card.entries.find((e) => e.date === today);
}

/** 历史条目（≠今天）不可编辑、不可删除。 */
export function isHistorical(entryDate: ISODate, today: ISODate): boolean {
  return entryDate !== today;
}

/**
 * 新增 / 覆盖当日反思条目（不可变更新）。
 * 当日无条目则新增，有则覆盖；其余历史条目原样保留；返回按 date 升序的新 Card。
 */
export function upsertTodayEntry(card: Card, today: ISODate, draft: ReflectionDraft): Card {
  const entry: ReflectionEntry = {
    date: today,
    thought: draft.thought.trim(),
    nextAction: draft.nextAction.trim(),
  };
  const others = card.entries.filter((e) => e.date !== today);
  const entries = [...others, entry].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  return { ...card, entries };
}

export function reflectionCount(card: Card): number {
  return card.entries.length;
}

/** 最近一次反思的日期；无反思返回 null。 */
export function lastReflectedDate(card: Card): ISODate | null {
  if (card.entries.length === 0) return null;
  return card.entries[card.entries.length - 1].date;
}

/** 最近一条反思条目（entries 按 date 升序，末元素即最近）；无反思返回 undefined。 */
export function latestEntry(card: Card): ReflectionEntry | undefined {
  return card.entries[card.entries.length - 1];
}

/** 历史反思条目（≠今天），按时间倒序（最近在前），只读展示用。 */
export function historicalEntries(card: Card, today: ISODate): ReflectionEntry[] {
  return card.entries
    .filter((e) => e.date !== today)
    .slice()
    .reverse();
}

/** 今天是否仍需回顾：进行中且今天还没反思。 */
export function needsReviewToday(card: Card, today: ISODate): boolean {
  return card.status === 'open' && findTodayEntry(card, today) === undefined;
}

export function markResolved(card: Card): Card {
  return { ...card, status: 'resolved' };
}

export function reopen(card: Card): Card {
  return { ...card, status: 'open' };
}

export interface GroupedCards {
  /** 进行中且今天还没反思——今日待回顾。 */
  pending: Card[];
  /** 进行中且今天已反思。 */
  reflectedToday: Card[];
  /** 阶段性解决。 */
  resolved: Card[];
}

/** 按类型筛选卡片；filter 为 'all' 时原样返回。 */
export function filterCardsByType(cards: Card[], filter: CardTypeFilter): Card[] {
  return filter === 'all' ? cards : cards.filter((c) => coerceCardType(c.type) === filter);
}

/** 各类型计数（含 all = 总数），用于筛选条徽标。 */
export function countByType(cards: Card[]): Record<CardTypeFilter, number> {
  const out: Record<CardTypeFilter, number> = { all: cards.length, reflection: 0, thinking: 0 };
  for (const c of cards) out[coerceCardType(c.type)]++;
  return out;
}

/** 按状态与今日反思情况把卡片分三组。 */
export function groupCards(cards: Card[], today: ISODate): GroupedCards {
  const pending: Card[] = [];
  const reflectedToday: Card[] = [];
  const resolved: Card[] = [];
  for (const card of cards) {
    if (card.status === 'resolved') {
      resolved.push(card);
    } else if (findTodayEntry(card, today)) {
      reflectedToday.push(card);
    } else {
      pending.push(card);
    }
  }
  return { pending, reflectedToday, resolved };
}
