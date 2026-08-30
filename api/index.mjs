if (process.env.VERCEL && !process.env.GROW_CLINIC_DATA_DIR) {
  process.env.GROW_CLINIC_DATA_DIR = "/tmp/fivecrop-data";
}

const { server } = await import("../server.mjs");

export default function handler(req, res) {
  const segments = Array.isArray(req.query?.fivecropPath)
    ? req.query.fivecropPath
    : String(req.query?.fivecropPath || "").split("/");
  const path = segments.filter(Boolean).map(encodeURIComponent).join("/");
  const requestURL = new URL(req.url || "/", "https://fivecrop.local");
  requestURL.searchParams.delete("fivecropPath");
  const query = requestURL.searchParams.toString();
  req.url = `/api/${path}${query ? `?${query}` : ""}`;
  server.emit("request", req, res);
}
