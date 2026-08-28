const principal = "field-tech-show-suite";
const queueKey = "dr-forest.field-capture.queue.v3";
const routeSnapshotKey = "dr-forest.field-route.snapshot.v1";
const queueLimit = 20;
let route = [];
let reminders = [];
let remediationTasks = [];
let routeKit = { locations: [], balances: [], summary: {} };
let selected = null;
let activeReminder = null;
let activeRemediationTask = null;
let selectedModule = null;

const $ = (selector) => document.querySelector(selector);
const headers = { "Content-Type": "application/json", "x-dr-forest-principal": principal };
const query = new URLSearchParams(location.search);

function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char])); }
function queueItems() {
  try {
    const value = JSON.parse(localStorage.getItem(queueKey) || "[]");
    return Array.isArray(value) ? value.map((item) => ({ ...item, attempts: Number(item.attempts || 0) })) : [];
  } catch { return []; }
}
function saveQueue(items) {
  try { localStorage.setItem(queueKey, JSON.stringify(items)); }
  catch { const error = new Error("Offline queue storage is full. Sync or remove a pending photo first."); error.code = "MOBILE_QUEUE_STORAGE_FULL"; throw error; }
  renderQueue();
}
function routeSnapshot() {
  try {
    const value = JSON.parse(localStorage.getItem(routeSnapshotKey) || "null");
    return value && Array.isArray(value.route) && Array.isArray(value.reminders) ? { ...value, remediationTasks: Array.isArray(value.remediationTasks) ? value.remediationTasks : [], routeKit: value.routeKit || { locations: [], balances: [], summary: {} } } : null;
  } catch { return null; }
}
function saveRouteSnapshot(nextRoute, nextReminders, counts, nextRemediationTasks = [], nextRouteKit = {}) {
  try {
    localStorage.setItem(routeSnapshotKey, JSON.stringify({ savedAt: new Date().toISOString(), route: nextRoute, reminders: nextReminders, remediationTasks: nextRemediationTasks, routeKit: nextRouteKit, counts }));
  } catch { /* Route cache is a convenience; the capture queue remains the durable local workflow. */ }
}
function enqueue(item, lastError = null) {
  const existing = queueItems().find((queued) => queued.id === item.id);
  const next = {
    ...item,
    attempts: Number(existing?.attempts || 0) + (lastError ? 1 : 0),
    lastError: lastError || null,
    lastAttemptAt: lastError ? new Date().toISOString() : (existing?.lastAttemptAt || null),
    queuedAt: existing?.queuedAt || item.queuedAt || new Date().toISOString()
  };
  const remaining = queueItems().filter((queued) => queued.id !== item.id);
  if (remaining.length >= queueLimit) throw new Error(`Offline queue is full (${queueLimit} records)`);
  saveQueue([...remaining, next]);
}
function setState(message, tone = "") { const el = $("#sync-state"); el.textContent = message; el.className = `state ${tone}`; }
function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function observedLabel(reading) {
  const value = reading?.observedAt || reading?.lastSeenAt;
  if (!value) return "no data";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "time unknown" : `last ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

async function json(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

async function load() {
  setState(navigator.onLine ? "Loading" : "Offline · cached route");
  let liveRoute = true;
  try {
    const [routeBody, reminderBody, remediationBody, routeKitBody] = await Promise.all([
      json(`/api/mobile/route`, { headers }),
      json(`/api/mobile/reminders`, { headers }),
      json(`/api/mobile/remediation-tasks?statuses=open,assigned,in_progress`, { headers }),
      json(`/api/mobile/route-kit`, { headers })
    ]);
    route = routeBody.route || [];
    reminders = reminderBody.items || [];
    remediationTasks = remediationBody.tasks || [];
    routeKit = routeKitBody;
    saveRouteSnapshot(route, reminders, reminderBody.counts || {}, remediationTasks, routeKit);
    renderRoute();
    renderReminders(reminderBody.counts || {});
    renderRemediationTasks();
    renderRouteKit();
    setState(queueItems().length ? `Ready · ${queueItems().length} pending` : "Ready");
  } catch (error) {
    const cached = routeSnapshot();
    if (!cached) throw error;
    liveRoute = false;
    route = cached.route;
    reminders = cached.reminders;
    remediationTasks = cached.remediationTasks || [];
    routeKit = cached.routeKit || { locations: [], balances: [], summary: {} };
    renderRoute();
    renderReminders(cached.counts || {});
    renderRemediationTasks();
    renderRouteKit();
    setState(navigator.onLine ? "Cached route · service unavailable" : "Offline · cached route", "error");
  }
  const workOrderId = query.get("workOrderId");
  if (workOrderId) {
    const reminder = reminders.find((item) => item.workorderId === workOrderId) || null;
    const stop = route.find((item) => item.workOrderId === workOrderId);
    if (stop) selectStop(stop, reminder, false);
  }
  return liveRoute;
}

function renderRouteKit() {
  const ownLocation = (routeKit.locations || []).find((item) => item.kind === "technician-kit" && item.technicianId === principal);
  const balances = (routeKit.balances || []).filter((item) => item.locationId === ownLocation?.id);
  const low = balances.filter((item) => item.lowStock).length;
  $("#route-kit-state").textContent = ownLocation ? `${low} low` : "Not configured";
  $("#route-kit-list").innerHTML = balances.length ? balances.map((item) => `<div class="route-kit-item ${item.lowStock ? "low" : ""}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.available)} ${escapeHtml(item.unit)} available${item.reserved ? ` · ${escapeHtml(item.reserved)} reserved` : ""}</span></div>`).join("") : "<p>No route-kit stock is recorded.</p>";
}

