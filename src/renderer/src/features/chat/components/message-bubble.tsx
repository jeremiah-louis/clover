import { memo } from "react";
import {
  ChatMarkdownRenderer,
  MemoizedMarkdown,
} from "@/components/chat-markdown";
import type { ChatMessage } from "../types";

interface MessageBubbleProps {
  message: ChatMessage;
  streamingContent?: string;
  isStreaming?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  streamingContent,
  isStreaming = false,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-muted rounded-2xl px-3.5 py-2 text-sm max-w-[75%] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  const content = isStreaming ? (streamingContent ?? "") : message.content;

  if (!content && !isStreaming) return null;

  return (
    <div className="px-1">
      {message.status === "error" ? (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {message.error ?? "An error occurred."}
        </div>
      ) : isStreaming ? (
        <ChatMarkdownRenderer content={content} isStreaming={true} size="md" />
      ) : (
        <MemoizedMarkdown content={content} id={message.id} size="md" />
      )}
    </div>
  );
});
