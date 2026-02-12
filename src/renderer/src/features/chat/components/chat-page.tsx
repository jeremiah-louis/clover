import React, { useRef } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MessageList } from "./message-list"
import { ChatInput } from "./chat-input"
import { useChat } from "../use-chat"

export function ChatPage() {
  const {
    state,
    sendMessage,
    setInput,
    cancelStreaming,
    dismissError,
    isLoading,
    canSend,
    canCancel,
  } = useChat()

  const onSendScrollRef = useRef<(() => void) | null>(null)

  const handleSubmit = () => {
    sendMessage(state.inputValue)
    onSendScrollRef.current?.()
  }

  return (
    <TooltipProvider>
      <div className="h-dvh flex flex-col bg-background text-foreground">
        {/* Title bar drag region */}
        <div
          className="shrink-0 h-10"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4 min-h-0">
          <MessageList
            messages={state.messages}
            phase={state.phase}
            streamingMessageId={state.streamingMessageId}
            streamingContent={state.streamingContent}
            onSendScrollRef={onSendScrollRef}
          />

          {/* Error banner */}
          {state.phase === "ERROR" && state.error && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-lg">
              <span className="flex-1">{state.error}</span>
              <button
                onClick={dismissError}
                className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <ChatInput
            value={state.inputValue}
            onValueChange={setInput}
            onSubmit={handleSubmit}
            onCancel={cancelStreaming}
            isLoading={isLoading}
            canSend={canSend}
            canCancel={canCancel}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
