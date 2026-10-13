import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  CalendarPlus,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Phone,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react"
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

/* ==================================================================
   ROLES
================================================================== */

export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "MIDWIFE"
  | "LAB_TECH"
  | "PHARMACIST"
  | "RECEPTIONIST"
  | "PATIENT"
  | "USER"

const CLINICAL_ROLES: AppRole[] = [
  "DOCTOR",
  "NURSE",
  "MIDWIFE",
  "LAB_TECH",
  "PHARMACIST",
  "RECEPTIONIST",
]

export const normalizeRole = (role?: string): AppRole => {
  const r = (role ?? "").toUpperCase().replace(/[\s-]+/g, "_")
  if (r === "SUPER_ADMIN" || r === "ADMIN") return r
  if (CLINICAL_ROLES.includes(r as AppRole)) return r as AppRole
  if (r === "PATIENT") return "PATIENT"
  return "USER"
}

export const isClinicalRole = (role: AppRole) => CLINICAL_ROLES.includes(role)
export const isAdminRole = (role: AppRole) =>
  role === "ADMIN" || role === "SUPER_ADMIN"

export type Workspace = "admin" | "clinical" | "patient"

export const workspaceForRole = (role: AppRole): Workspace => {
  if (isAdminRole(role)) return "admin"
  if (isClinicalRole(role)) return "clinical"
  return "patient"
}

/* ==================================================================
   LINKS
================================================================== */

export type DashIcon = React.ElementType

export interface DashLink {
  id: string
  label: string
  description: string
  to: string
  icon: DashIcon
  bar?: boolean
}

/** Bottom bar tabs (no top header tabs). Center slot is the + FAB. */
export const PRIMARY_TABS: DashLink[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Your care home — hospitals, news, and health",
    to: "/dashboard",
    icon: LayoutDashboard,
    bar: true,
  },
  {
    id: "doctors",
    label: "Doctors",
    description: "Clinicians from the Daryeel network",
    to: "/dashboard?section=doctors",
    icon: Stethoscope,
    bar: true,
  },
  {
    id: "appointments",
    label: "Appts",
    description: "Upcoming and past visits",
    to: "/dashboard?section=appointments",
    icon: Calendar,
    bar: true,
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    description: "Medicines, refills, and pharmacies",
    to: "/dashboard?section=pharmacy",
    icon: Pill,
    bar: true,
  },
  {
    id: "profile",
    label: "Profile",
    description: "Account and security",
    to: "/dashboard/UserProfile",
    icon: UserRound,
    bar: true,
  },
]

/** Opened from the raised + button — booking & shortcuts */
const QUICK_ACTIONS: DashLink[] = [
  {
    id: "book",
    label: "Book visit",
    description: "Schedule a consultation",
    to: "/dashboard?section=appointments",
    icon: CalendarPlus,
  },
  {
    id: "doctors",
    label: "Doctors",
    description: "Browse clinicians",
    to: "/dashboard?section=doctors",
    icon: Stethoscope,
  },
  {
    id: "patients",
    label: "Patients",
    description: "People in care",
    to: "/dashboard?section=patients",
    icon: Users,
  },
  {
    id: "hospitals",
    label: "Hospitals",
    description: "Find care facilities",
    to: "/hospitals",
    icon: Building2,
  },
  {
    id: "health",
    label: "Health Daily",
    description: "Steps, water, sleep & vitals",
    to: "/dashboard?section=health",
    icon: HeartPulse,
  },
  {
    id: "news",
    label: "Health news",
    description: "Tips and wellness guides",
    to: "/dashboard?section=news",
    icon: Newspaper,
  },
  {
    id: "labs",
    label: "Labs",
    description: "Orders and results",
    to: "/dashboard?section=labs",
    icon: FlaskConical,
  },
  {
    id: "pharmacy",
    label: "Medications",
    description: "Prescriptions and refills",
    to: "/dashboard?section=pharmacy",
    icon: Pill,
  },
  {
    id: "messages",
    label: "Messages",
    description: "Care team inbox",
    to: "/dashboard?section=messages",
    icon: MessageSquare,
  },
  {
    id: "notifications",
    label: "Alerts",
    description: "Reminders and updates",
    to: "/dashboard?section=notifications",
    icon: Bell,
  },
  {
    id: "consents",
    label: "Consents",
    description: "Who can see your records",
    to: "/dashboard?section=consents",
    icon: ShieldCheck,
  },
  {
    id: "activity",
    label: "Audit",
    description: "Recent system activity",
    to: "/dashboard?section=activity",
    icon: Activity,
  },
]

