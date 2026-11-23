import { useMemo, useState } from "react"
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Eye,
  HeartPulse,
  Info,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  AdminFilterChips,
  AdminPageHeader,
  AdminPanel,
  AdminToolbar,
} from "@/components/admin/AdminShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  formatNotifFullDate,
  formatNotifTime,
  notificationId,
  notificationTone,
} from "@/lib/adminNotifications"
import {
  useDeleteNotificationMutation,
  useGetUnreadCountQuery,
  useListNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/Redex/service/notifications/NotificationsApi"
import type { Notification } from "@/Redex/types/Types"
import { cn } from "@/lib/utils"

type ReadFilter = "all" | "unread" | "read"
type KindFilter = "all" | "booking" | "payment" | "care" | "system"

function TypeIcon({ group }: { group: string }) {
  if (group === "payment") return <CreditCard className="h-4 w-4" />
  if (group === "booking") return <CalendarCheck className="h-4 w-4" />
  if (group === "care") return <HeartPulse className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

export default function AdminNotifications() {
  const [readFilter, setReadFilter] = useState<ReadFilter>("all")
  const [kindFilter, setKindFilter] = useState<KindFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string>("")

  const { data: unreadData } = useGetUnreadCountQuery()
  const unread = unreadData?.unreadCount ?? 0
  const { data: notifications = [], isLoading, isFetching, refetch } =
    useListNotificationsQuery({ limit: 100 })
  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation()
  const [deleteNotif, { isLoading: deleting }] = useDeleteNotificationMutation()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notifications.filter((n) => {
      if (readFilter === "unread" && n.isRead) return false
      if (readFilter === "read" && !n.isRead) return false
      const tone = notificationTone(String(n.type))
      if (kindFilter !== "all" && tone.group !== kindFilter) return false
      if (!q) return true
      return (
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q) ||
        String(n.type).toLowerCase().includes(q)
      )
    })
  }, [notifications, readFilter, kindFilter, query])

  const selected =
    filtered.find((n) => notificationId(n) === selectedId) ||
    filtered[0] ||
    null

  const openItem = async (n: Notification) => {
    const id = notificationId(n)
    setSelectedId(id)
    if (!n.isRead && id) {
      try {
        await markAsRead(id).unwrap()
      } catch {
        /* ignore */
      }
    }
  }

  const onMarkAll = async () => {
    try {
      await markAllAsRead().unwrap()
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Could not mark all as read")
    }
  }

  const onDelete = async (n: Notification) => {
    const id = notificationId(n)
    if (!id || !confirm("Delete this notification?")) return
    try {
      await deleteNotif(id).unwrap()
      toast.success("Notification deleted")
      if (selectedId === id) setSelectedId("")
    } catch {
      toast.error("Delete failed")
    }
  }

  const counts = useMemo(() => {
    const base = { booking: 0, payment: 0, care: 0, system: 0 }
    for (const n of notifications) {
      base[notificationTone(String(n.type)).group] += 1
    }
    return base
  }, [notifications])

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle="Clear, readable alerts for SUPER_ADMIN & ADMIN — bookings, payments, care, and system."
        meta={`${notifications.length} total · ${unread} unread`}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 rounded-lg"
              disabled={markingAll || unread === 0}
              onClick={() => void onMarkAll()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Unread", unread, "text-primary"],
            ["Bookings", counts.booking, "text-sky-700"],
            ["Payments", counts.payment, "text-emerald-700"],
            ["System", counts.system + counts.care, "text-slate-700"],
          ] as const
        ).map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={cn("mt-1 font-heading text-2xl font-bold", color)}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or message…"
            className="h-9 rounded-lg border-blue-100 pl-9"
          />
        </div>
        <AdminFilterChips
          value={readFilter}
          onChange={(id) => setReadFilter(id as ReadFilter)}
          items={[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread (${unread})` },
            { id: "read", label: "Read" },
          ]}
        />
        <AdminFilterChips
          value={kindFilter}
          onChange={(id) => setKindFilter(id as KindFilter)}
          items={[
            { id: "all", label: "Any type" },
            { id: "booking", label: "Bookings" },
            { id: "payment", label: "Payments" },
            { id: "care", label: "Care" },
            { id: "system", label: "System" },
          ]}
        />
      </AdminToolbar>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <AdminPanel
          title={`Inbox · ${filtered.length}`}
          action={
            <span className="text-[11px] text-muted-foreground">
              Click a row to read
            </span>
          }
        >
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-brand-light/70"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-brand-bg/50 px-4 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-primary/70" />
              <p className="mt-3 font-heading text-base font-bold text-brand-dark">
                Nothing here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing search or filters.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((n) => {
                const id = notificationId(n)
                const tone = notificationTone(String(n.type))
                const active = selected && notificationId(selected) === id
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => void openItem(n)}
                      className={cn(
                        "flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? "border-primary/30 bg-brand-light shadow-sm"
                          : "border-blue-50 bg-white hover:border-blue-100 hover:bg-brand-bg/40",
                        !n.isRead && !active && "bg-sky-50/50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          tone.iconBg,
                          tone.iconText
                        )}
                      >
                        <TypeIcon group={tone.group} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-heading text-sm font-bold text-brand-dark">
                            {n.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-brand-muted">
                            {formatNotifTime(n.createdAt)}
                          </span>
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {n.body}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                              tone.badge
                            )}
                          >
                            {tone.label}
                          </span>
                          {!n.isRead ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Unread
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Read
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Read view">
          {!selected ? (
            <div className="rounded-xl bg-brand-bg/60 px-4 py-10 text-center text-sm text-muted-foreground">
              Select a notification to read the full message.
            </div>
          ) : (
            <article className="space-y-4">
              {(() => {
                const tone = notificationTone(String(selected.type))
                return (
                  <>
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          tone.iconBg,
                          tone.iconText
                        )}
                      >
                        <TypeIcon group={tone.group} />
                      </span>
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                            tone.badge
                          )}
                        >
                          {tone.label}
                        </span>
                        <h3 className="mt-2 font-heading text-lg font-bold leading-snug text-brand-dark">
                          {selected.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatNotifFullDate(selected.createdAt)}
                          {selected.isRead && selected.readAt
                            ? ` · Read ${formatNotifTime(selected.readAt)}`
                            : " · Unread"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-50 bg-brand-bg/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Message
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-dark">
                        {selected.body}
                      </p>
                    </div>

                    {selected.channel ? (
                      <p className="text-xs text-muted-foreground">
                        Channel:{" "}
                        <span className="font-semibold text-brand-dark">
                          {String(selected.channel)}
                        </span>
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {!selected.isRead ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() =>
                            void markAsRead(notificationId(selected))
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Mark read
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-destructive"
                        disabled={deleting}
                        onClick={() => void onDelete(selected)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </>
                )
              })()}
            </article>
          )}
        </AdminPanel>
      </div>
    </div>
  )
}
