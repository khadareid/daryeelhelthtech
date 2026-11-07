import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  CalendarPlus,
  CreditCard,
  Droplets,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Pill,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
import { useGetMyDoctorProfileQuery } from "@/Redex/service/doctors/DoctorsApi"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "USER"

export const normalizeRole = (role?: string): AppRole => {
  const r = (role ?? "").toUpperCase().replace(/[\s-]+/g, "_")
  if (r === "SUPER_ADMIN" || r === "ADMIN") return r
  return "USER"
}

export const isAdminRole = (role: AppRole) =>
  role === "ADMIN" || role === "SUPER_ADMIN"

export type Workspace = "admin" | "patient"

export const workspaceForRole = (role: AppRole): Workspace =>
  isAdminRole(role) ? "admin" : "patient"

export type DashIcon = React.ElementType

export interface DashLink {
  id: string
  label: string
  description: string
  to: string
  icon: DashIcon
  bar?: boolean
}

export const PRIMARY_TABS: DashLink[] = [
  {
    id: "dashboard",
    label: "Home",
    description: "Your health home",
    to: "/dashboard",
    icon: LayoutDashboard,
    bar: true,
  },
  {
    id: "doctors",
    label: "Doctors",
    description: "Find and book clinicians",
    to: "/dashboard?section=doctors",
    icon: Stethoscope,
    bar: true,
  },
  {
    id: "appointments",
    label: "Visits",
    description: "Upcoming and past appointments",
    to: "/dashboard?section=appointments",
    icon: Calendar,
    bar: true,
  },
]

const CLINIC_ACTION: DashLink = {
  id: "clinic",
  label: "My clinic",
  description: "Patients, payments & doctor profile",
  to: "/dashboard?section=clinic",
  icon: Stethoscope,
}

const QUICK_ACTIONS: DashLink[] = [
  {
    id: "book",
    label: "Book visit",
    description: "Schedule a consultation",
    to: "/dashboard?section=appointments",
    icon: CalendarPlus,
  },
  {
    id: "payments",
    label: "Payments",
    description: "Free vs paid visits & invoices",
    to: "/dashboard?section=payments",
    icon: CreditCard,
  },
  {
    id: "health",
    label: "Daily health",
    description: "Daily health log",
    to: "/dashboard?section=health",
    icon: HeartPulse,
  },
  {
    id: "vitals",
    label: "Vitals",
    description: "Blood pressure, heart rate & more",
    to: "/dashboard?section=vitals",
    icon: Activity,
  },
  {
    id: "medications",
    label: "Medications",
    description: "Your active medicines",
    to: "/dashboard?section=medications",
    icon: Pill,
  },
  {
    id: "allergies",
    label: "Allergies",
    description: "Allergens and reactions",
    to: "/dashboard?section=allergies",
    icon: AlertTriangle,
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    description: "Issued prescriptions",
    to: "/dashboard?section=prescriptions",
    icon: FlaskConical,
  },
  {
    id: "records",
    label: "Records",
    description: "Medical records & documents",
    to: "/dashboard?section=records",
    icon: Droplets,
  },
  {
    id: "family",
    label: "Family",
    description: "Family members",
    to: "/dashboard?section=family",
    icon: Users,
  },
  {
    id: "emergency",
    label: "Emergency",
    description: "Contacts & emergency card",
    to: "/dashboard?section=emergency",
    icon: ShieldAlert,
  },
  {
    id: "notifications",
    label: "Alerts",
    description: "Reminders and updates",
    to: "/dashboard?section=notifications",
    icon: Bell,
  },
  {
    id: "profile",
    label: "My Profile",
    description: "Account & health ID",
    to: "/dashboard/UserProfile",
    icon: UserRound,
  },
]

const LEGACY_ALIASES: Record<string, string> = {
  home: "dashboard",
  care: "appointments",
  labs: "prescriptions",
  healthcare: "appointments",
}

export const linksForRole = (role: AppRole): DashLink[] => [
  ...PRIMARY_TABS,
  ...(isAdminRole(role)
    ? [
        {
          id: "admin",
          label: "Admin",
          description: "Users, doctors, audits",
          to: "/admin",
          icon: ShieldCheck,
        } satisfies DashLink,
      ]
    : []),
  ...QUICK_ACTIONS.filter((l) => !PRIMARY_TABS.some((t) => t.id === l.id)),
]

export const sectionFromLocation = (pathname: string, search: string): string => {
  if (/\/userprofile\/?$/i.test(pathname)) return "profile"
  const raw = new URLSearchParams(search).get("section") || "dashboard"
  return LEGACY_ALIASES[raw] || raw
}

interface DashboardSidebarProps {
  userRole?: string
  userName?: string
  userImage?: string
}

