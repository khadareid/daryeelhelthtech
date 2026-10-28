import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import {
  Blocks,
  ChevronDown,
  Crown,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  User as UserIcon,
  Users,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/Redex/service/auth/Userinfo"
import { AppDispatch } from "@/Redex/store/store"
import { cn } from "@/lib/utils"

type Props = {
  userName?: string
  userEmail?: string
  userImage?: string
  userRole?: string
  /** Compact trigger for dense headers */
  className?: string
}

function initialsOf(name?: string) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function prettyRole(role?: string) {
  const upper = (role || "USER").toUpperCase()
  if (upper === "USER" || upper === "PATIENT") return "Member"
  if (upper === "RECEPTIONIST") return "Staff"
  return (role || "USER")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function UserProfileMenu({
  userName = "User",
  userEmail = "",
  userImage = "",
  userRole = "USER",
  className,
}: Props) {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const initials = initialsOf(userName)
  const roleLabel = prettyRole(userRole)

  const signOut = () => {
    dispatch(logout())
    navigate("/", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-slate-200/60 transition-all hover:shadow-md data-[state=open]:ring-slate-300",
            className,
          )}
        >
          <Avatar className="h-9 w-9 ring-2 ring-white">
            <AvatarImage src={userImage || undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-tight sm:flex">
            <span className="max-w-[120px] truncate text-[13px] font-semibold text-slate-800">
              {userName}
            </span>
            <span className="max-w-[120px] truncate text-[11px] text-slate-400">
              {userEmail || roleLabel}
            </span>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[320px] overflow-hidden rounded-[22px] border-0 bg-white p-2 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/60"
      >
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Avatar className="h-11 w-11 ring-2 ring-slate-100">
            <AvatarImage src={userImage || undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-[15px] font-semibold leading-tight text-slate-900">
              {userName}
            </p>
            <p className="truncate text-[12px] leading-tight text-slate-400">
              {userEmail || "No email"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="group relative mt-1 flex w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 px-4 py-3 text-left shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <Crown
              className="h-[18px] w-[18px] text-amber-300"
              strokeWidth={2.5}
            />
            <span className="text-[14px] font-semibold text-white">
              Open dashboard
            </span>
          </div>
          <span className="relative rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wide text-blue-600 shadow-sm">
            GO
          </span>
        </button>

        <div className="mt-2 flex flex-col">
          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">Dashboard</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/dashboard/UserProfile")}
          >
            <UserIcon className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">User Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/dashboard/UserProfile")}
          >
            <Blocks className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">Integrations</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/dashboard/UserProfile")}
          >
            <Settings className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/doctors")}
          >
            <Users className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">Care team</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium text-slate-600 transition-colors focus:bg-slate-50 focus:text-slate-900"
            onClick={() => navigate("/dashboard?section=notifications")}
          >
            <LifeBuoy className="h-[18px] w-[18px] shrink-0 text-slate-500 group-focus:text-slate-700" />
            <span className="flex-1 leading-none">Help & alerts</span>
          </DropdownMenuItem>
        </div>

        <div className="mt-1 border-t border-slate-100 pt-1">
          <DropdownMenuItem
            className="group flex cursor-pointer flex-row items-center gap-3 rounded-2xl bg-rose-50 px-3 py-2.5 text-[14px] font-semibold text-rose-600 transition-colors focus:bg-rose-100 focus:text-rose-700"
            onClick={signOut}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-rose-500 group-focus:text-rose-600" />
            <span className="flex-1 leading-none">Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
