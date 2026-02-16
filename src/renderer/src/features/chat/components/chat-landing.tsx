import { useMemo } from "react"
import { Monitor, Flame, Grid3x3, Sparkles } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"
import { ChatInput } from "./chat-input"

const PROMPT_SUGGESTIONS = [
  {
    label: "LCD Hello World",
    icon: Monitor,
    prompt:
      "Create an Arduino sketch that displays 'Hello World!' on a 16x2 I2C LCD (LiquidCrystal_I2C) with a custom heart character scrolling on the second line",
  },
  {
    label: "LED Matrix Swirl",
    icon: Grid3x3,
    prompt:
      "Create an Arduino sketch using FastLED that displays a colorful swirl animation with 2D blur on an 8x8 WS2811 NeoPixel LED matrix on pin 3",
  },
  {
    label: "NeoPixel Fire",
    icon: Flame,
    prompt:
      "Create an Arduino sketch using FastLED that simulates a realistic fire effect with heat color palettes on a 256-LED NeoPixel strip on pin 5",
  },
  {
    label: "Surprise me",
    icon: Sparkles,
    prompt:
      "Create a creative and fun Arduino project — maybe a metaballs animation on a 16x16 NeoPixel matrix, an OLED snowflake animation, or something unexpected. Surprise me!",
  },
]

const GRID_SQUARES: [number, number] = [80, 80]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  if (hour >= 17 && hour < 21) return "Good evening"
  return "Good night"
}

function getUserName(): string {
  try {
    const raw = localStorage.getItem("user-profile")
    if (raw) {
      const profile = JSON.parse(raw)
      if (profile.name?.trim()) return profile.name.trim()
    }
  } catch {}
  return ""
}

interface ChatLandingProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  onSendPrompt: (prompt: string) => void
  isLoading: boolean
  canSend: boolean
  canCancel: boolean
  pipelinePhase?: "idle" | "compiling" | "running" | "auto-debugging" | "error"
  debugAttempt?: number
}

export function ChatLanding({
  value,
  onValueChange,
  onSubmit,
  onCancel,
  onSendPrompt,
  isLoading,
  canSend,
  canCancel,
  pipelinePhase,
  debugAttempt,
}: ChatLandingProps) {
  const userName = useMemo(() => getUserName(), [])
  const greeting = userName ? `${getGreeting()}, ${userName}` : getGreeting()

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-16 overflow-hidden">
      <InteractiveGridPattern
        width={20}
        height={20}
        squares={GRID_SQUARES}
        className="[mask-image:linear-gradient(to_top,white_20%,transparent_55%)]"
      />
      {/* Greeting */}
      <div className="relative z-10 mb-8 flex items-center gap-3 text-3xl font-serif italic font-medium text-foreground tracking-tight">
        <Logo className="w-8 h-8 shrink-0" fill="currentColor" animate={false} />
        <span>{greeting}</span>
      </div>

      {/* Centered chat input */}
      <div className="relative z-10 w-full max-w-2xl">
        <ChatInput
          value={value}
          onValueChange={onValueChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isLoading={isLoading}
          canSend={canSend}
          canCancel={canCancel}
          pipelinePhase={pipelinePhase}
          debugAttempt={debugAttempt}
        />

        {/* Prebuilt prompt suggestions */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => onSendPrompt(suggestion.prompt)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-background border border-border rounded-full hover:text-foreground hover:border-foreground/30 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <suggestion.icon className="w-4 h-4" />
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
