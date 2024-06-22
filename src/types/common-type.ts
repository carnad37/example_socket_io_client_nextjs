export interface WsWorkerContextType {
  data?: Record<string, string>
  events?: string[]
}

export interface WsWorkerInitDataType {
  wsUrl: string
  transport: string
  query?: Record<string, string>
  header?: Record<string, string>
}

export interface WsWorkerEventType {
  name: string
  value: string | Record<string, string>
}

export interface WsWorkerClientMessageType {
  initData?: WsWorkerInitDataType
  contextData?: WsWorkerContextType
  eventData?: WsWorkerEventType
}

export interface WsWorkerMessageSeverType {
  uniqueName: string,
  clientMessage: WsWorkerClientMessageType
}

export interface WsWorkerMessageType {
  responseData?: Record<string, string>
  eventData?: WsWorkerEventType
  shareData?: {
    setup?: boolean
  }
}
