<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { ReflectionDraft } from "./domain/types";
import { useCards } from "./composables/useCards";
import { useAuth } from "./composables/useAuth";
import { isSupabaseConfigured } from "./services/supabase";
import { formatFullDate } from "./lib/date";
import LoginView from "./components/LoginView.vue";
import NewCardDialog from "./components/NewCardDialog.vue";
import CardList from "./components/CardList.vue";
import CardDetail from "./components/CardDetail.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const {
  loading,
  error,
  todayDate,
  grouped,
  selectedCard,
  selectedId,
  pendingCount,
  load,
  addCard,
  saveTodayReflection,
  setResolved,
  deleteCard,
  select,
  reset,
} = useCards();

const authRequired = isSupabaseConfigured();
const { user, ready, signOut } = useAuth();
const needsLogin = computed(() => authRequired && !user.value);
const booting = computed(() => authRequired && !ready.value);

const confirmOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);
const newCardOpen = ref(false);

onMounted(() => {
  if (!authRequired) load();
});

// Supabase 模式：会话就绪/登录后加载数据，退出后清空
watch(user, (u, prev) => {
  if (u && !prev) load();
  if (!u && prev) reset();
});

async function onLogout() {
  await signOut();
}

function onCreateCard(question: string) {
  addCard(question);
  newCardOpen.value = false;
}

function onSave(draft: ReflectionDraft) {
  if (selectedCard.value) saveTodayReflection(selectedCard.value.id, draft);
}
function onResolve() {
  if (selectedCard.value) setResolved(selectedCard.value.id, true);
}
function onReopen() {
  if (selectedCard.value) setResolved(selectedCard.value.id, false);
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
  <div v-if="booting" class="boot">加载中…</div>
  <LoginView v-else-if="needsLogin" />
  <div v-else class="app" :class="{ 'has-selection': !!selectedCard }">
    <aside class="sidebar">
      <header class="brand">
        <div class="brand-row">
          <h1>Resonance · 睿所纳思</h1>
          <button v-if="authRequired" class="logout" @click="onLogout">
            退出
          </button>
        </div>
        <p class="subtitle">
          {{ formatFullDate(todayDate) }} · 待回顾 {{ pendingCount }}
        </p>
      </header>
      <CardList
        :grouped="grouped"
        :selected-id="selectedId"
        :today-date="todayDate"
        @select="select"
      />
    </aside>

    <main class="main">
      <button v-if="selectedCard" class="back-btn" @click="select(null)">
        ← 返回列表
      </button>
      <p v-if="error" class="error">{{ error }}</p>
      <CardDetail
        v-if="selectedCard"
        :card="selectedCard"
        :today-date="todayDate"
        @save="onSave"
        @resolve="onResolve"
        @reopen="onReopen"
        @remove="onRemove"
      />
      <div v-else class="placeholder">
        <p v-if="loading">加载中…</p>
        <p v-else>从左侧选一张卡片开始回顾，或新建一个问题。</p>
      </div>
    </main>

    <button class="fab" aria-label="新建问题" @click="newCardOpen = true">
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
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 14px;
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
