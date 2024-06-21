// Webpack5 부터 지원하는 방법.
// 다만 chunk파일의 명칭이 달라지는관계로 같은 page에서만 공유한다.
// worker와 페이지간에 통신은 message로만 이루워지며, 실질적인 정보교환은 1:1로 이루워진다.
// 즉, 아무리 여러 탭에서 해당 worker를 공유하고있어도
// 소켓은 하나만 생성된다.
import { io, Socket } from 'socket.io-client'
import { WsWorkerContextType, WsWorkerMessageType } from '@/types/common-type'
import { BrowserPort } from '@/worker/browser-port'

interface SharedWorkerGlobalScope {
  onconnect: (event: MessageEvent) => void
  close: () => void
}

const _self: SharedWorkerGlobalScope = self as any

let ports: BrowserPort[] = []
const context: WsWorkerContextType = {}
let contextInitFlag = false
const responseData: Record<string, string> = {}

let isHealthCheck = false
const workerHealthCheck = () => {
  if (!emptyPorts()) {
    setTimeout(workerHealthCheck, 3000)
  } else {
    _self.close()
  }
}

const postMessage = (port: BrowserPort, message: WsWorkerMessageType) => {
  port.postMessage(message)
}

const emptyPorts = () => {
  ports = ports.filter((el) => el.isAlive())
  return ports.length < 1
}

const sendEventMessage = (eventName: string, response: string) => {
  if (!emptyPorts()) {
    ports.forEach((port) => {
      if (port.isAlive()) {
        postMessage(port, {
          messageData: {
            name: eventName,
            value: response
          }
        })
      }
    })
  } else {
    _self.close()
  }
}

let ws: Socket | undefined

_self.onconnect = function (e) {
  const port = e.ports[0]
  const browserPort = new BrowserPort(port)
  browserPort.addEventListener('message', (rawEvent: Event) => {
    const e = rawEvent as MessageEvent<WsWorkerMessageType>
    console.log(e.data)
    if (!contextInitFlag && e.data.contextData && e.data.initData) {
      const initData = e.data.initData
      contextInitFlag = true
      Object.assign(context, e.data.contextData)
      ws = io(initData.wsUrl, {
        extraHeaders: initData.header,
        query: initData.query,
        transports: [initData.transport]
      })
      // 이벤트 초기화
      for (const tEvent of context?.events || []) {
        console.log(tEvent)
        ws.on(tEvent, (res) => {
          responseData[tEvent] = res
          sendEventMessage(tEvent, res)
        })
      }
    } else if (e.data.messageData) {
      const messageData = e.data.messageData
      console.log('messageData', messageData)
      console.log('context.data', context.data)
      const data =
        typeof messageData.value === 'string'
          ? {
              ...context.data,
              data: messageData.value
            }
          : {
              ...context.data,
              ...messageData.value
            }

      if (ws) {
        ws.emit(messageData.name, data)
      }
    }
  })
  port.start()

  ports.forEach((el) => {
    console.log('el.isAlive()', el.isAlive())
  })
  ports.forEach((tPort) => {
    if (!tPort.isAlive()) {
      tPort.close()
    }
  })
  emptyPorts()
  ports.push(browserPort)
  if (!isHealthCheck) {
    isHealthCheck = true
    workerHealthCheck()
  }
  // init message
  postMessage(browserPort, {
    responseData,
    shareData: {
      setup: true
    }
  })
}
