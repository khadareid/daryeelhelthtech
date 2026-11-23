import { useEffect, useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Compact horizontal flowing row — tight edges, smaller controls. */
export function FlowRow({
  children,
  className,
  speed = 0.4,
}: {
  children: ReactNode
  className?: string
  speed?: number
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const paused = useRef(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    let raf = 0
    const tick = () => {
      if (!paused.current && el) {
        el.scrollLeft += speed
        const max = el.scrollWidth - el.clientWidth
        if (max > 0 && el.scrollLeft >= max - 1) {
          el.scrollLeft = 0
        }
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [speed])

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({
      left: dir * Math.min(260, el.clientWidth * 0.7),
      behavior: "smooth",
    })
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white/95 text-primary shadow sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white/95 text-primary shadow sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div
        ref={scrollerRef}
        onMouseEnter={() => {
          paused.current = true
        }}
        onMouseLeave={() => {
          paused.current = false
        }}
        onTouchStart={() => {
          paused.current = true
        }}
        onTouchEnd={() => {
          window.setTimeout(() => {
            paused.current = false
          }, 1800)
        }}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-0 pb-1 sm:gap-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  )
}
