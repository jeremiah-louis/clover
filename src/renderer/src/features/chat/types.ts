export type MessageRole = "user" | "assistant"

export type MessageStatus = "sending" | "streaming" | "complete" | "error"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: number
  error?: string
}

export type ChatPhase =
  | "IDLE"
  | "READY"
  | "COMPOSING"
  | "VALIDATING"
  | "SENDING"
  | "WAITING"
  | "STREAMING"
  | "RENDERING"
  | "ERROR"

export interface ChatState {
  phase: ChatPhase
  messages: ChatMessage[]
  streamingMessageId: string | null
  streamingContent: string
  error: string | null
  inputValue: string
}

export type ChatAction =
  | { type: "SET_INPUT"; payload: string }
  | { type: "SUBMIT_MESSAGE"; payload: { id: string; content: string; createdAt: number } }
  | { type: "VALIDATION_FAILED"; payload: string }
  | { type: "MESSAGE_SENT" }
  | { type: "START_WAITING"; payload: { messageId: string } }
  | { type: "START_STREAMING" }
  | { type: "STREAM_TOKEN"; payload: string }
  | { type: "STREAM_COMPLETE" }
  | { type: "RENDER_COMPLETE" }
  | { type: "ERROR"; payload: string }
  | { type: "DISMISS_ERROR" }
  | { type: "CANCEL_STREAMING" }
  | { type: "RESET" }
