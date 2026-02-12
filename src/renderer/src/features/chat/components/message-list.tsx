import React from "react"
import { MessageBubble } from "./message-bubble"
import { ThinkingIndicator } from "./thinking-indicator"
import { EmptyState } from "./empty-state"
import { ScrollToBottomButton } from "./scroll-to-bottom-button"
import { useAutoScroll } from "../hooks/use-auto-scroll"
import type { ChatMessage, ChatPhase } from "../types"

interface MessageListProps {
  messages: ChatMessage[]
  phase: ChatPhase
  streamingMessageId: string | null
  streamingContent: string
  onSendScrollRef?: React.MutableRefObject<(() => void) | null>
}

export function MessageList({
  messages,
  phase,
  streamingMessageId,
  streamingContent,
  onSendScrollRef,
}: MessageListProps) {
  const { containerRef, scrollToBottom, requestScrollToNewMessage } =
    useAutoScroll(messages.length)

  // Expose requestScrollToNewMessage to parent synchronously at render time
  if (onSendScrollRef) {
    onSendScrollRef.current = requestScrollToNewMessage
  }

  const isEmpty = messages.length === 0 && phase === "IDLE"
  const showThinking = phase === "WAITING"

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className={`h-full overflow-y-auto py-4 ${isEmpty ? "flex flex-col" : "space-y-4"}`}
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => {
              const isActiveStream = message.id === streamingMessageId
              return (
                <div key={message.id} data-message-role={message.role}>
                  <MessageBubble
                    message={message}
                    streamingContent={isActiveStream ? streamingContent : undefined}
                    isStreaming={isActiveStream && phase === "STREAMING"}
                  />
                </div>
              )
            })}
            {showThinking && <ThinkingIndicator />}
            {/* Bottom spacer — ensures enough scroll height so any message can reach the top */}
            <div
              data-scroll-spacer
              className="shrink-0 pointer-events-none"
              style={{ height: "100%" }}
            />
          </>
        )}
      </div>
      {!isEmpty && (
        <ScrollToBottomButton
          containerRef={containerRef}
          onScrollToBottom={scrollToBottom}
        />
      )}
    </div>
  )
}
