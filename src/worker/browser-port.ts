// WeakRef을 이용해 port를 gc대상으로하기
export class BrowserPort {
  private readonly weakRef: WeakRef<MessagePort>

  constructor(port: MessagePort) {
    this.weakRef = new WeakRef(port)
    port.start()
  }

  isAlive(): boolean {
    return !!this.weakRef.deref()
  }

  postMessage(message: unknown): void {
    this.weakRef.deref()?.postMessage(message)
  }

  addEventListener(event: string, handler: (event: Event) => void): void {
    this.weakRef.deref()?.addEventListener(event, handler)
  }

  removeEventListener(event: string, handler: (event: Event) => void): void {
    this.weakRef.deref()?.removeEventListener(event, handler)
  }

  close(): void {
    this.weakRef.deref()?.close()
  }
}