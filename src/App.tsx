import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { DnsChecker } from "@/components/DnsChecker"
import { WhoisLookup } from "@/components/WhoisLookup"
import { SslChecker } from "@/components/SslChecker"
import { ThemeToggle } from "@/components/ThemeToggle"

type Tab = "dns" | "whois" | "ssl"

const TABS: { id: Tab; label: string }[] = [
  { id: "dns", label: "DNS RECORDS" },
  { id: "whois", label: "WHOIS LOOKUP" },
  { id: "ssl", label: "SSL CHECKER" },
]

const RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "PTR", "SRV", "CAA"]

export default function App() {
  const [tab, setTab] = useState<Tab>("dns")
  const [domain, setDomain] = useState("")
  const [submittedDomain, setSubmittedDomain] = useState("")
  const [recordType, setRecordType] = useState("A")
  const [visitorIp, setVisitorIp] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/ip`)
      .then((r) => r.json())
      .then((d) => setVisitorIp(d.ip))
      .catch((e) => console.error("Failed to fetch visitor IP:", e))
  }, [])

  function handleSearch() {
    setSubmittedDomain(domain.trim())
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="relative overflow-visible pb-20"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.35 0.10 165.6) 0%, oklch(0.508 0.118 165.6) 50%, oklch(0.40 0.12 165.6) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          <div className="absolute -right-16 -top-16 size-64 rounded-full border border-white/10" />
          <div className="absolute -right-8 -top-8 size-48 rounded-full border border-white/[0.08]" />
          <div className="absolute right-32 top-4 size-32 rounded-full border border-white/15" />
          <div className="absolute -left-20 top-8 size-56 rounded-full border border-white/[0.08]" />
          <svg className="absolute left-8 top-6 opacity-20" width="120" height="80">
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 10 }, (_, col) => (
                <circle key={`${row}-${col}`} cx={col * 12} cy={row * 12} r="1.5" fill="white" />
              ))
            )}
          </svg>
          <svg className="absolute right-48 top-0 opacity-15" width="200" height="200">
            <line x1="0" y1="0" x2="200" y2="200" stroke="oklch(0.75 0.10 165.6)" strokeWidth="1" />
          </svg>
        </div>

        {/* Title */}
        <div className="relative z-10 pt-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Simple Domain Name Tools
          </h1>
          <div className="absolute right-4 top-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto -mt-[calc(2.75rem+1px)] w-full max-w-2xl px-4">
        <div className="rounded-2xl border border-white/20 shadow-2xl">
          {/* Tab switcher — frosted glass over the green header */}
          <div className="flex h-11 rounded-t-2xl bg-white/10 backdrop-blur-md">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 text-xs font-bold tracking-widest transition-colors",
                  i === 0 && "rounded-tl-2xl",
                  i === TABS.length - 1 && "rounded-tr-2xl",
                  tab === t.id ? "text-white" : "text-white/60 hover:text-white/90",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="border-t border-white/20" />

          <div className="flex items-center gap-2 rounded-b-2xl bg-card px-4 py-3">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Your Domain .."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {tab === "dns" && (
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger size="sm" className="min-w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </div>
      </div>

      {visitorIp && (
        <div className="mt-6 text-center text-sm">
          Your IP: <span className="font-medium text-foreground">{visitorIp}</span>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-6 pt-10 pb-10">
        {tab === "dns" && <DnsChecker domain={submittedDomain} recordType={recordType} />}
        {tab === "whois" && <WhoisLookup domain={submittedDomain} />}
        {tab === "ssl" && <SslChecker domain={submittedDomain} />}
      </main>
    </div>
  )
}
