<script setup lang="ts">
defineProps<{ open: boolean; message: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="dialog" role="dialog" aria-modal="true">
      <p class="msg">{{ message }}</p>
      <div class="actions">
        <button @click="emit('cancel')">取消</button>
        <button class="primary danger" @click="emit('confirm')">删除</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(40, 35, 30, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.dialog {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px 24px;
  width: min(380px, 90vw);
}
.msg {
  margin: 0 0 18px;
  line-height: 1.6;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.primary.danger {
  background: var(--danger);
  border-color: var(--danger);
}
.primary.danger:hover {
  background: #9c3636;
}
</style>
