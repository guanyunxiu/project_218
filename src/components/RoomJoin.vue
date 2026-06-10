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

      <div v-if="!isSecureContext" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <p class="text-red-400 font-medium text-sm">无法访问摄像头和麦克风</p>
            <p class="text-red-300/70 text-xs mt-1">浏览器要求在 HTTPS 或 localhost 环境下才能访问媒体设备，请使用安全协议访问本页面。</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">房间号</label>
          <div class="flex gap-2">
            <a-input
              v-model:value="roomId"
              size="large"
              placeholder="请输入房间号"
              class="rounded-lg flex-1"
              :disabled="requestingPermission || joining"
              @pressEnter="handleJoin"
            >
              <template #prefix>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </template>
            </a-input>
            <a-tooltip title="随机生成房间号">
              <a-button
                size="large"
                @click="generateRoomId"
                class="rounded-lg h-[40px]"
                :disabled="requestingPermission || joining"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </a-button>
            </a-tooltip>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between p-3 rounded-lg transition-colors"
            :class="deviceBgClass.camera">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="deviceIconBgClass.camera">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"
                  :class="deviceIconClass.camera"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium" :class="deviceTextClass.camera">摄像头</p>
                <p class="text-xs" :class="deviceSubtextClass.camera">{{ deviceStatusText.camera }}</p>
              </div>
            </div>
            <button
              v-if="showPermButton.camera && isSecureContext"
              @click="handleRequestSinglePermission('camera')"
              :disabled="requestingPermission"
              class="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ requestingPermission ? '请求中...' : '授权' }}
            </button>
          </div>

          <div class="flex items-center justify-between p-3 rounded-lg transition-colors"
            :class="deviceBgClass.microphone">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="deviceIconBgClass.microphone">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"
                  :class="deviceIconClass.microphone"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium" :class="deviceTextClass.microphone">麦克风</p>
                <p class="text-xs" :class="deviceSubtextClass.microphone">{{ deviceStatusText.microphone }}</p>
              </div>
            </div>
            <button
              v-if="showPermButton.microphone && isSecureContext"
              @click="handleRequestSinglePermission('microphone')"
              :disabled="requestingPermission"
              class="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ requestingPermission ? '请求中...' : '授权' }}
            </button>
          </div>
        </div>

        <a-button
          v-if="needRequestAll && isSecureContext"
          size="large"
          block
          class="h-11 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 border-gray-600"
          :loading="requestingPermission"
          @click="requestAllPermissions"
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </template>
          请求摄像头和麦克风权限
        </a-button>

        <a-button
          type="primary"
          size="large"
          block
          :loading="joining"
          :disabled="!roomId.trim() || !isSecureContext"
          class="h-12 rounded-lg text-base font-medium"
          @click="handleJoin"
        >
          {{ joining ? '加入中...' : '加入房间' }}
        </a-button>
      </div>

      <div v-if="showDeniedGuide" class="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
        <div class="flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-orange-400 font-medium text-sm">权限已被拒绝</p>
            <p class="text-orange-300/80 text-xs mt-1">
              请点击浏览器地址栏左侧的 🔒 或 ⓘ 图标，在「网站设置」中将摄像头和麦克风设置为「允许」，然后刷新页面。
            </p>
          </div>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gray-700/30 rounded-xl">
        <p class="text-sm text-gray-400 text-center leading-relaxed">
          💡 使用说明：<br>
          1. 点击上方「请求摄像头和麦克风权限」按钮<br>
          2. 在浏览器弹窗中点击「允许」<br>
          3. 输入房间号，点击「加入房间」开始通话
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'

type DeviceState = 'checking' | 'granted' | 'prompt' | 'denied' | 'no-device'
type DeviceType = 'camera' | 'microphone'

const emit = defineEmits<{
  (e: 'join', roomId: string): void
}>()

const roomId = ref('')
const joining = ref(false)
const requestingPermission = ref(false)

const isSecureContext = computed(() => {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
})

const deviceStatus = reactive({
  camera: 'checking' as DeviceState,
  microphone: 'checking' as DeviceState,
})

const deviceStatusText = computed(() => ({
  camera: getDeviceStatusText(deviceStatus.camera),
  microphone: getDeviceStatusText(deviceStatus.microphone),
}))

const showPermButton = computed(() => ({
  camera: deviceStatus.camera === 'prompt' || deviceStatus.camera === 'checking',
  microphone: deviceStatus.microphone === 'prompt' || deviceStatus.microphone === 'checking',
}))

const needRequestAll = computed(() => {
  return (deviceStatus.camera === 'prompt' || deviceStatus.camera === 'checking' ||
          deviceStatus.microphone === 'prompt' || deviceStatus.microphone === 'checking')
})

const showDeniedGuide = computed(() => {
  return deviceStatus.camera === 'denied' || deviceStatus.microphone === 'denied'
})

const deviceBgClass = computed(() => ({
  camera: getDeviceBgClass(deviceStatus.camera),
  microphone: getDeviceBgClass(deviceStatus.microphone),
}))

const deviceIconBgClass = computed(() => ({
  camera: getDeviceIconBgClass(deviceStatus.camera),
  microphone: getDeviceIconBgClass(deviceStatus.microphone),
}))

const deviceIconClass = computed(() => ({
  camera: getDeviceIconClass(deviceStatus.camera),
  microphone: getDeviceIconClass(deviceStatus.microphone),
}))

const deviceTextClass = computed(() => ({
  camera: getDeviceTextClass(deviceStatus.camera),
  microphone: getDeviceTextClass(deviceStatus.microphone),
}))

