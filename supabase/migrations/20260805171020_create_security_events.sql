/*
# Security Events & Activity Logs

1. Overview
This app is an AI-powered cyber attack detection dashboard. It ingests activity logs
(login attempts, file access, network requests, email events), runs them through a
detection engine, and surfaces detected threats (unusual login, ransomware, phishing,
brute force) before damage occurs. The app is single-tenant (no sign-in screen), so
policies allow the anon-key frontend to read and write its own shared data.

2. New Tables
- `activity_logs`
  - `id` (uuid, pk)
  - `source_ip` (text) - origin of the activity
  - `username` (text) - account involved
  - `event_type` (text) - login | file_access | email | network
  - `raw_payload` (jsonb) - full event details (geo, user agent, file path, etc.)
  - `created_at` (timestamptz, default now())
- `security_events`
  - `id` (uuid, pk)
  - `threat_type` (text) - unusual_login | ransomware | phishing | brute_force
  - `severity` (text) - low | medium | high | critical
  - `confidence` (numeric, 0-100) - AI confidence score
  - `source_ip` (text) - originating IP
  - `username` (text) - targeted account
  - `description` (text) - human-readable explanation
  - `indicators` (jsonb) - array of signals that triggered detection
  - `status` (text, default 'open') - open | acknowledged | resolved
  - `activity_log_id` (uuid, fk -> activity_logs) - the log that triggered this event
  - `created_at` (timestamptz, default now())

3. Indexes
- `security_events(created_at desc)` - dashboard feed ordering
- `security_events(threat_type)` - breakdown aggregation
- `security_events(status)` - open-threat filtering
- `activity_logs(created_at desc)` - ingestion ordering
- `activity_logs(source_ip)` - per-IP correlation

4. Security
- RLS enabled on both tables.
- Single-tenant app (no auth): policies allow `anon, authenticated` full CRUD because
  the data is intentionally shared/public across the dashboard.
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ip text NOT NULL,
  username text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('login','file_access','email','network')),
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type text NOT NULL CHECK (threat_type IN ('unusual_login','ransomware','phishing','brute_force')),
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  confidence numeric(5,2) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  source_ip text NOT NULL,
  username text NOT NULL,
  description text NOT NULL,
  indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  activity_log_id uuid REFERENCES activity_logs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_threat_type ON security_events (threat_type);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events (status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_source_ip ON activity_logs (source_ip);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_logs" ON activity_logs;
CREATE POLICY "anon_update_activity_logs" ON activity_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_security_events" ON security_events;
CREATE POLICY "anon_select_security_events" ON security_events FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_security_events" ON security_events;
CREATE POLICY "anon_insert_security_events" ON security_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_security_events" ON security_events;
CREATE POLICY "anon_update_security_events" ON security_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_security_events" ON security_events;
CREATE POLICY "anon_delete_security_events" ON security_events FOR DELETE
  TO anon, authenticated USING (true);
