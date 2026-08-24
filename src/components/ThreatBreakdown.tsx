import { THREAT_META } from "@/lib/threats";
import type { ThreatType } from "@/lib/supabase";
import type { LucideIcon } from "lucide-react";

interface ThreatBreakdownProps {
  counts: Record<ThreatType, number>;
}

const ORDER: ThreatType[] = ["brute_force", "unusual_login", "ransomware", "phishing"];

export default function ThreatBreakdown({ counts }: ThreatBreakdownProps) {
  const total = ORDER.reduce((sum, t) => sum + (counts[t] ?? 0), 0);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Threat Type Breakdown
      </h3>
      <div className="space-y-4">
        {ORDER.map((type) => {
          const meta = THREAT_META[type];
          const count = counts[type] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const Icon: LucideIcon = meta.icon;
          return (
            <div key={type}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <span className="text-[var(--color-text)]">{meta.label}</span>
                </span>
                <span className="font-mono text-[var(--color-text-muted)]">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${meta.bg.replace("/10", "/60")}`}
                  style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="mt-4 text-center text-sm text-[var(--color-text-dim)]">
          No threats detected yet. Run a scan to analyze recent activity.
        </p>
      )}
    </div>
  );
}
