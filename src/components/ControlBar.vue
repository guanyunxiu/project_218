<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 z-20">
    <a-tooltip :title="store.isMuted ? '取消静音' : '静音'">
      <button
        @click="store.toggleMute()"
        class="control-btn relative"
        :class="store.isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'"
      >
        <svg v-if="store.isMuted" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <div v-if="!store.isMuted && store.audioLevel > 0.05" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
      </button>
    </a-tooltip>

    <a-tooltip :title="store.isCameraOff ? '开启摄像头' : '关闭摄像头'">
      <button
        @click="store.toggleCamera()"
        class="control-btn"
        :class="store.isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'"
      >
        <svg v-if="store.isCameraOff" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636L5.636 18.364" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </a-tooltip>

    <a-tooltip :title="store.isScreenSharing ? '停止共享' : '共享屏幕'">
      <button
        @click="handleScreenShare"
        class="control-btn"
        :class="store.isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
    </a-tooltip>

    <div class="flex items-center gap-1 mx-1 h-8">
      <div
        v-for="i in 5"
        :key="i"
        class="w-1 rounded-full transition-all duration-150"
        :style="{
          height: getBarHeight(i) + 'px',
          backgroundColor: store.isMuted ? '#4b5563' : getBarColor(i),
        }"
      ></div>
    </div>

    <div class="w-px h-8 bg-gray-600 mx-1"></div>

    <a-tooltip title="挂断">
      <button
        @click="emit('hangUp')"
        class="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white rotate-135" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useCallStore } from '@/stores/callStore'

const store = useCallStore()

const emit = defineEmits<{
  (e: 'hangUp'): void
  (e: 'toggleScreenShare'): void
}>()

function handleScreenShare() {
  emit('toggleScreenShare')
}

function getBarHeight(index: number): number {
  if (store.isMuted) return 6
  const level = store.audioLevel
  const threshold = index / 5
  if (level < threshold * 0.5) return 6
  const height = 6 + (level * 24)
  return Math.min(height, 32)
}

function getBarColor(index: number): string {
  const level = store.audioLevel
  if (level > 0.7 && index >= 4) return '#ef4444'
  if (level > 0.4 && index >= 3) return '#f59e0b'
  return '#22c55e'
}
</script>

<style scoped>
.control-btn {
  @apply w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95;
}
</style>
