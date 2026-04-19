import { useState } from "react"
import worldMap from "@/assets/world-map.png"

export type ServerStatus = "ok" | "warning" | "pending" | "error"

export interface DnsServer {
  id: number
  flag: string
  city: string
  country: string
  ip: string
  result: string
  records: string[]
  status: ServerStatus
  x: number // percentage 0–100 of map width
  y: number // percentage 0–100 of map height
}

interface WorldMapProps {
  servers: DnsServer[]
}

const PIN_COLORS: Record<ServerStatus, string> = {
  ok: "var(--color-primary)",
  warning: "oklch(0.75 0.15 85)",
  error: "var(--color-destructive)",
  pending: "var(--color-muted-foreground)",
}

export function WorldMap({ servers }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<DnsServer | null>(null)

  return (
    <div className="relative w-full select-none" onMouseLeave={() => setTooltip(null)}>
      <img
        src={worldMap}
        alt="World map"
        className="w-full h-auto opacity-60 dark:opacity-40"
        draggable={false}
      />

      {/* Pins */}
      {servers.map((server) => (
        <div
          key={server.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ left: `${server.x}%`, top: `${server.y}%` }}
          onMouseEnter={() => setTooltip(server)}
        >
          {/* Pulse ring */}
          {(server.status === "ok" || server.status === "warning") && (
            <span
              className="absolute inset-0 m-auto size-4 rounded-full animate-ping opacity-40"
              style={{ background: PIN_COLORS[server.status] }}
            />
          )}
          {/* Dot */}
          <span
            className="relative block size-3 rounded-full border-2 border-background shadow-md"
            style={{ background: PIN_COLORS[server.status] }}
          />
        </div>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none -translate-x-1/2"
          style={{ left: `${tooltip.x}%`, top: `calc(${tooltip.y}% - 64px)` }}
        >
          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl whitespace-nowrap text-popover-foreground">
            <div className="font-semibold">{tooltip.flag} {tooltip.city}, {tooltip.country}</div>
            <div className="text-muted-foreground mt-0.5">{tooltip.ip}</div>
            <div
              className="mt-0.5 font-medium"
              style={{ color: PIN_COLORS[tooltip.status] }}
            >
              {tooltip.status === "ok" ? "✓" : tooltip.status === "error" ? "✗" : "~"} {tooltip.result}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
