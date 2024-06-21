export interface WsWorkerContextType {
  data?: Record<string, string>
  events?: string[]
}

export interface WsWorkerMessageType {
  initData?: {
    wsUrl: string
    query?: Record<string, string>
    header?: Record<string, string>
    transport: string
  }
  contextData?: WsWorkerContextType
  responseData?: Record<string, string>
  messageData?: {
    name: string
    value: string | Record<string, string>
  }
  shareData?: {
    setup?: boolean
  }
}
