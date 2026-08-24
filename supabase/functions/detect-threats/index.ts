import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type EventType = "login" | "file_access" | "email" | "network";

interface ActivityLog {
  id: string;
  source_ip: string;
  username: string;
  event_type: EventType;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

interface Threat {
  threat_type: "unusual_login" | "ransomware" | "phishing" | "brute_force";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  source_ip: string;
  username: string;
  description: string;
  indicators: string[];
  activity_log_id: string;
}

// Suspicious file extensions commonly associated with ransomware
const RANSOMWARE_EXTENSIONS = [
  ".encrypted", ".locked", ".crypto", ".crypted", ".locky",
  ".cerber", ".crypt", ".wcry", ".wannacry", ".ryk", ".enc",
];

// Known phishing keywords in email subjects/links
const PHISHING_KEYWORDS = [
  "verify your account", "suspend", "urgent action", "confirm your identity",
  "click here to verify", "password expired", "account locked",
  "update your payment", "invoice attached", "security alert",
  "reset your password", "unusual activity",
];

// High-risk countries for geo-anomaly login detection (simplified demo list)
const HIGH_RISK_COUNTRIES = [
  "RU", "CN", "KP", "IR", "SY", "VE", "BY",
];

// Tor / known malicious exit nodes (demo subset)
const SUSPICIOUS_IP_PREFIXES = [
  "45.129.", "185.220.", "23.129.", "199.249.", "171.25.",
];

function isSuspiciousIp(ip: string): boolean {
  return SUSPICIOUS_IP_PREFIXES.some((p) => ip.startsWith(p));
}

function severityFromConfidence(c: number): "low" | "medium" | "high" | "critical" {
  if (c >= 85) return "critical";
  if (c >= 65) return "high";
  if (c >= 40) return "medium";
  return "low";
}

// --- Detection rules ---

function detectBruteForce(logs: ActivityLog[]): Threat[] {
  const threats: Threat[] = [];
  const byIp = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    if (log.event_type !== "login") continue;
    const failed = log.raw_payload?.status === "failed" || log.raw_payload?.success === false;
    if (!failed) continue;
    const arr = byIp.get(log.source_ip) ?? [];
    arr.push(log);
    byIp.set(log.source_ip, arr);
  }
  for (const [ip, attempts] of byIp) {
    const recent = attempts.filter((a) => {
      const ageMin = (Date.now() - new Date(a.created_at).getTime()) / 60000;
      return ageMin <= 15;
    });
    if (recent.length >= 5) {
      const confidence = Math.min(95, 55 + recent.length * 4);
      threats.push({
        threat_type: "brute_force",
        severity: severityFromConfidence(confidence),
        confidence,
        source_ip: ip,
        username: recent[0].username,
        description: `${recent.length} failed login attempts from ${ip} within 15 minutes targeting account "${recent[0].username}".`,
        indicators: [
          `${recent.length} failed logins in 15 min`,
          `Repeated attempts on single account`,
        ],
        activity_log_id: recent[recent.length - 1].id,
      });
    }
  }
  return threats;
}

function detectUnusualLogin(logs: ActivityLog[]): Threat[] {
  const threats: Threat[] = [];
  for (const log of logs) {
    if (log.event_type !== "login") continue;
    const success = log.raw_payload?.status === "success" || log.raw_payload?.success === true;
    if (!success) continue;
    const country = String(log.raw_payload?.country ?? "US");
    const hour = new Date(log.created_at).getUTCHours();
    const offHours = hour < 6 || hour > 22;
    const indicators: string[] = [];
    let confidence = 0;
    if (HIGH_RISK_COUNTRIES.includes(country)) {
      indicators.push(`Login from high-risk country ${country}`);
      confidence += 35;
    }
    if (offHours) {
      indicators.push(`Login at unusual hour (${hour}:00 UTC)`);
      confidence += 20;
    }
    if (isSuspiciousIp(log.source_ip)) {
      indicators.push(`Source IP matches known proxy/Tor exit node`);
      confidence += 30;
    }
    const newDevice = log.raw_payload?.new_device === true;
    if (newDevice) {
      indicators.push(`First login from unrecognized device`);
      confidence += 15;
    }
    if (confidence >= 40) {
      threats.push({
        threat_type: "unusual_login",
        severity: severityFromConfidence(confidence),
        confidence: Math.min(95, confidence),
        source_ip: log.source_ip,
        username: log.username,
        description: `Successful login for "${log.username}" from ${country} at ${hour}:00 UTC flagged as anomalous.`,
        indicators,
        activity_log_id: log.id,
      });
    }
  }
  return threats;
}

