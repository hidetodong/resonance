<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), {
  size: 20,
  label: '加载中',
});
</script>

<template>
  <span
    class="spinner"
    role="status"
    :aria-label="label"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>

<style scoped>
.spinner {
  display: inline-block;
  box-sizing: border-box;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>
