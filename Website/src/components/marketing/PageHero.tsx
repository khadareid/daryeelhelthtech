import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { HeartPulse } from "lucide-react"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  image,
  chips,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Full-bleed hero photo (Horseed-style) */
  image?: string
  chips?: string[]
  className?: string
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden text-white",
        image ? "min-h-[320px] sm:min-h-[400px]" : "",
        className
      )}
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/92 via-primary/85 to-brand-dark/90" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#146AFB] to-brand-dark" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_45%)]" />

      <div className="container-page relative py-14 sm:py-20 lg:py-24">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/95 ring-1 ring-white/25 backdrop-blur-sm">
          <HeartPulse className="h-3.5 w-3.5" />
          {eyebrow || siteConfig.appName}
        </div>
        <h1 className="mt-4 max-w-3xl font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {subtitle}
          </p>
        ) : null}
        {chips?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}

export function ImageCard({
  image,
  title,
  meta,
  description,
  href,
  footer,
}: {
  image: string
  title: string
  meta?: string
  description?: string
  href?: string
  footer?: ReactNode
}) {
  const inner = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 to-transparent" />
        {meta ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary shadow-sm">
            {meta}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-bold text-brand-dark">{title}</h3>
        {description ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </>
  )

  if (href) {
    const className =
      "group flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    if (href.startsWith("http") || href.startsWith("mailto:")) {
      return (
        <a href={href} className={className}>
          {inner}
        </a>
      )
    }
    return (
      <Link to={href} className={className}>
        {inner}
      </Link>
    )
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      {inner}
    </article>
  )
}
