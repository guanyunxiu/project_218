<template>
  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
    :class="statusClasses">
    <span class="w-2 h-2 rounded-full" :class="dotClass"></span>
    <span>{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '@/types'

const props = defineProps<{
  status: ConnectionStatus
}>()

const statusText = computed(() => {
  switch (props.status) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中...'
    case 'disconnected':
    default:
      return '未连接'
  }
})

const statusClasses = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'bg-green-500/20 text-green-400 border border-green-500/30'
    case 'connecting':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    case 'disconnected':
    default:
      return 'bg-red-500/20 text-red-400 border border-red-500/30'
  }
})

const dotClass = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'bg-green-400'
    case 'connecting':
      return 'bg-yellow-400 animate-pulse'
    case 'disconnected':
    default:
      return 'bg-red-400'
  }
})
</script>