function remediationStatusLabel(status) { return String(status || "open").replaceAll("_", " "); }
function mergeRemediationTask(task, update) { return { ...task, ...update, module: update.module || task.module, mobileAction: update.mobileAction || task.mobileAction }; }
function renderRemediationTasks() {
  $("#remediation-count").textContent = `${remediationTasks.length} open`;
  const list = $("#remediation-list");
  list.innerHTML = remediationTasks.length ? remediationTasks.slice(0, 8).map((task) => {
    const moduleLabel = task.module?.label || task.moduleId;
    const reason = (task.reasons || []).join(" · ");
    const awaitingReview = task.reviewStatus === "pending";
    const action = awaitingReview ? "Awaiting FM review" : task.status === "in_progress" ? "Continue" : task.reviewStatus === "rejected" ? "Resume task" : "Start task";
    const reviewDetail = awaitingReview ? ` · submitted ${escapeHtml(task.submittedAt ? new Date(task.submittedAt).toLocaleString() : "now")}` : task.reviewStatus === "rejected" ? ` · FM rejected${task.reviewNote ? `: ${escapeHtml(task.reviewNote)}` : ""}` : "";
    return `<article class="remediation-item ${activeRemediationTask?.id === task.id ? "active" : ""}"><div><strong>${escapeHtml(moduleLabel)}</strong><span>${escapeHtml(reason)}</span><small>${task.workOrderId ? `WO ${escapeHtml(task.workOrderId)} · ` : "No active WO · "}${escapeHtml(remediationStatusLabel(task.status))} · ${escapeHtml(task.priority)}${reviewDetail}${task.dueAt ? ` · due ${escapeHtml(new Date(task.dueAt).toLocaleString())}` : ""}</small></div><button type="button" data-remediation-start="${escapeHtml(task.id)}" ${awaitingReview ? "disabled" : ""}>${action}</button></article>`;
  }).join("") : "<p>No assigned module tasks.</p>";
  list.querySelectorAll("[data-remediation-start]").forEach((button) => button.addEventListener("click", () => {
    const task = remediationTasks.find((item) => item.id === button.dataset.remediationStart);
    if (task) startRemediationTask(task).catch((error) => setState(error.message, "error"));
  }));
}

