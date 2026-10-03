import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * A backgrounded tab does not run requestAnimationFrame, so the count never advanced and the
 * figure sat at zero. Nobody watching sees it, but a screenshot, a print, or a link preview
 * rendered off-screen captured a page of zeros where the headline numbers should be.
 */
const renderedOffscreen = () => typeof document !== 'undefined' && document.hidden

/**
 * Counts a figure up to its value on mount.
 *
 * The point is not decoration. These four numbers are the first thing on the page and the
 * reason the rest of it exists, and a number that arrives at its value pulls the eye in a way
 * a number that was always there does not. It is short enough that a reader who is not
 * watching for it will not notice it happened.
 *
 * Under reduced motion the final value is rendered immediately. That is the authored state,
 * not a degraded one: nothing is lost, because the number was always the content.
 */
export default function CountUp({ value, duration = 620 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() || renderedOffscreen() ? value : 0,
  )
  const frame = useRef<number>()

  useEffect(() => {
    if (prefersReducedMotion() || renderedOffscreen()) {
      setShown(value)
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Ease out cubic: quick off the mark, settling rather than stopping.
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [value, duration])

  return <>{shown}</>
}
