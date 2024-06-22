import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  WsWorkerClientMessageType,
  WsWorkerContextType,
  WsWorkerMessageSeverType,
  WsWorkerMessageType
} from '@/types/common-type'

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

const useSharedSocket = (url: string, options?: OptionType) => {
  const [socketInfo, setSocketInfo] = useState<SocketInfo>({
    isConnected: false,
    transport: 'N/A'
  })
  const workerRef = useRef<SharedWorker | null>(null)
  const initRef = useRef(false)
  const pathname = usePathname()

  const emitCover = (data: WsWorkerClientMessageType) => {
    if (workerRef.current) {
      workerRef.current.port.postMessage({
        uniqueName: pathname,
        clientMessage: data
      } as WsWorkerMessageSeverType)
    }
  }

  const emit = (eventName: string, args: string | Record<string, string>) => {
    const message = {
      eventData: {
        name: eventName,
        value: args
      }
    } as WsWorkerMessageType
    if (workerRef.current) {
      emitCover(message)
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
        new URL('@/worker/ws-store.ts', import.meta.url), {
          name: 'toy-socket-example'
        }
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

        if (e.data?.eventData) {
          // 메세지처리
          const messageData = e.data.eventData
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
      }
      worker.port.start()
      workerRef.current = worker

      // 초기화 emit
      emitCover({
        initData,
        contextData
      })
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

export default useSharedSocket
