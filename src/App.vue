<template>
  <RoomJoin v-if="!inCall" @join="handleJoin" />
  <VideoCall
    v-else
    @hang-up="handleHangUp"
    @toggle-screen-share="handleScreenShare"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useCallStore } from '@/stores/callStore'
import { useWebRTC } from '@/composables/useWebRTC'
import RoomJoin from '@/components/RoomJoin.vue'
import VideoCall from '@/components/VideoCall.vue'

const store = useCallStore()
const { joinCall, startScreenShare, stopScreenShare, hangUp, screenStream } = useWebRTC()

const inCall = ref(false)

async function handleJoin(roomId: string) {
  try {
    await joinCall(roomId)
    inCall.value = true
    message.success(`已加入房间: ${roomId}`)
  } catch (err: any) {
    console.error('加入房间失败:', err)
    const errorMessage = getErrorMessage(err)
    message.error(errorMessage)
  }
}

function handleHangUp() {
  hangUp()
  inCall.value = false
  message.info('已离开房间')
}

function handleScreenShare() {
  if (store.isScreenSharing) {
    stopScreenShare()
    store.setScreenStream(null)
    message.info('已停止屏幕共享')
  } else {
    startScreenShare().then(() => {
      store.setScreenStream(screenStream.value)
      message.success('已开始屏幕共享')
    }).catch((err) => {
      console.error('屏幕共享失败:', err)
      message.error('屏幕共享启动失败')
    })
  }
}

function getErrorMessage(err: any): string {
  if (err?.name === 'NotAllowedError') {
    return '摄像头或麦克风权限被拒绝，请在浏览器设置中允许访问'
  }
  if (err?.name === 'NotFoundError') {
    return '未找到摄像头或麦克风设备'
  }
  if (err?.name === 'NotReadableError') {
    return '无法访问摄像头或麦克风，可能被其他应用占用'
  }
  if (err?.name === 'OverconstrainedError') {
    return '请求的媒体格式不受支持'
  }
  if (err?.message) {
    return err.message
  }
  return '加入房间失败，请检查摄像头和麦克风权限'
}
</script>
