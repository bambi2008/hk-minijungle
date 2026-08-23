import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-signature-test");
const signingSecret = "evidence-signing-secret-32-bytes-minimum";
const signingKeyId = "test-evidence-hmac-v1";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 8000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}api/health`);
      if (response.ok) return;
      lastError = new Error(`Server returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  throw lastError || new Error("Server did not start");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

function principalHeaders(principalId, headers = {}) {
  return { ...headers, "x-dr-forest-principal": principalId };
}

async function main() {
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}/`;
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DR_FOREST_ENV: "pilot",
      DR_FOREST_RUNTIME_DIR: runtimeDir,
      DR_FOREST_EVIDENCE_SIGNING_SECRET: signingSecret,
      DR_FOREST_EVIDENCE_SIGNING_KEY_ID: signingKeyId,
      DR_FOREST_OPERATOR_EMAIL: "ops@example.test",
      DR_FOREST_OPERATOR_PASSWORD: "pilot-password-123"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output = [];
  server.stdout.on("data", (chunk) => output.push(chunk.toString()));
  server.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    await waitForServer(baseUrl);
    const ephemeral = await fetchJson(`${baseUrl}api/proof/evidence-snapshot`, {
      headers: principalHeaders("fm-lead")
    });
    assert(ephemeral.response.ok, "Signed evidence snapshot endpoint failed");
    assert(ephemeral.body.signatureAlgorithm === "hmac-sha256", "Signed evidence snapshot algorithm was not HMAC-SHA256");
    assert(ephemeral.body.signatureStatus === "signed", "Configured signing secret did not produce signed status");
    assert(ephemeral.body.signatureKeyId === signingKeyId, "Configured signature key ID was not returned");
    assert(/^[a-f0-9]{64}$/.test(ephemeral.body.signature), "Signed evidence snapshot did not expose a 64-character signature");
    const expected = createHmac("sha256", signingSecret).update(`${ephemeral.body.snapshotId}.${ephemeral.body.sha256}`, "utf8").digest("hex");
    assert(ephemeral.body.signature === expected, "Evidence snapshot HMAC did not match the independent calculation");

    const persisted = await fetchJson(`${baseUrl}api/proof/evidence-snapshots`, {
      method: "POST",
      headers: principalHeaders("fm-lead", { "Content-Type": "application/json" })
    });
    assert(persisted.response.status === 201, "Signed evidence snapshot persistence failed");
    const persistedExpected = createHmac("sha256", signingSecret).update(`${persisted.body.snapshotId}.${persisted.body.sha256}`, "utf8").digest("hex");
    assert(persisted.body.signature === persistedExpected, "Persisted signed snapshot HMAC did not match the independent calculation");
    const readBack = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/${encodeURIComponent(persisted.body.snapshotId)}`, {
      headers: principalHeaders("fm-lead")
    });
    assert(readBack.response.ok, "Signed evidence snapshot read-back failed");
    assert(readBack.body.signatureStatus === "signed", "Read-back snapshot lost signed status");
    assert(readBack.body.signature === persistedExpected, "Read-back signed snapshot changed its HMAC");
    console.log(`Evidence signature smoke test passed at ${baseUrl}`);
  } catch (error) {
    if (output.length) console.error(output.join(""));
    throw error;
  } finally {
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 120));
    await rm(runtimeDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
