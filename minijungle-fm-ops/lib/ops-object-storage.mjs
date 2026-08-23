import { createHash, createHmac } from "node:crypto";

export const objectStorageVersion = "2026-08-17.s3-compatible-v1";

function hmac(key, value, encoding) { return createHmac("sha256", key).update(value).digest(encoding); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function encodePath(value) { return String(value).split("/").map((part) => encodeURIComponent(part)).join("/"); }
function config() {
  return {
    endpoint: String(process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT || "").replace(/\/$/, ""),
    region: String(process.env.DR_FOREST_OBJECT_STORAGE_REGION || "us-east-1"),
    accessKey: String(process.env.DR_FOREST_OBJECT_STORAGE_ACCESS_KEY || ""),
    secretKey: String(process.env.DR_FOREST_OBJECT_STORAGE_SECRET_KEY || "")
  };
}
function destinationParts(destination) {
  const value = String(destination || "").trim();
  if (!value.toLowerCase().startsWith("s3://")) throw new Error("Object storage destination must use s3://bucket/prefix");
  const withoutScheme = value.slice(5);
  const slash = withoutScheme.indexOf("/");
  return { bucket: slash < 0 ? withoutScheme : withoutScheme.slice(0, slash), prefix: slash < 0 ? "" : withoutScheme.slice(slash + 1).replace(/^\/+|\/+$/g, "") };
}

export function parseObjectStorageDestination(destination) { return destinationParts(destination); }

export async function putS3Object({ bucket, key, body, contentType = "application/octet-stream" }) {
  const { endpoint, region, accessKey, secretKey } = config();
  if (!endpoint || !accessKey || !secretKey) throw new Error("Object storage credentials are not configured");
  const target = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodePath(key)}`);
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const payloadHash = sha256(bodyBuffer);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = target.host;
  const canonicalUri = target.pathname;
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  const response = await fetch(target, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "host": host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    },
    body: bodyBuffer,
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Object storage upload failed: ${response.status} ${await response.text()}`);
  return { bucket, key, etag: response.headers.get("etag") || null, bytes: bodyBuffer.length };
}

export async function getS3Object({ bucket, key }) {
  const { endpoint, region, accessKey, secretKey } = config();
  if (!endpoint || !accessKey || !secretKey) throw new Error("Object storage credentials are not configured");
  const target = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodePath(key)}`);
  const payloadHash = sha256(Buffer.alloc(0));
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = target.host;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["GET", target.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = hmac(signingKey, stringToSign, "hex");
  const response = await fetch(target, {
    method: "GET",
    headers: {
      "host": host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error(`Object storage download failed: ${response.status} ${await response.text()}`);
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "application/octet-stream", etag: response.headers.get("etag") || null };
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
