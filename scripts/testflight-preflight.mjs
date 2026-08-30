import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const urlIndex = args.indexOf("--url");
const rawAppUrl = urlIndex >= 0 ? args[urlIndex + 1] : process.env.FIVECROP_APP_URL;

function fail(message, detail = null) {
  console.error(`TestFlight preflight failed: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

if (!rawAppUrl) {
  fail("pass --url with the HTTPS customer app address.");
}

let appURL;
try {
  appURL = new URL(rawAppUrl);
} catch {
  fail("the supplied app URL is invalid.");
}

if (appURL.protocol !== "https:") fail("the TestFlight service must use HTTPS.");
if (appURL.hostname === "replace-me.invalid" || appURL.hostname.endsWith(".example")) {
  fail("replace the placeholder hostname with the deployed FiveCrop service.");
}
if (appURL.searchParams.get("mode") !== "customer") fail("the URL must include mode=customer.");
if (appURL.searchParams.get("runtime") !== "testflight") fail("the URL must include runtime=testflight.");
if (appURL.searchParams.get("realVision") !== "required") {
  fail("the URL must include realVision=required so the app cannot silently use local rules.");
}

async function fetchChecked(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(60000)
    });
  } catch (error) {
    fail(`could not reach ${url.origin}.`, String(error?.message || error));
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    fail(`${url.pathname || "/"} returned HTTP ${response.status}.`, body.slice(0, 300));
  }
  return response;
}

const pageResponse = await fetchChecked(appURL);
const pageHTML = await pageResponse.text();
if (!pageHTML.includes("FiveCrop")) fail("the deployed page does not look like FiveCrop.");

const statusURL = new URL("/api/integrations/status", appURL);
const statusResponse = await fetchChecked(statusURL);
const status = await statusResponse.json();
const visionStatus = status.items?.find((item) => item.key === "vision-ai");
if (visionStatus?.status !== "connected") {
  fail("the deployed service does not report a connected vision provider.", visionStatus?.summary);
}

const imagePath = resolve(process.cwd(), "assets/tomato-diagnosis-preview.jpg");
const imageData = `data:image/jpeg;base64,${(await readFile(imagePath)).toString("base64")}`;
const analysisURL = new URL("/api/vision/analyze", appURL);
const analysisResponse = await fetchChecked(analysisURL, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    imageData,
    fileName: "testflight-preflight-tomato.jpg",
    photoType: "plant",
    context: {
      cropKey: "tomato",
      stageKey: "flowering",
      mediumKey: "soil",
      mode: "testflight-preflight"
    }
  })
});
const analysis = await analysisResponse.json();

if (!analysis.provider || analysis.provider === "local-heuristic-placeholder") {
  fail("the live vision request fell back to local rules.", analysis.aiFallbackReason);
}
if (!analysis.modelInput?.hasImage) fail("the provider result does not confirm image input.");
if (!analysis.model) fail("the provider result does not name the model used.");
if (!Array.isArray(analysis.labels) || !Array.isArray(analysis.observations)) {
  fail("the provider result is missing the expected structured diagnosis fields.");
}

console.log(JSON.stringify({
  ok: true,
  app: appURL.origin,
  visionStatus: visionStatus.status,
  provider: analysis.provider,
  model: analysis.model,
  cropKey: analysis.cropKey,
  confidence: analysis.confidence,
  checkedAt: new Date().toISOString()
}, null, 2));
