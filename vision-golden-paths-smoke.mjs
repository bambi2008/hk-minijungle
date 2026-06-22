import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const host = "127.0.0.1";
const testDataDir = await mkdtemp(join(tmpdir(), "fivecrop-golden-vision-"));
process.env.GROW_CLINIC_DATA_DIR = testDataDir;
const expectedProvider = process.env.VISION_EXPECTED_PROVIDER || "";
const { server, closeStorage } = await import("./server.mjs");

const photoTypes = new Set(["plant", "leaf", "root", "flower", "pest", "unknown"]);

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

function drawPlantPngDataUrl(path) {
  const width = 128;
  const height = 128;
  const rows = [];
  const symptom = path.symptom || "healthy";
  const crop = path.cropKey;
  const background = [248, 249, 246];

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      let [r, g, b] = background;

      const pot = y > 100 && ((x - 64) ** 2) / 2300 + ((y - 112) ** 2) / 180 < 1;
      const stem = Math.abs(x - 64) < (crop === "rosemary" ? 3 : 4) && y > 30 && y < 104;
      const leftLeaf = ((x - 44) ** 2) / 360 + ((y - 58) ** 2) / 135 < 1;
      const rightLeaf = ((x - 84) ** 2) / 420 + ((y - 50) ** 2) / 155 < 1;
      const lowerLeaf = ((x - 82) ** 2) / 520 + ((y - 78) ** 2) / 170 < 1;
      const upperLeaf = ((x - 52) ** 2) / 260 + ((y - 38) ** 2) / 100 < 1;
      const rootBand = y > 84 && y < 102 && Math.abs(x - 64) < 36;
      const flower = ((x - 76) ** 2 + (y - 31) ** 2 < 70) || ((x - 91) ** 2 + (y - 42) ** 2 < 60);
      const fruit = ((x - 43) ** 2 + (y - 74) ** 2 < 80) || ((x - 92) ** 2 + (y - 70) ** 2 < 80);
      const longLeggyStem = crop === "basil" && Math.abs(x - 64) < 3 && y > 14 && y < 108;
      const rosemaryNeedle = crop === "rosemary" && Math.abs(x - 64) < 26 && y > 32 && y < 86 && (x + y) % 9 < 3;
      const crownWet = crop === "strawberry" && y > 79 && y < 99 && Math.abs(x - 64) < 28;

      if (pot) [r, g, b] = [192, 168, 142];
      if (stem || longLeggyStem) [r, g, b] = [42, 132, 65];
      if (leftLeaf || rightLeaf || lowerLeaf || upperLeaf || rosemaryNeedle) [r, g, b] = [31, 150, 74];
      if (flower && ["tomato", "pepper", "strawberry"].includes(crop)) [r, g, b] = crop === "strawberry" ? [245, 245, 235] : [237, 199, 43];
      if (fruit && ["strawberry", "pepper", "tomato"].includes(crop)) [r, g, b] = crop === "pepper" ? [42, 120, 54] : [208, 48, 42];
      if (rootBand && crop === "rosemary") [r, g, b] = [110, 86, 61];
      if (crownWet) [r, g, b] = [82, 105, 70];

      const yellowStress = symptom === "yellowing" && (((x - 46) ** 2 + (y - 60) ** 2 < 46) || ((x - 84) ** 2 + (y - 52) ** 2 < 46));
      const flowerDrop = symptom === "flower-drop" && flower && y > 36;
      const wetRoot = symptom === "root-risk" && rootBand && (x + y) % 4 < 2;
      const leggy = symptom === "leggy-growth" && longLeggyStem && y < 42;
      const wetCrown = symptom === "wet-crown" && crownWet;

      if (yellowStress) [r, g, b] = [214, 190, 68];
      if (flowerDrop) [r, g, b] = [184, 147, 28];
      if (wetRoot) [r, g, b] = [68, 82, 55];
      if (leggy) [r, g, b] = [82, 171, 80];
      if (wetCrown) [r, g, b] = [58, 78, 51];

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

const goldenCases = [
  {
    cropKey: "tomato",
    pathwayId: "tomato-flower-no-fruit",
    photoType: "flower",
    stageKey: "flowering",
    concern: "fruit",
    symptom: "flower-drop",
    signals: { yellowRatio: 0.18, greenRatio: 0.42, darkRatio: 0.1, brightness: 148, contrast: 46, width: 128, height: 128 },
    compare: { context: "flower", before: { yellowRatio: 0.18, greenRatio: 0.42, darkRatio: 0.1 }, after: { yellowRatio: 0.07, greenRatio: 0.46, darkRatio: 0.01 }, trend: "improved" }
  },
  {
    cropKey: "basil",
    pathwayId: "basil-leggy-low-light",
    photoType: "plant",
    stageKey: "vegetative",
    concern: "leggy",
    symptom: "leggy-growth",
    signals: { yellowRatio: 0.08, greenRatio: 0.3, darkRatio: 0.18, brightness: 112, contrast: 38, width: 128, height: 128 },
    compare: { context: "plant", before: { yellowRatio: 0.08, greenRatio: 0.3, darkRatio: 0.18 }, after: { yellowRatio: 0.03, greenRatio: 0.4, darkRatio: 0.07 }, trend: "improved" }
  },
  {
    cropKey: "rosemary",
    pathwayId: "rosemary-wet-root-decline",
    photoType: "root",
    stageKey: "vegetative",
    concern: "root",
    symptom: "root-risk",
    signals: { yellowRatio: 0.14, greenRatio: 0.2, darkRatio: 0.34, brightness: 102, contrast: 44, width: 128, height: 128 },
    compare: { context: "root", before: { yellowRatio: 0.14, greenRatio: 0.32, darkRatio: 0.34 }, after: { yellowRatio: 0.11, greenRatio: 0.2, darkRatio: 0.22 }, trend: "improved" }
  },
  {
    cropKey: "strawberry",
    pathwayId: "strawberry-crown-wet",
    photoType: "flower",
    stageKey: "flowering",
    concern: "fruit",
    symptom: "wet-crown",
    signals: { yellowRatio: 0.1, greenRatio: 0.32, darkRatio: 0.2, brightness: 136, contrast: 42, width: 128, height: 128 },
    compare: { context: "flower", before: { yellowRatio: 0.1, greenRatio: 0.32, darkRatio: 0.2 }, after: { yellowRatio: 0.08, greenRatio: 0.38, darkRatio: 0.11 }, trend: "improved" }
  },
  {
    cropKey: "pepper",
    pathwayId: "pepper-flower-drop",
    photoType: "flower",
    stageKey: "flowering",
    concern: "fruit",
    symptom: "flower-drop",
    signals: { yellowRatio: 0.16, greenRatio: 0.38, darkRatio: 0.12, brightness: 145, contrast: 44, width: 128, height: 128 },
    compare: { context: "flower", before: { yellowRatio: 0.16, greenRatio: 0.38, darkRatio: 0.12 }, after: { yellowRatio: 0.06, greenRatio: 0.44, darkRatio: 0.03 }, trend: "improved" }
  }
];

function assertVisionContract(payload, item) {
  if (!payload.provider || payload.provider === "local-heuristic-placeholder") {
    const detail = payload.aiFallbackDetail ? ` detail=${payload.aiFallbackDetail}` : "";
    throw new Error(`${item.cropKey}: vision model did not run; fallback=${payload.aiFallbackReason || "unknown"}${detail}`);
  }
  if (expectedProvider && payload.provider !== expectedProvider) {
    throw new Error(`${item.cropKey}: vision provider mismatch expected=${expectedProvider} actual=${payload.provider}`);
  }
  if (!payload.model || !payload.integrationContract?.canSwapProviderWithoutUiChange || !payload.modelInput?.hasImage) {
    throw new Error(`${item.cropKey}: vision provider payload contract mismatch`);
  }
  if (!photoTypes.has(payload.photoType) || !Array.isArray(payload.observations) || !Array.isArray(payload.labels) || !payload.nextAction) {
    throw new Error(`${item.cropKey}: normalized vision fields missing`);
  }
}

await new Promise((resolve) => server.listen(0, host, resolve));
const { port } = server.address();
const base = `http://${host}:${port}`;

try {
  const goldenResponse = await fetch(`${base}/api/golden-paths`);
  if (goldenResponse.status !== 200) throw new Error(`GET /api/golden-paths failed: ${goldenResponse.status}`);
  const golden = await goldenResponse.json();
  for (const item of goldenCases) {
    console.log(`golden-vision-start crop=${item.cropKey} photoType=${item.photoType}`);
    const path = golden.paths?.find((candidate) => candidate.cropKey === item.cropKey);
    if (path?.pathwayId !== item.pathwayId || !path.runnableFlow?.photo || !path.runnableFlow?.action || !path.runnableFlow?.followup) {
      throw new Error(`${item.cropKey}: golden path is not runnable`);
    }

    const response = await fetch(`${base}/api/vision/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        photoType: item.photoType,
        fileName: `fivecrop-live-${item.cropKey}-${item.photoType}.png`,
        imageData: drawPlantPngDataUrl(item),
        capturedPhotoTypes: ["plant", item.photoType],
        clientPipeline: {
          version: "ai-pipeline-v1",
          readyForRealVision: true,
          photoQualityGate: { version: "photo-gate-v1", state: "pass", score: 92 }
        },
        context: { cropKey: item.cropKey, stageKey: item.stageKey, mediumKey: "xponge", concern: item.concern },
        signals: item.signals
      })
    });
    if (response.status !== 200) throw new Error(`${item.cropKey}: POST /api/vision/analyze failed: ${response.status}`);
    const payload = await response.json();
    assertVisionContract(payload, item);

    const compareResponse = await fetch(`${base}/api/vision/compare`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        context: item.compare.context,
        before: { signals: item.compare.before },
        after: { signals: item.compare.after }
      })
    });
    if (compareResponse.status !== 200) throw new Error(`${item.cropKey}: POST /api/vision/compare failed: ${compareResponse.status}`);
    const comparison = await compareResponse.json();
    if (comparison.trend !== item.compare.trend) {
      throw new Error(`${item.cropKey}: follow-up comparison expected ${item.compare.trend}, got ${comparison.trend}`);
    }

    const labelText = payload.labels.map((entry) => entry.label).join("|") || "none";
    console.log(`golden-vision-ok crop=${item.cropKey} model=${payload.model} labels=${labelText} compare=${comparison.trend}`);
  }
  console.log(`vision-golden-paths-smoke-ok paths=${goldenCases.length}`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  closeStorage();
  await rm(testDataDir, { recursive: true, force: true });
}
