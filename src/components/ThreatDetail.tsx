import type { SecurityEvent } from "@/lib/supabase";
import { THREAT_META, SEVERITY_META, timeAgo } from "@/lib/threats";
import type { LucideIcon } from "lucide-react";
import {
  X, MapPin, User, Server, Gauge, Clock, ShieldCheck,
  CheckCircle2, AlertTriangle, Radio,
} from "lucide-react";

interface ThreatDetailProps {
  event: SecurityEvent | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-dim)]" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">{label}</p>
        <p className="truncate font-mono text-sm text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

export default function ThreatDetail({ event, onClose, onAcknowledge, onResolve }: ThreatDetailProps) {
  if (!event) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--color-text)]">No threat selected</p>
        <p className="mt-1 max-w-xs text-xs text-[var(--color-text-dim)]">
          Select a threat from the feed to view full detection details, indicators, and response actions.
        </p>
      </div>
    );
  }

  const meta = THREAT_META[event.threat_type];
  const sev = SEVERITY_META[event.severity];
  const Icon: LucideIcon = meta.icon;

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.bg} ${meta.border} border`}>
            <Icon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">{meta.label}</h3>
            <p className="text-xs text-[var(--color-text-dim)]">Detected {timeAgo(event.created_at)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${sev.bg} ${sev.color}`}>
            {sev.label}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-[var(--color-bg)] px-2 py-1 font-mono text-xs text-[var(--color-text-muted)]">
            <Gauge className="h-3 w-3" />
            {event.confidence.toFixed(0)}% confidence
          </span>
          <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${
            event.status === "open" ? "bg-red-500/15 text-red-400" :
            event.status === "acknowledged" ? "bg-yellow-500/15 text-yellow-400" :
            "bg-emerald-500/15 text-emerald-400"
          }`}>
            {event.status}
          </span>
        </div>

        <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {event.description}
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <Field icon={Server} label="Source IP" value={event.source_ip} />
          <Field icon={User} label="Target Account" value={event.username} />
          <Field icon={Clock} label="Timestamp" value={new Date(event.created_at).toLocaleString()} />
          <Field icon={MapPin} label="Threat ID" value={event.id.slice(0, 8)} />
        </div>

        <div className="mb-5">
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Radio className="h-3.5 w-3.5" />
            Detection Indicators
          </h4>
          <ul className="space-y-1.5">
            {event.indicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${meta.color.replace("text", "bg")}`} />
                {ind}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          {event.status !== "acknowledged" && event.status !== "resolved" && (
            <button
              onClick={() => onAcknowledge(event.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 py-2.5 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
            >
              <AlertTriangle className="h-4 w-4" />
              Acknowledge
            </button>
          )}
          {event.status !== "resolved" && (
            <button
              onClick={() => onResolve(event.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
