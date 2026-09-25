import crypto from "node:crypto";
import fs from "node:fs";

const [buildNumber] = process.argv.slice(2);
const {
  ASC_KEY_ID: keyId,
  ASC_ISSUER_ID: issuerId,
  AUTH_KEY_PATH: keyPath,
  TESTFLIGHT_APP_ID: appId,
  TESTFLIGHT_GROUP_NAME: groupName,
} = process.env;

for (const [name, value] of Object.entries({
  buildNumber,
  ASC_KEY_ID: keyId,
  ASC_ISSUER_ID: issuerId,
  AUTH_KEY_PATH: keyPath,
  TESTFLIGHT_APP_ID: appId,
  TESTFLIGHT_GROUP_NAME: groupName,
})) {
  if (!value) throw new Error(`Missing required value: ${name}`);
}

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

function makeToken() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = [
    encode({ alg: "ES256", kid: keyId, typ: "JWT" }),
    encode({ iss: issuerId, iat: now - 20, exp: now + 600, aud: "appstoreconnect-v1" }),
  ].join(".");
  const signature = crypto.sign("sha256", Buffer.from(unsigned), {
    key: fs.readFileSync(keyPath),
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${unsigned}.${signature}`;
}

async function api(path, options = {}) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${makeToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

let build;
for (let attempt = 1; attempt <= 30; attempt += 1) {
  const result = await api(`/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=20`);
  build = result.data.find((item) => item.attributes.version === buildNumber);
  const state = build?.attributes.processingState ?? "NOT_VISIBLE_YET";
  console.log(`Build ${buildNumber}: ${state} (check ${attempt}/30)`);
  if (state === "VALID") break;
  if (state === "FAILED" || state === "INVALID") {
    throw new Error(`Apple marked build ${buildNumber} as ${state}.`);
  }
  await delay(20_000);
}

if (!build || build.attributes.processingState !== "VALID") {
  throw new Error(`Build ${buildNumber} did not become valid within 10 minutes.`);
}

const groups = await api(`/v1/betaGroups?filter[app]=${appId}&limit=50`);
const group = groups.data.find((item) => item.attributes.name === groupName);
if (!group) throw new Error(`Internal group not found: ${groupName}`);

const assigned = await api(`/v1/betaGroups/${group.id}/builds?limit=200`);
if (assigned.data.some((item) => item.id === build.id)) {
  console.log(`Build ${buildNumber} is already assigned to ${groupName}.`);
} else {
  await api(`/v1/betaGroups/${group.id}/relationships/builds`, {
    method: "POST",
    body: JSON.stringify({ data: [{ type: "builds", id: build.id }] }),
  });
  console.log(`Assigned build ${buildNumber} to ${groupName}.`);
}

const verified = await api(`/v1/betaGroups/${group.id}/builds?limit=200`);
if (!verified.data.some((item) => item.id === build.id)) {
  throw new Error(`Build ${buildNumber} is still missing from ${groupName} after assignment.`);
}
console.log(`TestFlight visibility verified: build ${buildNumber} → ${groupName}.`);
