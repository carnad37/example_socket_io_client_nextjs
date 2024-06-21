import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { WsWorkerContextType, WsWorkerMessageType } from '@/types/common-type'

type Transport = 'polling' | 'websocket'
interface OptionType {
  context?: Record<string, string>
  path?: string
  onConnect?: (
    emit: (eventName: string, args: string | Record<string, string>) => void
  ) => void
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
  const workerRef = useRef<SharedWorker | null>(null)
  const initRef = useRef(false)
  const pathname = usePathname()

  const emit = (eventName: string, args: string | Record<string, string>) => {
    const message = {
      messageData: {
        name: eventName,
        value: args
      }
    } as WsWorkerMessageType
    if (workerRef.current) {
      workerRef.current?.port.postMessage(message)
    }
  }

  const connect = () => {
    // worker 초기화
    const transport = options?.transport ?? DEFAULT_TRANSPORT
    const header = options?.header ? options.header : {}
    const query = options?.query ? options.query : {}
    const wsUrl = url + (options?.path ?? pathname)
    const events = options?.onEvents || []
    const initData = {
      transport,
      header,
      query,
      wsUrl
    }
    const contextData: WsWorkerContextType = {
      data: options?.context || {},
      events: events.map((el) => el.name)
    }

    if (typeof window !== 'undefined' && window?.SharedWorker) {
      const worker = new SharedWorker(
        new URL('@/worker/ws-store.ts', import.meta.url)
      )
      worker.port.onmessage = (e: MessageEvent<WsWorkerMessageType>) => {
        const responseData = e.data?.responseData
        if (!initRef.current && responseData) {
          // 초기화용 요청 처리(1회성)
          initRef.current = true
          for (const tEvent of events) {
            if (responseData?.[tEvent.name]) {
              tEvent.event(responseData[tEvent.name])
            }
          }
        }

        if (e.data?.messageData) {
          // 메세지처리
          const messageData = e.data.messageData
          for (const tEvent of events) {
            if (messageData.name === tEvent.name) {
              tEvent.event(messageData.value as string)
              break
            }
          }
        } else if (e.data?.shareData) {
          // 워커와 통신용
          const shareData = e.data?.shareData
          if (shareData?.setup === true) {
            // 워커와 연결이 이루워진뒤
            if (options?.onConnect) options.onConnect(emit)
            setSocketInfo((prev) => ({
              ...prev,
              isConnected: true
            }))
          }
        }
        console.log('Caller Received:', e.data)
      }
      worker.port.start()
      worker.port.postMessage({
        initData,
        contextData
      } as WsWorkerMessageType)
      workerRef.current = worker
    }
  }

  // 워커 종료시 disconnect가 되므로 따로 useEffect로 처리하지 않는다.
  useEffect(() => {
    const worker = workerRef
    return () => {
      console.log('unmounted')
      worker.current?.port.close()
    }
  }, [])

  return {
    connect,
    ...socketInfo
  }
}

export default useSocket
