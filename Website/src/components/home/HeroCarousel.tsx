import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Building2, CheckCircle2, Stethoscope } from "lucide-react"
import { HomeMedia } from "@/components/home/HomeMedia"
import { Button } from "@/components/ui/button"
import { heroSlides } from "@/config/homepageImages"
import { cn } from "@/lib/utils"

type Props = {
  hospitalsHref: string
  doctorsHref: string
}

/** Rotating hero: 5 Pexels doctor images + matching copy (auto-changes). */
export function HeroCarousel({ hospitalsHref, doctorsHref }: Props) {
  const [index, setIndex] = useState(0)
  const slide = heroSlides[index] ?? heroSlides[0]

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || heroSlides.length < 2) return

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % heroSlides.length)
    }, 5500)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="relative min-h-[78vh] overflow-hidden text-white sm:min-h-[72vh]">
      {heroSlides.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-out",
            i === index ? "opacity-100" : "opacity-0",
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
              "transition-transform duration-[8000ms] ease-out",
              i === index ? "scale-105" : "scale-100",
            )}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/93 via-brand-dark/78 to-primary/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 via-transparent to-brand-dark/20" />

      <div className="container-page relative flex min-h-[78vh] flex-col justify-center py-14 sm:min-h-[72vh] sm:py-20">
        <p className="font-heading text-sm font-semibold tracking-[0.22em] text-blue-100 uppercase">
          {slide.eyebrow}
        </p>
        <h1
          key={`title-${slide.id}`}
          className="mt-4 max-w-3xl font-heading text-3xl font-bold leading-tight text-white transition-opacity duration-500 sm:text-5xl lg:text-6xl"
        >
          {slide.title}
        </h1>
        <p
          key={`sub-${slide.id}`}
          className="mt-5 max-w-xl text-base leading-relaxed text-blue-50/90 transition-opacity duration-500 sm:text-lg"
        >
          {slide.subtitle}
        </p>

        <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <Link
            to={hospitalsHref}
            className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15"
          >
            <p className="inline-flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5" />
              Hospitals
            </p>
            <p className="mt-2 text-sm text-blue-50/90">
              View hospitals → see doctors → book a visit
            </p>
          </Link>
          <Link
            to={doctorsHref}
            className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm transition hover:bg-white/15"
          >
            <p className="inline-flex items-center gap-2 text-lg font-bold">
              <Stethoscope className="h-5 w-5" />
              Doctors
            </p>
            <p className="mt-2 text-sm text-blue-50/90">
              Browse Daryeel doctors → view and book
            </p>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 bg-white px-6 text-primary hover:bg-blue-50"
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
            className="h-12 border-white/40 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white"
          >
            <Link to={doctorsHref}>Find doctors</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-50/90">
          {slide.bullets.map((b) => (
            <span key={b} className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-200" />
              {b}
            </span>
          ))}
        </div>

        {/* Dots — jump between the 5 images */}
        <div className="mt-10 flex items-center gap-2">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-full transition-all",
                i === index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/40 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
