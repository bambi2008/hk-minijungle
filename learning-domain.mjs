import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const CROPS = ["tomato", "basil", "rosemary", "strawberry", "pepper"];
export const HYPOTHESES = ["low-light", "underwatered", "overwatered", "nutrition", "pests", "healthy", "other", "not-sure"];
export const OUTCOMES = ["better", "same", "worse"];
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
export const digest = (value) => sha256(JSON.stringify(value));
export class LearningError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new LearningError(status, message);
}
export function shortText(value, max, label, required = false) {
  requireValue(value === undefined || typeof value === "string", `${label}格式不正確`);
  const text = (value || "").trim();
  requireValue(text.length <= max && (!required || text.length > 0), `${label}長度不正確`);
  return text;
}
export function validId(id) {
  requireValue(typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id), "病例識別碼不正確");
  return id.toLowerCase();
}
export function photoData(data) {
  requireValue(typeof data === "string" && data.length <= 2800000, "照片過大，請重新拍攝");
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  requireValue(match, "請使用 JPEG 或 PNG 照片");
  const bytes = Buffer.from(match[2], "base64");
  const jpeg = bytes.length > 8 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  requireValue(bytes.length <= 2000000 && ((match[1] === "jpeg" && jpeg) || (match[1] === "png" && png)), "照片內容或大小不正確");
  return { bytes, hash: sha256(bytes), size: bytes.length, contentType: `image/${match[1]}`, extension: match[1] === "jpeg" ? "jpg" : "png" };
}
export function safeEqual(a, b) {
  const aa = Buffer.from(a || ""), bb = Buffer.from(b || "");
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function ownerFromToken(token) {
  requireValue(/^[a-f0-9]{64}$/.test(token || ""), "此裝置的病例憑證無效，請重新開啟 App", 401);
  return sha256(`fivecrop-owner:${token}`);
}

// Receipts bind an actual provider response to the exact compressed photo.
export function createVisionReceipt(body, result, secret, now = Date.now()) {
  if (!secret || result?.provider === "local-heuristic-placeholder" || !result?.model || result?.cropMismatch || result?.needsCropVerification || !CROPS.includes(result?.cropKey)) return null;
  try {
    const photo = photoData(body.imageData);
    const payload = Buffer.from(JSON.stringify({
      version: 1, at: now, hash: photo.hash,
      synthetic: /smoke|preflight|fixture/.test(body.context?.mode || ""),
      vision: {
        provider: result.provider, model: result.model, cropKey: result.cropKey,
        stageKey: result.stageKey, photoType: result.photoType, confidence: result.confidence,
        observations: result.observations || [], labels: result.labels || [], diagnosisHints: result.diagnosisHints || []
      }
    })).toString("base64url");
    return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
  } catch { return null; }
}
export function verifyVisionReceipt(receipt, photo, secret, now = Date.now()) {
  requireValue(secret, "可靠病例服務尚未配置，請稍後重試", 503);
  requireValue(typeof receipt === "string" && receipt.length < 40000, "缺少本次真實識別憑證，請重新識別照片");
  const [payload, signature, extra] = receipt.split(".");
  requireValue(!extra && payload && safeEqual(signature, createHmac("sha256", secret).update(payload).digest("base64url")), "識別憑證不匹配，請重新識別照片");
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { throw new LearningError(400, "識別憑證無效"); }
  requireValue(parsed.version === 1 && parsed.hash === photo.hash && Number.isFinite(parsed.at) && parsed.at <= now + 60000 && now - parsed.at < 30 * 86400000, "照片與診斷不匹配或已過期，請重新識別");
  return parsed;
}
export function evidenceDigest(row, events) {
  return digest([row.digest, ...events.filter((event) => event.kind === "followup" && event.photoReady).map((event) => event.digest)]);
}
export function summarizeCase(row, events = []) {
  const complete = events.filter((event) => event.photoReady);
  const followups = complete.filter((event) => event.kind === "followup");
  const review = complete.filter((event) => event.kind === "review").at(-1);
  const withdrawal = complete.some((event) => event.kind === "consent-withdrawn");
  const trainingConsent = row.snapshot.trainingConsent === true && !withdrawal;
  const evidence = evidenceDigest(row, events);
  const status = !row.photoReady ? "upload-pending" : review?.payload.evidenceDigest === evidence ? review.payload.status : "pending";
  const latest = followups.at(-1);
  const anchor = latest?.createdAt || row.createdAt;
  const days = latest?.payload.nextDays || row.snapshot.followupDays;
  const dueAt = new Date(Date.parse(anchor) + days * 86400000).toISOString();
  return {
    id: row.id, sequence: row.sequence, cropKey: row.cropKey, createdAt: row.createdAt,
    snapshot: { ...row.snapshot, trainingConsent }, photoReady: row.photoReady,
    photoHash: row.photo.hash, photoBytes: row.photo.size,
    status, dueAt, trainingConsent, evidenceDigest: evidence,
    trainingEligible: status === "verified" && trainingConsent && !row.snapshot.synthetic && followups.some((event) => event.payload.photo) && !row.deletedAt,
    followups: followups.map(({ id, createdAt, payload }) => ({ id, createdAt, ...payload, photo: payload.photo ? { hash: payload.photo.hash, size: payload.photo.size } : null })),
    review: review ? { ...review.payload, createdAt: review.createdAt } : null,
    pendingUploads: events.filter((event) => !event.photoReady).length
  };
}
