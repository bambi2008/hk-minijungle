import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { deleteS3Object, getS3Object, objectStorageConfig, putS3Object } from "../lib/ops-object-storage.mjs";

function clean(value) { return String(value || "").trim(); }
function required(value, label) { const result = clean(value); if (!result) throw new Error(`${label} is required`); return result; }
function arg(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? clean(process.argv[index + 1]) : fallback; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export async function runCosProductionProbe() {
  const configuration = objectStorageConfig();
  const bucket = required(process.env.DR_FOREST_OBJECT_STORAGE_BUCKET, "DR_FOREST_OBJECT_STORAGE_BUCKET");
  const key = arg("--key", `dr-forest-probe/${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}.txt`);
  const body = Buffer.from(`DR FOREST COS connectivity probe\ncreatedAt=${new Date().toISOString()}\n`, "utf8");
  const uploaded = await putS3Object({ bucket, key, body, contentType: "text/plain" });
  const downloaded = await getS3Object({ bucket, key });
  const downloadedHash = sha256(downloaded.bytes);
  if (downloaded.bytes.length !== body.length || downloadedHash !== sha256(body)) throw new Error("COS readback checksum mismatch");
  const retained = process.argv.includes("--retain");
  const deleted = retained ? null : await deleteS3Object({ bucket, key });
  return {
    ok: true,
    externalResource: true,
    probe: "put-get-delete",
    provider: configuration.provider,
    addressingStyle: configuration.style,
    endpointHost: new URL(configuration.endpoint).host,
    region: configuration.region,
    bucket,
    key,
    bytes: body.length,
    sha256: downloadedHash,
    retained,
    deleted
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCosProductionProbe().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
