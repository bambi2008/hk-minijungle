import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = "127.0.0.1";
const projectRoot = process.cwd();

function assert(condition, message) { if (!condition) throw new Error(message); }
async function getFreePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, host, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitFor(url, predicate, timeoutMs = 8000) { const deadline = Date.now() + timeoutMs; let lastError = null; while (Date.now() < deadline) { try { const response = await fetch(url); const body = await response.json(); if (predicate(response, body)) return { response, body }; lastError = new Error(`unexpected response ${response.status}`); } catch (error) { lastError = error; } await new Promise((resolve) => setTimeout(resolve, 120)); } throw lastError || new Error(`Timed out waiting for ${url}`); }
function waitForExit(child, timeoutMs = 8000) { return new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error("server did not exit after SIGTERM")), timeoutMs); child.once("exit", (code, signal) => { clearTimeout(timer); resolve({ code, signal }); }); }); }

const runtimeDir = await mkdtemp(join(tmpdir(), "dr-forest-lifecycle-").replaceAll("\\", "/"));
const port = await getFreePort();
const child = spawn(process.execPath, ["server.mjs", "--port", String(port)], { cwd: projectRoot, env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir, DR_FOREST_SHUTDOWN_TIMEOUT_MS: "4000" }, stdio: ["ignore", "pipe", "pipe", "ipc"] });
let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });
try {
  const ready = await waitFor(`http://${host}:${port}/api/health/ready`, (response, body) => response.status === 200 && body.status === "ready");
  assert(ready.response.headers.get("x-request-id"), "Readiness response did not expose X-Request-ID");
  child.send("shutdown");
  const exited = await waitForExit(child);
  assert(exited.code === 0, `Server exited unexpectedly: ${JSON.stringify(exited)}`);
  assert(output.includes('"event":"server.shutdown.start"'), "Shutdown start log was not emitted");
  assert(output.includes('"event":"server.shutdown.complete"'), "Shutdown complete log was not emitted");
  console.log(JSON.stringify({ ok: true, port, readiness: ready.response.status, exitCode: exited.code, graceful: true }, null, 2));
} finally {
  if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
  await rm(runtimeDir, { recursive: true, force: true });
}
