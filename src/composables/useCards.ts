import { computed, ref } from 'vue';
import type { Card, CardType, ReflectionDraft } from '../domain/types';
import type { CardTypeFilter } from '../domain/card';
import * as domain from '../domain/card';
import { createStorage } from '../services/storage';
import { today } from '../lib/date';

/**
 * 页面级唯一响应式真源：持有全部卡片与当前选中，暴露动作，并在每次变更后落盘。
 * 组件只通过本 composable 的动作改状态，不直接触达 storage。
 */
export function useCards() {
  const cards = ref<Card[]>([]);
  const selectedId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const todayDate = ref(today());
  /** 列表类型筛选（纯视图态，不落盘）。 */
  const typeFilter = ref<CardTypeFilter>('all');
  const storage = createStorage();

  // 全量分组（全局「待回顾」计数用，不受类型筛选影响）。
  const allGrouped = computed(() => domain.groupCards(cards.value, todayDate.value));
  // 列表展示分组：先按类型筛选，再按状态分三组。
  const grouped = computed(() =>
    domain.groupCards(
      domain.filterCardsByType(cards.value, typeFilter.value),
      todayDate.value,
    ),
  );
  const selectedCard = computed(
    () => cards.value.find((c) => c.id === selectedId.value) ?? null,
  );
  const pendingCount = computed(() => allGrouped.value.pending.length);
  // 类型筛选是卡片视图控件，计数只覆盖进行中卡（已解决卡归档到归档视图，不在此过滤范围）。
  const typeCounts = computed(() =>
    domain.countByType(cards.value.filter((c) => c.status !== 'resolved')),
  );
  // 归档：全部已解决卡，按解决日降序（独立于类型筛选）。
  const archivedCards = computed(() => domain.sortArchived(cards.value));
  // 统计派生（只读）：反思热力聚合 + 解决次数统计。
  const heatmap = computed(() => domain.buildHeatmap(cards.value));
  const solveStats = computed(() => domain.buildSolveStats(cards.value));

  async function persist(): Promise<void> {
    try {
      await storage.save({ version: 1, cards: cards.value });
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    }
  }

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const data = await storage.load();
      // 读边界归一：既有无 type 卡（本地文件 / 线上 Neon）补默认类型，无损读取。
      cards.value = domain.normalizeAppData(data).cards;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function addCard(question: string, type?: CardType): Promise<void> {
    const q = question.trim();
    if (!q) return;
    const card = domain.createCard(q, todayDate.value, type);
    cards.value = [card, ...cards.value];
    selectedId.value = card.id;
    await persist();
  }

  /** 切换某卡类型并持久化。 */
  async function setCardType(cardId: string, type: CardType): Promise<void> {
    cards.value = cards.value.map((c) =>
      c.id === cardId ? domain.setCardType(c, type) : c,
    );
    await persist();
  }

  function setTypeFilter(filter: CardTypeFilter): void {
    typeFilter.value = filter;
  }

  /** 新增 / 覆盖当日反思；想法为空则不保存。 */
  async function saveTodayReflection(cardId: string, draft: ReflectionDraft): Promise<void> {
    if (!draft.thought.trim()) return;
    cards.value = cards.value.map((c) =>
      c.id === cardId ? domain.upsertTodayEntry(c, todayDate.value, draft) : c,
    );
    await persist();
  }

  async function setResolved(cardId: string, resolved: boolean): Promise<void> {
    cards.value = cards.value.map((c) => {
      if (c.id !== cardId) return c;
      return resolved ? domain.markResolved(c, todayDate.value) : domain.reopen(c);
    });
    await persist();
  }

  async function deleteCard(cardId: string): Promise<void> {
    cards.value = cards.value.filter((c) => c.id !== cardId);
    if (selectedId.value === cardId) selectedId.value = null;
    await persist();
  }

  function select(cardId: string | null): void {
    selectedId.value = cardId;
  }

  /** 清空内存态（退出登录时调用）。 */
  function reset(): void {
    cards.value = [];
    selectedId.value = null;
    error.value = null;
  }

  return {
    cards,
    selectedId,
    loading,
    error,
    todayDate,
    grouped,
    selectedCard,
    pendingCount,
    typeFilter,
    typeCounts,
    archivedCards,
    heatmap,
    solveStats,
    load,
    addCard,
    saveTodayReflection,
    setResolved,
    setCardType,
    setTypeFilter,
    deleteCard,
    select,
    reset,
  };
}
