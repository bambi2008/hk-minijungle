import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { createLearningService } from "../learning-service.mjs";
import { createLearningApi } from "../learning-api.mjs";
import { createVisionReceipt, verifyVisionReceipt, photoData, ownerFromToken } from "../learning-domain.mjs";

const secret = "unit-test-signing-secret-not-production";
const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA2kAAAAASUVORK5CYII=";
const result = { provider: "dashscope", model: "qwen-vl-plus", cropKey: "basil", confidence: 0.8, observations: [{ label: "yellow-leaves", evidence: "黃葉" }] };
const owner = ownerFromToken("a".repeat(64)), stranger = ownerFromToken("b".repeat(64));
function fixture() {
  let sequence = 0; const rows = new Map(), events = new Map(), files = new Map();
  const repository = {
    async health() {}, async reserve() {},
    async find(id) { return rows.get(id); },
    async create(row) { if (!rows.has(row.id)) rows.set(row.id, { sequence: ++sequence, createdAt: new Date().toISOString(), photoReady: false, ...row }); return rows.get(row.id); },
    async list(ownerHash, before, limit) { return [...rows.values()].filter((r) => !r.deletedAt && (!ownerHash || r.ownerHash === ownerHash) && (!before || r.sequence < before)).sort((a,b) => b.sequence-a.sequence).slice(0,limit); },
    async events(id) { return [...events.values()].filter((e) => e.caseId === id).sort((a,b) => a.sequence-b.sequence); },
    async findEvent(id) { return events.get(id); },
    async append(event) { if (!events.has(event.id)) events.set(event.id, { sequence: ++sequence, createdAt: new Date().toISOString(), photoReady: true, ...event }); return events.get(event.id); },
    async ready(id, event) { (event ? events : rows).get(id).photoReady = true; },
    async tombstone(id) { rows.get(id).deletedAt = new Date().toISOString(); },
    async purge(id) { rows.delete(id); for (const [key,e] of events) if (e.caseId === id) events.delete(key); }
  };
  const media = { async put(p,b) { files.set(p.path,b); }, async get(p) { return files.get(p.path); }, async delete(photos) { photos.forEach((p) => files.delete(p.path)); } };
  return { repository, media, rows, events, files, service: createLearningService({ repository, media, secret: () => secret }) };
}
function input(overrides = {}, mode = "intake") {
  return { id: randomUUID(), plantId: "test-plant", cropKey: "basil", receipt: createVisionReceipt({ imageData: photo, context: { mode } }, result, secret), imageData: photo, diagnosis: "待驗證：缺水", action: "先檢查土壤", hypothesis: "low-light", note: "土濕，長期室內陰暗", followupDays: 3, trainingConsent: true, storeConsent: true, ...overrides };
}
const followup = (overrides = {}) => ({ id: randomUUID(), outcome: "better", actionTaken: "只增加光照，未調整澆水", note: "新葉挺立", nextDays: 7, imageData: photo, ...overrides });
const review = (item, overrides = {}) => ({ id: randomUUID(), evidenceDigest: item.evidenceDigest, status: "verified", reviewer: "test reviewer", diagnosis: "缺光風險", evidence: "已獨立核查光照記錄、含水量與前後照片，排除單純缺水，但仍需長期觀察。", independentAssessment: true, ...overrides });
const rejects = (promise, status) => assert.rejects(promise, (e) => e.status === status);

