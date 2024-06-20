import { io, type Socket } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

type Transport = 'polling' | 'websocket'
interface OptionType {
  path?: string
  onConnect?: (socket: Socket) => void
  onDisconnect?: (socket: Socket) => void
  transport?: Transport
  header?: Record<string, string>
  onEvents?: [
    {
      name: string
      event: (response: string) => void
    }
  ]
}

interface SocketInfo {
  isConnected: boolean
  transport: string
}

const DEFAULT_TRANSPORT: Transport = 'websocket'

const useSocket = (url: string, options?: OptionType) => {
  const [socketInfo, setSocketInfo] = useState<SocketInfo>({
    isConnected: false,
    transport: 'N/A'
  })
  const socketRef = useRef<Socket | null>(null)
  const optionsRef = useRef<OptionType | undefined>(options)
  const pathname = usePathname()

  const onConnect = () => {
    if (socketRef.current) {
      setSocketInfo({
        isConnected: true,
        transport: socketRef.current.io.engine.transport.name
      })
      if (optionsRef.current?.onConnect)
        optionsRef.current.onConnect(socketRef.current)
    }
  }

  const onDisconnect = () => {
    if (socketRef.current) {
      setSocketInfo({
        isConnected: false,
        transport: 'N/A'
      })
    }
  }

  const connect = () => {
    if (socketRef.current?.connected) throw new Error('socket already connect')
    const transport = optionsRef.current?.transport ?? DEFAULT_TRANSPORT
    const wsUrl = url + (optionsRef.current?.path ?? pathname)
    const socket = io(wsUrl, {
      extraHeaders: optionsRef.current?.header ? optionsRef.current.header : {},
      transports: [transport]
    })
    socketRef.current = socket
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (
      optionsRef.current?.onEvents &&
      Array.isArray(optionsRef.current?.onEvents)
    ) {
      for (const tEvents of optionsRef.current.onEvents) {
        socket.on(tEvents.name, tEvents.event)
      }
    }
  }

  const disconnect = () => {
    if (socketRef.current?.connected) {
      if (optionsRef.current?.onDisconnect)
        optionsRef.current.onDisconnect(socketRef.current)
      socketRef.current?.disconnect()
    }
  }

  useEffect(() => {
    const tSocket = socketRef
    const toptionsRef = optionsRef
    return () => {
      if (tSocket.current?.connected && toptionsRef.current) {
        disconnect()
      }
    }
  }, [])

  return {
    socketRef,
    connect,
    disconnect,
    ...socketInfo
  }
}

export default useSocket
