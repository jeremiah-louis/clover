import { TextShimmer } from "@/components/ui/text-shimmer"

export function ThinkingIndicator() {
  return (
    <div className="flex items-center py-2 px-1">
      <TextShimmer className="text-sm" duration={1.5}>
        Thinking...
      </TextShimmer>
    </div>
  )
}