function detectRansomware(logs: ActivityLog[]): Threat[] {
  const threats: Threat[] = [];
  const byIp = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    if (log.event_type !== "file_access") continue;
    const arr = byIp.get(log.source_ip) ?? [];
    arr.push(log);
    byIp.set(log.source_ip, arr);
  }
  for (const [ip, events] of byIp) {
    const encrypted = events.filter((e) => {
      const path = String(e.raw_payload?.file_path ?? "");
      return RANSOMWARE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
    });
    const recent = events.filter((e) => {
      const ageMin = (Date.now() - new Date(e.created_at).getTime()) / 60000;
      return ageMin <= 10;
    });
    const indicators: string[] = [];
    let confidence = 0;
    if (encrypted.length > 0) {
      indicators.push(`${encrypted.length} files written with ransomware-style extensions`);
      confidence += 50;
    }
    if (recent.length >= 20) {
      indicators.push(`${recent.length} file modifications in 10 minutes (mass encryption pattern)`);
      confidence += 30;
    }
    const massRename = recent.length >= 10 && encrypted.length / recent.length > 0.3;
    if (massRename) {
      indicators.push(`High ratio of encrypted-to-normal file writes`);
      confidence += 15;
    }
    if (confidence >= 40) {
      threats.push({
        threat_type: "ransomware",
        severity: severityFromConfidence(confidence),
        confidence: Math.min(98, confidence),
        source_ip: ip,
        username: events[0].username,
        description: `Possible ransomware activity from ${ip}: ${encrypted.length} encrypted files and ${recent.length} rapid file writes detected.`,
        indicators,
        activity_log_id: events[events.length - 1].id,
      });
    }
  }
  return threats;
}

function detectPhishing(logs: ActivityLog[]): Threat[] {
  const threats: Threat[] = [];
  for (const log of logs) {
    if (log.event_type !== "email") continue;
    const subject = String(log.raw_payload?.subject ?? "").toLowerCase();
    const body = String(log.raw_payload?.body ?? "").toLowerCase();
    const links = Array.isArray(log.raw_payload?.links)
      ? (log.raw_payload.links as string[]).map((l) => String(l).toLowerCase())
      : [];
    const indicators: string[] = [];
    let confidence = 0;
    for (const kw of PHISHING_KEYWORDS) {
      if (subject.includes(kw) || body.includes(kw)) {
        indicators.push(`Phishing keyword detected: "${kw}"`);
        confidence += 25;
        break;
      }
    }
    const spoofedSender = String(log.raw_payload?.sender ?? "").includes("reply-") ||
      /@(gmail|yahoo|outlook)\.com$/.test(String(log.raw_payload?.sender ?? "")) &&
      String(log.raw_payload?.claimed_domain ?? "") !== "";
    if (spoofedSender) {
      indicators.push(`Sender domain does not match claimed organization`);
      confidence += 20;
    }
    const suspiciousLink = links.some((l) =>
      l.includes("bit.ly") || l.includes("tinyurl") || l.includes("goo.gl") ||
      /\d+\.\d+\.\d+\.\d+/.test(l)
    );
    if (suspiciousLink) {
      indicators.push(`Email contains shortened or IP-based link`);
      confidence += 25;
    }
    const attachment = String(log.raw_payload?.attachment ?? "");
    if (attachment && /\.(exe|scr|js|vbs|zip)$/.test(attachment.toLowerCase())) {
      indicators.push(`Malicious attachment type: ${attachment}`);
      confidence += 30;
    }
    if (confidence >= 40) {
      threats.push({
        threat_type: "phishing",
        severity: severityFromConfidence(confidence),
        confidence: Math.min(95, confidence),
        source_ip: log.source_ip,
        username: log.username,
        description: `Phishing email targeting "${log.username}": ${indicators[0]}.`,
        indicators,
        activity_log_id: log.id,
      });
    }
  }
  return threats;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Pull recent activity logs (last 30 minutes) for analysis
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: logs, error: logErr } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    if (logErr) throw logErr;
    const activityLogs: ActivityLog[] = (logs ?? []) as ActivityLog[];

    // Run all detection rules
    const detected: Threat[] = [
      ...detectBruteForce(activityLogs),
      ...detectUnusualLogin(activityLogs),
      ...detectRansomware(activityLogs),
      ...detectPhishing(activityLogs),
    ];

    // De-duplicate against existing open events for the same IP + threat type
    let inserted = 0;
    for (const t of detected) {
      const { data: existing } = await supabase
        .from("security_events")
        .select("id")
        .eq("source_ip", t.source_ip)
        .eq("threat_type", t.threat_type)
        .eq("status", "open")
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("security_events").insert({
        threat_type: t.threat_type,
        severity: t.severity,
        confidence: t.confidence,
        source_ip: t.source_ip,
        username: t.username,
        description: t.description,
        indicators: t.indicators,
        status: "open",
        activity_log_id: t.activity_log_id,
      });
      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({
        analyzed: activityLogs.length,
        detected: detected.length,
        inserted,
        threats: detected,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
