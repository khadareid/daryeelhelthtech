import { isRouteErrorResponse, useRouteError } from "react-router-dom"
import { Button } from "@/components/ui/button"
// done
export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText || "This page could not be opened."
    : "This page hit a display problem."

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-[#146AFB]">Daryeel Health</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#0B3D91]">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            type="button"
            className="bg-[#146AFB] text-white hover:bg-[#146AFB]/90"
            onClick={() => window.location.assign("/")}
          >
            Go home
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
