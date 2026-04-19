import { useEffect, useState } from "react"
import { WorldMap, type DnsServer, type ServerStatus } from "./WorldMap"
import { CheckCircle2, XCircle, AlertCircle, Cloud } from "lucide-react"

const LOCATION_META: Record<string, { flag: string; city: string; country: string; x: number; y: number }> = {
  "New York, US":    { flag: "🇺🇸", city: "New York",    country: "US", x: 28, y: 40 },
  "Los Angeles, US": { flag: "🇺🇸", city: "Los Angeles", country: "US", x: 15, y: 42 },
  "Toronto, CA":     { flag: "🇨🇦", city: "Toronto",     country: "CA", x: 26, y: 38 },
  "Sydney, AU":      { flag: "🇦🇺", city: "Sydney",      country: "AU", x: 90, y: 84 },
  "London, UK":      { flag: "🇬🇧", city: "London",      country: "UK", x: 48, y: 32 },
  "Frankfurt, DE":   { flag: "🇩🇪", city: "Frankfurt",   country: "DE", x: 50, y: 34 },
  "Nairobi, KE":     { flag: "🇰🇪", city: "Nairobi",     country: "KE", x: 60, y: 62 },
  "Moscow, RU":      { flag: "🇷🇺", city: "Moscow",      country: "RU", x: 60, y: 30 },
  "Cape Town, ZA":   { flag: "🇿🇦", city: "Cape Town",   country: "ZA", x: 54, y: 82 },
  "Beijing, CN":     { flag: "🇨🇳", city: "Beijing",     country: "CN", x: 80, y: 40 },
  "Tokyo, JP":       { flag: "🇯🇵", city: "Tokyo",       country: "JP", x: 86, y: 44 },
  "São Paulo, BR":   { flag: "🇧🇷", city: "São Paulo",   country: "BR", x: 36, y: 78 },
}

interface ApiResult {
  location: string
  server_ip: string
  record_type: string
  records: string[]
  error?: string
}

function findMajority(results: ApiResult[]): string {
  const counts: Record<string, number> = {}
  for (const r of results) {
    if (r.records.length > 0 && !r.error) {
      const key = r.records.join(",")
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""
}

function toServerStatus(r: ApiResult, majority: string): ServerStatus {
  if (r.error || r.records.length === 0) return "error"
  if (r.records.join(",") === majority) return "ok"
  return "warning"
}

function StatusIcon({ status }: { status: ServerStatus }) {
  if (status === "ok") return <CheckCircle2 className="size-4 text-green-500" />
  if (status === "error") return <XCircle className="size-4 text-destructive" />
  if (status === "warning") return <AlertCircle className="size-4 text-yellow-500" />
  return <Cloud className="size-4 text-muted-foreground" />
}

const PLACEHOLDER_SERVERS: DnsServer[] = Object.entries(LOCATION_META).map(([location, meta], i) => ({
  id: i + 1,
  flag: meta.flag,
  city: meta.city,
  country: meta.country,
  ip: "—",
  result: "—",
  records: [],
  status: "pending",
  x: meta.x,
  y: meta.y,
  location,
}))

interface DnsCheckerProps {
  domain: string
  recordType: string
}

type DnsState =
  | { status: "idle" }
  | { status: "error"; key: string; message: string }
  | { status: "ok"; key: string; results: ApiResult[] }

export function DnsChecker({ domain, recordType }: DnsCheckerProps) {
  const [state, setState] = useState<DnsState>({ status: "idle" })

  useEffect(() => {
    if (!domain) return
    const key = `${domain}|${recordType}`
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_URL}/dns?domain=${encodeURIComponent(domain)}&type=${encodeURIComponent(recordType)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: ApiResult[]) => setState({ status: "ok", key, results: data }))
      .catch((e) => { if (e.name !== "AbortError") setState({ status: "error", key, message: e.message }) })
    return () => controller.abort()
  }, [domain, recordType])

  const currentKey = domain ? `${domain}|${recordType}` : null
  const fetchedKey = state.status !== "idle" ? state.key : null
  const isLoading = !!currentKey && fetchedKey !== currentKey

  const results = state.status === "ok" && !isLoading ? state.results : []
  const majority = findMajority(results)

  const liveServers: DnsServer[] = results.map((r, i) => {
    const meta = LOCATION_META[r.location] ?? { flag: "🌐", city: r.location, country: "", x: 50, y: 50 }
    return {
      id: i + 1,
      flag: meta.flag,
      city: meta.city,
      country: meta.country,
      ip: r.server_ip,
      result: r.error ? r.error : r.records.join(", ") || "—",
      records: r.error ? [r.error] : r.records.length > 0 ? r.records : ["—"],
      status: toServerStatus(r, majority),
      x: meta.x,
      y: meta.y,
    }
  })

  const servers = isLoading || results.length === 0 ? PLACEHOLDER_SERVERS : liveServers

  return (
    <div className="flex gap-6 items-start">
      <div className="w-[42%] shrink-0">
        {state.status === "error" && <p className="mb-3 text-xs text-destructive">Error: {state.message}</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 pl-1 text-left font-semibold text-foreground">Location</th>
              <th className="pb-3 text-left font-semibold text-foreground">Result</th>
              <th className="pb-3 pr-1 text-right font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{s.flag}</span>
                    <span className="text-xs text-muted-foreground">{s.city}{s.country ? `, ${s.country}` : ""}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex flex-col gap-0.5">
                    {(s.records.length > 0 ? s.records : ["—"]).map((rec, i) => (
                      <span key={`${i}-${rec}`} className="font-mono text-xs text-foreground/80 break-all">{rec}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 pr-1 text-right">
                  <div className="flex justify-end">
                    <StatusIcon status={s.status} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-1">
        <WorldMap servers={servers} />
      </div>
    </div>
  )
}