async function startRemediationTask(task) {
  if (task.reviewStatus === "pending") { setState("Awaiting independent FM review"); return; }
  activeRemediationTask = task;
  if (["open", "assigned"].includes(task.status)) {
    const result = await json(`/api/mobile/remediation-tasks/${encodeURIComponent(task.id)}`, { method: "PATCH", headers, body: JSON.stringify({ status: "in_progress" }) });
    activeRemediationTask = mergeRemediationTask(task, result.task);
    remediationTasks = remediationTasks.map((item) => item.id === task.id ? mergeRemediationTask(item, result.task) : item);
  }
  const stop = task.workOrderId ? route.find((item) => item.workOrderId === task.workOrderId) : route.find((item) => item.wallId === task.wallId);
  if (!stop) throw new Error("No route stop is available for this module task");
  await selectStop(stop, null, true, true);
  $("#module").value = task.moduleId;
  await loadModuleStatus();
  renderRemediationTasks();
}

function renderReminders(counts) {
  $("#reminder-count").textContent = `${counts.open ?? reminders.length} open`;
  const list = $("#reminder-list");
  list.innerHTML = reminders.length ? reminders.slice(0, 8).map((item) => `
    <article class="reminder ${item.priority === "high" || item.priority === "critical" ? "urgent" : ""}">
      <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.reason)}</span><small>${escapeHtml(item.due || "Scheduled")} · ${escapeHtml(item.mobileAction?.label || "Phone action")}</small></div>
      <button type="button" data-reminder="${escapeHtml(item.id)}">Start</button>
    </article>`).join("") : "<p>No open reminders.</p>";
  list.querySelectorAll("[data-reminder]").forEach((button) => button.addEventListener("click", () => {
    const reminder = reminders.find((item) => item.id === button.dataset.reminder);
    const stop = route.find((item) => item.workOrderId === reminder?.workorderId);
    if (stop) selectStop(stop, reminder);
  }));
}

