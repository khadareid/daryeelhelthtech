import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Search } from "lucide-react"
import { ImageCard, PageHero } from "@/components/marketing/PageHero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  defaultsForSlug,
  listItemPath,
  parseCmsListBody,
  type CmsListItem,
  type ListPageSlug,
} from "@/config/cmsListDefaults"
import { useGetPublicCmsPageQuery } from "@/Redex/service/cms/CmsApi"
import { cn } from "@/lib/utils"

const COPY: Record<
  ListPageSlug,
  {
    eyebrow: string
    fallbackTitle: string
    fallbackSubtitle: string
    chips: string[]
    heroFallback: string
    listLabel: string
    viewLabel: string
  }
> = {
  training: {
    eyebrow: "Learning · Capacity building",
    fallbackTitle: "Training & Capacity Building",
    fallbackSubtitle:
      "Practical digital health programmes for clinicians, hospital teams, and community partners.",
    chips: ["Clinicians", "Hospitals", "Outreach", "Leadership"],
    heroFallback:
      "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1800",
    listLabel: "programmes",
    viewLabel: "View programme",
  },
  events: {
    eyebrow: "Calendar · Forums & workshops",
    fallbackTitle: "Events",
    fallbackSubtitle:
      "Workshops, community days, and partner sessions — in person and online.",
    chips: ["Open day", "Workshops", "Webinars", "Bootcamps"],
    heroFallback:
      "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1800",
    listLabel: "events",
    viewLabel: "View event",
  },
  insights: {
    eyebrow: "Knowledge · News & ideas",
    fallbackTitle: "Insights",
    fallbackSubtitle:
      "Stories, guides, and updates on digital healthcare and patient safety.",
    chips: ["Articles", "Guides", "Product", "Privacy"],
    heroFallback:
      "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1800",
    listLabel: "articles",
    viewLabel: "Read article",
  },
}

function tagsFromItems(items: CmsListItem[]) {
  const set = new Set<string>()
  for (const item of items) {
    if (item.tag?.trim()) set.add(item.tag.trim())
  }
  return Array.from(set)
}

export function CmsListBrowse({ kind }: { kind: ListPageSlug }) {
  const copy = COPY[kind]
  const { data: cms } = useGetPublicCmsPageQuery(kind)
  const [query, setQuery] = useState("")
  const [tag, setTag] = useState("all")

  const list = useMemo(() => {
    const parsed = parseCmsListBody(cms?.body)
    if (parsed.items?.length) return parsed
    return defaultsForSlug(kind)
  }, [cms?.body, kind])

  const items = list.items || []
  const stats = list.stats?.length ? list.stats : defaultsForSlug(kind).stats || []
  const tags = tagsFromItems(items)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (tag !== "all" && (item.tag || "").trim() !== tag) return false
      if (!q) return true
      const hay = [
        item.title,
        item.meta,
        item.description,
        item.tag,
        ...(item.points || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, query, tag])

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <PageHero
        image={cms?.heroImageUrl || copy.heroFallback}
        eyebrow={copy.eyebrow}
        title={cms?.title || copy.fallbackTitle}
        subtitle={cms?.subtitle || copy.fallbackSubtitle}
        chips={copy.chips}
        actions={
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/contact">Get in touch</Link>
          </Button>
        }
      />

      {stats.length ? (
        <div className="container-page relative z-10 -mt-8">
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:grid-cols-4 sm:p-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="container-page py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${copy.listLabel}…`}
              className="h-11 rounded-xl border-blue-100 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTag("all")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                tag === "all"
                  ? "bg-primary text-white"
                  : "bg-brand-light text-brand-dark hover:bg-blue-100"
              )}
            >
              All · {items.length}
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  tag === t
                    ? "bg-primary text-white"
                    : "bg-brand-light text-brand-dark hover:bg-blue-100"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Browse
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark">
              {filtered.length} {copy.listLabel}
              {query || tag !== "all" ? " found" : ""}
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
            <p className="font-heading text-lg font-bold text-brand-dark">
              No matches
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another search or clear filters.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("")
                setTag("all")
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, index) => (
              <ImageCard
                key={item.slug || item.title}
                image={
                  item.image ||
                  "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800"
                }
                title={item.title}
                meta={item.tag || item.meta}
                description={item.description}
                href={listItemPath(kind, item, index)}
                footer={
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-brand-muted">
                      {item.meta}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {copy.viewLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
