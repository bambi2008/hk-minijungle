import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const host = "127.0.0.1";
const testDataDir = await mkdtemp(join(tmpdir(), "fivecrop-vision-"));
process.env.GROW_CLINIC_DATA_DIR = testDataDir;
const expectedProvider = process.env.VISION_EXPECTED_PROVIDER || "";
const { server, closeStorage } = await import("./server.mjs");

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function plantPngDataUrl() {
  const width = 96;
  const height = 96;
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      let r = 244;
      let g = 248;
      let b = 239;
      const stem = Math.abs(x - 48) < 4 && y > 30 && y < 82;
      const leftLeaf = ((x - 33) ** 2) / 360 + ((y - 43) ** 2) / 145 < 1;
      const rightLeaf = ((x - 62) ** 2) / 430 + ((y - 35) ** 2) / 160 < 1;
      const lowerLeaf = ((x - 59) ** 2) / 520 + ((y - 62) ** 2) / 180 < 1;
      const yellowSpot = ((x - 38) ** 2 + (y - 40) ** 2 < 25) || ((x - 66) ** 2 + (y - 60) ** 2 < 30);
      if (stem) [r, g, b] = [58, 132, 65];
      if (leftLeaf || rightLeaf || lowerLeaf) [r, g, b] = yellowSpot ? [211, 190, 74] : [39, 151, 74];
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = 255;
    }
    rows.push(row);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0))
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

await new Promise((resolve) => server.listen(0, host, resolve));
const { port } = server.address();
const base = `http://${host}:${port}`;

try {
  const response = await fetch(`${base}/api/vision/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      photoType: "leaf",
      fileName: "fivecrop-live-yellow-leaf.png",
      imageData: plantPngDataUrl(),
      capturedPhotoTypes: ["plant"],
      clientPipeline: {
        version: "ai-pipeline-v1",
        readyForRealVision: true,
        photoQualityGate: { version: "photo-gate-v1", state: "pass", score: 94 }
      },
      context: { cropKey: "tomato", stageKey: "flowering", mediumKey: "xponge", concern: "yellow" },
      signals: { yellowRatio: 0.28, greenRatio: 0.34, darkRatio: 0.08, brightness: 140, contrast: 52, width: 96, height: 96 }
    })
  });

  if (response.status !== 200) {
    throw new Error(`POST /api/vision/analyze failed: ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.provider || payload.provider === "local-heuristic-placeholder") {
    const detail = payload.aiFallbackDetail ? ` detail=${payload.aiFallbackDetail}` : "";
    throw new Error(`Vision model did not run; fallback=${payload.aiFallbackReason || "unknown"}${detail}`);
  }
  if (expectedProvider && payload.provider !== expectedProvider) {
    throw new Error(`Vision provider mismatch: expected=${expectedProvider} actual=${payload.provider}`);
  }
  if (!payload.model || !payload.integrationContract?.canSwapProviderWithoutUiChange || !payload.modelInput?.hasImage) {
    throw new Error("Vision provider payload contract mismatch");
  }
  if (!Array.isArray(payload.observations) || !Array.isArray(payload.labels) || !payload.nextAction) {
    throw new Error("Vision provider result missing normalized analysis fields");
  }

  console.log(`vision-provider-smoke-ok provider=${payload.provider} model=${payload.model} labels=${payload.labels.length}`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  closeStorage();
  await rm(testDataDir, { recursive: true, force: true });
}
