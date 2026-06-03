<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { CardType, ReflectionDraft } from "./domain/types";
import type { AppView } from "./lib/view";
import { useCards } from "./composables/useCards";
import { useAuth } from "./composables/useAuth";
import { formatFullDate } from "./lib/date";
import { buildHeatGrid } from "./lib/heatmap";
import LoginView from "./components/LoginView.vue";
import NewCardDialog from "./components/NewCardDialog.vue";
import CardList from "./components/CardList.vue";
import CardTypeFilter from "./components/CardTypeFilter.vue";
import CardDetail from "./components/CardDetail.vue";
import ViewSwitcher from "./components/ViewSwitcher.vue";
import ArchiveView from "./components/ArchiveView.vue";
import StatsView from "./components/StatsView.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import Spinner from "./components/Spinner.vue";
import SkeletonList from "./components/SkeletonList.vue";

const {
  loading,
  error,
  todayDate,
  grouped,
  selectedCard,
  selectedId,
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
} = useCards();

/** 顶级视图（纯导航 UI，不落盘，刷新回默认）。 */
const currentView = ref<AppView>("cards");
const heatGrid = computed(() => buildHeatGrid(heatmap.value, todayDate.value));

/** 切换顶级视图：每个视图从占位起步，清空跨视图选中，避免错配。 */
function onChangeView(view: AppView) {
  currentView.value = view;
  select(null);
}
/** 右侧详情面板的占位文案，随当前视图变化。 */
const placeholderText = computed(() => {
  if (currentView.value === "archive")
    return "从左侧归档选一张卡片，查看完整反思时间线。";
  if (currentView.value === "stats") return "统计概览见左侧侧栏。";
  return "从左侧选一张卡片开始回顾，或新建一个问题。";
});

const { user, ready, authDisabled, signOut } = useAuth();
// 需登录 = 已就绪 && 后端启用认证 && 未登录
const needsLogin = computed(
  () => ready.value && !authDisabled.value && !user.value,
);
const booting = computed(() => !ready.value);

const confirmOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);
const newCardOpen = ref(false);

// 就绪且无需登录（dev 免认证 / 已登录）时加载一次；退出登录则清空、待下次登录重载。
let loadedOnce = false;
watch(
  [ready, needsLogin],
  () => {
    if (ready.value && !needsLogin.value && !loadedOnce) {
      loadedOnce = true;
      load();
    }
  },
  { immediate: true },
);
watch(user, (u, prev) => {
  if (!u && prev) {
    loadedOnce = false;
    reset();
  }
});

async function onLogout() {
  await signOut();
}

function onCreateCard(question: string, type: CardType) {
  addCard(question, type);
  newCardOpen.value = false;
}
function onSetType(type: CardType) {
  if (selectedCard.value) setCardType(selectedCard.value.id, type);
}

function onSave(draft: ReflectionDraft) {
  if (selectedCard.value) saveTodayReflection(selectedCard.value.id, draft);
}
function onResolve() {
  if (selectedCard.value) setResolved(selectedCard.value.id, true);
}
function onReopen() {
  if (!selectedCard.value) return;
  setResolved(selectedCard.value.id, false);
  // reopen 后该卡变回进行中，切回卡片视图并保留选中，右侧续显其详情。
  currentView.value = "cards";
}
function onRemove() {
  if (!selectedCard.value) return;
  pendingDeleteId.value = selectedCard.value.id;
  confirmOpen.value = true;
}
function confirmDelete() {
  if (pendingDeleteId.value) deleteCard(pendingDeleteId.value);
  confirmOpen.value = false;
  pendingDeleteId.value = null;
}
function cancelDelete() {
  confirmOpen.value = false;
  pendingDeleteId.value = null;
}
</script>

