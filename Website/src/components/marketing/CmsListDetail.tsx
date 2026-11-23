import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Clock3, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  defaultsForSlug,
  findListItem,
  itemSlug,
  listBasePath,
  listItemPath,
  parseCmsListBody,
  type ListPageSlug,
} from "@/config/cmsListDefaults"
import { useGetPublicCmsPageQuery } from "@/Redex/service/cms/CmsApi"

const LABELS: Record<
  ListPageSlug,
  { singular: string; back: string; cta: string }
> = {
  training: {
    singular: "Programme",
    back: "All training",
    cta: "Request this programme",
  },
  events: {
    singular: "Event",
    back: "All events",
    cta: "Register interest",
  },
  insights: {
    singular: "Article",
    back: "All insights",
    cta: "Share feedback",
  },
}

export function CmsListDetail({ kind }: { kind: ListPageSlug }) {
  const { itemSlug: paramSlug = "" } = useParams()
  const { data: cms, isLoading } = useGetPublicCmsPageQuery(kind)
  const labels = LABELS[kind]

  const body = (() => {
    const parsed = parseCmsListBody(cms?.body)
    if (parsed.items?.length) return parsed
    return defaultsForSlug(kind)
  })()

  const items = body.items || []
  const item =
    findListItem(body, paramSlug) ||
    items.find((_, i) => itemSlug(items[i], i) === paramSlug)

  const index = item
    ? items.findIndex((x, i) => itemSlug(x, i) === itemSlug(item, i))
    : -1
  const prev = index > 0 ? items[index - 1] : null
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null

  if (isLoading) {
    return (
      <div className="container-page py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This {labels.singular.toLowerCase()} is unavailable.
        </p>
        <Button asChild className="mt-6">
          <Link to={listBasePath(kind)}>{labels.back}</Link>
        </Button>
      </div>
    )
  }

  const paragraphs = (item.content || item.description || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <section className="relative overflow-hidden text-white">
        <img
          src={
            item.image ||
            cms?.heroImageUrl ||
            "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1800"
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/92 via-primary/80 to-brand-dark/90" />
        <div className="container-page relative py-12 sm:py-16">
          <Link
            to={listBasePath(kind)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {labels.back}
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            {labels.singular}
            {item.tag ? ` · ${item.tag}` : ""}
          </p>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            {item.title}
          </h1>
          {item.meta ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/90">
              <Clock3 className="h-4 w-4" />
              {item.meta}
            </p>
          ) : null}
        </div>
      </section>

      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <article className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            {item.description ? (
              <p className="text-base leading-relaxed text-brand-dark sm:text-lg">
                {item.description}
              </p>
            ) : null}
            <div className="mt-6 space-y-4">
              {paragraphs.map((p) => (
                <p
                  key={p.slice(0, 40)}
                  className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {p}
                </p>
              ))}
            </div>
            {item.points?.length ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {item.points.map((point) => (
                  <span
                    key={point}
                    className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark"
                  >
                    {point}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/contact">{labels.cta}</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/20">
                <Link to={listBasePath(kind)}>{labels.back}</Link>
              </Button>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Details
              </p>
              <ul className="mt-3 space-y-3 text-sm text-brand-dark">
                {item.tag ? (
                  <li className="flex items-start gap-2">
                    <Tag className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item.tag}</span>
                  </li>
                ) : null}
                {item.meta ? (
                  <li className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item.meta}</span>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                More {kind}
              </p>
              <div className="mt-3 space-y-2">
                {prev ? (
                  <Link
                    to={listItemPath(kind, prev, index - 1)}
                    className="block rounded-xl bg-brand-bg px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light"
                  >
                    ← {prev.title}
                  </Link>
                ) : null}
                {next ? (
                  <Link
                    to={listItemPath(kind, next, index + 1)}
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-bg px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light"
                  >
                    {next.title} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
