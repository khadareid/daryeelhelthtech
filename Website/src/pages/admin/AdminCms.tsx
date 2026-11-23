import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Eye, FileText, Plus, Save, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AdminCmsListEditor } from "@/components/admin/AdminCmsListEditor"
import {
  AdminFilterChips,
  AdminPageHeader,
  AdminPanel,
  AdminToolbar,
} from "@/components/admin/AdminShell"
import {
  defaultsForSlug,
  isListPageSlug,
  itemSlug,
  listItemPath,
  parseCmsListBody,
  slugifyTitle,
  type CmsListBody,
  type CmsListItem,
  type CmsListStat,
  type ListPageSlug,
} from "@/config/cmsListDefaults"
import { pathForCmsSlug } from "@/config/cmsPages"
import {
  useCreateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useEnsureCmsPagesMutation,
  useGetAdminCmsPagesQuery,
  useGetAdminCmsSettingsQuery,
  useGetAdminTeamQuery,
  useUpdateCmsBrandingMutation,
  useUpdateCmsPageMutation,
  useUpdateTeamMemberMutation,
  type CmsPage,
  type SiteBranding,
  type TeamMember,
} from "@/Redex/service/cms/CmsApi"

type Tab = "branding" | "pages" | "team"

const CATEGORIES = [
  "BOARD",
  "EXECUTIVE",
  "DEPARTMENT",
  "STAFF",
  "PARTNER",
  "SPONSOR",
  "VOLUNTEER",
] as const

const emptyMember: Partial<TeamMember> = {
  fullName: "",
  title: "",
  department: "",
  category: "STAFF",
  bio: "",
  email: "",
  phone: "",
  photoUrl: "",
  expertise: [],
  education: "",
  yearsExperience: undefined,
  sortOrder: 0,
  isPublished: true,
  isFeatured: false,
}

