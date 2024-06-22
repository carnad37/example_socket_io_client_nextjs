// Webpack5 부터 지원하는 방법.
// 다만 chunk파일의 명칭이 달라지는관계로 같은 page에서만 공유한다.
// worker와 페이지간에 통신은 message로만 이루워지며, 실질적인 정보교환은 1:1로 이루워진다.
// 즉, 아무리 여러 탭에서 해당 worker를 공유하고있어도
// 소켓은 하나만 생성된다.
import {WebSocketHub} from "@/worker/web-socket-hub";
import {BrowserPort} from "@/worker/browser-port";

interface SharedWorkerGlobalScope {
  onconnect: (event: MessageEvent) => void
  close: () => void
}

const _self: SharedWorkerGlobalScope = self as any
const hub = new WebSocketHub(()=>{
  _self.close()
})

_self.onconnect = function (e) {
  const port = e.ports[0]
  const browserPort = new BrowserPort(port)
  hub.socketProcess(browserPort)
}
