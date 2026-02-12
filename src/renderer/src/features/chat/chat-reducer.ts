import type { ChatState, ChatAction, ChatMessage } from "./types"

export const initialChatState: ChatState = {
  phase: "IDLE",
  messages: [],
  streamingMessageId: null,
  streamingContent: "",
  error: null,
  inputValue: "",
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, inputValue: action.payload }

    case "SUBMIT_MESSAGE": {
      if (state.phase !== "IDLE" && state.phase !== "READY" && state.phase !== "COMPOSING") {
        return state
      }
      const userMessage: ChatMessage = {
        id: action.payload.id,
        role: "user",
        content: action.payload.content,
        status: "sending",
        createdAt: action.payload.createdAt,
      }
      return {
        ...state,
        phase: "VALIDATING",
        messages: [...state.messages, userMessage],
        inputValue: "",
      }
    }

    case "VALIDATION_FAILED": {
      if (state.phase !== "VALIDATING") return state
      const lastMessage = state.messages[state.messages.length - 1]
      return {
        ...state,
        phase: state.messages.length > 1 ? "READY" : "IDLE",
        error: action.payload,
        messages: state.messages.slice(0, -1),
        inputValue: lastMessage?.content ?? state.inputValue,
      }
    }

    case "MESSAGE_SENT":
      if (state.phase !== "VALIDATING") return state
      return {
        ...state,
        phase: "SENDING",
        messages: state.messages.map((m, i) =>
          i === state.messages.length - 1 ? { ...m, status: "complete" as const } : m,
        ),
      }

    case "START_WAITING": {
      if (state.phase !== "SENDING") return state
      const assistantMessage: ChatMessage = {
        id: action.payload.messageId,
        role: "assistant",
        content: "",
        status: "streaming",
        createdAt: Date.now(),
      }
      return {
        ...state,
        phase: "WAITING",
        messages: [...state.messages, assistantMessage],
        streamingMessageId: action.payload.messageId,
        streamingContent: "",
      }
    }

    case "START_STREAMING":
      if (state.phase !== "WAITING") return state
      return { ...state, phase: "STREAMING" }

    case "STREAM_TOKEN":
      if (state.phase !== "STREAMING") return state
      return {
        ...state,
        streamingContent: state.streamingContent + action.payload,
      }

    case "STREAM_COMPLETE":
      if (state.phase !== "STREAMING") return state
      return {
        ...state,
        phase: "RENDERING",
        messages: state.messages.map((m) =>
          m.id === state.streamingMessageId
            ? { ...m, content: state.streamingContent, status: "complete" as const }
            : m,
        ),
        streamingMessageId: null,
        streamingContent: "",
      }

    case "CANCEL_STREAMING":
      if (state.phase !== "STREAMING" && state.phase !== "WAITING") return state
      return {
        ...state,
        phase: "READY",
        messages: state.streamingContent
          ? state.messages.map((m) =>
              m.id === state.streamingMessageId
                ? { ...m, content: state.streamingContent, status: "complete" as const }
                : m,
            )
          : // If no content streamed yet (WAITING), remove the empty placeholder
            state.messages.filter((m) => m.id !== state.streamingMessageId),
        streamingMessageId: null,
        streamingContent: "",
      }

    case "RENDER_COMPLETE":
      if (state.phase !== "RENDERING") return state
      return { ...state, phase: "READY" }

    case "ERROR":
      return {
        ...state,
        phase: "ERROR",
        error: action.payload,
        messages: state.streamingMessageId
          ? state.messages.map((m) =>
              m.id === state.streamingMessageId
                ? { ...m, status: "error" as const, error: action.payload }
                : m,
            )
          : state.messages,
        streamingMessageId: null,
        streamingContent: "",
      }

    case "DISMISS_ERROR":
      if (state.phase !== "ERROR") return state
      return {
        ...state,
        phase: state.messages.length > 0 ? "READY" : "IDLE",
        error: null,
      }

    case "RESET":
      return { ...initialChatState }

    default:
      return state
  }
}
