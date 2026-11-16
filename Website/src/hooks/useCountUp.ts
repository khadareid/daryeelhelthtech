import { useEffect, useState } from "react"

/** Subtle animated counter for homepage stats. Honors reduced motion. */
export function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setValue(0)
      return
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduce) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
