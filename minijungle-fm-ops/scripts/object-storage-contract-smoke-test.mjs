import { createServer } from "node:http";
import { buildObjectStorageTarget, getS3Object, objectStorageConfig, putS3Object } from "../lib/ops-object-storage.mjs";

const store = new Map();
const server = createServer(async (req, res) => {
  const key = req.url || "/";
  if (req.method === "PUT") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    store.set(key, Buffer.concat(chunks));
    res.writeHead(200, { etag: '"contract-etag"' });
    res.end();
    return;
  }
  if (req.method === "GET" && store.has(key)) {
    res.writeHead(200, { "content-type": "image/png", etag: '"contract-etag"' });
    res.end(store.get(key));
    return;
  }
  res.writeHead(404);
  res.end();
});

const original = new Map(["DR_FOREST_OBJECT_STORAGE_ENDPOINT", "DR_FOREST_OBJECT_STORAGE_REGION", "DR_FOREST_OBJECT_STORAGE_ACCESS_KEY", "DR_FOREST_OBJECT_STORAGE_SECRET_KEY", "DR_FOREST_OBJECT_STORAGE_PROVIDER", "DR_FOREST_OBJECT_STORAGE_STYLE"].map((key) => [key, process.env[key]]));
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const port = server.address().port;
  process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT = `http://127.0.0.1:${port}`;
  process.env.DR_FOREST_OBJECT_STORAGE_REGION = "test-1";
  process.env.DR_FOREST_OBJECT_STORAGE_ACCESS_KEY = "contract-access";
  process.env.DR_FOREST_OBJECT_STORAGE_SECRET_KEY = "contract-secret";
  process.env.DR_FOREST_OBJECT_STORAGE_PROVIDER = "s3";
  process.env.DR_FOREST_OBJECT_STORAGE_STYLE = "path";
  const body = Buffer.from("dr-forest-object-storage-contract");
  const uploaded = await putS3Object({ bucket: "dr-forest-test", key: "proof/module-01.png", body, contentType: "image/png" });
  const downloaded = await getS3Object({ bucket: "dr-forest-test", key: "proof/module-01.png" });
  if (uploaded.bytes !== body.length || !downloaded.bytes.equals(body)) throw new Error("S3-compatible PUT/GET contract returned different bytes");
  process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT = "https://cos.ap-hongkong.myqcloud.com";
  process.env.DR_FOREST_OBJECT_STORAGE_PROVIDER = "cos";
  process.env.DR_FOREST_OBJECT_STORAGE_STYLE = "virtual";
  const cosTarget = buildObjectStorageTarget({ bucket: "drforest-prod-1250000000", key: "proof/module 01.png" });
  if (cosTarget.hostname !== "drforest-prod-1250000000.cos.ap-hongkong.myqcloud.com" || cosTarget.pathname !== "/proof/module%2001.png") throw new Error("Tencent COS target did not use virtual-hosted addressing");
  if (objectStorageConfig().style !== "virtual") throw new Error("Tencent COS configuration did not resolve virtual-hosted addressing");
  console.log(JSON.stringify({ ok: true, contractOnly: true, bytes: body.length, etag: uploaded.etag, cosAddressing: "virtual-hosted" }));
} finally {
  for (const [key, value] of original) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await new Promise((resolve) => server.close(resolve));
}