function renderRoute() {
  const list = $("#route-list");
  list.innerHTML = route.length ? "" : "<p>No assigned stops today.</p>";
  route.forEach((stop) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `stop ${selected?.workOrderId === stop.workOrderId ? "active" : ""}`;
    const signals = stop.signals || {};
    const signalText = [signals.openIncidents ? `${signals.openIncidents} incident${signals.openIncidents === 1 ? "" : "s"}` : "", signals.activeSensorAlerts ? `${signals.activeSensorAlerts} sensor alert${signals.activeSensorAlerts === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ") || "No open signals";
    button.innerHTML = `<strong>${escapeHtml(stop.assetName || stop.asset?.name || stop.wallId)}</strong><span>${escapeHtml(stop.workOrderId)} · ${escapeHtml(stop.clientName || stop.client?.name || stop.clientId)}</span><span>${escapeHtml(stop.due || "Scheduled")} · ${escapeHtml(stop.priority || "normal")} · ${stop.modules?.length || 0} modules</span><small class="stop-signal ${signalText === "No open signals" ? "quiet" : "attention"}">${escapeHtml(signalText)}</small>`;
    button.onclick = () => { activeRemediationTask = null; selectStop(stop, reminders.find((item) => item.workorderId === stop.workOrderId && item.sourceType === "workorder")); renderRemediationTasks(); };
    list.append(button);
  });
}

async function selectStop(stop, reminder = null, scroll = true, preserveRemediation = false) {
  if (!preserveRemediation) activeRemediationTask = null;
  selected = stop;
  activeReminder = reminder;
  $("#capture-form").hidden = false;
  $("#asset-title").textContent = stop.assetName || stop.asset?.name || stop.wallId;
  $("#work-order").textContent = stop.workOrderId;
  const signals = stop.signals || {};
  $("#capture-context").innerHTML = `<span>${escapeHtml(stop.clientName || stop.client?.name || stop.clientId)} · ${escapeHtml(stop.asset?.location || "Location not set")}</span><span class="${signals.openIncidents || signals.activeSensorAlerts ? "attention" : "quiet"}">${signals.openIncidents || signals.activeSensorAlerts ? `${signals.openIncidents || 0} incidents · ${signals.activeSensorAlerts || 0} sensor alerts` : "No open signals"}</span>`;
  const moduleSelect = $("#module");
  moduleSelect.innerHTML = `<option value="">Whole wall / no module</option>` + (stop.modules || []).map((module) => `<option value="${escapeHtml(module.id)}">${escapeHtml(module.label)}${module.zone ? ` · ${escapeHtml(module.zone)}` : ""}</option>`).join("");
  const moduleFromUrl = query.get("moduleId");
  if (moduleFromUrl && (stop.modules || []).some((module) => module.id === moduleFromUrl)) moduleSelect.value = moduleFromUrl;
  await loadModuleStatus();
  if (activeReminder) acknowledgeReminder(activeReminder).catch(() => {});
  renderRoute();
  if (scroll) window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

async function loadModuleStatus() {
  const moduleId = $("#module").value;
  selectedModule = selected?.modules?.find((module) => module.id === moduleId) || null;
  if (!moduleId || !selected) {
    $("#module-status").innerHTML = "<span>No module selected</span>";
    return;
  }
  renderModuleStatus();
  try {
    const body = await json(`/api/modules?wallId=${encodeURIComponent(selected.wallId)}`, { headers });
    selectedModule = (body.modules || []).find((module) => module.id === moduleId) || null;
    renderModuleStatus();
  } catch {
    renderModuleStatus();
  }
}

function renderModuleStatus() {
  if (!selectedModule) {
    $("#module-status").innerHTML = "<span>Module data unavailable</span>";
    return;
  }
  const byMetric = new Map((selectedModule.latestReadings || []).map((reading) => [reading.metric, reading]));
  $("#module-status").innerHTML = [
    ["TEMP", "temperature", "C"], ["RH", "humidity", "%"], ["CO2", "co2", "ppm"], ["MC", "mc", "MC"]
  ].map(([label, metric, unit]) => { const reading = byMetric.get(metric); const status = String(reading?.status || "no-data").replace(/[^a-z-]/gi, "").toLowerCase(); return `<span class="reading-${status}"><b>${label}</b><strong>${reading ? `${escapeHtml(reading.value)} ${unit}` : "--"}</strong><small>${reading ? `${escapeHtml(reading.status || "unknown")} · ${escapeHtml(observedLabel(reading))}` : "no data"}</small></span>`; }).join("");
}

async function acknowledgeReminder(reminder) {
  await json("/api/mobile/reminder-actions", { method: "POST", headers, body: JSON.stringify({ reminderId: reminder.id, status: "acknowledged", actionType: reminder.mobileAction.actionType, clientId: reminder.clientId, wallId: reminder.wallId, workorderId: reminder.workorderId }) });
}

function renderQueue() {
  const items = queueItems();
  $("#queue-count").textContent = items.length;
  $("#queue-list").innerHTML = items.length ? items.map((item) => {
    const status = item.lastError ? `retry ${item.attempts} · ${item.lastError}` : (item.attempts ? `${item.attempts} retry` : "pending");
    const retry = item.lastError ? `<button type="button" class="secondary queue-retry" data-retry="${escapeHtml(item.id)}">Retry</button>` : "";
    return `<div class="queue-item"><div><strong>${escapeHtml(item.stop?.assetName || item.stop?.wallId || "Unknown stop")}</strong><br>${escapeHtml(new Date(item.createdAt).toLocaleString())} · ${item.photo ? "photo pending" : "record pending"}${item.exception ? " · exception" : ""}${item.remediationTaskId ? " · module task" : ""}<br><small>${escapeHtml(status)}</small></div>${retry}</div>`;
  }).join("") : "<p>Nothing waiting to sync.</p>";
  $("#queue-list").querySelectorAll("[data-retry]").forEach((button) => button.addEventListener("click", () => flushQueue([button.dataset.retry])));
}

function toBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); }); }
async function createPayload() {
  if (!selected) throw new Error("Choose a stop first");
  const photoFile = $("#photo").files[0] || null;
  if (photoFile && photoFile.size > 2 * 1024 * 1024) throw new Error("Photo exceeds the 2 MB offline pilot limit");
  const exception = $("#exception").checked;
  const notes = $("#notes").value.trim();
  if (exception && !notes) throw new Error("Add a short note before saving an exception");
  return {
    id: id("MCB"),
    createdAt: new Date().toISOString(),
    queuedAt: new Date().toISOString(),
    stop: selected,
    reminder: activeReminder ? { id: activeReminder.id, actionType: activeReminder.mobileAction?.actionType || "visit-record" } : null,
    moduleId: $("#module").value || null,
    latestReadings: selectedModule?.latestReadings || [],
    water: $("#water").value,
    nutrient: $("#nutrient").value,
    replacementPods: $("#replacement-pods").value,
    xpongeSleeves: $("#xponge-sleeves").value,
    health: $("#health").value,
    notes,
    exception,
    remediationTaskId: activeRemediationTask?.id || null,
    photo: photoFile ? { name: photoFile.name, type: photoFile.type, base64: await toBase64(photoFile) } : null
  };
}
async function sha256(base64) { const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)); const hash = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

async function sync(item) {
  const photoItemId = `${item.id}-ITEM-1`;
  const mediaId = `${item.id}-PM`;
  const items = [
    { type: "photo", label: "Field proof photo", value: item.photo ? "pending proof upload" : "no photo", metadata: { moduleId: item.moduleId, source: "technician-camera" } },
    { type: "water", label: "Water added", value: item.water, unit: "L" },
    { type: "nutrient", label: "Nutrient added", value: item.nutrient, unit: "ml" },
    { type: "health-check", label: "Visual health score", value: item.health, unit: "score", metadata: { moduleId: item.moduleId, telemetry: item.latestReadings || [] } }
  ];
  if (item.exception) items.push({ type: "exception", label: "Exception follow-up", value: item.notes, metadata: { moduleId: item.moduleId, source: "technician-mobile" } });
  const consumables = [
    { sku: "NUT-A", quantity: Number(item.nutrient || 0) },
    { sku: "POD-S", quantity: Number(item.replacementPods || 0) },
    { sku: "XSP-90", quantity: Number(item.xpongeSleeves || 0) }
  ].filter((entry) => entry.quantity > 0);
  const capture = { id: item.id, technicianId: principal, clientId: item.stop.clientId, wallId: item.stop.wallId, moduleId: item.moduleId, workorderId: item.stop.workOrderId, deviceId: "field-browser", capturedAt: item.createdAt, notes: item.notes, consumables, items };
  const captureResult = await json("/api/mobile/capture-batches", { method: "POST", headers, body: JSON.stringify(capture) });
  if (item.photo) {
    const bytes = Uint8Array.from(atob(item.photo.base64), (c) => c.charCodeAt(0));
    const media = { id: mediaId, clientId: item.stop.clientId, wallId: item.stop.wallId, moduleId: item.moduleId, workorderId: item.stop.workOrderId, captureBatchId: item.id, captureItemId: photoItemId, category: "visit-photo", filename: item.photo.name || "field-photo.jpg", contentType: item.photo.type, byteSize: bytes.length, sha256: await sha256(item.photo.base64), source: "technician-mobile", metadata: { privacy: "plant-zone-only", capturedOffline: true, cameraDevice: "technician-phone" } };
    await json("/api/proof/media-intents", { method: "POST", headers, body: JSON.stringify(media) });
    await json(`/api/proof/media-evidence/${encodeURIComponent(mediaId)}/upload`, { method: "POST", headers, body: JSON.stringify({ fileBase64: item.photo.base64, uploadedAt: item.createdAt }) });
  }
  if (item.reminder?.id) await json("/api/mobile/reminder-actions", { method: "POST", headers, body: JSON.stringify({ reminderId: item.reminder.id, status: "completed", actionType: item.reminder.actionType || "visit-record", clientId: item.stop.clientId, wallId: item.stop.wallId, workorderId: item.stop.workOrderId, moduleId: item.moduleId, captureBatchId: item.id, note: "Completed from technician mobile capture." }) });
  if (item.remediationTaskId) {
    const currentTask = remediationTasks.find((task) => task.id === item.remediationTaskId) || activeRemediationTask || {};
    const result = await json(`/api/mobile/remediation-tasks/${encodeURIComponent(item.remediationTaskId)}`, { method: "PATCH", headers, body: JSON.stringify({ submitForReview: true, resolutionNote: item.notes || "Completion evidence submitted from technician mobile capture.", evidenceRef: item.photo ? mediaId : item.id }) });
    activeRemediationTask = null;
    remediationTasks = remediationTasks.map((task) => task.id === item.remediationTaskId ? mergeRemediationTask(currentTask, result.task) : task);
    renderRemediationTasks();
    return { ...result, inventory: captureResult.inventory };
  }
  return captureResult;
}

async function submit(offlineOnly = false) {
  let item = null;
  try {
    item = await createPayload();
    if (offlineOnly) { enqueue(item); setState("Saved offline"); return; }
    setState("Syncing"); const result = await sync(item); $("#capture-form").reset(); clearPhotoPreview(); await load(); setState(result?.inventory?.status === "exception" ? `Visit saved · stock review: ${result.inventory.message}` : "Synced", result?.inventory?.status === "exception" ? "error" : "");
  } catch (error) {
    if (!offlineOnly && item && selected) { try { enqueue(item, error.message); } catch (queueError) { setState(queueError.message, "error"); return; } }
    setState(error.message || "Saved offline", "error");
  }
}

async function flushQueue(onlyIds = null) {
  const pending = queueItems(); if (!pending.length) return;
  const selectedIds = onlyIds ? new Set(onlyIds) : null;
  const toSync = selectedIds ? pending.filter((item) => selectedIds.has(item.id)) : pending;
  const remaining = selectedIds ? pending.filter((item) => !selectedIds.has(item.id)) : [];
  setState(`Syncing ${toSync.length}`);
  for (const item of toSync) { try { await sync(item); } catch (error) { remaining.push({ ...item, attempts: Number(item.attempts || 0) + 1, lastError: error.message, lastAttemptAt: new Date().toISOString() }); } }
  saveQueue(remaining); setState(remaining.length ? `${remaining.length} pending` : "Queue synced", remaining.length ? "error" : "");
}

let photoPreviewUrl = null;
function clearPhotoPreview() {
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;
  $("#photo-preview").hidden = true;
  $("#photo-preview-image").removeAttribute("src");
}
$("#photo").addEventListener("change", () => {
  clearPhotoPreview();
  const file = $("#photo").files[0];
  if (!file) return;
  photoPreviewUrl = URL.createObjectURL(file);
  $("#photo-preview-image").src = photoPreviewUrl;
  $("#photo-preview").hidden = false;
});
$("#clear-photo").onclick = () => { $("#photo").value = ""; clearPhotoPreview(); };

$("#capture-form").addEventListener("submit", (event) => { event.preventDefault(); submit(false); });
$("#queue").onclick = () => submit(true);
$("#module").onchange = () => loadModuleStatus();
$("#refresh").onclick = () => load().catch((error) => setState(error.message, "error"));
$("#flush-queue").onclick = () => flushQueue();
window.addEventListener("online", () => load().then((loaded) => loaded ? flushQueue() : null).catch((error) => setState(error.message, "error")));
window.addEventListener("offline", () => setState("Offline · save locally", "error"));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/mobile-service-worker.js").catch(() => {});
renderQueue(); load().then((loaded) => loaded ? flushQueue() : null).catch((error) => setState(error.message, "error"));
