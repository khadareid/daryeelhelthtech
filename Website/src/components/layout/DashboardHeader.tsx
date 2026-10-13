import { useNavigate } from "react-router-dom"
import { Bell, Home, Settings } from "lucide-react"
import { UserProfileMenu } from "./UserProfileMenu"
import { siteConfig } from "@/config/site"

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
  userName?: string
  userRole?: string
  userEmail?: string
  userImage?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function DashboardHeader({
  title = "Dashboard",
  userName = "User",
  userRole = "USER",
  userEmail = "",
  userImage = "",
}: DashboardHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-5 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex shrink-0 items-center gap-2 rounded-xl transition hover:opacity-90"
            aria-label="Dashboard home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-dark text-white shadow-md shadow-primary/30">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden
              >
                <path d="M13 2L4.5 13.5H11L10 22L19 10H12.5L13 2Z" />
              </svg>
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-bold tracking-tight text-brand-dark">
                {siteConfig.appName}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {title}
              </span>
            </span>
          </button>
          <span className="truncate font-heading text-base font-bold text-brand-dark sm:hidden">
            {title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/70 transition hover:text-primary md:flex"
            aria-label="Public home"
          >
            <Home className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard?section=notifications")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/70 transition hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/UserProfile")}
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/70 transition hover:text-primary sm:flex"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <UserProfileMenu
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            userRole={userRole}
          />
        </div>
      </div>
    </header>
  )
}
