import type { ThreatType, Severity } from "@/lib/supabase";
import {
  UserX, Lock, MailWarning, Hammer, ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ThreatMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

export const THREAT_META: Record<ThreatType, ThreatMeta> = {
  unusual_login: {
    label: "Unusual Login",
    icon: UserX,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  ransomware: {
    label: "Ransomware",
    icon: Lock,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  phishing: {
    label: "Phishing",
    icon: MailWarning,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
  },
  brute_force: {
    label: "Brute Force",
    icon: Hammer,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
};

export const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-500/15" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/15" },
};

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export { ShieldAlert };
