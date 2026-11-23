import type { Notification } from "@/Redex/types/Types"

export function notificationId(n: Notification) {
  return n.id || n.notificationid || ""
}

export function formatNotifTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  })
}

export function formatNotifFullDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export type NotifTone = {
  label: string
  badge: string
  iconBg: string
  iconText: string
  group: "booking" | "payment" | "care" | "system"
}

export function notificationTone(type?: string): NotifTone {
  const t = String(type || "SYSTEM").toUpperCase()
  if (t.includes("PAYMENT") || t === "REFUND") {
    return {
      label: humanType(t),
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      group: "payment",
    }
  }
  if (t.includes("APPOINTMENT") || t === "CHECKED_IN" || t === "VISIT_COMPLETED") {
    return {
      label: humanType(t),
      badge: "bg-sky-50 text-sky-700 ring-sky-100",
      iconBg: "bg-sky-100",
      iconText: "text-sky-700",
      group: "booking",
    }
  }
  if (t === "CONSULTATION" || t === "MEDICAL_RECORD") {
    return {
      label: humanType(t),
      badge: "bg-violet-50 text-violet-700 ring-violet-100",
      iconBg: "bg-violet-100",
      iconText: "text-violet-700",
      group: "care",
    }
  }
  return {
    label: humanType(t),
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    iconBg: "bg-slate-100",
    iconText: "text-slate-700",
    group: "system",
  }
}

function humanType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
