export type NavItem = {
  title: string
  href: string
  roles?: string[]
}

export const publicNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Hospitals", href: "/hospitals" },
  { title: "Doctors", href: "/doctors" },
  { title: "Services", href: "/#services" },
  { title: "How it works", href: "/#how-it-works" },
  { title: "Contact", href: "/#contact" },
]

export const dashboardNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Hospitals", href: "/dashboard?section=hospitals" },
  { title: "Book hospital", href: "/dashboard?section=book" },
  { title: "My Visits", href: "/dashboard?section=healthcare" },
  { title: "Daryeel doctors", href: "/dashboard?section=doctors" },
  {
    title: "Daryeel bookings",
    href: "/dashboard?section=healthcare&tab=daryeel",
  },
  { title: "Daily health", href: "/dashboard?section=health" },
  { title: "Vitals", href: "/dashboard?section=vitals" },
  { title: "Medications", href: "/dashboard?section=medications" },
  { title: "Allergies", href: "/dashboard?section=allergies" },
  { title: "Prescriptions", href: "/dashboard?section=prescriptions" },
  { title: "Records", href: "/dashboard?section=records" },
  { title: "Family", href: "/dashboard?section=family" },
  { title: "Emergency", href: "/dashboard?section=emergency" },
  { title: "Notifications", href: "/dashboard?section=notifications" },
  { title: "Profile", href: "/dashboard/UserProfile" },
]

export const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard" },
  { title: "Users", href: "/admin/users" },
  { title: "Doctors", href: "/admin/doctors" },
  { title: "Audits", href: "/admin/audits" },
  { title: "Settings", href: "/admin/settings" },
]
