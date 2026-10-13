import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

/* ---------- Public site ---------- */
import SiteHeader from "@/features/Main/SiteHeader";
// import SiteFooter from "@/features/Main/SiteFooter";
import { PublicLayout } from "@/features/PublicLayout";
import { NotFoundPage } from "@/features/Main/public/NotFoundPage";
import HospitalsPage from "@/features/Main/public/HospitalsPage";
import HospitalDetailPage from "@/features/Main/public/HospitalDetailPage";
import DoctorsPage from "@/features/Main/public/DoctorsPage";
import DoctorDetailPage from "@/features/Main/public/DoctorDetailPage";
import NewsPage from "@/features/Main/public/NewsPage";
import NewsDetailPage from "@/features/Main/public/NewsDetailPage";
import SignInPage from "@/pages/auth/SignIn";
import RegisterPage from "@/pages/auth/Register";
import GoogleCallbackHandler from "@/pages/auth/AuthCallback";
import GoogleOAuthBounce from "@/pages/auth/GoogleOAuthBounce";

/* ---------- Dashboard ---------- */
import DashRouter from "@/components/layout/DashRouter";
import UserProfile from "@/pages/dashboard/profile/UserProfile";
import { RouteError } from "@/routes/RouteError";

/* ---------- Super Admin (/admin) ---------- */
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminCms from "@/pages/admin/AdminCms";
import AdminAudits from "@/pages/admin/AdminAudits";
import AdminSettings from "@/pages/admin/AdminSettings";
import { PricingPage } from "@/features/Main/public/PricingPage";

/* ==================================================================
   PUBLIC SHELL — header + footer around every public page
================================================================== */

const PublicShell = () => (
  <div className="flex min-h-screen flex-col">
    <SiteHeader />

    <main className="flex-grow">
      <Outlet />
    </main>

    {/* <SiteFooter /> */}
  </div>
);

/* ==================================================================
   ROUTER
================================================================== */

export const router = createBrowserRouter(
  [
    /* ---------- Public routes ---------- */
    {
      path: "/",
      element: <PublicShell />,
      errorElement: <RouteError />,
      children: [
        { index: true,     element: <PublicLayout /> },
        { path: "hospitals", element: <HospitalsPage /> },
        { path: "hospitals/:tenantId", element: <HospitalDetailPage /> },
        { path: "doctors", element: <DoctorsPage /> },
        { path: "doctors/:doctorId", element: <DoctorDetailPage /> },
        { path: "news", element: <NewsPage /> },
        { path: "news/:id", element: <NewsDetailPage /> },
        { path: "pricing", element: <PricingPage /> },
        { path: "signin",  element: <SignInPage /> },
        { path: "SignUp",  element: <RegisterPage /> },
        { path: "*",       element: <NotFoundPage /> },
      ],
    },

    /* ---------- Super Admin console (SUPER_ADMIN / ADMIN) ---------- */
    {
      path: "/admin",
      element: <AdminLayout />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <AdminDashboard /> },
        { path: "users", element: <AdminUsers /> },
        { path: "plans", element: <AdminPlans /> },
        { path: "subscriptions", element: <AdminSubscriptions /> },
        { path: "cms", element: <AdminCms /> },
        { path: "audits", element: <AdminAudits /> },
        { path: "settings", element: <AdminSettings /> },
        { path: "tenants", element: <Navigate to="/admin/subscriptions" replace /> },
      ],
    },

    /* Google returns tokens here after the API finishes OAuth */
    { path: "/auth/google/callback", element: <GoogleCallbackHandler /> },

    /**
     * Misconfigured Google redirect (Website host + /api/v1/...).
     * Bounce to the real API callback so login can complete.
     * @see https://daryeel-healthtech.vercel.app/api/v1/auth/google/callback
     */
    {
      path: "/api/v1/auth/google/callback",
      element: <GoogleOAuthBounce />,
    },

    /* ---------- Dashboard routes ---------- */
    {
      path: "/dashboard",
      element: <DashRouter />,
      errorElement: <RouteError />,
      children: [
        { path: "UserProfile", element: <UserProfile /> },
      ],
    },
  ],
  {
    future: {
      // v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);