import React, { useState } from "react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
  PromptInputContextItems,
  PromptInputVariantContext,
} from "@/components/ui/prompt-input";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export function PromptInputDemo() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVariant, setShowVariant] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    setMessages((prev) => [...prev, value]);
    setValue("");
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <TooltipProvider>
      <div className="h-dvh flex flex-col bg-background text-foreground">
        {/* Title bar drag region */}
        <div
          className="shrink-0 h-10 flex items-center justify-center"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <span className="text-xs text-muted-foreground">
            PromptInput Demo
          </span>
        </div>

        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pb-4">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  Type a message and press Enter to test the component
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="flex justify-end">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm max-w-[70%]">
                  {msg}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                Thinking...
              </div>
            )}
          </div>

          {/* Toggle options */}
          <div className="flex gap-2 mb-2">
            <Button
              variant={showVariant ? "default" : "outline"}
              size="sm"
              onClick={() => setShowVariant(!showVariant)}
            >
              Variant Badge
            </Button>
            <Button
              variant={showContext ? "default" : "outline"}
              size="sm"
              onClick={() => setShowContext(!showContext)}
            >
              Context Items
            </Button>
          </div>

          {/* PromptInput component */}
          <PromptInput
            value={value}
            onValueChange={setValue}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            selectedVariant={
              showVariant ? { id: "1", name: "Claude Sonnet 4.5" } : null
            }
            contextItems={
              showContext ? (
                <div className="flex gap-1 px-2 pb-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    App.tsx
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    utils.ts
                  </span>
                </div>
              ) : undefined
            }
            className="rounded-xl border border-border bg-card p-2 shadow-sm"
          >
            <PromptInputVariantContext />
            <PromptInputContextItems />
            <PromptInputTextarea placeholder="Type a message..." />
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
              <PromptInputAction tooltip={isLoading ? "Stop" : "Send message"}>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={isLoading ? () => setIsLoading(false) : handleSubmit}
                  disabled={!isLoading && !value.trim()}
                >
                  {isLoading ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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
        </div>
      </div>
    </TooltipProvider>
  );
}
