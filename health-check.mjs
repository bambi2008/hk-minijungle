const base = process.env.BASE_URL || "http://127.0.0.1:8004";

const checks = [
  "/",
  "/styles.css",
  "/app.js",
  "/api/reports",
  "/api/cases",
  "/api/insights",
  "/api/opportunities",
  "/api/experiments",
  "/api/crop-models",
  "/api/knowledge-graph",
  "/api/storage/status",
  "/api/notifications",
  "/api/notifications/due"
];

const failures = [];

for (const path of checks) {
  try {
    const response = await fetch(`${base}${path}`);
    if (!response.ok) failures.push(`${path} -> ${response.status}`);
  } catch (error) {
    failures.push(`${path} -> ${error.message}`);
  }
}

try {
  const response = await fetch(`${base}/api/vision/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      photoType: "leaf",
      capturedPhotoTypes: ["plant"],
      context: { cropKey: "tomato", stageKey: "flowering", mediumKey: "xponge", concern: "yellow" },
      signals: { yellowRatio: 0.3, greenRatio: 0.2, darkRatio: 0.1, brightness: 120, contrast: 40, width: 1024, height: 768 }
    })
  });
  if (!response.ok) failures.push(`/api/vision/analyze -> ${response.status}`);
  const payload = await response.json();
  if (!payload.readyForAiProvider || payload.modelInput?.cropKey !== "tomato") {
    failures.push("/api/vision/analyze -> payload mismatch");
  }
} catch (error) {
  failures.push(`/api/vision/analyze -> ${error.message}`);
}

if (failures.length) {
  console.error(`health-check-failed\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("health-check-ok");
