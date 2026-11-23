import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"

/* ---------- Public site ---------- */
import SiteHeader from "@/features/Main/SiteHeader"
import SiteFooter from "@/features/Main/SiteFooter"
import { PublicLayout } from "@/features/PublicLayout"
import { NotFoundPage } from "@/features/Main/public/NotFoundPage"
import DoctorsPage from "@/features/Main/public/DoctorsPage"
import DoctorDetailPage from "@/features/Main/public/DoctorDetailPage"
import ApplyDoctorPage from "@/features/Main/public/ApplyDoctorPage"
import HospitalsPage from "@/features/Main/public/HospitalsPage"
import HospitalDetailPage from "@/features/Main/public/HospitalDetailPage"
import HospitalDoctorDetailPage from "@/features/Main/public/HospitalDoctorDetailPage"
import HealthcareBookingPage from "@/features/Main/public/HealthcareBookingPage"
import HealthcareDoctorsPage from "@/features/Main/public/HealthcareDoctorsPage"
import PrivacyPage from "@/features/Main/public/PrivacyPage"
import TermsPage from "@/features/Main/public/TermsPage"
import AboutPage from "@/features/Main/public/AboutPage"
import TrainingPage from "@/features/Main/public/TrainingPage"
import EventsPage from "@/features/Main/public/EventsPage"
import InsightsPage from "@/features/Main/public/InsightsPage"
import CmsListDetailPage from "@/features/Main/public/CmsListDetailPage"
import ContactPage from "@/features/Main/public/ContactPage"
import CarePage from "@/features/Main/public/CarePage"
import SignInPage from "@/pages/auth/SignIn"
import RegisterPage from "@/pages/auth/Register"
import GoogleCallbackHandler from "@/pages/auth/AuthCallback"
import GoogleOAuthBounce from "@/pages/auth/GoogleOAuthBounce"

/* ---------- Dashboard ---------- */
import DashRouter from "@/components/layout/DashRouter"
import UserProfile from "@/pages/dashboard/profile/UserProfile"
import { RouteError } from "@/routes/RouteError"

/* ---------- Super Admin (/admin) ---------- */
import AdminLayout from "@/pages/admin/AdminLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminDoctors from "@/pages/admin/AdminDoctors"
import AdminAppointments from "@/pages/admin/AdminAppointments"
import AdminPayments from "@/pages/admin/AdminPayments"
import AdminAudits from "@/pages/admin/AdminAudits"
import AdminSettings from "@/pages/admin/AdminSettings"
import AdminCms from "@/pages/admin/AdminCms"
import AdminNotifications from "@/pages/admin/AdminNotifications"

const PublicShell = () => (
  <div className="flex min-h-screen flex-col">
    <SiteHeader />
    <main className="flex-grow">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
)

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <PublicShell />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <PublicLayout /> },
        { path: "hospitals", element: <HospitalsPage /> },
        {
          path: "hospitals/:hospitalId/doctors/:doctorId",
          element: <HospitalDoctorDetailPage />,
        },
        { path: "hospitals/:hospitalId", element: <HospitalDetailPage /> },
        { path: "healthcare/book", element: <HealthcareBookingPage /> },
        { path: "healthcare/doctors", element: <HealthcareDoctorsPage /> },
        { path: "doctors", element: <DoctorsPage /> },
        { path: "doctors/apply", element: <ApplyDoctorPage /> },
        { path: "doctors/:doctorId", element: <DoctorDetailPage /> },
        { path: "signin", element: <SignInPage /> },
        { path: "SignUp", element: <RegisterPage /> },
        { path: "about", element: <AboutPage /> },
        { path: "about/management-staff", element: <AboutPage /> },
        { path: "about/team", element: <AboutPage /> },
        { path: "care", element: <CarePage /> },
        { path: "training", element: <TrainingPage /> },
        {
          path: "training/:itemSlug",
          element: <CmsListDetailPage kind="training" />,
        },
        { path: "events", element: <EventsPage /> },
        {
          path: "events/:itemSlug",
          element: <CmsListDetailPage kind="events" />,
        },
        { path: "insights", element: <InsightsPage /> },
        {
          path: "insights/:itemSlug",
          element: <CmsListDetailPage kind="insights" />,
        },
        { path: "contact", element: <ContactPage /> },
        { path: "privacy", element: <PrivacyPage /> },
        { path: "terms", element: <TermsPage /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },

    {
      path: "/admin",
      element: <AdminLayout />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <AdminDashboard /> },
        { path: "notifications", element: <AdminNotifications /> },
        { path: "users", element: <AdminUsers /> },
        { path: "doctors", element: <AdminDoctors /> },
        { path: "appointments", element: <AdminAppointments /> },
        { path: "payments", element: <AdminPayments /> },
        { path: "audits", element: <AdminAudits /> },
        { path: "settings", element: <AdminSettings /> },
        { path: "cms", element: <AdminCms /> },
        { path: "plans", element: <Navigate to="/admin/dashboard" replace /> },
        { path: "subscriptions", element: <Navigate to="/admin/dashboard" replace /> },
        { path: "tenants", element: <Navigate to="/admin/dashboard" replace /> },
      ],
    },

    { path: "/auth/google/callback", element: <GoogleCallbackHandler /> },
    {
      path: "/api/v1/auth/google/callback",
      element: <GoogleOAuthBounce />,
    },

    {
      path: "/dashboard",
      element: <DashRouter />,
      errorElement: <RouteError />,
      children: [{ path: "UserProfile", element: <UserProfile /> }],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
)
