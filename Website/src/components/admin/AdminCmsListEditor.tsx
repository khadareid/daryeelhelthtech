import { Link } from "react-router-dom"
import { Eye, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  itemSlug,
  listItemPath,
  slugifyTitle,
  type CmsListBody,
  type CmsListItem,
  type CmsListStat,
  type ListPageSlug,
} from "@/config/cmsListDefaults"

export function AdminCmsListEditor({
  kind,
  listBody,
  setListBody,
  listFilter,
  setListFilter,
  listTag,
  setListTag,
  listTags,
  filteredListItems,
  editingItemIndex,
  setEditingItemIndex,
  updateListItem,
}: {
  kind: ListPageSlug
  listBody: CmsListBody
  setListBody: (next: CmsListBody) => void
  listFilter: string
  setListFilter: (v: string) => void
  listTag: string
  setListTag: (v: string) => void
  listTags: string[]
  filteredListItems: { item: CmsListItem; index: number }[]
  editingItemIndex: number | null
  setEditingItemIndex: (v: number | null) => void
  updateListItem: (index: number, patch: Partial<CmsListItem>) => void
}) {
  const emptyStats: CmsListStat[] = [
    { value: "", label: "Stat 1" },
    { value: "", label: "Stat 2" },
    { value: "", label: "Stat 3" },
    { value: "", label: "Stat 4" },
  ]
  const stats = listBody.stats?.length ? listBody.stats : emptyStats

  return (
    <div className="space-y-3 rounded-2xl border border-blue-100 bg-brand-bg/50 p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            List · filter · view · update
          </p>
          <p className="text-sm text-muted-foreground">
            {listBody.items?.length || 0} items · {filteredListItems.length} shown
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={() => {
            const item: CmsListItem = {
              title: "New item",
              slug: `item-${Date.now()}`,
              meta: "",
              description: "",
              content: "",
              image: "",
              tag: "",
            }
            const items = [...(listBody.items || []), item]
            setListBody({ ...listBody, items })
            setEditingItemIndex(items.length - 1)
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="space-y-1 rounded-xl border border-blue-50 bg-white p-2"
          >
            <Input
              placeholder="Value"
              value={stat.value}
              onChange={(e) => {
                const next = [...stats]
                next[idx] = { ...next[idx], value: e.target.value }
                setListBody({ ...listBody, stats: next })
              }}
            />
            <Input
              placeholder="Label"
              value={stat.label}
              onChange={(e) => {
                const next = [...stats]
                next[idx] = { ...next[idx], label: e.target.value }
                setListBody({ ...listBody, stats: next })
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            placeholder="Filter items…"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setListTag("all")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              listTag === "all"
                ? "bg-primary text-white"
                : "bg-white text-brand-dark"
            }`}
          >
            All
          </button>
          {listTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setListTag(t)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                listTag === t
                  ? "bg-primary text-white"
                  : "bg-white text-brand-dark"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredListItems.map(({ item, index }) => {
          const publicPath = listItemPath(kind, item, index)
          const open = editingItemIndex === index
          return (
            <div
              key={`${item.slug || item.title}-${index}`}
              className="rounded-xl border border-blue-50 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-dark">
                    {item.title || "Untitled"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.tag || "—"} · {item.meta || "no meta"} · /
                    {itemSlug(item, index)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    asChild
                  >
                    <Link to={publicPath} target="_blank">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => setEditingItemIndex(open ? null : index)}
                  >
                    {open ? "Close" : "Update"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive"
                    onClick={() => {
                      const items = (listBody.items || []).filter(
                        (_, i) => i !== index
                      )
                      setListBody({ ...listBody, items })
                      if (editingItemIndex === index) setEditingItemIndex(null)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {open ? (
                <div className="grid gap-2 border-t border-blue-50 p-3 sm:grid-cols-2">
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) =>
                      updateListItem(index, { title: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Slug (url)"
                    value={item.slug || ""}
                    onChange={(e) =>
                      updateListItem(index, {
                        slug: slugifyTitle(e.target.value),
                      })
                    }
                  />
                  <Input
                    placeholder="Meta (date / duration)"
                    value={item.meta || ""}
                    onChange={(e) =>
                      updateListItem(index, { meta: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Tag / filter"
                    value={item.tag || ""}
                    onChange={(e) =>
                      updateListItem(index, { tag: e.target.value })
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Image URL"
                    value={item.image || ""}
                    onChange={(e) =>
                      updateListItem(index, { image: e.target.value })
                    }
                  />
                  <Textarea
                    className="sm:col-span-2"
                    rows={2}
                    placeholder="Short description (list card)"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateListItem(index, { description: e.target.value })
                    }
                  />
                  <Textarea
                    className="sm:col-span-2"
                    rows={5}
                    placeholder="Full content (public read page)"
                    value={item.content || ""}
                    onChange={(e) =>
                      updateListItem(index, { content: e.target.value })
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Points (comma separated)"
                    value={(item.points || []).join(", ")}
                    onChange={(e) =>
                      updateListItem(index, {
                        points: e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          )
        })}
        {!filteredListItems.length ? (
          <p className="text-sm text-muted-foreground">
            No items match this filter.
          </p>
        ) : null}
      </div>
    </div>
  )
}
