import React, { useMemo } from "react"

import { cn } from "@/utils"

interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  squares?: [number, number]
  className?: string
  squaresClassName?: string
}

const FIRE_COLORS = [
  "239,68,68", "220,38,38", "248,113,113", "234,88,12",
  "249,115,22", "251,146,60", "245,158,11",
  "217,119,6", "252,211,77", "234,179,8", "250,204,21",
]

export const InteractiveGridPattern = React.memo(function InteractiveGridPattern({
  width = 20,
  height = 20,
  squares = [80, 80],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares

  const fireMap = useMemo(() => {
    const map = new Map<
      number,
      { color: string; maxOpacity: number; delay: number; duration: number }
    >()

    for (let row = 0; row < vertical; row++) {
      const normalizedRow = row / (vertical - 1)
      if (normalizedRow <= 0.55) continue

      const fireDepth = (normalizedRow - 0.55) / 0.45

      for (let col = 0; col < horizontal; col++) {
        const colVar = (Math.sin(col * 2.1 + 0.5) * 0.5 + 0.5) * 0.3
        const adjusted = Math.min(1, fireDepth + colVar * fireDepth)

        if (Math.random() > 0.25 + adjusted * 0.55) continue

        let colorIdx: number
        let maxOpacity: number

        if (adjusted > 0.7) {
          colorIdx = Math.floor(Math.random() * 4)
          maxOpacity = 0.45 + adjusted * 0.35
        } else if (adjusted > 0.35) {
          colorIdx = 4 + Math.floor(Math.random() * 3)
          maxOpacity = 0.25 + adjusted * 0.35
        } else {
          colorIdx = 7 + Math.floor(Math.random() * 4)
          maxOpacity = 0.1 + adjusted * 0.3
        }

        map.set(row * horizontal + col, {
          color: FIRE_COLORS[colorIdx],
          maxOpacity: Math.min(maxOpacity, 0.85),
          delay: Math.random() * 5,
          duration: 1.2 + Math.random() * 3,
        })
      }
    }

    return map
  }, [horizontal, vertical])

  const vw = width * horizontal
  const vh = height * vertical

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      className={cn("absolute inset-0 h-full w-full", className)}
      {...props}
    >
      <defs>
        <style>{`
          @keyframes fire {
            0%, 100% { fill-opacity: 0; }
            12% { fill-opacity: 1; }
            28% { fill-opacity: 0.25; }
            42% { fill-opacity: 0.85; }
            58% { fill-opacity: 0.12; }
            72% { fill-opacity: 1; }
            88% { fill-opacity: 0.3; }
          }
        `}</style>
      </defs>
      {Array.from({ length: horizontal * vertical }).map((_, index) => {
        const x = (index % horizontal) * width
        const y = Math.floor(index / horizontal) * height
        const fire = fireMap.get(index)

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            className={cn(
              "stroke-gray-400/30 fill-transparent",
              squaresClassName
            )}
            style={
              fire
                ? {
                    fill: `rgba(${fire.color}, ${fire.maxOpacity})`,
                    animation: `fire ${fire.duration}s ease-in-out ${fire.delay}s infinite`,
                  }
                : undefined
            }
          />
        )
      })}
    </svg>
  )
})
