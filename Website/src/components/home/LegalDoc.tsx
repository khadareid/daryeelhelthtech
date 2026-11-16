import { Link } from "react-router-dom"
import { siteConfig } from "@/config/site"

type Props = {
  title: string
  updated: string
  children: React.ReactNode
  otherLabel: string
  otherTo: string
}

/** Shared layout for public Privacy / Terms pages. */
export function LegalDoc({
  title,
  updated,
  children,
  otherLabel,
  otherTo,
}: Props) {
  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-14">
        <article className="mx-auto max-w-3xl rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            {siteConfig.appName}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last Updated: {updated}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link to={otherTo} className="font-semibold text-primary hover:underline">
              {otherLabel}
            </Link>
            <Link to="/#contact" className="text-muted-foreground hover:text-primary">
              Contact
            </Link>
          </div>

          <div className="legal-prose mt-8 space-y-8 text-sm leading-relaxed text-brand-dark/90 sm:text-[15px]">
            {children}
          </div>

          <div className="mt-12 border-t border-blue-50 pt-6 text-center">
            <p className="font-heading text-base font-bold text-brand-dark">
              Daryeel Healthtech
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Caafimaadkaaga, Gacantaada.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_strong]:text-brand-dark">
        {children}
      </div>
    </section>
  )
}
