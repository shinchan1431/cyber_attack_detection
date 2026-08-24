import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const USERNAMES = [
  "j.martinez", "s.chen", "admin", "r.patel", "k.johnson",
  "finance", "l.garcia", "m.olsen", "ops_deploy", "c.tanaka",
];

const NORMAL_IPS = [
  "10.0.12.45", "10.0.8.22", "192.168.1.50", "172.16.4.18", "10.0.3.91",
];

const ATTACKER_IPS = [
  "45.129.14.33", "185.220.101.7", "23.129.56.12", "91.218.12.44", "171.25.200.9",
];

const COUNTRIES = ["US", "GB", "DE", "FR", "CA", "JP", "AU", "NL"];
const HIGH_RISK = ["RU", "CN", "KP", "IR"];

const FILE_PATHS = [
  "/docs/report_q3.pdf", "/projects/alpha.xlsx", "/shared/budget.csv",
  "/home/user/notes.txt", "/var/log/app.log",
];

const RANSOMWARE_PATHS = [
  "/docs/report_q3.pdf.encrypted", "/projects/alpha.xlsx.locked",
  "/shared/budget.csv.crypt", "/home/user/notes.txt.wcry",
  "/var/log/app.log.locky", "/data/backup.zip.encrypted",
];

const PHISHING_SUBJECTS = [
  "Urgent: Verify your account immediately",
  "Your password has expired - action required",
  "Security alert: unusual activity detected",
  "Invoice attached - confirm your identity",
  "Account locked - click here to verify",
];

const PHISHING_LINKS = [
  "https://bit.ly/verify-account", "http://185.220.101.7/login",
  "https://tinyurl.com/update-payment", "https://goo.gl/security-check",
];

const PHISHING_SENDERS = [
  "reply-support@google.com", "no-reply@micros0ft-verify.com",
  "billing@arnazon-invoice.com", "security@paypa1-secure.com",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return Math.random() < 0.4 ? pick(ATTACKER_IPS) : pick(NORMAL_IPS);
}

function generateLog() {
  const roll = Math.random();
  const username = pick(USERNAMES);
  const ip = randomIp();

  if (roll < 0.45) {
    // login event
    const isAttacker = ATTACKER_IPS.includes(ip);
    const success = Math.random() < (isAttacker ? 0.3 : 0.9);
    const country = isAttacker ? pick(HIGH_RISK) : pick(COUNTRIES);
    const hour = Math.floor(Math.random() * 24);
    return {
      source_ip: ip,
      username,
      event_type: "login" as const,
      raw_payload: {
        status: success ? "success" : "failed",
        success,
        country,
        new_device: isAttacker && Math.random() < 0.6,
        user_agent: pick(["Chrome/120", "Firefox/121", "curl/8.4", "python-requests/2.31"]),
      },
      created_at: new Date().toISOString(),
    };
  } else if (roll < 0.7) {
    // file access
    const isRansomware = ATTACKER_IPS.includes(ip) && Math.random() < 0.5;
    const path = isRansomware ? pick(RANSOMWARE_PATHS) : pick(FILE_PATHS);
    return {
      source_ip: ip,
      username,
      event_type: "file_access" as const,
      raw_payload: {
        file_path: path,
        operation: "write",
        size_kb: Math.floor(Math.random() * 4096),
      },
      created_at: new Date().toISOString(),
    };
  } else if (roll < 0.9) {
    // email
    const isPhishing = Math.random() < 0.35;
    return {
      source_ip: ip,
      username,
      event_type: "email" as const,
      raw_payload: isPhishing
        ? {
            sender: pick(PHISHING_SENDERS),
            subject: pick(PHISHING_SUBJECTS),
            body: "Please confirm your identity to avoid suspension.",
            links: PHISHING_LINKS.slice(0, Math.floor(Math.random() * 3) + 1),
            attachment: Math.random() < 0.4 ? "invoice.exe" : "",
            claimed_domain: "company.com",
          }
        : {
            sender: `internal-user@company.com`,
            subject: "Weekly team sync notes",
            body: "Here are the notes from yesterday's sync.",
            links: [],
            attachment: "",
          },
      created_at: new Date().toISOString(),
    };
  } else {
    // network
    return {
      source_ip: ip,
      username,
      event_type: "network" as const,
      raw_payload: {
        destination: pick(["api.company.com", "cdn.cloudflare.com", "45.129.14.33:4444"]),
        port: pick([443, 80, 22, 4444, 3389]),
        bytes: Math.floor(Math.random() * 100000),
      },
      created_at: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { count = 25 } = await req.json().catch(() => ({ count: 25 }));
    const n = Math.min(Math.max(Number(count) || 25, 1), 200);

    const logs = Array.from({ length: n }, () => generateLog());
    const { error } = await supabase.from("activity_logs").insert(logs);
    if (error) throw error;

    return new Response(
      JSON.stringify({ generated: n }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
