import { useEffect, useState } from "react";
import type { SecurityEvent } from "@/lib/supabase";
import { THREAT_META, SEVERITY_META, timeAgo } from "@/lib/threats";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";

interface ThreatFeedProps {
  events: SecurityEvent[];
  onSelect: (event: SecurityEvent) => void;
  selectedId: string | null;
}

export default function ThreatFeed({ events, onSelect, selectedId }: ThreatFeedProps) {
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [events.length]);

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const visible = sorted.slice(0, visibleCount);

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Live Threat Feed
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-dim)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-blink" />
          {events.length} events
        </span>
      </div>
      <div className="max-h-[560px] flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[var(--color-text-dim)]">
            No threats detected. The system is monitoring.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {visible.map((event) => {
              const meta = THREAT_META[event.threat_type];
              const sev = SEVERITY_META[event.severity];
              const Icon: LucideIcon = meta.icon;
              const isSelected = event.id === selectedId;
              return (
                <li key={event.id}>
                  <button
                    onClick={() => onSelect(event)}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-2)] ${
                      isSelected ? "bg-[var(--color-surface-2)]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.border} border`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-[var(--color-text)]">
                          {meta.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-[var(--color-text-dim)]">
                          {timeAgo(event.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                        {event.source_ip} → {event.username}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
                          {event.confidence.toFixed(0)}% confidence
                        </span>
                        {event.status === "resolved" && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                        {event.status === "acknowledged" && (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[var(--color-text-dim)]" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {sorted.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((c) => c + 15)}
          className="border-t border-[var(--color-border)] py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          Load {Math.min(15, sorted.length - visibleCount)} more
        </button>
      )}
    </div>
  );
}
