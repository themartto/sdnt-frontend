import { useEffect, useState } from "react"
import { ShieldCheck, ShieldX } from "lucide-react"

interface ApiResponse {
  subject: string
  issuer: string
  not_before: string
  not_after: string
  sans: string[]
  serial: string
  is_expired: boolean
}

function parseCN(dn: string): string {
  const m = dn.match(/CN=([^,]+)/)
  return m?.[1] ?? dn
}

function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function getSeverity(days: number, expired: boolean): "destructive" | "yellow" | "green" {
  if (expired || days <= 14) return "destructive"
  if (days <= 30) return "yellow"
  return "green"
}

function expiryColor(days: number, expired: boolean): string {
  const s = getSeverity(days, expired)
  return s === "destructive" ? "text-destructive" : s === "yellow" ? "text-yellow-500" : "text-green-500"
}

function barColor(days: number, expired: boolean): string {
  const s = getSeverity(days, expired)
  return s === "destructive" ? "bg-destructive" : s === "yellow" ? "bg-yellow-500" : "bg-green-500"
}

interface SslCheckerProps {
  domain: string
}

type SslState =
  | { status: "idle" }
  | { status: "error"; domain: string; message: string }
  | { status: "ok"; domain: string; data: ApiResponse }

export function SslChecker({ domain }: SslCheckerProps) {
  const [state, setState] = useState<SslState>({ status: "idle" })

  useEffect(() => {
    if (!domain) return
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_URL}/ssl?domain=${encodeURIComponent(domain)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: ApiResponse | { error: string }) => {
        if ("error" in d) setState({ status: "error", domain, message: d.error })
        else setState({ status: "ok", domain, data: d })
      })
      .catch((e) => { if (e.name !== "AbortError") setState({ status: "error", domain, message: e.message }) })
    return () => controller.abort()
  }, [domain])

  const fetchedDomain = state.status !== "idle" ? state.domain : null
  const isLoading = !!domain && fetchedDomain !== domain

  if (isLoading) return <p className="text-sm text-muted-foreground">Fetching SSL certificate…</p>
  if (state.status === "error") return <p className="text-sm text-destructive">Error: {state.message}</p>
  if (state.status !== "ok") return <p className="text-sm text-muted-foreground">Enter a domain and click Search.</p>

  const { data } = state
  const days = daysUntil(data.not_after)
  const totalDays = Math.max(
    Math.floor((new Date(data.not_after).getTime() - new Date(data.not_before).getTime()) / (1000 * 60 * 60 * 24)),
    1,
  )
  const pct = Math.max(0, Math.min(100, Math.round((days / totalDays) * 100)))
  const secure = !data.is_expired

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className={[
        "flex items-center gap-3 rounded-2xl border p-4",
        secure
          ? "border-green-500/30 bg-green-500/10"
          : "border-destructive/30 bg-destructive/10",
      ].join(" ")}>
        {secure
          ? <ShieldCheck className="size-8 shrink-0 text-green-500" />
          : <ShieldX className="size-8 shrink-0 text-destructive" />}
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${secure ? "text-green-500" : "text-destructive"}`}>
              {secure ? "SECURE" : "EXPIRED"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${secure ? "bg-green-500" : "bg-destructive"}`}>
              {secure ? "Valid Certificate" : "Certificate Expired"}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {secure ? "SSL certificate is valid and properly configured" : "This certificate has expired"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</span>
          <p className="mt-1 font-mono text-sm font-medium text-foreground">{parseCN(data.subject)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{data.subject}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Issuer</span>
          <p className="mt-1 text-sm font-medium text-foreground">{parseCN(data.issuer)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{data.issuer}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Valid From</span>
          <p className="mt-1 text-sm font-medium text-foreground">{data.not_before}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Valid Until</span>
          <p className="mt-1 text-sm font-medium text-foreground">{data.not_after}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {data.is_expired ? "Expired" : "Days Remaining"}
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barColor(days, data.is_expired)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`tabular-nums text-sm font-bold ${expiryColor(days, data.is_expired)}`}>
              {data.is_expired ? `${Math.abs(days)} days ago` : `${days} days`}
            </span>
          </div>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject Alternative Names</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.sans.map((san) => (
              <span key={san} className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{san}</span>
            ))}
          </div>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Serial Number</span>
          <p className="mt-1 font-mono text-xs text-foreground/80 break-all">{data.serial}</p>
        </div>
      </div>
    </div>
  )
}
