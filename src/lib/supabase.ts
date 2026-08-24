import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type ThreatType = "unusual_login" | "ransomware" | "phishing" | "brute_force";
export type Severity = "low" | "medium" | "high" | "critical";
export type EventStatus = "open" | "acknowledged" | "resolved";
export type EventType = "login" | "file_access" | "email" | "network";

export interface SecurityEvent {
  id: string;
  threat_type: ThreatType;
  severity: Severity;
  confidence: number;
  source_ip: string;
  username: string;
  description: string;
  indicators: string[];
  status: EventStatus;
  activity_log_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  source_ip: string;
  username: string;
  event_type: EventType;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

const EDGE_BASE = `${supabaseUrl}/functions/v1`;
const HEADERS = {
  Authorization: `Bearer ${supabaseAnonKey}`,
  "Content-Type": "application/json",
};

export async function runDetection(): Promise<{ analyzed: number; detected: number; inserted: number } | null> {
  const res = await fetch(`${EDGE_BASE}/detect-threats`, {
    method: "POST",
    headers: HEADERS,
    body: "{}",
  });
  if (!res.ok) throw new Error(`Detection failed (${res.status})`);
  return res.json();
}

export async function generateLogs(count = 25): Promise<{ generated: number } | null> {
  const res = await fetch(`${EDGE_BASE}/generate-logs`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error(`Log generation failed (${res.status})`);
  return res.json();
}