const deviceSubtextClass = computed(() => ({
  camera: getDeviceSubtextClass(deviceStatus.camera),
  microphone: getDeviceSubtextClass(deviceStatus.microphone),
}))

function getDeviceStatusText(state: DeviceState): string {
  switch (state) {
    case 'granted': return '已授权 ✅'
    case 'denied': return '已拒绝 ⚠️'
    case 'no-device': return '未找到设备 ❌'
    case 'prompt': return '待授权'
    case 'checking': return '检测中...'
    default: return '待授权'
  }
}

function getDeviceBgClass(state: DeviceState): string {
  switch (state) {
    case 'granted': return 'bg-green-500/10'
    case 'denied': return 'bg-orange-500/10'
    case 'no-device': return 'bg-red-500/10'
    default: return 'bg-gray-700/30'
  }
}

function getDeviceIconBgClass(state: DeviceState): string {
  switch (state) {
    case 'granted': return 'bg-green-500/20'
    case 'denied': return 'bg-orange-500/20'
    case 'no-device': return 'bg-red-500/20'
    default: return 'bg-gray-600/40'
  }
}

function getDeviceIconClass(state: DeviceState): string {
  switch (state) {
    case 'granted': return 'text-green-400'
    case 'denied': return 'text-orange-400'
    case 'no-device': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

function getDeviceTextClass(state: DeviceState): string {
  switch (state) {
    case 'granted': return 'text-green-400'
    case 'denied': return 'text-orange-400'
    case 'no-device': return 'text-red-400'
    default: return 'text-gray-300'
  }
}

function getDeviceSubtextClass(state: DeviceState): string {
  switch (state) {
    case 'granted': return 'text-green-400/70'
    case 'denied': return 'text-orange-400/70'
    case 'no-device': return 'text-red-400/70'
    default: return 'text-gray-500'
  }
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  roomId.value = result
}

async function checkDevicePermissions() {
  if (!isSecureContext.value) {
    deviceStatus.camera = 'no-device'
    deviceStatus.microphone = 'no-device'
    return
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(d => d.kind === 'videoinput')
    const audioDevices = devices.filter(d => d.kind === 'audioinput')

    if (videoDevices.length === 0) {
      deviceStatus.camera = 'no-device'
    } else if (videoDevices.some(d => d.label && d.label.length > 0)) {
      deviceStatus.camera = 'granted'
    } else {
      deviceStatus.camera = 'prompt'
    }

    if (audioDevices.length === 0) {
      deviceStatus.microphone = 'no-device'
    } else if (audioDevices.some(d => d.label && d.label.length > 0)) {
      deviceStatus.microphone = 'granted'
    } else {
      deviceStatus.microphone = 'prompt'
    }
  } catch (err) {
    console.warn('[设备检测] enumerateDevices 失败:', err)
    deviceStatus.camera = 'prompt'
    deviceStatus.microphone = 'prompt'
  }
}

async function requestAllPermissions() {
  if (!isSecureContext.value) return

  requestingPermission.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    stream.getTracks().forEach(track => track.stop())
    deviceStatus.camera = 'granted'
    deviceStatus.microphone = 'granted'
    message.success('设备权限已授权')
    await nextTick()
    await checkDevicePermissions()
  } catch (err: any) {
    console.warn('[请求权限] 失败:', err)
    if (err?.name === 'NotAllowedError') {
      deviceStatus.camera = 'denied'
      deviceStatus.microphone = 'denied'
      message.warning('权限被拒绝，请在浏览器设置中手动允许访问')
    } else if (err?.name === 'NotFoundError') {
      deviceStatus.camera = 'no-device'
      deviceStatus.microphone = 'no-device'
      message.error('未找到摄像头或麦克风设备')
    } else {
      message.error('请求权限失败：' + (err?.message || '未知错误'))
    }
  } finally {
    requestingPermission.value = false
    await nextTick()
    await checkDevicePermissions()
  }
}

async function handleRequestSinglePermission(device: DeviceType) {
  if (!isSecureContext.value) return

  requestingPermission.value = true
  try {
    const constraints: MediaStreamConstraints = device === 'camera'
      ? { video: true, audio: false }
      : { video: false, audio: true }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    stream.getTracks().forEach(track => track.stop())
    deviceStatus[device] = 'granted'
    message.success(`${device === 'camera' ? '摄像头' : '麦克风'}已授权`)
    await nextTick()
    await checkDevicePermissions()
  } catch (err: any) {
    console.warn(`[请求${device}权限] 失败:`, err)
    if (err?.name === 'NotAllowedError') {
      deviceStatus[device] = 'denied'
      message.warning('权限被拒绝，请在浏览器设置中手动允许访问')
    } else if (err?.name === 'NotFoundError') {
      deviceStatus[device] = 'no-device'
      message.error(`未找到${device === 'camera' ? '摄像头' : '麦克风'}设备`)
    } else {
      message.error('请求权限失败：' + (err?.message || '未知错误'))
    }
  } finally {
    requestingPermission.value = false
    await nextTick()
    await checkDevicePermissions()
  }
}

function handleJoin() {
  if (!roomId.value.trim()) {
    message.warning('请输入房间号')
    return
  }
  if (!isSecureContext.value) {
    message.error('当前环境无法访问媒体设备，请使用 HTTPS 或 localhost 访问')
    return
  }
  joining.value = true
  emit('join', roomId.value.trim())
}

function resetJoining() {
  joining.value = false
}

defineExpose({ resetJoining, requestAllPermissions })

onMounted(async () => {
  await checkDevicePermissions()
})
</script>
