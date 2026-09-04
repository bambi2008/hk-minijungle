import { createHash, createHmac } from "node:crypto";

export const objectStorageVersion = "2026-09-04.s3-compatible-cos-v2";

function hmac(key, value, encoding) { return createHmac("sha256", key).update(value).digest(encoding); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function clean(value) { return String(value || "").trim(); }
function encodePath(value) { return String(value).split("/").map((part) => encodeURIComponent(part)).join("/"); }

function isTencentCosEndpoint(endpoint) {
  try {
    const hostname = new URL(endpoint).hostname.toLowerCase();
    return hostname.endsWith(".myqcloud.com") && (hostname.includes(".cos.") || hostname.startsWith("cos."));
  } catch {
    return false;
  }
}

export function objectStorageConfig() {
  const endpoint = clean(process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT).replace(/\/$/, "");
  const provider = clean(process.env.DR_FOREST_OBJECT_STORAGE_PROVIDER).toLowerCase() || (isTencentCosEndpoint(endpoint) ? "cos" : "s3");
  const configuredStyle = clean(process.env.DR_FOREST_OBJECT_STORAGE_STYLE).toLowerCase();
  const style = configuredStyle || (provider === "cos" ? "virtual" : "path");
  if (style !== "virtual" && style !== "path") throw new Error("DR_FOREST_OBJECT_STORAGE_STYLE must be virtual or path");
  return {
    provider,
    endpoint,
    region: clean(process.env.DR_FOREST_OBJECT_STORAGE_REGION) || "us-east-1",
    accessKey: clean(process.env.DR_FOREST_OBJECT_STORAGE_ACCESS_KEY),
    secretKey: clean(process.env.DR_FOREST_OBJECT_STORAGE_SECRET_KEY),
    style
  };
}

function destinationParts(destination) {
  const value = String(destination || "").trim();
  if (!value.toLowerCase().startsWith("s3://")) throw new Error("Object storage destination must use s3://bucket/prefix");
  const withoutScheme = value.slice(5);
  const slash = withoutScheme.indexOf("/");
  const bucket = slash < 0 ? withoutScheme : withoutScheme.slice(0, slash);
  const prefix = slash < 0 ? "" : withoutScheme.slice(slash + 1).replace(/^\/+|\/+$/g, "");
  if (!bucket || /[\\\s]/.test(bucket)) throw new Error("Object storage destination must contain a valid bucket");
  return { bucket, prefix };
}

export function parseObjectStorageDestination(destination) { return destinationParts(destination); }

function baseEndpoint(endpoint) {
  let base;
  try { base = new URL(endpoint); } catch { throw new Error("Object storage endpoint must be a valid URL"); }
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("Object storage endpoint must use http or https");
  return base;
}

export function buildObjectStorageTarget({ bucket, key }) {
  const configuration = objectStorageConfig();
  const target = baseEndpoint(configuration.endpoint);
  const normalizedBucket = clean(bucket);
  const normalizedKey = clean(key).replace(/^\/+/, "");
  if (!normalizedBucket || !normalizedKey) throw new Error("Object storage bucket and key are required");
  const basePath = target.pathname.replace(/\/+$/, "");
  if (configuration.style === "virtual") {
    const hostname = target.hostname.toLowerCase();
    if (!hostname.startsWith(`${normalizedBucket.toLowerCase()}.`)) target.hostname = `${normalizedBucket}.${target.hostname}`;
    target.pathname = `${basePath}/${encodePath(normalizedKey)}` || "/";
  } else {
    target.pathname = `${basePath}/${encodeURIComponent(normalizedBucket)}/${encodePath(normalizedKey)}` || "/";
  }
  target.search = "";
  target.hash = "";
  return target;
}

function signedRequest({ method, target, body = Buffer.alloc(0), contentType = null }) {
  const configuration = objectStorageConfig();
  if (!configuration.endpoint || !configuration.accessKey || !configuration.secretKey) throw new Error("Object storage credentials are not configured");
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const payloadHash = sha256(bodyBuffer);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = target.host;
  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["content-type"] = contentType;
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${String(headers[name]).trim()}\n`).join("");
  const canonicalRequest = [method, target.pathname || "/", "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${configuration.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${configuration.secretKey}`, dateStamp), configuration.region), "s3"), "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${configuration.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { headers, body: bodyBuffer };
}

async function requestObject({ method, bucket, key, body = Buffer.alloc(0), contentType = null }) {
  const target = buildObjectStorageTarget({ bucket, key });
  const signed = signedRequest({ method, target, body, contentType });
  const response = await fetch(target, {
    method,
    headers: signed.headers,
    body: method === "GET" ? undefined : signed.body,
    signal: AbortSignal.timeout(15_000)
  });
  return { response, target };
}

export async function putS3Object({ bucket, key, body, contentType = "application/octet-stream" }) {
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const { response } = await requestObject({ method: "PUT", bucket, key, body: bodyBuffer, contentType });
  if (!response.ok) throw new Error(`Object storage upload failed: ${response.status} ${await response.text()}`);
  return { bucket, key, etag: response.headers.get("etag") || null, bytes: bodyBuffer.length };
}

export async function getS3Object({ bucket, key }) {
  const { response } = await requestObject({ method: "GET", bucket, key });
  if (!response.ok) throw new Error(`Object storage download failed: ${response.status} ${await response.text()}`);
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "application/octet-stream", etag: response.headers.get("etag") || null };
}

export async function deleteS3Object({ bucket, key }) {
  const { response } = await requestObject({ method: "DELETE", bucket, key });
  if (!response.ok && response.status !== 404) throw new Error(`Object storage delete failed: ${response.status} ${await response.text()}`);
  return { bucket, key, deleted: response.status !== 404, status: response.status };
}

export async function uploadBackupTree(destination, backupRoot, files) {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { bucket, prefix } = destinationParts(destination);
  const uploaded = [];
  for (const file of files) {
    const key = [prefix, file.path].filter(Boolean).join("/");
    uploaded.push(await putS3Object({ bucket, key, body: await readFile(join(backupRoot, file.path)), contentType: file.path.endsWith(".json") ? "application/json" : "application/octet-stream" }));
  }
  return { bucket, prefix, uploaded };
}
