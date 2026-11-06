import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LOCAL_PAY_METHODS,
  type InvoiceDraft,
  type LocalPayMethod,
} from "@/lib/payments"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  invoice: InvoiceDraft | null
  busy?: boolean
  onClose: () => void
  onPay: (payload: {
    method: LocalPayMethod["method"]
    provider: string
    phone?: string
  }) => Promise<void>
}

export function PayInvoiceDialog({
  open,
  invoice,
  busy,
  onClose,
  onPay,
}: Props) {
  const [methodId, setMethodId] = useState("zaad")
  const [phone, setPhone] = useState("")

  if (!open || !invoice) return null

  const selected =
    LOCAL_PAY_METHODS.find((m) => m.id === methodId) || LOCAL_PAY_METHODS[0]
  const needsPhone = selected.method === "MOBILE_MONEY" || selected.method === "WALLET"

  const submit = async () => {
    if (needsPhone && phone.trim().length < 7) {
      toast.error("Enter a valid mobile money number")
      return
    }
    await onPay({
      method: selected.method,
      provider: selected.provider,
      phone: phone.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
        <div className="border-b border-blue-50 bg-brand-light/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Invoice
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold text-brand-dark">
            Pay visit fee
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose local money (Zaad, eDahab…) or cash / bank / card.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl border border-dashed border-blue-200 bg-slate-50/80 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Visit
                </p>
                <p className="font-semibold text-brand-dark">
                  {invoice.doctorName || "Doctor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {invoice.appointmentCode || invoice.appointmentId.slice(0, 10)}
                  {invoice.scheduledAt
                    ? ` · ${new Date(invoice.scheduledAt).toLocaleString()}`
                    : ""}
                </p>
                {invoice.reason ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {invoice.reason}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Amount due
                </p>
                <p className="font-heading text-2xl font-bold text-brand-dark">
                  {invoice.currency} {invoice.amount.toFixed(2)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  Unpaid
                </Badge>
              </div>
            </div>
            {invoice.patientName ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Patient · {invoice.patientName}
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-brand-dark">
              Payment method
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOCAL_PAY_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition",
                    methodId === m.id
                      ? "border-primary bg-primary text-white"
                      : "border-blue-100 bg-brand-light/40 text-brand-dark hover:border-primary/40"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{selected.hint}</p>
          </div>

          {needsPhone ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-brand-dark">
                {selected.label} number *
              </span>
              <Input
                placeholder="e.g. 63xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-blue-50 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={busy}>
            {busy
              ? "Processing…"
              : `Pay ${invoice.currency} ${invoice.amount.toFixed(2)} · ${selected.label}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
