import { Link } from "react-router-dom"
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  HeartPulse,
  Info,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  formatNotifTime,
  notificationId,
  notificationTone,
} from "@/lib/adminNotifications"
import {
  useListNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/Redex/service/notifications/NotificationsApi"
import { cn } from "@/lib/utils"
import type { Notification } from "@/Redex/types/Types"

function TypeIcon({ group }: { group: string }) {
  if (group === "payment") return <CreditCard className="h-4 w-4" />
  if (group === "booking") return <CalendarCheck className="h-4 w-4" />
  if (group === "care") return <HeartPulse className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

export function AdminNotificationsPanel({
  open,
  onClose,
  unread,
}: {
  open: boolean
  onClose: () => void
  unread: number
}) {
  const { data: notifications = [], isFetching } = useListNotificationsQuery(
    { limit: 12 },
    { skip: !open }
  )
  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation()

  if (!open) return null

  const onOpenItem = async (n: Notification) => {
    const id = notificationId(n)
    if (!n.isRead && id) {
      try {
        await markAsRead(id).unwrap()
      } catch {
        /* still allow viewing */
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

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-brand-dark/10 backdrop-blur-[1px]"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,380px)] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl shadow-primary/10">
        <div className="flex items-start justify-between gap-3 border-b border-blue-50 bg-gradient-to-br from-brand-light/80 to-white px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="font-heading text-sm font-bold text-brand-dark">
                  Notifications
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {unread > 0
                    ? `${unread} unread · admin alerts`
                    : "You're all caught up"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1 px-2 text-[11px]"
                disabled={markingAll}
                onClick={() => void onMarkAll()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read all
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[min(70vh,420px)] overflow-y-auto">
          {isFetching && notifications.length === 0 ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-brand-light/70"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <p className="mt-3 font-heading text-sm font-bold text-brand-dark">
                No notifications yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Booking, payment, and system alerts will show here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-blue-50">
              {notifications.map((n) => {
                const tone = notificationTone(String(n.type))
                const id = notificationId(n)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => void onOpenItem(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-brand-light/50",
                        !n.isRead && "bg-sky-50/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          tone.iconBg,
                          tone.iconText
                        )}
                      >
                        <TypeIcon group={tone.group} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-heading text-[13px] font-bold leading-snug text-brand-dark">
                            {n.title}
                          </span>
                          {!n.isRead ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          ) : null}
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
                          <span className="text-[10px] font-medium text-brand-muted">
                            {formatNotifTime(n.createdAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-blue-50 bg-brand-bg/60 px-3 py-2.5">
          <Link
            to="/admin/notifications"
            onClick={onClose}
            className="flex h-9 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary/90"
          >
            Open full inbox
          </Link>
        </div>
      </div>
    </>
  )
}
