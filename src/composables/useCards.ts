import { computed, ref } from 'vue';
import type { Card, ReflectionDraft } from '../domain/types';
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
  const storage = createStorage();

  const grouped = computed(() => domain.groupCards(cards.value, todayDate.value));
  const selectedCard = computed(
    () => cards.value.find((c) => c.id === selectedId.value) ?? null,
  );
  const pendingCount = computed(() => grouped.value.pending.length);

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
      cards.value = data.cards;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  async function addCard(question: string): Promise<void> {
    const q = question.trim();
    if (!q) return;
    const card = domain.createCard(q, todayDate.value);
    cards.value = [card, ...cards.value];
    selectedId.value = card.id;
    await persist();
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
      return resolved ? domain.markResolved(c) : domain.reopen(c);
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

  return {
    cards,
    selectedId,
    loading,
    error,
    todayDate,
    grouped,
    selectedCard,
    pendingCount,
    load,
    addCard,
    saveTodayReflection,
    setResolved,
    deleteCard,
    select,
  };
}
