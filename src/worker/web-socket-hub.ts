import {ShareWebSocket} from "@/worker/share-web-socket";
import { WsWorkerMessageSeverType } from "@/types/common-type";
import {BrowserPort} from "@/worker/browser-port";

export class WebSocketHub {

  private wsStore: Map<string, ShareWebSocket>
  private readonly closeCallback: ()=>void

  constructor(closeCallback: ()=>void) {
    this.wsStore = new Map()
    this.closeCallback = closeCallback
  }

  socketProcess = (browserPort: BrowserPort) => {
    // 처음 요청이 들어온 시점에 소켓은 어디서 보낸건지 알 수가 없다.
    // hub에서는 init에 관련된 postMessage만 처리함
    const messageEvent = (rawEvent: Event) => {
      const e = rawEvent as MessageEvent<WsWorkerMessageSeverType>
      const uniqueName = e.data.uniqueName
      if (!uniqueName) return
      const tSocket = this.wsStore.get(uniqueName)
      if (tSocket && e.data.clientMessage.eventData) tSocket.messageProcess(e.data.clientMessage.eventData)
    }

    const portEvent = (rawEvent: Event) => {
      const e = rawEvent as MessageEvent<WsWorkerMessageSeverType>
      console.log(e.data)
      const uniqueName = e.data.uniqueName
      if (!uniqueName) return
      const tSocket = this.wsStore.get(uniqueName)
      // 첫 postMessage인경우
      if (e.data.clientMessage.contextData && e.data.clientMessage.initData) {
        // 소켓 map에 분배처리
        const wsInitData = {
          port: browserPort,
          initData: e.data.clientMessage.initData,
          contextData: e.data.clientMessage.contextData
        }
        if (tSocket) {
          // 이미 추가되어있다면, port만 추가한다.
          tSocket.portProcess(wsInitData)
        } else {
          // 새로 hub에 등록한다
          this.wsStore.set(uniqueName, new ShareWebSocket(wsInitData, () => this.del(uniqueName)))
        }
        browserPort.addEventListener('message', messageEvent)
        browserPort.removeEventListener('message', portEvent)
      }
    }

    browserPort.addEventListener('message', portEvent)
  }

  del(uniqueName: string) {
    // ws 객체내의 port가 전부 gc로 사라지면 실행
    this.wsStore.delete(uniqueName)
    if (this.wsStore.size < 1) {
      // 전부 gc되면 worker 종료용 콜백 호출.
      this.closeCallback()
    }
  }

  allClear() {
    for(const [wsName, ws] of this.wsStore.entries()) {
      if (!ws.isAlive()) {
        this.del(wsName)
      }
    }
  }
}