test("receipt rejects tampering, different photos, fallback and expired records", () => {
  const body = input(); assert.equal(verifyVisionReceipt(body.receipt, photoData(photo), secret).vision.model, result.model);
  assert.throws(() => verifyVisionReceipt(body.receipt + "x", photoData(photo), secret));
  assert.throws(() => verifyVisionReceipt(body.receipt, { hash: "other" }, secret));
  assert.throws(() => verifyVisionReceipt(body.receipt, photoData(photo), secret, Date.now()+31*86400000));
  assert.equal(createVisionReceipt(body, { ...result, provider: "local-heuristic-placeholder" }, secret), null);
  assert.equal(createVisionReceipt(body, { ...result, cropMismatch: true }, secret), null);
});
test("same request is idempotent and conflicting content cannot overwrite", async () => {
  const f=fixture(), body=input(); await f.service.create(owner,body); await f.service.create(owner,body);
  assert.equal(f.rows.size,1); assert.equal(f.files.size,1);
  await rejects(f.service.create(owner,{...body,note:"different"}),409);
  await rejects(f.service.create(stranger,body),409);
});
test("cross-device reads, followups, photos, deletion, consent are denied", async () => {
  const f=fixture(), body=input(); await f.service.create(owner,body);
  for (const call of [() => f.service.get(stranger,body.id), () => f.service.photo(stranger,body.id), () => f.service.followup(stranger,body.id,followup()), () => f.service.remove(stranger,body.id), () => f.service.withdraw(stranger,body.id,{id:randomUUID()})]) await rejects(call(),404);
  assert.equal((await f.service.list(stranger)).items.length,0);
});
test("photo failure remains pending and can be retried safely", async () => {
  const f=fixture(), body=input(), put=f.media.put;
  f.media.put=async()=>{throw Error("offline")}; await assert.rejects(f.service.create(owner,body));
  assert.equal((await f.service.get(owner,body.id)).status,"upload-pending");
  f.media.put=put; assert.equal((await f.service.create(owner,body)).status,"pending");
  const entry=followup(); f.media.put=async()=>{throw Error("offline")}; await assert.rejects(f.service.followup(owner,body.id,entry));
  assert.equal((await f.service.get(owner,body.id)).followups.length,0);
  f.media.put=put; assert.equal((await f.service.followup(owner,body.id,entry)).followups.length,1);
});
test("candidate gate requires consent, photo followup and independent human review", async () => {
  const f=fixture(), body=input(); let item=await f.service.create(owner,body);
  assert.equal(item.trainingEligible,false); await rejects(f.service.review(body.id,review(item)),400);
  item=await f.service.followup(owner,body.id,followup());
  await rejects(f.service.review(body.id,review(item,{independentAssessment:false})),400);
  item=await f.service.review(body.id,review(item)); assert.equal(item.trainingEligible,true);
  assert.equal((await f.service.export(null)).items.length,1);
  assert.equal(JSON.stringify(await f.service.export(null)).includes("土濕"),false);
  item=await f.service.withdraw(owner,body.id,{id:randomUUID()}); assert.equal(item.trainingEligible,false);
  assert.equal((await f.service.export(null)).items.length,0);
});
test("unconsented, synthetic and no-followup-photo cases never export", async () => {
  for (const scenario of ["no-consent","fixture","no-photo"]) {
    const f=fixture(), body=input({trainingConsent: scenario!=="no-consent"},scenario);
    await f.service.create(owner,body);
    let item=await f.service.followup(owner,body.id,followup(scenario==="no-photo"?{imageData:null}:{}));
    item=await f.service.review(body.id,review(item)); assert.equal(item.trainingEligible,false);
  }
});
test("new evidence invalidates old review; stale reviewer cannot approve unseen evidence", async () => {
  const f=fixture(), body=input(); await f.service.create(owner,body);
  let item=await f.service.followup(owner,body.id,followup()); const stale=review(item);
  await f.service.review(body.id,stale);
  item=await f.service.followup(owner,body.id,followup({outcome:"worse"}));
  assert.equal(item.status,"pending"); assert.equal(item.trainingEligible,false);
  await rejects(f.service.review(body.id,{...stale,id:randomUUID()}),409);
});
test("concurrent independent followups preserved; duplicate events not duplicated", async () => {
  const f=fixture(), body=input(); await f.service.create(owner,body);
  const a=followup(), b=followup({outcome:"same"});
  await Promise.all([f.service.followup(owner,body.id,a),f.service.followup(owner,body.id,b)]);
  await f.service.followup(owner,body.id,a);
  assert.equal((await f.service.get(owner,body.id)).followups.length,2);
  await rejects(f.service.followup(owner,body.id,{...a,outcome:"worse"}),409);
});
test("delete tombstones before media removal and can finish a failed cleanup", async () => {
  const f=fixture(), body=input(); await f.service.create(owner,body); await f.service.followup(owner,body.id,followup());
  const remove=f.media.delete; f.media.delete=async()=>{throw Error("outage")};
  await rejects(f.service.remove(owner,body.id),503); await rejects(f.service.get(owner,body.id),404);
  assert.equal((await f.service.list(owner)).items.length,0);
  f.media.delete=remove; await f.service.remove(owner,body.id); assert.equal(f.files.size,0); assert.equal(f.rows.size,0); assert.equal(f.events.size,0);
});
test("photo integrity and input validation enforced", async () => {
  const f=fixture(), body=input(); await rejects(f.service.create(owner,{...body,storeConsent:false}),400);
  await rejects(f.service.create(owner,{...body,cropKey:"tomato"}),400);
  await rejects(f.service.create(owner,{...body,followupDays:999}),400);
  await f.service.create(owner,body); f.media.get=async()=>randomBytes(20); await rejects(f.service.photo(owner,body.id),502);
});
test("deleting while a photo is uploading does not leave an orphan photo", async () => {
  const f=fixture(), body=input(), put=f.media.put;
  f.media.put=async(p,b)=>{ await f.repository.tombstone(body.id); await f.repository.purge(body.id); await put(p,b); };
  await rejects(f.service.create(owner,body),404); assert.equal(f.files.size,0);
});
test("mobile result changes with actual findings, not a crop-specific canned diagnosis", async () => {
  const source=await readFile(new URL("../app.js",import.meta.url),"utf8");
  const start=source.indexOf("function customerMobileResultModel("), end=source.indexOf("\nfunction renderCustomerMobileExperience",start);
  const context={latestFindings:[{title:"缺水線索",why:"test"}],latestVisionResult:{observations:[]},customerCompactPlanModel:()=>({action:"actual action",followup:"actual followup"}),firstSentence:(v)=>v,customerEvidenceLabel:(v)=>v};
  const code=source.slice(start,end)+";customerMobileResultModel({crop:'basil'})";
  assert.equal(runInNewContext(code,context).risk,"待驗證：缺水線索");
  context.latestFindings[0].title="缺光線索";
  assert.equal(runInNewContext(code,context).risk,"待驗證：缺光線索");
  assert.ok(source.includes("${escapeMarkup(title)}"));
  const feedback=await readFile(new URL("../case-feedback.js",import.meta.url),"utf8");
  assert.equal(/\bconfirm\(/.test(feedback),false,"Existing WKWebView has no native JS confirm delegate");
});
test("HTTP layer rejects absent admin/owner authorization, malformed and oversized requests", async () => {
  const f=fixture(), handler=createLearningApi({...f,secret:()=>secret,reviewerToken:()=>"admin".repeat(16)});
  const server=createServer((req,res)=>handler(req,res,new URL(req.url,"http://localhost")));
  await new Promise((resolve)=>server.listen(0,"127.0.0.1",resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/learning`;
  try {
    assert.equal((await fetch(`${base}/cases`)).status,401);
    assert.equal((await fetch(`${base}/admin/cases`,{headers:{Authorization:`Bearer ${"a".repeat(64)}`}})).status,401);
    const headers={Authorization:`Bearer ${"a".repeat(64)}`,"content-type":"application/json"};
    assert.equal((await fetch(`${base}/cases`,{method:"POST",headers,body:"null"})).status,400);
    assert.equal((await fetch(`${base}/cases`,{method:"POST",headers,body:JSON.stringify({note:"a".repeat(2900001)})})).status,413);
    const response=await fetch(`${base}/cases`,{method:"POST",headers,body:JSON.stringify(input())});
    assert.equal(response.status,201); assert.match(response.headers.get("cache-control"),/no-store/);
  } finally { await new Promise((resolve)=>server.close(resolve)); }
});
