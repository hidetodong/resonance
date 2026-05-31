import type { Card, ISODate, ReflectionDraft, ReflectionEntry } from './types';

/** 新建一张卡片，初始状态「进行中」、无反思条目。 */
export function createCard(question: string, today: ISODate): Card {
  return {
    id: crypto.randomUUID(),
    question: question.trim(),
    createdAt: today,
    status: 'open',
    entries: [],
  };
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
