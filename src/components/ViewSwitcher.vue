<script setup lang="ts">
import type { AppView } from '../lib/view';
import { APP_VIEWS } from '../lib/view';

defineProps<{ current: AppView }>();
const emit = defineEmits<{ change: [view: AppView] }>();
</script>

<template>
  <nav class="switcher" role="tablist" aria-label="切换视图">
    <button
      v-for="v in APP_VIEWS"
      :key="v.value"
      type="button"
      role="tab"
      class="seg"
      :class="{ active: current === v.value }"
      :aria-selected="current === v.value"
      @click="emit('change', v.value)"
    >
      {{ v.label }}
    </button>
  </nav>
</template>

<style scoped>
.switcher {
  display: flex;
  gap: 2px;
  margin: 10px 14px 2px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
}
.seg {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  padding: 5px 0;
  border-radius: 999px;
}
.seg:hover:not(.active) {
  color: var(--ink);
}
.seg.active {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}
</style>
