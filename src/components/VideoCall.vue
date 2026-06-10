<template>
  <div class="min-h-screen bg-gray-900 relative select-none">
    <div class="h-screen flex flex-col">
      <div class="flex items-center justify-between px-6 py-3 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-white">房间: {{ store.roomId }}</h2>
          <ConnectionStatus :status="store.connectionStatus" />
        </div>
        <div v-if="store.isScreenSharing" class="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full border border-blue-500/30">
          <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          <span class="text-sm text-blue-400 font-medium">屏幕共享中</span>
        </div>
      </div>

      <div class="flex-1 relative p-4">
        <div class="w-full h-full relative rounded-2xl overflow-hidden bg-gray-800 shadow-2xl">
          <video
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          ></video>

          <div v-if="!store.remoteStream" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="text-gray-500 text-lg mb-2">等待对方加入...</p>
              <p class="text-gray-600 text-sm">分享房间号给朋友开始通话</p>
            </div>
          </div>

          <div v-if="store.remoteStream" class="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="text-white text-sm">对方</span>
          </div>
        </div>

        <div class="absolute bottom-24 right-8 w-72 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 transition-all duration-300"
          :class="store.isScreenSharing ? 'border-blue-500/60' : 'border-gray-600/50'">
          <video
            ref="localVideoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          ></video>

          <div v-if="store.isCameraOff && !store.isScreenSharing" class="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div class="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636L5.636 18.364" />
              </svg>
              <span class="text-gray-500 text-xs">摄像头已关闭</span>
            </div>
          </div>

          <div v-if="store.isScreenSharing" class="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-blue-500/80 backdrop-blur-sm rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span class="text-white text-xs font-medium">共享</span>
          </div>

          <div class="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md">
            <span class="text-white text-xs">我</span>
            <div v-if="store.isMuted" class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <span class="text-red-400 text-xs">静音</span>
            </div>
          </div>
        </div>
      </div>

      <ControlBar @hang-up="handleHangUp" @toggle-screen-share="handleScreenShare" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useCallStore } from '@/stores/callStore'
import ConnectionStatus from './ConnectionStatus.vue'
import ControlBar from './ControlBar.vue'

const store = useCallStore()

const emit = defineEmits<{
  (e: 'hangUp'): void
  (e: 'toggleScreenShare'): void
}>()

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRef = ref<HTMLVideoElement | null>(null)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationFrameId: number | null = null

function bindVideoStream(videoEl: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!videoEl) return
  if (stream) {
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream
    }
  } else {
    videoEl.srcObject = null
  }
}

function getDisplayStream(): MediaStream | null {
  if (store.isScreenSharing && store.screenStream) {
    return store.screenStream
  }
  return store.localStream
}

watch(() => [store.localStream, store.screenStream, store.isScreenSharing], () => {
  nextTick(() => {
    const displayStream = getDisplayStream()
    bindVideoStream(localVideoRef.value, displayStream)
  })
}, { deep: true })

watch(() => store.remoteStream, (newStream) => {
  nextTick(() => {
    bindVideoStream(remoteVideoRef.value, newStream)
  })
})

function setupAudioAnalyser() {
  if (!store.localStream) return
  try {
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(store.localStream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function updateAudioLevel() {
      if (!analyser) return
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
      store.setAudioLevel(average / 255)
      animationFrameId = requestAnimationFrame(updateAudioLevel)
    }

    updateAudioLevel()
  } catch (err) {
    console.warn('[音频分析] 无法创建音频分析器:', err)
  }
}

function cleanupAudioAnalyser() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  analyser = null
}

onMounted(() => {
  const displayStream = getDisplayStream()
  bindVideoStream(localVideoRef.value, displayStream)
  bindVideoStream(remoteVideoRef.value, store.remoteStream)
  setupAudioAnalyser()
})

onBeforeUnmount(() => {
  cleanupAudioAnalyser()
})

function handleHangUp() {
  cleanupAudioAnalyser()
  emit('hangUp')
}

function handleScreenShare() {
  emit('toggleScreenShare')
}
</script>
