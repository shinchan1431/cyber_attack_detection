import { useCallback, useEffect, useMemo, useState } from "react";
import {
  supabase, runDetection, generateLogs,
  type SecurityEvent, type ThreatType,
} from "@/lib/supabase";
import { THREAT_META } from "@/lib/threats";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ThreatFeed from "@/components/ThreatFeed";
import ThreatDetail from "@/components/ThreatDetail";
import ThreatBreakdown from "@/components/ThreatBreakdown";
import RadarChart from "@/components/RadarChart";
import ActivityTimeline from "@/components/ActivityTimeline";

const THREAT_TYPES: ThreatType[] = ["unusual_login", "ransomware", "phishing", "brute_force"];

export default function App() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      setError(error.message);
      return;
    }
    setEvents((data ?? []) as SecurityEvent[]);
    if (selected) {
      const updated = (data ?? []).find((e) => e.id === selected.id);
      if (updated) setSelected(updated as SecurityEvent);
    }
  }, [selected]);

  const fetchLogCount = useCallback(async () => {
    const { count } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true });
    setLogCount(count ?? 0);
  }, []);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      await runDetection();
      setLastScan(new Date());
      await Promise.all([fetchEvents(), fetchLogCount()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [fetchEvents, fetchLogCount]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateLogs(30);
      await fetchLogCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [fetchLogCount]);

  const updateStatus = useCallback(async (id: string, status: "acknowledged" | "resolved") => {
    const { error } = await supabase
      .from("security_events")
      .update({ status })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await fetchEvents();
  }, [fetchEvents]);

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchLogCount();
  }, [fetchEvents, fetchLogCount]);

  // Auto-scan mode: run detection every 20s
  useEffect(() => {
    if (!autoMode) return;
    handleScan();
    const id = setInterval(() => handleScan(), 20000);
    return () => clearInterval(id);
  }, [autoMode, handleScan]);

  // Realtime subscription for new security events
  useEffect(() => {
    const channel = supabase
      .channel("security-events-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "security_events" },
        () => fetchEvents(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  const threatCounts = useMemo(() => {
    const counts = { unusual_login: 0, ransomware: 0, phishing: 0, brute_force: 0 } as Record<ThreatType, number>;
    for (const e of events) counts[e.threat_type]++;
    return counts;
  }, [events]);

  const openThreats = events.filter((e) => e.status === "open").length;
  const criticalCount = events.filter((e) => e.severity === "critical" && e.status === "open").length;
  const avgConfidence = events.length > 0
    ? events.reduce((s, e) => s + e.confidence, 0) / events.length
    : 0;

  // Build 24h activity timeline from event timestamps
  const timelineData = useMemo(() => {
    const buckets = new Array(24).fill(0);
    const now = Date.now();
    for (const e of events) {
      const ageHours = (now - new Date(e.created_at).getTime()) / 3600000;
      const idx = 23 - Math.floor(ageHours);
      if (idx >= 0 && idx < 24) buckets[idx]++;
    }
    return buckets.map((count, i) => ({ time: `${i}h`, count }));
  }, [events]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        scanning={scanning}
        generating={generating}
        autoMode={autoMode}
        lastScan={lastScan}
        onScan={handleScan}
        onGenerate={handleGenerate}
        onToggleAuto={() => setAutoMode((v) => !v)}
      />

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <StatsBar
          totalThreats={events.length}
          openThreats={openThreats}
          criticalCount={criticalCount}
          logsAnalyzed={logCount}
          detectionRate={avgConfidence}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ThreatFeed events={events} onSelect={setSelected} selectedId={selected?.id ?? null} />
          </div>
          <div className="lg:col-span-1">
            <ThreatDetail
              event={selected}
              onClose={() => setSelected(null)}
              onAcknowledge={(id) => updateStatus(id, "acknowledged")}
              onResolve={(id) => updateStatus(id, "resolved")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ActivityTimeline data={timelineData} />
          <ThreatBreakdown counts={threatCounts} />
          <RadarChart active={scanning || autoMode} />
        </div>

        <footer className="border-t border-[var(--color-border)] pt-6 pb-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)]">
            SentinelAI monitors login anomalies, ransomware file patterns, phishing emails, and brute force attempts in real time.
            Use "Simulate Traffic" to generate activity, then "Run Threat Scan" to detect threats.
          </p>
        </footer>
      </main>
    </div>
  );
}