export function DashboardSidebar({
  userRole = "USER",
  userName = "User",
  userImage = "",
}: DashboardSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [actionsOpen, setActionsOpen] = useState(false)
  const { data: myDoctor } = useGetMyDoctorProfileQuery()
  const isDoctor = Boolean(myDoctor?.id)

  const role = normalizeRole(userRole)
  const current = sectionFromLocation(location.pathname, location.search)
  const primaryTabs = useMemo(() => {
    if (!isDoctor) return PRIMARY_TABS
    return PRIMARY_TABS.map((t) =>
      t.id === "doctors"
        ? {
            ...t,
            id: "clinic",
            label: "Clinic",
            description: "Patients, payments & your doctor profile",
            to: "/dashboard?section=clinic",
          }
        : t
    )
  }, [isDoctor])
  const left = primaryTabs.filter((t) =>
    ["dashboard", "doctors", "clinic"].includes(t.id)
  )
  const right = primaryTabs.filter((t) => t.id === "appointments")
  const quickActions = useMemo(
    () => (isDoctor ? [CLINIC_ACTION, ...QUICK_ACTIONS] : QUICK_ACTIONS),
    [isDoctor]
  )

  const go = (to: string) => {
    setActionsOpen(false)
    navigate(to)
  }

  const initials = (userName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] sm:px-4">
        <div className="pointer-events-auto relative mx-auto w-full max-w-lg md:max-w-xl">
          <div className="absolute -inset-px rounded-[26px] bg-gradient-to-r from-primary/20 via-sky-400/10 to-brand-dark/15 blur-[1px] sm:rounded-[30px]" />
          <div className="relative flex items-end justify-between gap-0 rounded-[24px] border border-white/80 bg-white/95 px-0.5 pb-1 pt-1.5 shadow-[0_12px_40px_rgba(11,61,145,0.16)] backdrop-blur-xl sm:rounded-[28px] sm:px-1.5 sm:pb-1.5 sm:pt-2">
            {left.map((item) => (
              <BarItem
                key={item.id}
                item={item}
                active={current === item.id}
                onSelect={() => go(item.to)}
              />
            ))}

            <button
              type="button"
              aria-label="Quick actions"
              onClick={() => setActionsOpen(true)}
              className="-mt-8 mb-0.5 flex w-14 flex-col items-center gap-0.5 sm:w-[4.5rem]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-dark text-white shadow-lg shadow-primary/40 ring-4 ring-white transition active:scale-95 sm:h-14 sm:w-14">
                <Plus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.4} />
              </span>
              <span className="text-[10px] font-semibold text-primary">Actions</span>
            </button>

            {right.map((item) => (
              <BarItem
                key={item.id}
                item={item}
                active={current === item.id}
                onSelect={() => go(item.to)}
              />
            ))}

            <button
              type="button"
              onClick={() => go("/dashboard/UserProfile")}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5 transition sm:px-1",
                current === "profile" && "bg-primary/8"
              )}
              aria-label="Profile"
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition",
                  current === "profile"
                    ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-white"
                    : "ring-2 ring-slate-200"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userImage || undefined} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-brand-dark text-[10px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none",
                  current === "profile" ? "text-primary" : "text-slate-400"
                )}
              >
                Profile
              </span>
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={actionsOpen} onOpenChange={setActionsOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl px-3 pb-8 pt-3 sm:px-4"
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
          <SheetHeader className="text-left">
            <SheetTitle className="text-base text-brand-dark sm:text-lg">
              Quick actions
            </SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              Health records, booking, and alerts — {workspaceForRole(role)} workspace.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
            {quickActions.map((item) => (
              <button
                key={`${item.id}-${item.label}`}
                type="button"
                onClick={() => go(item.to)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-blue-100 bg-brand-light/50 px-2 py-3 text-center transition hover:border-primary/40 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm sm:h-11 sm:w-11">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-brand-dark sm:text-[11px]">
                  {item.label}
                </span>
              </button>
            ))}

            {isAdminRole(role) ? (
              <button
                type="button"
                onClick={() => go("/admin")}
                className="flex flex-col items-center gap-2 rounded-2xl border border-blue-100 bg-brand-light/50 px-2 py-3 text-center transition hover:border-primary/40 hover:bg-white"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-brand-dark">
                  Admin
                </span>
              </button>
            ) : null}

            <a
              href={`tel:${siteConfig.supportPhone}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 px-2 py-3 text-center transition hover:border-rose-200"
              onClick={() => setActionsOpen(false)}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-rose-700">
                Emergency
              </span>
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function BarItem({
  item,
  active,
  onSelect,
}: {
  item: DashLink
  active: boolean
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition",
        active && "bg-primary/8"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl transition",
          active
            ? "bg-primary text-white shadow-md shadow-primary/35"
            : "bg-transparent text-slate-400"
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
      </span>
      <span
        className={cn(
          "max-w-full truncate text-[9px] font-semibold leading-none sm:text-[10px]",
          active ? "text-primary" : "text-slate-400"
        )}
      >
        {item.label}
      </span>
    </button>
  )
}
