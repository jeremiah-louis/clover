import { FolderOpen } from "lucide-react"
import { cn } from "@/utils"

interface ProjectIconProps {
  className?: string
}

export function ProjectIcon({ className }: ProjectIconProps) {
  return (
    <FolderOpen
      className={cn("text-muted-foreground shrink-0", className)}
    />
  )
}
