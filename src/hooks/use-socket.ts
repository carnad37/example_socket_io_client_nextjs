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
  query?: Record<string, string>
  share?: boolean
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
  const pathname = usePathname()

  const onConnect = () => {
    if (socketRef.current) {
      setSocketInfo({
        isConnected: true,
        transport: socketRef.current.io.engine.transport.name
      })
      if (options?.onConnect) options.onConnect(socketRef.current)
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
    const transport = options?.transport ?? DEFAULT_TRANSPORT
    const header = options?.header ? options.header : {}
    const query = options?.query ? options.query : {}
    const wsUrl = url + (options?.path ?? pathname)
    const socket = io(wsUrl, {
      extraHeaders: header,
      query,
      transports: [transport]
    })
    socketRef.current = socket
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (options?.onEvents && Array.isArray(options?.onEvents)) {
      for (const tEvents of options.onEvents) {
        socket.on(tEvents.name, tEvents.event)
      }
    }
  }

  const disconnect = () => {
    if (socketRef.current?.connected) {
      if (options?.onDisconnect) options.onDisconnect(socketRef.current)
      socketRef.current?.disconnect()
    }
  }

  useEffect(() => {
    const tSocket = socketRef
    return () => {
      if (tSocket.current?.connected) {
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
