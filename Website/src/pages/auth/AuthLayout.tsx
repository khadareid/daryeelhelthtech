import type React from "react"
import { Link } from "react-router-dom"
import { HeartPulse } from "lucide-react"
import { siteConfig } from "@/config/site"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({
  children,
  title = "Welcome",
  subtitle = "Access your health dashboard",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-brand-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30"
          >
            <HeartPulse className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-brand-dark">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {siteConfig.appName}
          {" · "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-medium text-primary hover:text-primary/80"
          >
            {siteConfig.supportEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
