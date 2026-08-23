const principal = "fm-lead";
const headers = { "x-dr-forest-principal": principal };
const $ = (selector) => document.querySelector(selector);
function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char])); }
async function api(path, options = {}) { const response = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) }, credentials: "include" }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`); return body; }
function renderAlerts(alerts) { $("#alerts-list").innerHTML = alerts.length ? alerts.slice(0, 6).map((item) => `<article class="insight-item"><div><strong>${escapeHtml(item.metric)} / ${escapeHtml(item.moduleId || item.wallId)}</strong><span>${escapeHtml(item.reason)}</span><small>${escapeHtml(item.status)} | ${escapeHtml(item.lastSeenAt)}</small></div><button data-alert-status="${escapeHtml(item.id)}" data-next-status="${item.status === "open" ? "acknowledged" : "resolved"}">${item.status === "open" ? "Acknowledge" : "Resolve"}</button></article>`).join("") : "<p class=\"empty\">No active alerts.</p>"; }
function renderAiQueue(diagnoses) { const queue = diagnoses.filter((item) => ["queued", "running"].includes(item.status)); $("#ai-list").innerHTML = queue.length ? queue.slice(0, 6).map((item) => `<article class="insight-item"><div><strong>${escapeHtml(item.moduleId)}</strong><span>Capture ${escapeHtml(item.captureId)}</span><small>${escapeHtml(item.status)} | ${escapeHtml(item.requestedBy)}</small></div><span class="module-state warn">${escapeHtml(item.status)}</span></article>`).join("") : "<p class=\"empty\">No queued AI diagnosis.</p>"; }
async function load() {
  $("#notice").textContent = "";
  const [reminders, route, modules, alerts, diagnoses] = await Promise.all([api("/api/mobile/reminders"), api("/api/mobile/route"), api("/api/modules"), api("/api/telemetry/alerts?statuses=open,acknowledged"), api("/api/ai/visual-diagnoses?statuses=queued,running")]);
  const open = reminders.counts?.open ?? reminders.items?.length ?? 0;
  $("#open-count").textContent = open;
  $("#stop-count").textContent = route.route?.length || 0;
  $("#module-count").textContent = modules.modules?.length || 0;
  const deviceGaps = (modules.modules || []).filter((item) => Object.values(item.monitoringDevices || {}).some((device) => device.state === "not_connected") || !(item.latestReadings || []).length).length;
  $("#device-gap-count").textContent = deviceGaps;
  $("#alert-count").textContent = alerts.alerts?.filter((item) => item.status === "open").length || 0;
  $("#ai-count").textContent = diagnoses.diagnoses?.length || 0;
  $("#route-state").textContent = `${route.route?.length || 0} stops`;
  $("#reminder-list").innerHTML = reminders.items?.length ? reminders.items.slice(0, 8).map((item) => `<article class="reminder ${item.priority === "high" || item.priority === "critical" ? "urgent" : ""}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.reason)}</span><small>${escapeHtml(item.due || "Scheduled")}</small></div><a href="${escapeHtml(item.mobileAction?.path || "mobile.html")}">Start</a></article>`).join("") : "<p>No open reminders.</p>";
  $("#route-list").innerHTML = route.route?.length ? route.route.map((stop) => `<article class="route-item"><div><strong>${escapeHtml(stop.assetName || stop.asset?.name || stop.wallId)}</strong><span>${escapeHtml(stop.workOrderId)} · ${escapeHtml(stop.due || "Scheduled")} · ${stop.modules?.length || 0} modules</span></div><a href="mobile.html?workOrderId=${encodeURIComponent(stop.workOrderId)}&wallId=${encodeURIComponent(stop.wallId)}">Open</a></article>`).join("") : "<p>No assigned stops today.</p>";
  $("#modules-list").innerHTML = modules.modules?.length ? modules.modules.slice(0, 20).map((module) => { const hasData = (module.latestReadings || []).length > 0; const gap = Object.values(module.monitoringDevices || {}).some((device) => device.state === "not_connected") || !hasData; return `<article class="module-item"><div><strong>${escapeHtml(module.label)}</strong><span>${escapeHtml(module.assetId)} · ${escapeHtml(module.zone || "No zone")} · ${hasData ? `${module.latestReadings.length}/4 metrics` : "No telemetry yet"}</span></div><span class="module-state ${gap ? "warn" : ""}">${gap ? "Needs setup" : "Connected"}</span></article>`; }).join("") : "<p>No modules registered.</p>";
  renderAlerts(alerts.alerts || []);
  renderAiQueue(diagnoses.diagnoses || []);
}
$("#refresh").onclick = () => load().catch((error) => { $("#notice").textContent = error.message; });
document.addEventListener("click", async (event) => { const button = event.target.closest("[data-alert-status]"); if (!button) return; button.disabled = true; try { await api(`/api/telemetry/alerts/${encodeURIComponent(button.dataset.alertStatus)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus, resolutionNote: "Handled from Today operations queue." }) }); await load(); } catch (error) { $("#notice").textContent = error.message; button.disabled = false; } });
load().catch((error) => { $("#notice").textContent = error.message; });