const MORE_LINKS = QUICK_ACTIONS

/** Keep alias for older call sites that used "home" / "care" */
const LEGACY_ALIASES: Record<string, string> = {
  home: "dashboard",
  care: "appointments",
  prescriptions: "pharmacy",
  users: "patients",
}

export const linksForRole = (role: AppRole): DashLink[] => [
  ...PRIMARY_TABS,
  ...(isAdminRole(role)
    ? [
        {
          id: "admin",
          label: "Super Admin",
          description: "Users, plans, subscriptions, homepage CMS",
          to: "/admin",
          icon: ShieldCheck,
        } satisfies DashLink,
      ]
    : []),
  {
    id: "apply-professional",
    label: "Apply pro",
    description: "Request healthcare professional access",
    to: "/dashboard?section=apply-professional",
    icon: Stethoscope,
  },
  {
    id: "patients",
    label: "Patients",
    description: "People in care and patient records",
    to: "/dashboard?section=patients",
    icon: Users,
  },
  ...MORE_LINKS.filter((l) => l.id !== "doctors" && l.id !== "pharmacy"),
]

export const sectionFromLocation = (pathname: string, search: string): string => {
  if (/\/userprofile\/?$/i.test(pathname)) return "profile"
  const raw = new URLSearchParams(search).get("section") || "dashboard"
  return LEGACY_ALIASES[raw] || raw
}

/* ==================================================================
   BOTTOM BAR — tabs + raised + (booking / actions)
================================================================== */

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

  const role = normalizeRole(userRole)
  const current = sectionFromLocation(location.pathname, location.search)
  const left = PRIMARY_TABS.filter((t) =>
    ["dashboard", "doctors"].includes(t.id),
  )
  const right = PRIMARY_TABS.filter((t) =>
    ["appointments", "pharmacy"].includes(t.id),
  )
  const profileTab = PRIMARY_TABS.find((t) => t.id === "profile")!

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
              <span className="text-[10px] font-semibold text-primary">
                Actions
              </span>
            </button>

            {right.map((item) => (
              <BarItem
                key={item.id}
                item={item}
                active={current === item.id}
                onSelect={() => go(item.to)}
              />
            ))}

            {/* Profile — avatar chip (distinct from icon tabs) */}
            <button
              type="button"
              onClick={() => go(profileTab.to)}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-0.5 py-1.5 transition sm:px-1",
                current === "profile" && "bg-primary/8",
              )}
              aria-label="Profile"
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-full transition",
                  current === "profile"
                    ? "ring-[2.5px] ring-primary ring-offset-2 ring-offset-white"
                    : "ring-2 ring-slate-200",
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userImage || undefined} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-brand-dark text-[10px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {current === "profile" ? (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none",
                  current === "profile" ? "text-primary" : "text-slate-400",
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
              Book a visit, open hospitals, health log, and more —{" "}
              {workspaceForRole(role)} workspace.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
            {QUICK_ACTIONS.map((item) => (
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

            <a
              href={`tel:${siteConfig.supportPhone}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 px-2 py-3 text-center transition hover:border-rose-200"
              onClick={() => setActionsOpen(false)}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                <Phone className="h-5 w-5" />
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
        active && "bg-primary/8",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl transition",
          active
            ? "bg-primary text-white shadow-md shadow-primary/35"
            : "bg-transparent text-slate-400",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
      </span>
      <span
        className={cn(
          "max-w-full truncate text-[9px] font-semibold leading-none sm:text-[10px]",
          active ? "text-primary" : "text-slate-400",
        )}
      >
        {item.label}
      </span>
    </button>
  )
}
