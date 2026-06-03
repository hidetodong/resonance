<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 5 });
</script>

<template>
  <div class="skel-list" aria-hidden="true">
    <div v-for="n in count" :key="n" class="skel-item">
      <span class="skel-line w-title" />
      <span class="skel-line w-preview" />
      <span class="skel-line w-meta" />
    </div>
  </div>
</template>

<style scoped>
.skel-list {
  padding: 8px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skel-item {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.skel-line {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    var(--heat-0) 25%,
    #f7f3ee 37%,
    var(--heat-0) 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
.w-title {
  width: 70%;
  height: 13px;
}
.w-preview {
  width: 90%;
}
.w-meta {
  width: 40%;
}
@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skel-line {
    animation: none;
  }
}
</style>
