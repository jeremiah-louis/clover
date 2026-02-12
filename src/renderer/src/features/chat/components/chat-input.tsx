import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  isLoading: boolean
  canSend: boolean
  canCancel: boolean
}

export function ChatInput({
  value,
  onValueChange,
  onSubmit,
  onCancel,
  isLoading,
  canSend,
  canCancel,
}: ChatInputProps) {
  return (
    <PromptInput
      value={value}
      onValueChange={onValueChange}
      isLoading={isLoading}
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card p-2 shadow-sm"
    >
      <PromptInputTextarea placeholder="Message Claude..." />
      <PromptInputActions className="justify-between px-2 pb-1">
        <div className="flex items-center gap-1">
          <PromptInputAction tooltip="Attach file">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </Button>
          </PromptInputAction>
        </div>
        <PromptInputAction tooltip={canCancel ? "Stop" : "Send message"}>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={canCancel ? onCancel : onSubmit}
            disabled={!canCancel && !canSend}
          >
            {canCancel ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  )
}