export default function AdminCms() {
  const [tab, setTab] = useState<Tab>("branding")
  const { data: settings, isLoading: settingsLoading } =
    useGetAdminCmsSettingsQuery()
  const { data: pages = [], isLoading: pagesLoading } =
    useGetAdminCmsPagesQuery()
  const { data: team = [], isLoading: teamLoading } = useGetAdminTeamQuery()
  const [updateBranding, { isLoading: savingBrand }] =
    useUpdateCmsBrandingMutation()
  const [updatePage, { isLoading: savingPage }] = useUpdateCmsPageMutation()
  const [ensurePages, { isLoading: ensuringPages }] =
    useEnsureCmsPagesMutation()
  const [createMember, { isLoading: creatingMember }] =
    useCreateTeamMemberMutation()
  const [updateMember, { isLoading: updatingMember }] =
    useUpdateTeamMemberMutation()
  const [deleteMember, { isLoading: deletingMember }] =
    useDeleteTeamMemberMutation()

  const [brand, setBrand] = useState<Partial<SiteBranding>>({})
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [pageDraft, setPageDraft] = useState<Partial<CmsPage>>({})
  const [memberDraft, setMemberDraft] =
    useState<Partial<TeamMember>>(emptyMember)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [listFilter, setListFilter] = useState("")
  const [listTag, setListTag] = useState("all")
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  useEffect(() => {
    if (settings?.branding) setBrand(settings.branding)
  }, [settings])

  const sortedPages = useMemo(() => {
    const priority = [
      "management-staff",
      "training",
      "events",
      "insights",
      "contact",
    ]
    return [...pages].sort((a, b) => {
      const ai = priority.indexOf(a.slug)
      const bi = priority.indexOf(b.slug)
      if (ai === -1 && bi === -1) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [pages])

  useEffect(() => {
    if (!sortedPages.length) return
    const preferred =
      sortedPages.find((p) => p.slug === "management-staff") || sortedPages[0]
    if (!selectedPageId) setSelectedPageId(preferred.id)
  }, [sortedPages, selectedPageId])

  useEffect(() => {
    const page = pages.find((p) => p.id === selectedPageId)
    if (page) {
      const listBody = isListPageSlug(page.slug)
        ? parseCmsListBody(page.body)?.items?.length
          ? parseCmsListBody(page.body)
          : defaultsForSlug(page.slug)
        : parseCmsListBody(page.body)
      setPageDraft({
        ...page,
        highlights: page.highlights || [],
        body: isListPageSlug(page.slug) ? listBody : page.body,
      })
    }
  }, [pages, selectedPageId])

  const listBody: CmsListBody = useMemo(() => {
    if (!isListPageSlug(pageDraft.slug)) return { stats: [], items: [] }
    const parsed = parseCmsListBody(pageDraft.body)
    if (parsed.items?.length || parsed.stats?.length) return parsed
    return defaultsForSlug(pageDraft.slug)
  }, [pageDraft.slug, pageDraft.body])

  const setListBody = (next: CmsListBody) => {
    setPageDraft((d) => ({ ...d, body: next }))
  }

  const filteredListItems = useMemo(() => {
    const items = listBody.items || []
    const q = listFilter.trim().toLowerCase()
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (listTag !== "all" && (item.tag || "").trim() !== listTag) return false
        if (!q) return true
        return [item.title, item.meta, item.description, item.tag, item.content]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
  }, [listBody.items, listFilter, listTag])

  const listTags = useMemo(() => {
    const set = new Set<string>()
    for (const item of listBody.items || []) {
      if (item.tag?.trim()) set.add(item.tag.trim())
    }
    return Array.from(set)
  }, [listBody.items])

  const updateListItem = (index: number, patch: Partial<CmsListItem>) => {
    const items = [...(listBody.items || [])]
    const next = { ...items[index], ...patch }
    if (patch.title && !patch.slug) {
      next.slug = slugifyTitle(patch.title)
    }
    items[index] = next
    setListBody({ ...listBody, items })
  }

  useEffect(() => {
    setListFilter("")
    setListTag("all")
    setEditingItemIndex(null)
  }, [selectedPageId])

  const filteredTeam = useMemo(() => {
    if (categoryFilter === "all") return team
    return team.filter((m) => m.category === categoryFilter)
  }, [team, categoryFilter])

  const onSaveBrand = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await updateBranding(brand).unwrap()
      toast.success("Site branding updated")
    } catch {
      toast.error("Failed to update branding")
    }
  }

  const onSavePage = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedPageId) return
    try {
      await updatePage({
        id: selectedPageId,
        body: {
          title: pageDraft.title,
          subtitle: pageDraft.subtitle,
          summary: pageDraft.summary,
          heroImageUrl: pageDraft.heroImageUrl,
          status: pageDraft.status,
          highlights: pageDraft.highlights,
          quote: pageDraft.quote,
          cta: pageDraft.cta,
          sortOrder: pageDraft.sortOrder,
          body: pageDraft.body,
        },
      }).unwrap()
      toast.success("Page saved")
    } catch {
      toast.error("Failed to save page")
    }
  }

  const onEnsurePages = async () => {
    try {
      const list = await ensurePages().unwrap()
      toast.success(`Loaded ${list.length} site pages`)
      if (list[0] && !selectedPageId) setSelectedPageId(list[0].id)
    } catch {
      toast.error("Failed to load catalog pages")
    }
  }

  const onSaveMember = async (e: FormEvent) => {
    e.preventDefault()
    if (!memberDraft.fullName || !memberDraft.title) {
      toast.error("Name and title are required")
      return
    }
    const payload = {
      ...memberDraft,
      expertise:
        typeof memberDraft.expertise === "string"
          ? String(memberDraft.expertise)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : memberDraft.expertise || [],
    }
    try {
      if (editingMemberId) {
        await updateMember({ id: editingMemberId, body: payload }).unwrap()
        toast.success("Team member updated")
      } else {
        await createMember(payload).unwrap()
        toast.success("Team member added")
      }
      setMemberDraft(emptyMember)
      setEditingMemberId(null)
    } catch {
      toast.error("Failed to save team member")
    }
  }

  const startEdit = (m: TeamMember) => {
    setEditingMemberId(m.id)
    setMemberDraft({
      ...m,
      expertise: m.expertise || [],
    })
    setTab("team")
  }

  const onDelete = async (id: string) => {
    if (!confirm("Delete this team member?")) return
    try {
      await deleteMember(id).unwrap()
      toast.success("Deleted")
      if (editingMemberId === id) {
        setEditingMemberId(null)
        setMemberDraft(emptyMember)
      }
    } catch {
      toast.error("Delete failed")
    }
  }

  const highlightText = Array.isArray(pageDraft.highlights)
    ? pageDraft.highlights
        .map((h) =>
          h.description ? `${h.title} | ${h.description}` : h.title
        )
        .join("\n")
    : ""

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="CMS"
        title="Website Content"
        subtitle="SUPER_ADMIN & ADMIN only. Edit branding, pages, and team — web manages content; the mobile app only views it."
        actions={
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
            <Link to="/about" target="_blank">
              Preview About
            </Link>
          </Button>
        }
      />

      <AdminToolbar>
        <AdminFilterChips
          value={tab}
          onChange={(id) => setTab(id as Tab)}
          items={[
            { id: "branding", label: "Site info" },
            { id: "pages", label: "Pages" },
            { id: "team", label: "Team" },
          ]}
        />
      </AdminToolbar>

      {tab === "branding" ? (
        <AdminPanel title="Public branding" action={<FileText className="h-4 w-4 text-primary" />}>
          <form onSubmit={onSaveBrand} className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["appName", "App name"],
                ["name", "Short name"],
                ["tagline", "Tagline"],
                ["url", "Website URL"],
                ["supportEmail", "Support email"],
                ["supportPhone", "Support phone"],
                ["location", "Location"],
                ["address", "Address"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={String(brand[key] ?? "")}
                  disabled={settingsLoading}
                  onChange={(e) =>
                    setBrand((b) => ({ ...b, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={brand.description || ""}
                onChange={(e) =>
                  setBrand((b) => ({ ...b, description: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingBrand} className="gap-2">
                <Save className="h-4 w-4" />
                Save branding
              </Button>
            </div>
          </form>
        </AdminPanel>
      ) : null}

      {tab === "pages" ? (
        <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
          <AdminPanel
            title="Pages"
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 rounded-lg text-xs"
                disabled={ensuringPages}
                onClick={onEnsurePages}
              >
                <Plus className="h-3.5 w-3.5" />
                {ensuringPages ? "Loading…" : "Load all"}
              </Button>
            }
          >
            <p className="mb-2 text-[11px] text-muted-foreground">
              Top: About, Training, Events, Insights, Contact — then the rest.
            </p>
            <ul className="space-y-1">
              {pagesLoading ? (
                <li className="text-sm text-muted-foreground">Loading…</li>
              ) : sortedPages.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No pages yet. Click &quot;Load all&quot;.
                </li>
              ) : (
                sortedPages
                  .filter((p) => p.slug !== "about")
                  .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPageId(p.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                        selectedPageId === p.id
                          ? "bg-brand-light font-semibold text-primary"
                          : "hover:bg-brand-bg"
                      }`}
                    >
                      {p.slug === "management-staff" ? "About" : p.title}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {pathForCmsSlug(p.slug)} · {p.status}
                        {isListPageSlug(p.slug)
                          ? ` · ${parseCmsListBody(p.body).items?.length || 0} items`
                          : ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </AdminPanel>

          <AdminPanel title="Edit page">
            <form onSubmit={onSavePage} className="grid gap-3">
              {isListPageSlug(pageDraft.slug) ? (
                <AdminCmsListEditor
                  kind={pageDraft.slug}
                  listBody={listBody}
                  setListBody={setListBody}
                  listFilter={listFilter}
                  setListFilter={setListFilter}
                  listTag={listTag}
                  setListTag={setListTag}
                  listTags={listTags}
                  filteredListItems={filteredListItems}
                  editingItemIndex={editingItemIndex}
                  setEditingItemIndex={setEditingItemIndex}
                  updateListItem={updateListItem}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={pageDraft.title || ""}
                    onChange={(e) =>
                      setPageDraft((d) => ({ ...d, title: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={pageDraft.status || "DRAFT"}
                    onChange={(e) =>
                      setPageDraft((d) => ({
                        ...d,
                        status: e.target.value as CmsPage["status"],
                      }))
                    }
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Input
                  value={pageDraft.subtitle || ""}
                  onChange={(e) =>
                    setPageDraft((d) => ({ ...d, subtitle: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Summary</Label>
                <Textarea
                  rows={4}
                  value={pageDraft.summary || ""}
                  onChange={(e) =>
                    setPageDraft((d) => ({ ...d, summary: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Highlights (one per line: Title | Description)</Label>
                <Textarea
                  rows={4}
                  value={highlightText}
                  onChange={(e) => {
                    const highlights = e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [title, ...rest] = line.split("|")
                        return {
                          title: title.trim(),
                          description: rest.join("|").trim() || undefined,
                        }
                      })
                    setPageDraft((d) => ({ ...d, highlights }))
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Quote text</Label>
                  <Textarea
                    rows={3}
                    value={
                      pageDraft.quote &&
                      typeof pageDraft.quote === "object" &&
                      "text" in pageDraft.quote
                        ? String(pageDraft.quote.text || "")
                        : ""
                    }
                    onChange={(e) =>
                      setPageDraft((d) => ({
                        ...d,
                        quote: {
                          ...(typeof d.quote === "object" && d.quote
                            ? d.quote
                            : {}),
                          text: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Quote author</Label>
                  <Input
                    value={
                      pageDraft.quote &&
                      typeof pageDraft.quote === "object" &&
                      "author" in pageDraft.quote
                        ? String(pageDraft.quote.author || "")
                        : ""
                    }
                    onChange={(e) =>
                      setPageDraft((d) => ({
                        ...d,
                        quote: {
                          ...(typeof d.quote === "object" && d.quote
                            ? d.quote
                            : { text: "" }),
                          author: e.target.value,
                        },
                      }))
                    }
                  />
                  <Label className="mt-2 block">Quote role</Label>
                  <Input
                    value={
                      pageDraft.quote &&
                      typeof pageDraft.quote === "object" &&
                      "role" in pageDraft.quote
                        ? String(pageDraft.quote.role || "")
                        : ""
                    }
                    onChange={(e) =>
                      setPageDraft((d) => ({
                        ...d,
                        quote: {
                          ...(typeof d.quote === "object" && d.quote
                            ? d.quote
                            : { text: "" }),
                          role: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingPage} className="w-fit gap-2">
                <Save className="h-4 w-4" />
                Save page
              </Button>
            </form>
          </AdminPanel>
        </div>
      ) : null}

      {tab === "team" ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <AdminPanel
            title="Team members"
            action={<Users className="h-4 w-4 text-primary" />}
          >
            <AdminFilterChips
              value={categoryFilter}
              onChange={setCategoryFilter}
              items={[
                { id: "all", label: "All" },
                ...CATEGORIES.map((c) => ({ id: c, label: c })),
              ]}
            />
            <div className="mt-3 space-y-2">
              {teamLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : filteredTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                filteredTeam.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 bg-brand-bg/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-dark">
                        {m.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.title} · {m.category}
                        {!m.isPublished ? " · Hidden" : ""}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => startEdit(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 text-destructive"
                        disabled={deletingMember}
                        onClick={() => void onDelete(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminPanel>

          <AdminPanel
            title={editingMemberId ? "Edit member" : "Add member"}
            action={
              editingMemberId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingMemberId(null)
                    setMemberDraft(emptyMember)
                  }}
                >
                  New
                </Button>
              ) : (
                <Plus className="h-4 w-4 text-primary" />
              )
            }
          >
            <form onSubmit={onSaveMember} className="grid gap-2.5">
              <Field
                label="Full name"
                value={memberDraft.fullName || ""}
                onChange={(v) =>
                  setMemberDraft((d) => ({ ...d, fullName: v }))
                }
              />
              <Field
                label="Title"
                value={memberDraft.title || ""}
                onChange={(v) => setMemberDraft((d) => ({ ...d, title: v }))}
              />
              <Field
                label="Department"
                value={memberDraft.department || ""}
                onChange={(v) =>
                  setMemberDraft((d) => ({ ...d, department: v }))
                }
              />
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={memberDraft.category || "STAFF"}
                  onChange={(e) =>
                    setMemberDraft((d) => ({
                      ...d,
                      category: e.target.value as TeamMember["category"],
                    }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={memberDraft.bio || ""}
                  onChange={(e) =>
                    setMemberDraft((d) => ({ ...d, bio: e.target.value }))
                  }
                />
              </div>
              <Field
                label="Email"
                value={memberDraft.email || ""}
                onChange={(v) => setMemberDraft((d) => ({ ...d, email: v }))}
              />
              <Field
                label="Phone"
                value={memberDraft.phone || ""}
                onChange={(v) => setMemberDraft((d) => ({ ...d, phone: v }))}
              />
              <Field
                label="Photo URL"
                value={memberDraft.photoUrl || ""}
                onChange={(v) =>
                  setMemberDraft((d) => ({ ...d, photoUrl: v }))
                }
              />
              <Field
                label="Expertise (comma separated)"
                value={
                  Array.isArray(memberDraft.expertise)
                    ? memberDraft.expertise.join(", ")
                    : String(memberDraft.expertise || "")
                }
                onChange={(v) =>
                  setMemberDraft((d) => ({
                    ...d,
                    expertise: v as unknown as string[],
                  }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Education"
                  value={memberDraft.education || ""}
                  onChange={(v) =>
                    setMemberDraft((d) => ({ ...d, education: v }))
                  }
                />
                <Field
                  label="Years exp."
                  value={
                    memberDraft.yearsExperience != null
                      ? String(memberDraft.yearsExperience)
                      : ""
                  }
                  onChange={(v) =>
                    setMemberDraft((d) => ({
                      ...d,
                      yearsExperience: v ? Number(v) : undefined,
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={memberDraft.isPublished !== false}
                  onChange={(e) =>
                    setMemberDraft((d) => ({
                      ...d,
                      isPublished: e.target.checked,
                    }))
                  }
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(memberDraft.isFeatured)}
                  onChange={(e) =>
                    setMemberDraft((d) => ({
                      ...d,
                      isFeatured: e.target.checked,
                    }))
                  }
                />
                Featured
              </label>
              <Button
                type="submit"
                disabled={creatingMember || updatingMember}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {editingMemberId ? "Update member" : "Add member"}
              </Button>
            </form>
          </AdminPanel>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
