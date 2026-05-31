import type { ISODate } from '../domain/types';

/** 本机时区下的今天，'YYYY-MM-DD'。跨午夜按自然日切分。 */
export function today(): ISODate {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 展示用日期：'2026-05-31' → '5月31日'。 */
export function formatDate(date: ISODate): string {
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const [, m, d] = parts;
  return `${Number(m)}月${Number(d)}日`;
}

/** 展示用完整日期：'2026-05-31' → '2026年5月31日'。 */
export function formatFullDate(date: ISODate): string {
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const [y, m, d] = parts;
  return `${y}年${Number(m)}月${Number(d)}日`;
}

/** 两个自然日相差的天数（to - from），基于本地零点计算，规避 DST 偏差。 */
export function daysBetween(from: ISODate, to: ISODate): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

/** 列表展示用的「回顾新鲜度」文案。 */
export function reviewFreshness(last: ISODate | null, today: ISODate): string {
  if (last === null) return '还没反思过';
  const days = daysBetween(last, today);
  if (days <= 0) return '今天已回顾';
  if (days === 1) return '昨天回顾过';
  return `已 ${days} 天未回顾`;
}
