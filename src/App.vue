<script setup lang="ts">
import { onMounted } from 'vue'
import ToastStack from '@/components/feedback/ToastStack.vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
onMounted(() => auth.initialize())
</script>

<template>
  <RouterView />
  <ToastStack />
</template>
