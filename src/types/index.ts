export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface CallState {
  roomId: ''
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  connectionStatus: ConnectionStatus
  remoteUserId: string | null
}
