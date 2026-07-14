import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const proofMediaMigrationVersion = "2026-07-15.proof-media-v1";

const acceptedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const acceptedStatuses = new Set(["intent-created", "registered", "verified", "rejected"]);
const verificationStatuses = new Set(["verified", "rejected"]);

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function proofMediaError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validationError(message) {
  return proofMediaError(400, message, "PROOF_MEDIA_VALIDATION_ERROR");
}

function notFoundError(mediaId) {
  return proofMediaError(404, `Proof media object not found: ${mediaId}`, "PROOF_MEDIA_NOT_FOUND");
}

function requireString(value, field) {
  const text = String(value || "").trim();
  if (!text) throw validationError(`${field} is required`);
  return text;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw validationError(`${field} must be a positive integer`);
  }
  return number;
}

function requireSha256(value) {
  const sha256 = requireString(value, "sha256").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw validationError("sha256 must be a 64-character lowercase or uppercase hex digest");
  }
  return sha256;
}

function sanitizePathPart(value) {
  return String(value || "file")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initializeProofMediaDatabase(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initializeProofMediaDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proof_media_objects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      workorder_id TEXT NOT NULL,
      proof_record_id TEXT,
      capture_batch_id TEXT,
      capture_item_id TEXT,
      category TEXT NOT NULL,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL CHECK (byte_size > 0),
      sha256 TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE,
      storage_provider TEXT NOT NULL,
      upload_status TEXT NOT NULL CHECK (upload_status IN ('intent-created', 'registered', 'verified', 'rejected')),
      created_at TEXT NOT NULL,
      uploaded_at TEXT,
      verified_at TEXT,
      verified_by TEXT,
      verification_note TEXT,
      source TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_proof_media_client
      ON proof_media_objects(client_id);

    CREATE INDEX IF NOT EXISTS idx_proof_media_wall
      ON proof_media_objects(wall_id);

    CREATE INDEX IF NOT EXISTS idx_proof_media_workorder
      ON proof_media_objects(workorder_id);

    CREATE INDEX IF NOT EXISTS idx_proof_media_status
      ON proof_media_objects(upload_status);

    CREATE INDEX IF NOT EXISTS idx_proof_media_sha256
      ON proof_media_objects(sha256);

    CREATE TABLE IF NOT EXISTS proof_media_links (
      id TEXT PRIMARY KEY,
      media_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (media_id) REFERENCES proof_media_objects(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_proof_media_links_media
      ON proof_media_links(media_id);

    CREATE INDEX IF NOT EXISTS idx_proof_media_links_entity
      ON proof_media_links(entity_type, entity_id);
  `);

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `).run(proofMediaMigrationVersion, new Date().toISOString());
}

function buildObjectKey(media) {
  return [
    "dr-forest-proof",
    sanitizePathPart(media.clientId),
    sanitizePathPart(media.wallId),
    sanitizePathPart(media.workorderId),
    `${sanitizePathPart(media.id)}-${sanitizePathPart(media.filename)}`
  ].join("/");
}

function normalizeIntent(input) {
  const media = {
    id: requireString(input?.id, "media.id"),
    clientId: requireString(input?.clientId, "media.clientId"),
    wallId: requireString(input?.wallId, "media.wallId"),
    workorderId: requireString(input?.workorderId, "media.workorderId"),
    proofRecordId: input?.proofRecordId ? String(input.proofRecordId).trim() : null,
    captureBatchId: input?.captureBatchId ? String(input.captureBatchId).trim() : null,
    captureItemId: input?.captureItemId ? String(input.captureItemId).trim() : null,
    category: input?.category ? String(input.category).trim() : "site-proof",
    filename: requireString(input?.filename, "media.filename"),
    contentType: requireString(input?.contentType, "media.contentType").toLowerCase(),
    byteSize: positiveInteger(input?.byteSize, "media.byteSize"),
    sha256: requireSha256(input?.sha256),
    storageProvider: input?.storageProvider ? String(input.storageProvider).trim() : "dr-forest-local-vault",
    uploadStatus: "intent-created",
    createdAt: new Date().toISOString(),
    uploadedAt: null,
    verifiedAt: null,
    verifiedBy: null,
    verificationNote: "",
    source: input?.source ? String(input.source).trim() : "technician-mobile",
    metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}
  };

  if (!acceptedContentTypes.has(media.contentType)) {
    throw validationError(`media.contentType must be one of ${Array.from(acceptedContentTypes).join(", ")}`);
  }

  media.objectKey = input?.objectKey ? String(input.objectKey).trim() : buildObjectKey(media);
  return media;
}

function objectFromRow(row, links = []) {
  return {
    id: row.id,
    clientId: row.client_id,
    wallId: row.wall_id,
    workorderId: row.workorder_id,
    proofRecordId: row.proof_record_id || null,
    captureBatchId: row.capture_batch_id || null,
    captureItemId: row.capture_item_id || null,
    category: row.category,
    filename: row.filename,
    contentType: row.content_type,
    byteSize: row.byte_size,
    sha256: row.sha256,
    objectKey: row.object_key,
    storageProvider: row.storage_provider,
    uploadStatus: row.upload_status,
    createdAt: row.created_at,
    uploadedAt: row.uploaded_at || null,
    verifiedAt: row.verified_at || null,
    verifiedBy: row.verified_by || null,
    verificationNote: row.verification_note || "",
    source: row.source,
    metadata: parseJson(row.metadata_json, {}),
    integrity: {
      sha256: row.sha256,
      byteSize: row.byte_size,
      hashAlgorithm: "sha256"
    },
    links
  };
}

function linkFromRow(row) {
  return {
    id: row.id,
    mediaId: row.media_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    clientId: row.client_id,
    relation: row.relation,
    createdAt: row.created_at
  };
}

function linksForMedia(media) {
  const links = [
    { entityType: "wall", entityId: media.wallId, relation: "captures" },
    { entityType: "workorder", entityId: media.workorderId, relation: "evidence-for" }
  ];

  if (media.proofRecordId) links.push({ entityType: "proof", entityId: media.proofRecordId, relation: "supports" });
  if (media.captureBatchId) links.push({ entityType: "mobile-capture-batch", entityId: media.captureBatchId, relation: "derived-from" });
  if (media.captureItemId) links.push({ entityType: "mobile-capture-item", entityId: media.captureItemId, relation: "derived-from" });

  return links.map((link) => ({
    ...link,
    id: `${media.id}:${link.entityType}:${link.entityId}`,
    mediaId: media.id,
    clientId: media.clientId,
    createdAt: media.createdAt
  }));
}

function readObjectById(db, mediaId) {
  const row = db.prepare(`
    SELECT *
    FROM proof_media_objects
    WHERE id = ?
  `).get(mediaId);

  if (!row) return null;

  const links = db.prepare(`
    SELECT *
    FROM proof_media_links
    WHERE media_id = ?
    ORDER BY entity_type ASC, entity_id ASC
  `).all(mediaId).map(linkFromRow);

  return objectFromRow(row, links);
}

function uploadInstructions(media) {
  return {
    provider: media.storageProvider,
    method: "PUT",
    putUrl: `drf-local-upload://${media.objectKey}`,
    objectKey: media.objectKey,
    headers: {
      "content-type": media.contentType,
      "x-drf-sha256": media.sha256
    },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    note: "Local metadata intent only. Production must replace this with signed object-storage upload URLs."
  };
}

export async function createSqliteProofMediaIntent(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const media = normalizeIntent(input);
    const existing = readObjectById(db, media.id);
    if (existing) {
      return {
        duplicate: true,
        object: existing,
        upload: uploadInstructions(existing)
      };
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        INSERT INTO proof_media_objects (
          id,
          client_id,
          wall_id,
          workorder_id,
          proof_record_id,
          capture_batch_id,
          capture_item_id,
          category,
          filename,
          content_type,
          byte_size,
          sha256,
          object_key,
          storage_provider,
          upload_status,
          created_at,
          uploaded_at,
          verified_at,
          verified_by,
          verification_note,
          source,
          metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        media.id,
        media.clientId,
        media.wallId,
        media.workorderId,
        media.proofRecordId,
        media.captureBatchId,
        media.captureItemId,
        media.category,
        media.filename,
        media.contentType,
        media.byteSize,
        media.sha256,
        media.objectKey,
        media.storageProvider,
        media.uploadStatus,
        media.createdAt,
        media.uploadedAt,
        media.verifiedAt,
        media.verifiedBy,
        media.verificationNote,
        media.source,
        JSON.stringify(media.metadata)
      );

      const insertLink = db.prepare(`
        INSERT INTO proof_media_links (
          id,
          media_id,
          entity_type,
          entity_id,
          client_id,
          relation,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const link of linksForMedia(media)) {
        insertLink.run(link.id, link.mediaId, link.entityType, link.entityId, link.clientId, link.relation, link.createdAt);
      }

      db.exec("COMMIT");
      const object = readObjectById(db, media.id);
      return {
        duplicate: false,
        object,
        upload: uploadInstructions(object)
      };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function registerSqliteProofMediaEvidence(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const mediaId = requireString(input?.id, "media.id");
    const existing = readObjectById(db, mediaId);
    if (!existing) throw notFoundError(mediaId);

    const sha256 = requireSha256(input?.sha256);
    const byteSize = positiveInteger(input?.byteSize, "media.byteSize");

    if (sha256 !== existing.sha256) {
      throw proofMediaError(400, "uploaded sha256 does not match the upload intent", "PROOF_MEDIA_HASH_MISMATCH");
    }

    if (byteSize !== existing.byteSize) {
      throw proofMediaError(400, "uploaded byteSize does not match the upload intent", "PROOF_MEDIA_SIZE_MISMATCH");
    }

    if (["registered", "verified", "rejected"].includes(existing.uploadStatus)) {
      return {
        duplicate: true,
        object: existing
      };
    }

    db.prepare(`
      UPDATE proof_media_objects
      SET upload_status = ?,
          uploaded_at = ?
      WHERE id = ?
    `).run("registered", input?.uploadedAt || new Date().toISOString(), mediaId);

    return {
      duplicate: false,
      object: readObjectById(db, mediaId)
    };
  });
}

export async function verifySqliteProofMediaEvidence(dbPath, mediaId, input) {
  return withDatabase(dbPath, (db) => {
    const existing = readObjectById(db, mediaId);
    if (!existing) throw notFoundError(mediaId);

    const status = requireString(input?.status, "verification.status");
    if (!verificationStatuses.has(status)) {
      throw validationError(`verification.status must be one of ${Array.from(verificationStatuses).join(", ")}`);
    }

    if (!acceptedStatuses.has(existing.uploadStatus)) {
      throw validationError(`Unsupported proof media status: ${existing.uploadStatus}`);
    }

    if (existing.uploadStatus === "intent-created") {
      throw proofMediaError(409, "proof media must be registered before verification", "PROOF_MEDIA_NOT_REGISTERED");
    }

    db.prepare(`
      UPDATE proof_media_objects
      SET upload_status = ?,
          verified_at = ?,
          verified_by = ?,
          verification_note = ?
      WHERE id = ?
    `).run(
      status,
      input?.verifiedAt || new Date().toISOString(),
      requireString(input?.verifiedBy, "verification.verifiedBy"),
      input?.note ? String(input.note).trim() : "",
      mediaId
    );

    return readObjectById(db, mediaId);
  });
}

export async function readSqliteProofMediaObject(dbPath, mediaId) {
  return withDatabase(dbPath, (db) => readObjectById(db, mediaId));
}

export async function listSqliteProofMediaObjects(dbPath) {
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare(`
      SELECT *
      FROM proof_media_objects
      ORDER BY created_at DESC, id ASC
    `).all();

    const linkRows = db.prepare(`
      SELECT *
      FROM proof_media_links
      ORDER BY media_id ASC, entity_type ASC, entity_id ASC
    `).all().map(linkFromRow);
    const linksByMedia = new Map();

    for (const link of linkRows) {
      linksByMedia.set(link.mediaId, [...(linksByMedia.get(link.mediaId) || []), link]);
    }

    return rows.map((row) => objectFromRow(row, linksByMedia.get(row.id) || []));
  });
}

export async function readSqliteProofMediaStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const tableRows = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('proof_media_objects', 'proof_media_links')
      ORDER BY name ASC
    `).all();
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    const statusCount = (status) => db.prepare(`
      SELECT COUNT(*) AS count
      FROM proof_media_objects
      WHERE upload_status = ?
    `).get(status).count;
    const withSha = db.prepare(`
      SELECT COUNT(*) AS count
      FROM proof_media_objects
      WHERE sha256 IS NOT NULL
        AND length(sha256) = 64
    `).get().count;
    const latestObject = db.prepare(`
      SELECT id, upload_status, created_at
      FROM proof_media_objects
      ORDER BY created_at DESC, id ASC
      LIMIT 1
    `).get();
    const foreignKeyIssues = db.prepare("PRAGMA foreign_key_check").all();

    return {
      backend: "sqlite",
      migrationVersion: proofMediaMigrationVersion,
      source: "proof-media-metadata-ledger",
      storageProvider: "dr-forest-local-vault",
      tables: tableRows.map((row) => row.name),
      counts: {
        mediaObjects: count("proof_media_objects"),
        mediaLinks: count("proof_media_links"),
        intentCreated: statusCount("intent-created"),
        registered: statusCount("registered"),
        verified: statusCount("verified"),
        rejected: statusCount("rejected")
      },
      hashCoverage: {
        mediaObjectsWithSha256: withSha
      },
      latestObject: latestObject
        ? {
            id: latestObject.id,
            uploadStatus: latestObject.upload_status,
            createdAt: latestObject.created_at
          }
        : null,
      relationshipIntegrity: {
        foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1,
        foreignKeyIssues: foreignKeyIssues.length
      }
    };
  });
}
