import { ref, onUnmounted } from 'vue'
import SimplePeer from 'simple-peer'
import { useCallStore } from '@/stores/callStore'
import { useSocket } from './useSocket'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

export function useWebRTC() {
  const store = useCallStore()
  const {
    connect: socketConnect,
    joinRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    leaveRoom: socketLeaveRoom,
    onUserJoined,
    onUserLeft,
    onOffer,
    onAnswer,
    onIceCandidate,
    onRoomFull,
    disconnect: socketDisconnect,
    offUserJoined,
    offUserLeft,
    offOffer,
    offAnswer,
    offIceCandidate,
    offRoomFull,
  } = useSocket()

  const peer = ref<SimplePeer.Instance | null>(null)
  const screenStream = ref<MediaStream | null>(null)
  const isInitiator = ref(false)
  const savedCameraTrack = ref<MediaStreamTrack | null>(null)

  async function getLocalStream(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    store.setLocalStream(stream)
    return stream
  }

  function createPeer(stream: MediaStream, initiator: boolean): SimplePeer.Instance {
    const p = new SimplePeer({
      initiator,
      stream,
      config: ICE_SERVERS,
      trickle: true,
    })

    p.on('signal', (data) => {
      if (!store.remoteUserId) return
      if (data.type === 'offer') {
        sendOffer(store.remoteUserId, data as RTCSessionDescriptionInit)
      } else if (data.type === 'answer') {
        sendAnswer(store.remoteUserId, data as RTCSessionDescriptionInit)
      } else if ((data as any).candidate) {
        sendIceCandidate(store.remoteUserId, data as RTCIceCandidateInit)
      }
    })

    p.on('stream', (remoteStream) => {
      console.log('[WebRTC] 收到远端流')
      store.setRemoteStream(remoteStream)
      store.setConnectionStatus('connected')
    })

    p.on('connect', () => {
      console.log('[WebRTC] P2P 连接已建立')
      store.setConnectionStatus('connected')
    })

    p.on('close', () => {
      console.log('[WebRTC] P2P 连接已关闭')
      store.setConnectionStatus('disconnected')
      peer.value = null
    })

    p.on('error', (err) => {
      console.error('[WebRTC] 连接错误:', err)
      store.setConnectionStatus('disconnected')
    })

    return p
  }

  function setupSignalingHandlers() {
    onUserJoined(handleUserJoined)
    onOffer(handleOffer)
    onAnswer(handleAnswer)
    onIceCandidate(handleIceCandidate)
    onUserLeft(handleUserLeft)
    onRoomFull(handleRoomFull)
  }

  function removeSignalingHandlers() {
    offUserJoined(handleUserJoined)
    offOffer(handleOffer)
    offAnswer(handleAnswer)
    offIceCandidate(handleIceCandidate)
    offUserLeft(handleUserLeft)
    offRoomFull(handleRoomFull)
  }

  function handleUserJoined(userId: string) {
    console.log('[信令] 用户加入:', userId)
    store.setRemoteUserId(userId)
    store.setConnectionStatus('connecting')

    const stream = store.localStream
    if (!stream) return

    if (!peer.value) {
      isInitiator.value = true
      peer.value = createPeer(stream, true)
    }
  }

  function handleOffer(data: { sdp: RTCSessionDescriptionInit; sender: string }) {
    console.log('[信令] 收到 offer')
    store.setRemoteUserId(data.sender)
    store.setConnectionStatus('connecting')

    const stream = store.localStream
    if (!stream) return

    if (!peer.value) {
      isInitiator.value = false
      peer.value = createPeer(stream, false)
    }

    peer.value.signal(data.sdp)
  }

  function handleAnswer(data: { sdp: RTCSessionDescriptionInit; sender: string }) {
    console.log('[信令] 收到 answer')
    peer.value?.signal(data.sdp)
  }

  function handleIceCandidate(data: { candidate: RTCIceCandidateInit; sender: string }) {
    if (peer.value) {
      peer.value.signal({ type: 'candidate', candidate: data.candidate as any })
    }
  }

  function handleUserLeft(userId: string) {
    console.log('[信令] 用户离开:', userId)
    destroyPeer()
    store.setRemoteStream(null)
    store.setRemoteUserId(null)
  }

  function handleRoomFull() {
    console.warn('[房间] 房间已满')
    store.setConnectionStatus('disconnected')
  }

  function destroyPeer() {
    if (peer.value) {
      peer.value.destroy()
      peer.value = null
    }
    store.setConnectionStatus('disconnected')
  }

  function getPeerConnection(): RTCPeerConnection | null {
    if (!peer.value) return null
    const pc = (peer.value as any)._pc
    return pc instanceof RTCPeerConnection ? pc : null
  }

  async function joinCall(roomId: string) {
    store.setRoomId(roomId)
    store.setConnectionStatus('connecting')

    let signalingSet = false
    let stream: MediaStream | null = null

    try {
      socketConnect()
      stream = await getLocalStream()
      setupSignalingHandlers()
      signalingSet = true

      await new Promise((resolve) => setTimeout(resolve, 300))
      joinRoom(roomId)
    } catch (err) {
      console.error('[加入房间] 失败:', err)

      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      if (signalingSet) {
        removeSignalingHandlers()
      }

      store.setLocalStream(null)
      store.setRemoteStream(null)
      store.setConnectionStatus('disconnected')
      store.setRemoteUserId(null)
      socketDisconnect()

      throw err
    }
  }

  async function startScreenShare() {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        } as any,
        audio: false,
      })

      screenStream.value = displayStream
      store.setScreenSharing(true)

      const screenTrack = displayStream.getVideoTracks()[0]
      const pc = getPeerConnection()
      if (pc && store.localStream) {
        savedCameraTrack.value = store.localStream.getVideoTracks()[0] || null
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack)
        }
      }

      if (store.localStream && screenTrack) {
        const cameraTrack = store.localStream.getVideoTracks()[0]
        if (cameraTrack) {
          cameraTrack.enabled = false
        }
      }

      screenTrack.onended = () => {
        stopScreenShare()
      }
    } catch (err) {
      console.error('[屏幕共享] 启动失败:', err)
      store.setScreenSharing(false)
    }
  }

  async function stopScreenShare() {
    if (screenStream.value) {
      screenStream.value.getTracks().forEach((track) => track.stop())
      screenStream.value = null
    }

    store.setScreenSharing(false)

    const pc = getPeerConnection()
    if (pc) {
      const cameraTrack = savedCameraTrack.value || store.localStream?.getVideoTracks()[0]
      if (cameraTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        if (sender) {
          await sender.replaceTrack(cameraTrack)
        }
        cameraTrack.enabled = true
      }
    }

    savedCameraTrack.value = null
    store.isCameraOff = false
  }

  function hangUp() {
    destroyPeer()
    removeSignalingHandlers()

    if (screenStream.value) {
      screenStream.value.getTracks().forEach((track) => track.stop())
      screenStream.value = null
    }

    if (store.localStream) {
      store.localStream.getTracks().forEach((track) => track.stop())
      store.setLocalStream(null)
    }

    store.setRemoteStream(null)
    socketLeaveRoom()
    socketDisconnect()
    store.resetState()

    savedCameraTrack.value = null
  }

  onUnmounted(() => {
    hangUp()
  })

  return {
    peer,
    screenStream,
    isInitiator,
    joinCall,
    startScreenShare,
    stopScreenShare,
    hangUp,
  }
}
