import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useSelector } from "react-redux"
import { DashboardSidebar, normalizeRole, sectionFromLocation } from "./Sidebar"
import { DashboardHeader } from "./DashboardHeader"
import { Dashboard } from "./Dashboard"
import { RootState } from "@/Redex/store/store"

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  home: "Dashboard",
  doctors: "Doctors",
  patients: "Patients",
  appointments: "Appointments",
  hospitals: "Hospitals",
  news: "Health news",
  care: "Appointments",
  health: "My Health",
  records: "Records",
  wallet: "Wallet",
  consents: "Consents",
  messages: "Messages",
  notifications: "Alerts",
  labs: "Labs",
  connections: "Connections",
  users: "Patients",
  finance: "Finance",
  activity: "Audit",
  profile: "My Profile",
  admin: "Super Admin",
  "apply-professional": "Professional application",
}

export default function DashRouter() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)

  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const role = normalizeRole(session.role)
  const section = sectionFromLocation(location.pathname, location.search)
  const onProfile = section === "profile"

  useEffect(() => {
    if (!signedIn) {
      navigate("/signin", { replace: true })
    }
  }, [signedIn, navigate])

  if (!signedIn) return null

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#F0F4FA]">
      {/* Soft atmosphere — desktop only so mobile stays light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(20,106,251,0.12),_transparent_55%)] md:block"
      />

      <DashboardHeader
        title={PAGE_TITLES[section] ?? "Dashboard"}
        userName={session.name}
        userRole={role}
        userEmail={session.email}
        userImage={session.image}
      />

      <main className="relative z-0 mx-auto w-full max-w-6xl flex-1 px-3 pb-[7.5rem] pt-3 sm:px-5 sm:pb-36 sm:pt-5 md:px-6 lg:px-8">
        {onProfile ? <Outlet /> : <Dashboard />}
      </main>

      <DashboardSidebar
        userRole={role}
        userName={session.name}
        userImage={session.image}
      />
    </div>
  )
}
