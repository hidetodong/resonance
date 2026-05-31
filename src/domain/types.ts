/** 本地自然日，格式 'YYYY-MM-DD'。 */
export type ISODate = string;

/** 卡片状态：进行中 / 阶段性解决。 */
export type CardStatus = 'open' | 'resolved';

/** 一条反思条目。date 为主键：每张卡每天至多一条。 */
export interface ReflectionEntry {
  /** 反思发生的自然日。 */
  date: ISODate;
  /** 想法（必填，已 trim）。 */
  thought: string;
  /** 明天就能开始的简单行动（选填，可为空串）。 */
  nextAction: string;
}

/** 一张卡片 = 一个尚未解决的问题。 */
export interface Card {
  id: string;
  /** 问题文本。 */
  question: string;
  /** 创建日。 */
  createdAt: ISODate;
  status: CardStatus;
  /** 历次反思条目，按 date 升序。 */
  entries: ReflectionEntry[];
}

/** 落盘的应用数据根结构。 */
export interface AppData {
  version: 1;
  cards: Card[];
}

/** 草稿：编辑中的当日反思输入。 */
export interface ReflectionDraft {
  thought: string;
  nextAction: string;
}
