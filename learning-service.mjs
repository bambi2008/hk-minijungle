import { CROPS, HYPOTHESES, OUTCOMES, digest, sha256, photoData, verifyVisionReceipt, requireValue, shortText, validId, evidenceDigest, summarizeCase, LearningError } from "./learning-domain.mjs";

const days = (value) => { requireValue([1, 2, 3, 7, 14].includes(value), "請選擇複查時間"); return value; };
function environment(input = {}) {
  const result = {};
  for (const field of ["stage", "medium", "light", "moisture", "growDevice"]) result[field] = shortText(input[field], 60, field);
  for (const field of ["lightHours", "temperature", "humidity", "sensorMoisture"]) {
    const value = input[field];
    result[field] = typeof value === "number" && Number.isFinite(value) && value >= -30 && value <= 100 ? value : null;
  }
  return result;
}
function photoRecord(photo, caseId, id = "baseline") {
  return { path: `fivecrop-cases/${caseId}/${id}-${photo.hash}.${photo.extension}`, hash: photo.hash, size: photo.size, contentType: photo.contentType };
}
export function createLearningService({ repository: repo, media, secret }) {
  async function own(owner, id, { admin = false, deleted = false } = {}) {
    const row = await repo.find(validId(id));
    requireValue(row && (admin || row.ownerHash === owner) && (deleted || !row.deletedAt), "找不到這個病例", 404);
    return row;
  }
  async function quota(owner, kind) {
    const date = new Date().toISOString().slice(0, 10);
    await repo.reserve(`${date}:${kind}:${owner}`, kind === "case" ? 30 : 100);
    await repo.reserve(`${date}:${kind}:all`, kind === "case" ? 150 : 750);
  }
  async function finishPhoto(row, photo, bytes, event = false) {
    if (!row.photoReady) {
      await media.put(photo, bytes);
      const parent = await repo.find(event ? row.caseId : row.id);
      if (!parent || parent.deletedAt) {
        await media.delete([photo]);
        throw new LearningError(404, "病例已刪除，這張照片不再保留");
      }
      await repo.ready(row.id, event);
    }
  }
  return {
    async create(owner, body) {
      const id = validId(body.id);
      requireValue(body.storeConsent === true, "請確認保存照片與病例以供複查");
      requireValue(typeof body.trainingConsent === "boolean", "請明確選擇是否同意模型改進");
      const photo = photoData(body.imageData);
      const receipt = verifyVisionReceipt(body.receipt, photo, secret());
      requireValue(CROPS.includes(body.cropKey) && body.cropKey === receipt.vision.cropKey, "作物與本次照片識別結果不匹配");
      requireValue(HYPOTHESES.includes(body.hypothesis), "請選擇你認為的原因");
      const plantId = shortText(body.plantId, 160, "植物檔案識別碼", true);
      const snapshot = {
        version: "fivecrop-learning-v1", pipelineVersion: "mobile-feedback-20260831",
        plantGroup: sha256(`${owner}:${plantId}`),
        diagnosis: shortText(body.diagnosis, 400, "原診斷", true),
        action: shortText(body.action, 700, "原照護建議"),
        hypothesis: body.hypothesis, note: shortText(body.note, 1200, "補充依據"),
        environment: environment(body.environment), vision: receipt.vision,
        analyzedAt: new Date(receipt.at).toISOString(), synthetic: receipt.synthetic,
        followupDays: days(body.followupDays), trainingConsent: body.trainingConsent
      };
      const fingerprint = digest([snapshot, photo.hash]);
      let row = await repo.find(id);
      if (!row) {
        await quota(owner, "case");
        row = await repo.create({ id, ownerHash: owner, cropKey: body.cropKey, digest: fingerprint, snapshot, photo: photoRecord(photo, id) });
      }
      requireValue(row.ownerHash === owner && row.digest === fingerprint && !row.deletedAt, "重複提交的內容不一致", 409);
      await finishPhoto(row, row.photo, photo.bytes);
      return this.get(owner, id);
    },
    async get(owner, id, admin = false) {
      const row = await own(owner, id, { admin });
      return summarizeCase(row, await repo.events(row.id));
    },
    async list(owner, before = null, admin = false) {
      if (before !== null) requireValue(Number.isSafeInteger(before) && before > 0, "分頁參數不正確");
      const rows = await repo.list(admin ? null : owner, before, 51);
      const selected = rows.slice(0, 50);
      const items = await Promise.all(selected.map(async (row) => summarizeCase(row, await repo.events(row.id))));
      return { items, nextCursor: rows.length > 50 ? selected.at(-1).sequence : null };
    },
    async followup(owner, id, body) {
      const row = await own(owner, id);
      requireValue(row.photoReady, "請先完成原始照片上傳", 409);
      const eventId = validId(body.id);
      requireValue(OUTCOMES.includes(body.outcome), "請選擇改善、沒變化或變差");
      const photo = body.imageData ? photoData(body.imageData) : null;
      const payload = {
        outcome: body.outcome, actionTaken: shortText(body.actionTaken, 800, "實際採取的措施", true),
        note: shortText(body.note, 1200, "複查觀察"), nextDays: days(body.nextDays),
        photo: photo ? photoRecord(photo, id, eventId) : null
      };
      const fingerprint = digest(payload);
      let event = await repo.findEvent(eventId);
      if (!event) { await quota(owner, "event"); event = await repo.append({ id: eventId, caseId: id, kind: "followup", digest: fingerprint, payload, photoReady: !photo }); }
      requireValue(event.caseId === id && event.digest === fingerprint && event.kind === "followup", "重複複查的內容不一致", 409);
      if (photo) await finishPhoto(event, payload.photo, photo.bytes, true);
      return this.get(owner, id);
    },
    async withdraw(owner, id, body) {
      await own(owner, id);
      const event = await repo.append({ id: validId(body.id), caseId: id, kind: "consent-withdrawn", digest: digest([id, "withdrawn"]), payload: { consent: false } });
      requireValue(event.caseId === id && event.kind === "consent-withdrawn", "請重試授權撤回", 409);
      return this.get(owner, id);
    },
    async review(id, body) {
      const row = await own(null, id, { admin: true });
      const events = await repo.events(id);
      const current = summarizeCase(row, events);
      requireValue(["verified", "rejected", "pending"].includes(body.status), "審核狀態不正確");
      requireValue(body.evidenceDigest === current.evidenceDigest, "病例已有新的複查，請重新閱讀後審核", 409);
      const payload = {
        status: body.status, reviewer: shortText(body.reviewer, 100, "審核人", true),
        diagnosis: shortText(body.diagnosis, 400, "核實後診斷", body.status === "verified"),
        evidence: shortText(body.evidence, 1200, "核實依據", true),
        evidenceDigest: evidenceDigest(row, events)
      };
      if (body.status === "verified") {
        requireValue(row.photoReady && current.followups.length > 0, "需有完整原始照片和至少一次複查才可核實");
        requireValue(payload.evidence.length >= 20 && body.independentAssessment === true, "需人工核查環境與照片證據；不能只把用戶猜測或改善當成確診");
      }
      const event = await repo.append({ id: validId(body.id), caseId: id, kind: "review", digest: digest(payload), payload });
      requireValue(event.caseId === id && event.digest === digest(payload) && event.kind === "review", "審核提交識別碼重複", 409);
      return this.get(null, id, true);
    },
    async photo(owner, id, eventId, admin = false) {
      const row = await own(owner, id, { admin });
      let photo = row.photo;
      if (eventId) {
        const event = await repo.findEvent(validId(eventId));
        requireValue(event?.caseId === id && event.photoReady && event.payload.photo, "找不到複查照片", 404);
        photo = event.payload.photo;
      } else requireValue(row.photoReady, "原始照片仍待同步", 404);
      const bytes = await media.get(photo);
      requireValue(bytes.length === photo.size && sha256(bytes) === photo.hash, "照片完整性檢查未通過", 502);
      return { bytes, contentType: photo.contentType };
    },
    async remove(owner, id) {
      const row = await own(owner, id, { deleted: true });
      // Immediately exclude from reads/export, even if remote photo deletion needs a retry.
      await repo.tombstone(id);
      const allPhotos = [row.photo, ...(await repo.events(id)).map((event) => event.payload.photo).filter(Boolean)];
      try { await media.delete(allPhotos); } catch { throw new LearningError(503, "病例已停止使用，照片清理待重試；請再次點刪除完成清理"); }
      await repo.purge(id);
      return { deleted: true };
    },
    async export(before) {
      const page = await this.list(null, before, true);
      return {
        version: "fivecrop-reviewed-training-v1", nextCursor: page.nextCursor,
        items: page.items.filter((item) => item.trainingEligible).map((item) => ({
          id: item.id, group: item.snapshot.plantGroup, cropKey: item.cropKey,
          photoHash: item.photoHash, photoEndpoint: `/api/learning/cases/${item.id}/photo`,
          environment: item.snapshot.environment,
          answer: { cropKey: item.cropKey, diagnosis: item.review.diagnosis, evidence: item.review.evidence },
          provenance: { provider: item.snapshot.vision.provider, model: item.snapshot.vision.model, reviewedAt: item.review.createdAt, evidenceDigest: item.evidenceDigest }
        }))
      };
    }
  };
}
