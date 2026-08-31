import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createVisionReceipt, sha256 } from "../learning-domain.mjs";
const base = new URL(process.argv[2] || "http://127.0.0.1:8014");
const token = randomBytes(32).toString("hex"), id = randomUUID();
const reviewer = process.env.FIVECROP_REVIEW_TOKEN;
assert.ok(reviewer, "Reviewer credential must be configured");
const bytes = await readFile(new URL("../assets/tomato-diagnosis-preview.jpg",import.meta.url));
const imageData = `data:image/jpeg;base64,${bytes.toString("base64")}`;
const request = { imageData, photoType:"plant", context:{ cropKey:"tomato",stageKey:"flowering",mediumKey:"soil",mode:"feedback-smoke-fixture" } };
async function call(path, body, auth=token, method=body?"POST":"GET") {
  const response = await fetch(new URL(path,base),{ method,headers:{Authorization:`Bearer ${auth}`,"content-type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000) });
  const payload = await response.json();
  assert.ok(response.ok, `${path}: ${response.status} ${payload.error||""}`);
  return payload;
}
let created=false;
try {
  assert.equal((await call("/api/learning/status")).durable,true);
  const vision = process.argv.includes("--real-vision")
    ? await call("/api/vision/analyze",request)
    : { provider:"dashscope",model:"storage-test-fixture",cropKey:"tomato",confidence:0.8,observations:[] };
  if (process.argv.includes("--real-vision")) assert.ok(vision.caseReceipt,`Live analysis must provide its own signed receipt: ${JSON.stringify({provider:vision.provider,model:vision.model,cropKey:vision.cropKey,cropMismatch:vision.cropMismatch,needsCropVerification:vision.needsCropVerification,fallback:vision.aiFallbackReason})}`);
  const receipt = vision.caseReceipt || createVisionReceipt(request,vision,process.env.FIVECROP_LEARNING_SECRET);
  assert.ok(receipt,"No real photo receipt returned");
  const body = { id,plantId:`smoke-${id}`,cropKey:"tomato",imageData,receipt,diagnosis:"測試病例，不可訓練",action:"記錄環境",hypothesis:"other",note:"Automated fixture: not a real user correction",environment:{lightHours:6,moisture:"normal"},followupDays:3,trainingConsent:true,storeConsent:true };
  let item=await call("/api/learning/cases",body); created=true;
  assert.equal(item.photoReady,true); assert.equal(item.status,"pending");
  assert.equal(item.snapshot.synthetic,true);
  await call("/api/learning/cases",body);
  assert.equal((await call("/api/learning/cases")).items.length,1);
  const photo=await fetch(new URL(`/api/learning/cases/${id}/photo`,base),{headers:{Authorization:`Bearer ${token}`}});
  assert.equal(photo.status,200); assert.equal(sha256(Buffer.from(await photo.arrayBuffer())),sha256(bytes));
  assert.equal((await fetch(new URL(`/api/learning/cases/${id}/photo`,base))).status,401);
  assert.equal((await fetch(new URL(`/api/learning/cases/${id}`,base),{headers:{Authorization:`Bearer ${randomBytes(32).toString("hex")}`}})).status,404);
  const followup={id:randomUUID(),outcome:"same",actionTaken:"存儲測試，未採取種植措施",note:"僅測試流程",nextDays:7,imageData};
  item=await call(`/api/learning/cases/${id}/followups`,followup);
  await call(`/api/learning/cases/${id}/followups`,followup);
  assert.equal((await call(`/api/learning/cases/${id}`)).followups.length,1);
  item=await call(`/api/learning/admin/cases/${id}/review`,{id:randomUUID(),evidenceDigest:item.evidenceDigest,status:"verified",reviewer:"automated storage test",diagnosis:"測試樣本",evidence:"這是一筆專用的自動化存儲測試資料，並不代表植物病因已經核實，禁止訓練。",independentAssessment:true},reviewer);
  assert.equal(item.trainingEligible,false);
  assert.equal((await call("/api/learning/admin/export",null,reviewer)).items.some((r)=>r.id===id),false);
  item=await call(`/api/learning/cases/${id}/consent`,{id:randomUUID()}); assert.equal(item.trainingConsent,false);
  await call(`/api/learning/cases/${id}`,null,token,"DELETE"); created=false;
  assert.equal((await fetch(new URL(`/api/learning/cases/${id}`,base),{headers:{Authorization:`Bearer ${token}`}})).status,404);
  for (const path of ["/.env.feedback.production.local","/learning-store.mjs","/data/grow-clinic.sqlite"]) assert.equal((await fetch(new URL(path,base))).status,404);
  console.log(JSON.stringify({result:"PASS",origin:base.origin,realVision:process.argv.includes("--real-vision"),provider:vision.provider,model:vision.model,checks:["cloud create and reload","idempotent create and followup","private photo SHA-256","device isolation","manual review","synthetic excluded from training","consent withdrawal","case and photo deletion","private file denial"]}));
} finally {
  if(created) await call(`/api/learning/cases/${id}`,null,token,"DELETE").catch(()=>console.error(`Test cleanup needs retry for case ${id}`));
}
