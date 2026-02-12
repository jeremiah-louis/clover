import { useReducer, useCallback, useRef, useEffect } from "react"
import { chatReducer, initialChatState } from "./chat-reducer"
import { selectMockResponse, isErrorResponse } from "./mock-responses"

const TOKEN_DELAY_MS = 15
const WAITING_DELAY_MS = 600
const RENDER_SETTLE_MS = 100

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
    }
  }, [])

  const cancelStreaming = useCallback(() => {
    abortRef.current = true
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current)
      streamTimerRef.current = null
    }
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current)
      waitTimerRef.current = null
    }
    dispatch({ type: "CANCEL_STREAMING" })
  }, [])

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    // Cancel any in-progress stream before starting a new one
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
    abortRef.current = true

    const userMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()

    // Finalize any in-progress streaming before submitting new message
    dispatch({ type: "STREAM_COMPLETE" })
    dispatch({ type: "RENDER_COMPLETE" })

    // IDLE/READY → VALIDATING
    dispatch({
      type: "SUBMIT_MESSAGE",
      payload: { id: userMessageId, content: trimmed, createdAt: Date.now() },
    })

    // VALIDATING → SENDING
    dispatch({ type: "MESSAGE_SENT" })

    // SENDING → WAITING (adds assistant placeholder)
    dispatch({ type: "START_WAITING", payload: { messageId: assistantMessageId } })

    const mockResponse = selectMockResponse(trimmed)
    abortRef.current = false

    // Simulate "thinking" delay then start streaming
    waitTimerRef.current = setTimeout(() => {
      if (abortRef.current) return

      // Check for simulated error
      if (isErrorResponse(mockResponse)) {
        dispatch({ type: "ERROR", payload: "Something went wrong. The API returned an unexpected error." })
        return
      }

      // WAITING → STREAMING
      dispatch({ type: "START_STREAMING" })

      const fullContent = mockResponse.content
      const delay = mockResponse.streamDelayMs ?? TOKEN_DELAY_MS
      let charIndex = 0

      const streamNextChunk = () => {
        if (abortRef.current || charIndex >= fullContent.length) {
          if (!abortRef.current) {
            // STREAMING → RENDERING
            dispatch({ type: "STREAM_COMPLETE" })
            streamTimerRef.current = setTimeout(() => {
              // RENDERING → READY
              dispatch({ type: "RENDER_COMPLETE" })
            }, RENDER_SETTLE_MS)
          }
          return
        }

        // Variable chunk size (1-4 chars) for natural feel
        const chunkSize = Math.min(
          1 + Math.floor(Math.random() * 3),
          fullContent.length - charIndex,
        )
        const chunk = fullContent.slice(charIndex, charIndex + chunkSize)
        charIndex += chunkSize

        dispatch({ type: "STREAM_TOKEN", payload: chunk })
        streamTimerRef.current = setTimeout(streamNextChunk, delay)
      }

      streamNextChunk()
    }, WAITING_DELAY_MS)
  }, [])

  const setInput = useCallback((value: string) => {
    dispatch({ type: "SET_INPUT", payload: value })
  }, [])

  const dismissError = useCallback(() => {
    dispatch({ type: "DISMISS_ERROR" })
  }, [])

  const reset = useCallback(() => {
    cancelStreaming()
    dispatch({ type: "RESET" })
  }, [cancelStreaming])

  return {
    state,
    sendMessage,
    setInput,
    cancelStreaming,
    dismissError,
    reset,
    // Derived convenience values
    isStreaming: state.phase === "STREAMING",
    isWaiting: state.phase === "WAITING",
    isLoading:
      state.phase === "SENDING" ||
      state.phase === "WAITING" ||
      state.phase === "STREAMING" ||
      state.phase === "RENDERING",
    canSend:
      (state.phase === "IDLE" || state.phase === "READY" || state.phase === "COMPOSING") &&
      state.inputValue.trim().length > 0,
    canCancel: state.phase === "STREAMING" || state.phase === "WAITING",
  }
}
