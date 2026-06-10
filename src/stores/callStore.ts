import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConnectionStatus } from '@/types'

export const useCallStore = defineStore('call', () => {
  const roomId = ref('')
  const localStream = ref<MediaStream | null>(null)
  const remoteStream = ref<MediaStream | null>(null)
  const screenStream = ref<MediaStream | null>(null)
  const isMuted = ref(false)
  const isCameraOff = ref(false)
  const isScreenSharing = ref(false)
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const remoteUserId = ref<string | null>(null)
  const audioLevel = ref(0)

  function setRoomId(id: string) {
    roomId.value = id
  }

  function setLocalStream(stream: MediaStream | null) {
    localStream.value = stream
  }

  function setRemoteStream(stream: MediaStream | null) {
    remoteStream.value = stream
  }

  function setScreenStream(stream: MediaStream | null) {
    screenStream.value = stream
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted.value
      })
    }
    if (screenStream.value) {
      screenStream.value.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted.value
      })
    }
  }

  function toggleCamera() {
    isCameraOff.value = !isCameraOff.value
    if (localStream.value) {
      localStream.value.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff.value
      })
    }
  }

  function setScreenSharing(value: boolean) {
    isScreenSharing.value = value
  }

  function setConnectionStatus(status: ConnectionStatus) {
    connectionStatus.value = status
  }

  function setRemoteUserId(id: string | null) {
    remoteUserId.value = id
  }

  function setAudioLevel(level: number) {
    audioLevel.value = level
  }

  function resetState() {
    roomId.value = ''
    localStream.value = null
    remoteStream.value = null
    screenStream.value = null
    isMuted.value = false
    isCameraOff.value = false
    isScreenSharing.value = false
    connectionStatus.value = 'disconnected'
    remoteUserId.value = null
    audioLevel.value = 0
  }

  return {
    roomId,
    localStream,
    remoteStream,
    screenStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    connectionStatus,
    remoteUserId,
    audioLevel,
    setRoomId,
    setLocalStream,
    setRemoteStream,
    setScreenStream,
    toggleMute,
    toggleCamera,
    setScreenSharing,
    setConnectionStatus,
    setRemoteUserId,
    setAudioLevel,
    resetState,
  }
})
