BEGIN;

CREATE TABLE IF NOT EXISTS proof_media_scan_results (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL REFERENCES proof_media_objects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  scan_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'clean', 'quarantined', 'error')),
  sha256 TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL,
  recorded_by TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (media_id, scan_id)
);

CREATE INDEX IF NOT EXISTS idx_proof_media_scan_media_time
  ON proof_media_scan_results(media_id, scanned_at DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_proof_media_scan_status
  ON proof_media_scan_results(status, scanned_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('2026-09-04.postgres-proof-media-scan-v1', NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
