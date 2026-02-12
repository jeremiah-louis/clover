import { Logo } from "@/components/ui/logo"

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Logo className="w-10 h-10 text-muted-foreground/40" animate={true} />
      <div className="text-center space-y-1">
        <h2 className="text-lg font-medium text-foreground">How can I help?</h2>
        <p className="text-sm text-muted-foreground">
          Ask me anything — code, writing, analysis, or just brainstorm.
        </p>
      </div>
    </div>
  )
}
