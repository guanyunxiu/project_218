import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  function connect(url?: string) {
    const serverUrl = url || window.location.origin
    socket.value = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('[Socket] 已连接:', socket.value?.id)
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] 已断开:', reason)
    })

    socket.value.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message)
    })

    socket.value.on('reconnect', (attempt) => {
      console.log('[Socket] 重新连接成功，尝试次数:', attempt)
    })

    socket.value.on('reconnect_failed', () => {
      console.error('[Socket] 重连失败，已达到最大尝试次数')
    })
  }

  function joinRoom(roomId: string) {
    socket.value?.emit('join-room', roomId)
  }

  function sendOffer(target: string, sdp: RTCSessionDescriptionInit) {
    socket.value?.emit('offer', { target, sdp })
  }

  function sendAnswer(target: string, sdp: RTCSessionDescriptionInit) {
    socket.value?.emit('answer', { target, sdp })
  }

  function sendIceCandidate(target: string, candidate: RTCIceCandidateInit) {
    socket.value?.emit('ice-candidate', { target, candidate })
  }

  function leaveRoom() {
    socket.value?.emit('leave-room')
  }

  function onUserJoined(callback: (userId: string) => void) {
    socket.value?.on('user-joined', callback)
  }

  function offUserJoined(callback: (userId: string) => void) {
    socket.value?.off('user-joined', callback)
  }

  function onUserLeft(callback: (userId: string) => void) {
    socket.value?.on('user-left', callback)
  }

  function offUserLeft(callback: (userId: string) => void) {
    socket.value?.off('user-left', callback)
  }

  function onOffer(callback: (data: { sdp: RTCSessionDescriptionInit; sender: string }) => void) {
    socket.value?.on('offer', callback)
  }

  function offOffer(callback: (data: { sdp: RTCSessionDescriptionInit; sender: string }) => void) {
    socket.value?.off('offer', callback)
  }

  function onAnswer(callback: (data: { sdp: RTCSessionDescriptionInit; sender: string }) => void) {
    socket.value?.on('answer', callback)
  }

  function offAnswer(callback: (data: { sdp: RTCSessionDescriptionInit; sender: string }) => void) {
    socket.value?.off('answer', callback)
  }

  function onIceCandidate(callback: (data: { candidate: RTCIceCandidateInit; sender: string }) => void) {
    socket.value?.on('ice-candidate', callback)
  }

  function offIceCandidate(callback: (data: { candidate: RTCIceCandidateInit; sender: string }) => void) {
    socket.value?.off('ice-candidate', callback)
  }

  function onRoomFull(callback: () => void) {
    socket.value?.on('room-full', callback)
  }

  function offRoomFull(callback: () => void) {
    socket.value?.off('room-full', callback)
  }

  function removeAllListeners() {
    if (!socket.value) return
    socket.value.off('user-joined')
    socket.value.off('user-left')
    socket.value.off('offer')
    socket.value.off('answer')
    socket.value.off('ice-candidate')
    socket.value.off('room-full')
  }

  function disconnect() {
    if (socket.value) {
      removeAllListeners()
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    connect,
    joinRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    leaveRoom,
    onUserJoined,
    offUserJoined,
    onUserLeft,
    offUserLeft,
    onOffer,
    offOffer,
    onAnswer,
    offAnswer,
    onIceCandidate,
    offIceCandidate,
    onRoomFull,
    offRoomFull,
    removeAllListeners,
    disconnect,
  }
}
