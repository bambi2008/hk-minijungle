import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, asc, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { put, get, head, del } from "@vercel/blob";
import { learningCases as cases, learningEvents as events, learningLimits as limits } from "./learning-schema.mjs";
import { LearningError, requireValue } from "./learning-domain.mjs";

let database;
function db() {
  requireValue(process.env.DATABASE_URL, "雲端病例庫尚未連接；未將資料存入臨時目錄", 503);
  database ||= drizzle(neon(process.env.DATABASE_URL));
  return database;
}

export const learningRepository = {
  async health() { await db().select({ id: cases.id }).from(cases).limit(1); },
  async find(id) { return (await db().select().from(cases).where(eq(cases.id, id)).limit(1))[0]; },
  async create(row) {
    const inserted = await db().insert(cases).values(row).onConflictDoNothing({ target: cases.id }).returning();
    return inserted[0] || this.find(row.id);
  },
  async list(ownerHash, before = null, limit = 50) {
    const conditions = [isNull(cases.deletedAt)];
    if (ownerHash) conditions.push(eq(cases.ownerHash, ownerHash));
    if (before) conditions.push(lt(cases.sequence, before));
    return db().select().from(cases).where(and(...conditions)).orderBy(desc(cases.sequence)).limit(limit);
  },
  async events(id) { return db().select().from(events).where(eq(events.caseId, id)).orderBy(asc(events.sequence)); },
  async findEvent(id) { return (await db().select().from(events).where(eq(events.id, id)).limit(1))[0]; },
  async append(event) {
    const inserted = await db().insert(events).values(event).onConflictDoNothing({ target: events.id }).returning();
    return inserted[0] || this.findEvent(event.id);
  },
  async ready(id, event = false) {
    const table = event ? events : cases;
    await db().update(table).set({ photoReady: true }).where(eq(table.id, id));
  },
  async tombstone(id) { await db().update(cases).set({ deletedAt: new Date().toISOString() }).where(eq(cases.id, id)); },
  async purge(id) { await db().delete(cases).where(eq(cases.id, id)); },
  async reserve(bucket, maximum) {
    const result = await db().insert(limits).values({ bucket, count: 1 }).onConflictDoUpdate({
      target: limits.bucket, set: { count: sql`${limits.count} + 1` }, setWhere: lt(limits.count, maximum)
    }).returning({ count: limits.count });
    if (!result.length) throw new LearningError(429, "今天的病例提交已達測試額度，資料仍可保留在本機稍後同步");
  }
};

export const privatePhotos = {
  async put(photo, bytes) {
    requireValue(process.env.BLOB_READ_WRITE_TOKEN, "私有照片庫尚未連接", 503);
    try {
      await put(photo.path, bytes, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: photo.contentType });
    } catch (error) {
      if (error?.name !== "BlobAlreadyExistsError") throw error;
      const existing = await head(photo.path);
      requireValue(existing.size === photo.size, "重複照片的大小不匹配", 409);
    }
  },
  async get(photo) {
    const result = await get(photo.path, { access: "private", useCache: false });
    if (result?.statusCode !== 200) throw new LearningError(404, "照片仍待上傳或已刪除");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  },
  async delete(photos) { if (photos.length) await del([...new Set(photos.map((photo) => photo.path))]); }
};
