import { useRef, useCallback, useLayoutEffect } from "react"

const SCROLL_DURATION = 250

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function getSpacerHeight(container: HTMLElement): number {
  const spacer = container.querySelector<HTMLElement>("[data-scroll-spacer]")
  return spacer ? spacer.offsetHeight : 0
}

export function useAutoScroll(messageCount: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRafRef = useRef(0)
  const pendingScrollRef = useRef(false)

  // Cancel any running scroll animation
  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(animationRafRef.current)
    animationRafRef.current = 0
  }, [])

  // Animate scrollTop from current position to target
  const animateScroll = useCallback(
    (el: HTMLElement, target: number) => {
      cancelAnimation()

      const start = el.scrollTop
      const startTime = performance.now()

      function step(now: number) {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / SCROLL_DURATION, 1)
        const eased = easeOutCubic(progress)

        el.scrollTop = start + (target - start) * eased

        if (progress < 1) {
          animationRafRef.current = requestAnimationFrame(step)
        }
      }

      animationRafRef.current = requestAnimationFrame(step)
    },
    [cancelAnimation],
  )

  // Initial scroll — synchronous before first paint
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  // After DOM commit when messageCount changes — scroll new user message to top
  useLayoutEffect(() => {
    if (!pendingScrollRef.current) return
    pendingScrollRef.current = false

    const el = containerRef.current
    if (!el) return

    const userMessages = el.querySelectorAll<HTMLElement>(
      '[data-message-role="user"]',
    )
    const lastUserMessage = userMessages[userMessages.length - 1]
    if (!lastUserMessage) return

    const containerRect = el.getBoundingClientRect()
    const messageRect = lastUserMessage.getBoundingClientRect()
    const target = messageRect.top - containerRect.top + el.scrollTop

    animateScroll(el, target)
  }, [messageCount, animateScroll])

  // Set flag so next DOM commit triggers scroll-to-new-message
  const requestScrollToNewMessage = useCallback(() => {
    pendingScrollRef.current = true
  }, [])

  // Animated scroll to bottom (accounts for spacer)
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const spacerHeight = getSpacerHeight(el)
    const target = el.scrollHeight - el.clientHeight - spacerHeight

    animateScroll(el, target)
  }, [animateScroll])

  return { containerRef, scrollToBottom, requestScrollToNewMessage }
}
