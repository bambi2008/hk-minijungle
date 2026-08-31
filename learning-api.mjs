import { learningRepository, privatePhotos } from "./learning-store.mjs";
import { createLearningService } from "./learning-service.mjs";
import { LearningError, requireValue, ownerFromToken, safeEqual } from "./learning-domain.mjs";

async function bodyJson(req) {
  requireValue((req.headers["content-type"] || "").startsWith("application/json"), "請使用 JSON 提交", 415);
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    requireValue(size <= 2900000, "照片或提交內容過大", 413);
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    requireValue(value && typeof value === "object" && !Array.isArray(value), "提交內容必須是物件");
    return value;
  }
  catch { throw new LearningError(400, "提交內容格式不正確"); }
}
function send(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(payload));
}
export function createLearningApi({ repository = learningRepository, media = privatePhotos, secret = () => process.env.FIVECROP_LEARNING_SECRET, reviewerToken = () => process.env.FIVECROP_REVIEW_TOKEN } = {}) {
  const service = createLearningService({ repository, media, secret });
  return async (req, res, url) => {
    if (!url.pathname.startsWith("/api/learning/")) return false;
    try {
      if (url.pathname === "/api/learning/status" && req.method === "GET") {
        requireValue(secret() && process.env.BLOB_READ_WRITE_TOKEN, "持久病例庫尚未準備好", 503);
        await repository.health();
        send(res, 200, { durable: true, photos: "private", version: "mobile-feedback-20260831" });
        return true;
      }
      const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1] || "";
      const admin = Boolean(reviewerToken() && reviewerToken().length >= 32 && safeEqual(token, reviewerToken()));
      const adminPath = url.pathname.startsWith("/api/learning/admin/");
      if (adminPath) requireValue(admin, "需要審核權限", 401);
      const owner = admin ? null : ownerFromToken(token);
      const cursor = url.searchParams.has("before") ? Number(url.searchParams.get("before")) : null;
      let output, status = 200;
      if (url.pathname === "/api/learning/admin/export" && req.method === "GET") output = await service.export(cursor);
      else if (url.pathname === "/api/learning/admin/cases" && req.method === "GET") output = await service.list(null, cursor, true);
      else if (url.pathname === "/api/learning/cases" && req.method === "GET") output = await service.list(owner, cursor, admin);
      else if (url.pathname === "/api/learning/cases" && req.method === "POST") {
        requireValue(!admin, "請使用裝置憑證提交病例", 403);
        output = await service.create(owner, await bodyJson(req)); status = 201;
      } else {
        const match = /^\/api\/learning\/(admin\/)?cases\/([0-9a-f-]+)(?:\/(followups|consent|review|photo))?$/.exec(url.pathname);
        requireValue(match, "找不到此功能", 404);
        const [, adminPart, id, action] = match;
        if (adminPart) requireValue(admin, "需要審核權限", 401);
        if (action === "photo" && req.method === "GET") {
          const photo = await service.photo(owner, id, url.searchParams.get("event"), admin);
          res.writeHead(200, { "content-type": photo.contentType, "content-length": photo.bytes.length, "cache-control": "private, no-store", "x-content-type-options": "nosniff" });
          res.end(photo.bytes); return true;
        } else if (!action && req.method === "GET") output = await service.get(owner, id, admin);
        else if (!action && req.method === "DELETE") { requireValue(!admin, "請用病例所屬裝置刪除", 403); output = await service.remove(owner, id); }
        else if (action === "followups" && req.method === "POST") { requireValue(!admin, "請使用裝置憑證", 403); output = await service.followup(owner, id, await bodyJson(req)); status = 201; }
        else if (action === "consent" && req.method === "POST") { requireValue(!admin, "請使用裝置憑證", 403); output = await service.withdraw(owner, id, await bodyJson(req)); }
        else if (action === "review" && adminPart && req.method === "POST") output = await service.review(id, await bodyJson(req));
        else throw new LearningError(405, "此操作方式不支援");
      }
      send(res, status, output);
    } catch (error) {
      send(res, error instanceof LearningError ? error.status : 503, { error: error instanceof LearningError ? error.message : "雲端同步暫不可用，請保留本機待同步資料並重試" });
    }
    return true;
  };
}
export const learningApi = createLearningApi();
