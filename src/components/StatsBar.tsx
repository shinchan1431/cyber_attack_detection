import { ShieldAlert, Activity, Brain, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  sublabel?: string;
  pulse?: boolean;
}

function StatCard({ label, value, icon: Icon, accent, sublabel, pulse }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-[var(--color-text)]">{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-[var(--color-text-dim)]">{sublabel}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {pulse && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      )}
    </div>
  );
}

interface StatsBarProps {
  totalThreats: number;
  openThreats: number;
  criticalCount: number;
  logsAnalyzed: number;
  detectionRate: number;
}

export default function StatsBar({
  totalThreats,
  openThreats,
  criticalCount,
  logsAnalyzed,
  detectionRate,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Active Threats"
        value={openThreats}
        icon={ShieldAlert}
        accent="bg-red-500/15 text-red-400"
        sublabel={`${totalThreats} total detected`}
        pulse={openThreats > 0}
      />
      <StatCard
        label="Critical Alerts"
        value={criticalCount}
        icon={Zap}
        accent="bg-orange-500/15 text-orange-400"
        sublabel={criticalCount > 0 ? "Immediate action required" : "All clear"}
      />
      <StatCard
        label="Logs Analyzed"
        value={logsAnalyzed.toLocaleString()}
        icon={Activity}
        accent="bg-blue-500/15 text-blue-400"
        sublabel="Activity events ingested"
      />
      <StatCard
        label="Detection Rate"
        value={`${detectionRate.toFixed(1)}%`}
        icon={Brain}
        accent="bg-cyan-500/15 text-cyan-400"
        sublabel="AI confidence average"
      />
    </div>
  );
}
