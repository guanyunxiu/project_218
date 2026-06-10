<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
    <div class="w-full max-w-md p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">WebRTC 视频通话</h1>
        <p class="text-gray-400 mt-2">输入房间号加入或创建视频通话</p>
      </div>

      <a-form layout="vertical" @finish="handleJoin">
        <a-form-item label="房间号" name="roomId"
          :rules="[{ required: true, message: '请输入房间号' }]">
          <div class="flex gap-2">
            <a-input
              v-model:value="roomId"
              size="large"
              placeholder="请输入房间号"
              class="rounded-lg flex-1"
            >
              <template #prefix>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </template>
            </a-input>
            <a-button
              size="large"
              @click="generateRoomId"
              class="rounded-lg h-[40px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </a-button>
          </div>
        </a-form-item>

        <a-button
          type="primary"
          html-type="submit"
          size="large"
          block
          :loading="loading"
          :disabled="!roomId.trim()"
          class="h-12 rounded-lg text-base font-medium mt-2"
        >
          加入房间
        </a-button>
      </a-form>

      <div class="mt-6 space-y-3">
        <div class="flex items-center gap-3 p-3 rounded-lg"
          :class="deviceStatus.camera === 'granted' ? 'bg-green-500/10' : deviceStatus.camera === 'denied' ? 'bg-red-500/10' : 'bg-gray-700/30'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"
            :class="deviceStatus.camera === 'granted' ? 'text-green-400' : deviceStatus.camera === 'denied' ? 'text-red-400' : 'text-gray-400'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span class="text-sm"
            :class="deviceStatus.camera === 'granted' ? 'text-green-400' : deviceStatus.camera === 'denied' ? 'text-red-400' : 'text-gray-400'">
            摄像头: {{ deviceStatus.camera === 'granted' ? '已授权' : deviceStatus.camera === 'denied' ? '未授权' : '未检测' }}
          </span>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-lg"
          :class="deviceStatus.microphone === 'granted' ? 'bg-green-500/10' : deviceStatus.microphone === 'denied' ? 'bg-red-500/10' : 'bg-gray-700/30'">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"
            :class="deviceStatus.microphone === 'granted' ? 'text-green-400' : deviceStatus.microphone === 'denied' ? 'text-red-400' : 'text-gray-400'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span class="text-sm"
            :class="deviceStatus.microphone === 'granted' ? 'text-green-400' : deviceStatus.microphone === 'denied' ? 'text-red-400' : 'text-gray-400'">
            麦克风: {{ deviceStatus.microphone === 'granted' ? '已授权' : deviceStatus.microphone === 'denied' ? '未授权' : '未检测' }}
          </span>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gray-700/30 rounded-xl">
        <p class="text-sm text-gray-400 text-center">
          💡 提示：双方输入相同的房间号即可开始视频通话
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const emit = defineEmits<{
  (e: 'join', roomId: string): void
}>()

const roomId = ref('')
const loading = ref(false)

const deviceStatus = reactive({
  camera: 'unknown' as 'granted' | 'denied' | 'unknown',
  microphone: 'unknown' as 'granted' | 'denied' | 'unknown',
})

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  roomId.value = result
}

async function checkDevicePermissions() {
  try {
    const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
    deviceStatus.camera = permissions.state as 'granted' | 'denied' | 'unknown'
    permissions.onchange = () => {
      deviceStatus.camera = permissions.state as 'granted' | 'denied' | 'unknown'
    }
  } catch {
    deviceStatus.camera = 'unknown'
  }

  try {
    const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    deviceStatus.microphone = permissions.state as 'granted' | 'denied' | 'unknown'
    permissions.onchange = () => {
      deviceStatus.microphone = permissions.state as 'granted' | 'denied' | 'unknown'
    }
  } catch {
    deviceStatus.microphone = 'unknown'
  }
}

async function handleJoin() {
  if (!roomId.value.trim()) {
    message.warning('请输入房间号')
    return
  }
  loading.value = true
  emit('join', roomId.value.trim())
}

onMounted(() => {
  checkDevicePermissions()
})
</script>
