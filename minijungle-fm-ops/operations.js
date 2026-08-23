const principal = "fm-lead";
const headers = { "x-dr-forest-principal": principal };
const $ = (selector) => document.querySelector(selector);
function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char])); }
async function api(path, options = {}) { const response = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) }, credentials: "include" }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`); return body; }
function formatTime(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? String(value || "Unknown time") : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function routeForWall(route, wallId) { return (route || []).find((stop) => stop.wallId === wallId) || null; }
function fieldLink(stop, moduleId = null) { if (!stop) return "mobile.html"; const params = new URLSearchParams({ workOrderId: stop.workOrderId, wallId: stop.wallId }); if (moduleId) params.set("moduleId", moduleId); return `mobile.html?${params.toString()}`; }
function renderAlerts(alerts, route) {
  $("#alerts-list").innerHTML = alerts.length ? alerts.slice(0, 6).map((item) => {
    const stop = routeForWall(route, item.wallId);
    const location = item.moduleId || item.wallId;
    const action = item.status === "open" ? "Acknowledge" : "Resolve";
    return `<article class="insight-item"><div><strong>${escapeHtml(item.metric)} ${escapeHtml(item.value)}${item.unit ? ` ${escapeHtml(item.unit)}` : ""} / ${escapeHtml(location)}</strong><span>${escapeHtml(item.reason)}</span><small>${escapeHtml(item.status)} · ${escapeHtml(item.occurrenceCount || 1)} occurrence${item.occurrenceCount === 1 ? "" : "s"} · last ${escapeHtml(formatTime(item.lastSeenAt))}</small><a class="inline-link" href="${escapeHtml(fieldLink(stop, item.moduleId))}">Open field context</a></div><button data-alert-status="${escapeHtml(item.id)}" data-next-status="${item.status === "open" ? "acknowledged" : "resolved"}">${action}</button></article>`;
  }).join("") : "<p class=\"empty\">No active alerts.</p>";
}
function renderAiQueue(diagnoses) { const queue = diagnoses.filter((item) => ["queued", "running"].includes(item.status)); $("#ai-list").innerHTML = queue.length ? queue.slice(0, 6).map((item) => `<article class="insight-item"><div><strong>${escapeHtml(item.moduleId)}</strong><span>Capture ${escapeHtml(item.captureId)}</span><small>${escapeHtml(item.status)} · requested by ${escapeHtml(item.requestedBy)} · result pending provider</small></div><span class="module-state warn">${escapeHtml(item.status)}</span></article>`).join("") : "<p class=\"empty\">No queued AI diagnosis.</p>"; }
function renderCaptures(batches) {
  $("#capture-list").innerHTML = batches.length ? batches.slice(0, 8).map((batch) => {
    const items = batch.items || [];
    const hasPhoto = items.some((item) => item.type === "photo" && item.value !== "no photo");
    const hasException = items.some((item) => item.type === "exception");
    const moduleLabel = batch.moduleId ? ` · ${batch.moduleId}` : " · whole wall";
    return `<article class="capture-item"><div><strong>${escapeHtml(batch.wallId)}${escapeHtml(moduleLabel)}</strong><span>${escapeHtml(batch.workorderId)} · ${escapeHtml(batch.technicianId)} · ${escapeHtml(formatTime(batch.capturedAt))}</span><small>${items.length} capture items · ${hasPhoto ? "photo" : "no photo"}${hasException ? " · exception" : ""}</small></div><span class="module-state ${hasException ? "warn" : ""}">${escapeHtml(batch.syncStatus || "synced")}</span></article>`;
  }).join("") : "<p class=\"empty\">No technician records synced yet.</p>";
}
function notificationLabel(item) { return item.eventType === "mobile.capture.exception" ? "Field exception" : item.eventType === "telemetry.alert.opened" ? "Sensor alert" : item.eventType; }
function renderNotifications(notifications, summary = {}) {
  const due = Number(summary.due || 0);
  $("#notification-count").textContent = due;
  $("#notification-state").textContent = `${due} due · ${Number(summary.failed || 0)} failed`;
  $("#notification-list").innerHTML = notifications.length ? notifications.slice(0, 8).map((item) => `<article class="notification-item"><div><strong>${escapeHtml(notificationLabel(item))} · ${escapeHtml(item.wallId || item.clientId || "platform")}</strong><span>${escapeHtml(item.status)} · ${escapeHtml(item.severity)} · ${escapeHtml(item.attempts)} attempt${item.attempts === 1 ? "" : "s"}</span><small>${escapeHtml(item.lastError ? `Last error: ${item.lastError}` : item.deliveredAt ? `Delivered ${formatTime(item.deliveredAt)}` : `Next attempt ${formatTime(item.nextAttemptAt)}`)}</small></div><span class="module-state ${["failed", "retry"].includes(item.status) ? "warn" : ""}">${escapeHtml(item.status)}</span></article>`).join("") : "<p class=\"empty\">No outbound notifications yet.</p>";
}
async function load() {
  $("#notice").textContent = "";
  const [reminders, route, modules, alerts, diagnoses, captures, notifications] = await Promise.all([api("/api/mobile/reminders"), api("/api/mobile/route"), api("/api/modules"), api("/api/telemetry/alerts?statuses=open,acknowledged"), api("/api/ai/visual-diagnoses?statuses=queued,running"), api("/api/mobile/capture-batches"), api("/api/notifications?limit=20")]);
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
  renderAlerts(alerts.alerts || [], route.route || []);
  renderAiQueue(diagnoses.diagnoses || []);
  renderCaptures(captures.batches || []);
  renderNotifications(notifications.notifications || [], notifications.summary || {});
}
$("#refresh").onclick = () => load().catch((error) => { $("#notice").textContent = error.message; });
document.addEventListener("click", async (event) => { const button = event.target.closest("[data-alert-status]"); if (!button) return; button.disabled = true; try { await api(`/api/telemetry/alerts/${encodeURIComponent(button.dataset.alertStatus)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus, resolutionNote: "Handled from Today operations queue." }) }); await load(); } catch (error) { $("#notice").textContent = error.message; button.disabled = false; } });
load().catch((error) => { $("#notice").textContent = error.message; });
