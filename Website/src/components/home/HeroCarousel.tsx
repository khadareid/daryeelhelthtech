import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { HomeMedia } from "@/components/home/HomeMedia"
import { Button } from "@/components/ui/button"
import { heroSlides, topFeatureImages } from "@/config/homepageImages"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

type Props = {
  hospitalsHref: string
  doctorsHref: string
}

/** Full-bleed 5-image hero + 5 image story strip (Gabiley-style clarity). */
export function HeroCarousel({ hospitalsHref, doctorsHref }: Props) {
  const [index, setIndex] = useState(0)
  const slide = heroSlides[index] ?? heroSlides[0]
  const total = heroSlides.length

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || total < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 5600)
    return () => window.clearInterval(id)
  }, [total])

  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + total) % total)

  return (
    <>
      <section className="relative min-h-[58vh] overflow-hidden text-white sm:min-h-[70vh] lg:min-h-[78vh]">
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== index}
          >
            <HomeMedia
              src={s.src}
              fallback={s.fallback}
              alt={s.alt}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full"
              imgClassName={cn(
                "h-full w-full object-cover transition-transform duration-1000 ease-out",
                i === index ? "scale-105" : "scale-100"
              )}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/92 via-primary/75 to-brand-dark/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent" />

        <div className="container-page relative flex min-h-[58vh] flex-col justify-center py-10 sm:min-h-[70vh] sm:py-16 lg:min-h-[78vh] lg:py-20">
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/25 backdrop-blur-sm sm:text-[11px]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{slide.eyebrow}</span>
          </div>

          <h1
            key={`title-${slide.id}`}
            className="mt-4 max-w-3xl font-heading text-fluid-hero font-bold leading-tight sm:mt-5"
          >
            {slide.title}
          </h1>
          <p
            key={`sub-${slide.id}`}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:mt-4 sm:text-base lg:text-lg"
          >
            {slide.subtitle}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 w-full bg-white px-6 text-primary hover:bg-blue-50 sm:h-12 sm:w-auto"
            >
              <Link to={hospitalsHref}>
                Find hospitals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 w-full border-white/40 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white sm:h-12 sm:w-auto"
            >
              <Link to={doctorsHref}>Find doctors</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 w-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white sm:h-12 sm:w-auto"
            >
              <Link to="/about">Our story</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {slide.bullets.map((b) => (
              <span
                key={b}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {heroSlides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slide ${i + 1} of ${total}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    i === index
                      ? "w-9 bg-white"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="ml-2 text-xs font-semibold text-white/80">
              {index + 1} / {total}
            </span>
          </div>
        </div>
      </section>

      {/* 5 compact image strip */}
      <section className="relative z-10 -mt-8 pb-1 sm:-mt-10">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-2.5">
            {topFeatureImages.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="group relative aspect-[5/4] overflow-hidden rounded-xl border border-blue-100 bg-white shadow-md shadow-primary/10 sm:aspect-[4/3]"
              >
                <img
                  src={item.src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5">
                  <p className="font-heading text-xs font-bold text-white sm:text-sm">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-white/85">
                    {item.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {siteConfig.appName} · explore care
          </p>
        </div>
      </section>
    </>
  )
}
