import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
  src: string
  fallback?: string
  alt: string
  className?: string
  imgClassName?: string
  loading?: "eager" | "lazy"
}

/** Image with graceful fallback for local/Pexels sources. */
export function HomeMedia({
  src,
  fallback,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: Props) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  return (
    <div className={cn("overflow-hidden bg-brand-light", className)}>
      <img
        src={current}
        alt={alt}
        loading={loading}
        decoding="async"
        className={cn("h-full w-full object-cover", imgClassName)}
        onError={() => {
          if (fallback && current !== fallback) setCurrent(fallback)
        }}
      />
    </div>
  )
}
