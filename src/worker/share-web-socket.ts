import { BrowserPort } from '@/worker/browser-port'
import {
  WsWorkerContextType,
  WsWorkerEventType,
  WsWorkerInitDataType,
  WsWorkerMessageType
} from '@/types/common-type'
import {io, Socket} from "socket.io-client";

interface InitType {
  port: BrowserPort,
  initData: WsWorkerInitDataType,
  contextData: WsWorkerContextType
}

export class ShareWebSocket {

  // 연결은
  // 페이지와 워커간의 연결(protProcess)이 이루워진뒤(port.start()),
  // 웹소켓 연결이 진행된다(io(...))
  // 페이지와 워커는 postMessage로밖에 통신할수 없으므로 코딩시 주의.
  constructor(initData: InitType, closeCallback: ()=>void, healthCheckTime?: number) {
    this.context = {}
    this.ports = []
    this.responseData = {}
    this.closeCallback = closeCallback
    this.healthCheckTime = healthCheckTime ?? 3000

    // 초기화
    this.portProcess(initData)

    // 상태체크 스케쥴러
    this.healthCheck()
  }

  private ws: Socket | undefined = undefined
  private ports: BrowserPort[]
  private closeCallback: () => void
  private context: WsWorkerContextType
  // 기존 소켓 이벤트 데이터
  private responseData: Record<string, string> = {}
  private healthCheckTime: number

  messageProcess = (messageData: WsWorkerEventType) => {
    if (!this.ws) return
    const data =
      typeof messageData.value === 'string'
        ? {
          ...this.context.data,
          data: messageData.value
        }
        : {
          ...this.context.data,
          ...messageData.value
        }
    this.ws.emit(messageData.name, data)
  }

  portProcess = ({port, initData, contextData}: InitType) => {
    if (!this.ws) {
      Object.assign(this.context, contextData)
      this.ws = io(initData.wsUrl, {
        extraHeaders: initData.header,
        query: initData.query,
        transports: [initData.transport]
      })
      // 이벤트 초기화
      for (const tEvent of this.context?.events || []) {
        this.ws.on(tEvent, (res) => {
          this.responseData[tEvent] = res
          this.sendEventMessage(tEvent, res)
        })
      }
    }
    this.allClear()
    this.ports.push(port)

    // 기존 소켓 이벤트 데이터와 연동
    this.postMessage(port, {
      responseData: this.responseData,
      shareData: {
        setup: true
      }
    })
  }

  private healthCheck = () => {
    this.allClear()
    if (this.ports.length > 0) {
      setTimeout(this.healthCheck, this.healthCheckTime)
    } else {
      this.closeCallback()
    }
  }

  allClear = () => {
    this.ports = this.ports.filter(port=>port.isAlive())
  }

  isAlive = () => {
    this.allClear()
    return this.ports.length > 0
  }

  private postMessage = (port: BrowserPort, message: WsWorkerMessageType) => {
    port.postMessage(message)
  }

  private sendEventMessage = (eventName: string, response: string) => {
    this.ports.forEach((port) => {
      if (!port.isAlive()) return
      this.postMessage(port, {
        eventData: {
          name: eventName,
          value: response
        }
      })
    })
  }
}
