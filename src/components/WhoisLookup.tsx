import { useEffect, useState } from "react"

interface ApiResponse {
  domain: string
  server: string
  raw: string
}

function extractField(raw: string, field: string): string {
  const m = raw.match(new RegExp(`^${field}:\\s*(.+)$`, "mi"))
  return m?.[1]?.trim() ?? ""
}

function extractAll(raw: string, field: string): string[] {
  const matches = [...raw.matchAll(new RegExp(`^${field}:\\s*(.+)$`, "gmi"))]
  return matches.map((m) => m[1].trim()).filter(Boolean)
}

const HIGHLIGHT_FIELDS = [
  "Domain Name",
  "Registrar",
  "Creation Date",
  "Updated Date",
  "Registry Expiry Date",
  "Name Server",
  "DNSSEC",
]

function highlightRaw(raw: string): React.ReactNode[] {
  return raw.split("\n").map((line, i) => {
    const isKey = HIGHLIGHT_FIELDS.some((f) => line.toLowerCase().startsWith(f.toLowerCase() + ":"))
    if (isKey) {
      const colon = line.indexOf(":")
      return (
        <span key={i} className="block">
          <span className="text-primary/80">{line.slice(0, colon + 1)}</span>
          <span className="text-foreground/90">{line.slice(colon + 1)}</span>
          {"\n"}
        </span>
      )
    }
    return <span key={i} className="block text-muted-foreground">{line}{"\n"}</span>
  })
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface WhoisLookupProps {
  domain: string
}

type WhoisState =
  | { status: "idle" }
  | { status: "error"; domain: string; message: string }
  | { status: "ok"; domain: string; data: ApiResponse }

export function WhoisLookup({ domain }: WhoisLookupProps) {
  const [state, setState] = useState<WhoisState>({ status: "idle" })

  useEffect(() => {
    if (!domain) return
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_URL}/whois?domain=${encodeURIComponent(domain)}`, { signal: controller.signal })
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

  if (isLoading) return <p className="text-sm text-muted-foreground">Looking up WHOIS data…</p>
  if (state.status === "error") return <p className="text-sm text-destructive">Error: {state.message}</p>
  if (state.status !== "ok") return <p className="text-sm text-muted-foreground">Enter a domain and click Search.</p>

  const { data } = state
  const raw = data.raw
  const registrar = extractField(raw, "Registrar")
  const createdOn = extractField(raw, "Creation Date")
  const expiresOn = extractField(raw, "Registry Expiry Date")
  const updatedOn = extractField(raw, "Updated Date")
  const nameServers = extractAll(raw, "Name Server")
  const dnssec = extractField(raw, "DNSSEC")

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-semibold text-foreground">WHOIS for</h2>
        <span className="font-mono font-bold text-primary">{data.domain}</span>
        <span className="text-xs text-muted-foreground">via {data.server}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="Domain" value={<span className="font-mono">{data.domain}</span>} />
        {registrar && <Field label="Registrar" value={registrar} />}
        {createdOn && <Field label="Created On" value={createdOn} />}
        {expiresOn && <Field label="Expires On" value={expiresOn} />}
        {updatedOn && <Field label="Updated On" value={updatedOn} />}
        {dnssec && <Field label="DNSSEC" value={dnssec} />}
        {nameServers.length > 0 && (
          <div className="col-span-2">
            <Field
              label="Name Servers"
              value={
                <div className="mt-0.5 flex flex-wrap gap-2">
                  {nameServers.map((ns) => (
                    <span key={ns} className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{ns}</span>
                  ))}
                </div>
              }
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raw WHOIS</span>
        <pre className="mt-2 overflow-x-auto text-xs leading-relaxed font-mono whitespace-pre-wrap break-all">
          {highlightRaw(raw)}
        </pre>
      </div>
    </div>
  )
}