<template>
  <div v-if="booting" class="boot">
    <Spinner :size="28" />
    <p>加载中…</p>
  </div>
  <LoginView v-else-if="needsLogin" />
  <div v-else class="app" :class="{ 'has-selection': !!selectedCard }">
    <aside class="sidebar">
      <header class="brand">
        <div class="brand-row">
          <h1>Resonance · 睿所纳思</h1>
          <button v-if="user" class="logout" @click="onLogout">退出</button>
        </div>
        <p class="subtitle">
          {{ formatFullDate(todayDate) }} · 待回顾 {{ pendingCount }}
        </p>
      </header>
      <ViewSwitcher :current="currentView" @change="onChangeView" />
      <CardTypeFilter
        v-if="currentView === 'cards' && !loading"
        :current="typeFilter"
        :counts="typeCounts"
        @change="setTypeFilter"
      />
      <div class="sidebar-body">
        <template v-if="currentView === 'cards'">
          <SkeletonList v-if="loading" />
          <CardList
            v-else
            :grouped="grouped"
            :selected-id="selectedId"
            :today-date="todayDate"
            @select="select"
          />
        </template>

        <ArchiveView
          v-else-if="currentView === 'archive'"
          :cards="archivedCards"
          :selected-id="selectedId"
          :today-date="todayDate"
          @select="select"
        />

        <StatsView
          v-else
          :grid="heatGrid"
          :stats="solveStats"
          :today-date="todayDate"
        />
      </div>
    </aside>

    <main class="main">
      <p v-if="error" class="error">{{ error }}</p>

      <button v-if="selectedCard" class="back-btn" @click="select(null)">
        ← 返回列表
      </button>
      <CardDetail
        v-if="selectedCard"
        :card="selectedCard"
        :today-date="todayDate"
        @save="onSave"
        @resolve="onResolve"
        @reopen="onReopen"
        @remove="onRemove"
        @set-type="onSetType"
      />
      <div v-else class="placeholder">
        <Spinner v-if="loading" :size="24" />
        <p v-else>{{ placeholderText }}</p>
      </div>
    </main>

    <button
      v-if="currentView === 'cards'"
      class="fab"
      aria-label="新建问题"
      @click="newCardOpen = true"
    >
      +
    </button>

    <NewCardDialog
      :open="newCardOpen"
      @create="onCreateCard"
      @cancel="newCardOpen = false"
    />
    <ConfirmDialog
      :open="confirmOpen"
      message="删除这张卡片及其全部反思？此操作不可撤销。"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 360px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border-right: 1px solid var(--line);
}
.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.brand {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line);
}
.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.brand h1 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.04em;
  color: var(--accent);
}
.logout {
  flex: none;
  border-color: transparent;
  background: transparent;
  color: var(--ink-soft);
  font-size: 12px;
  padding: 2px 8px;
}
.logout:hover:not(:disabled) {
  border-color: var(--line);
  color: var(--ink);
}
.boot {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ink-soft);
  font-size: 14px;
}
.boot p {
  margin: 0;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
}
.main {
  flex: 1;
  overflow-y: auto;
  position: relative;
}
.back-btn {
  display: none;
}
.placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 14px;
}
.error {
  margin: 16px 32px 0;
  color: var(--danger);
  font-size: 13px;
}
.fab {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 40;
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}
.fab:hover:not(:disabled) {
  background: #9c5226;
  border-color: #9c5226;
}

/* 手机端：两栏改为栈式 master-detail —— 列表全屏，选中卡→详情全屏 + 返回 */
@media (max-width: 720px) {
  .sidebar {
    width: 100%;
    border-right: none;
  }
  .main {
    display: none;
  }
  .app.has-selection .sidebar {
    display: none;
  }
  .app.has-selection .main {
    display: block;
  }
  .app.has-selection .fab {
    display: none;
  }
  .fab {
    right: 16px;
    bottom: 16px;
  }
  .back-btn {
    display: inline-flex;
    position: sticky;
    top: 0;
    z-index: 5;
    margin: 10px 0 0 12px;
    background: var(--panel);
  }
  .error {
    margin: 12px 16px 0;
  }
}
</style>
