import { memo, useState, useEffect, useRef, type RefObject } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown } from "lucide-react"

const BOTTOM_THRESHOLD = 50

interface ScrollToBottomButtonProps {
  containerRef: RefObject<HTMLDivElement | null>
  onScrollToBottom: () => void
}

export const ScrollToBottomButton = memo(function ScrollToBottomButton({
  containerRef,
  onScrollToBottom,
}: ScrollToBottomButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const lastAtBottomRef = useRef(true)
  const rafIdRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleScroll() {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return

        const spacer = el.querySelector<HTMLElement>("[data-scroll-spacer]")
        const spacerHeight = spacer ? spacer.offsetHeight : 0

        const atBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight - spacerHeight <=
          BOTTOM_THRESHOLD
        if (atBottom !== lastAtBottomRef.current) {
          lastAtBottomRef.current = atBottom
          setIsVisible(!atBottom)
        }
      })
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", handleScroll)
      cancelAnimationFrame(rafIdRef.current)
    }
  }, [containerRef])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          onClick={onScrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center size-8 rounded-full bg-background border shadow-md hover:bg-accent transition-colors cursor-pointer"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-4" />
        </motion.button>
      )}
    </AnimatePresence>
  )
})
