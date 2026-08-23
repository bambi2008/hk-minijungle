const principal = "field-tech-show-suite";
const queueKey = "dr-forest.field-capture.queue.v3";
const queueLimit = 20;
let route = [];
let reminders = [];
let selected = null;
let activeReminder = null;
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

async function json(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

async function load() {
  setState("Loading");
  const [routeBody, reminderBody] = await Promise.all([
    json(`/api/mobile/route`, { headers }),
    json(`/api/mobile/reminders`, { headers })
  ]);
  route = routeBody.route || [];
  reminders = reminderBody.items || [];
  renderRoute();
  renderReminders(reminderBody.counts || {});
  setState("Ready");
  const workOrderId = query.get("workOrderId");
  if (workOrderId) {
    const reminder = reminders.find((item) => item.workorderId === workOrderId) || null;
    const stop = route.find((item) => item.workOrderId === workOrderId);
    if (stop) selectStop(stop, reminder, false);
  }
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
    button.innerHTML = `<strong>${escapeHtml(stop.assetName || stop.asset?.name || stop.wallId)}</strong><span>${escapeHtml(stop.workOrderId)} · ${escapeHtml(stop.clientName || stop.client?.name || stop.clientId)}</span><span>${escapeHtml(stop.due || "Scheduled")} · ${escapeHtml(stop.priority || "normal")} · ${stop.modules?.length || 0} modules</span>`;
    button.onclick = () => selectStop(stop, reminders.find((item) => item.workorderId === stop.workOrderId && item.sourceType === "workorder"));
    list.append(button);
  });
}

async function selectStop(stop, reminder = null, scroll = true) {
  selected = stop;
  activeReminder = reminder;
  $("#capture-form").hidden = false;
  $("#asset-title").textContent = stop.assetName || stop.asset?.name || stop.wallId;
  $("#work-order").textContent = stop.workOrderId;
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
  selectedModule = null;
  if (!moduleId || !selected) {
    $("#module-status").innerHTML = "<span>No module selected</span>";
    return;
  }
  try {
    const body = await json(`/api/modules?wallId=${encodeURIComponent(selected.wallId)}`, { headers });
    selectedModule = (body.modules || []).find((module) => module.id === moduleId) || null;
    const byMetric = new Map((selectedModule?.latestReadings || []).map((reading) => [reading.metric, reading]));
    $("#module-status").innerHTML = [
      ["TEMP", "temperature", "C"], ["RH", "humidity", "%"], ["CO2", "co2", "ppm"], ["MC", "mc", "MC"]
    ].map(([label, metric, unit]) => { const reading = byMetric.get(metric); return `<span><b>${label}</b><strong>${reading ? `${escapeHtml(reading.value)} ${unit}` : "--"}</strong><small>${reading ? escapeHtml(reading.status) : "no data"}</small></span>`; }).join("");
  } catch {
    $("#module-status").innerHTML = "<span>Module data unavailable</span>";
  }
}

async function acknowledgeReminder(reminder) {
  await json("/api/mobile/reminder-actions", { method: "POST", headers, body: JSON.stringify({ reminderId: reminder.id, status: "acknowledged", actionType: reminder.mobileAction.actionType, clientId: reminder.clientId, wallId: reminder.wallId, workorderId: reminder.workorderId }) });
}

function renderQueue() {
  const items = queueItems();
  $("#queue-count").textContent = items.length;
  $("#queue-list").innerHTML = items.length ? items.map((item) => {
    const status = item.lastError ? `retry ${item.attempts} · ${item.lastError}` : (item.attempts ? `${item.attempts} retry` : "pending");
    return `<div class="queue-item"><strong>${escapeHtml(item.stop.wallId)}</strong><br>${escapeHtml(new Date(item.createdAt).toLocaleString())} · ${item.photo ? "photo pending" : "record pending"}<br><small>${escapeHtml(status)}</small></div>`;
  }).join("") : "<p>Nothing waiting to sync.</p>";
}

function toBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); }); }
async function createPayload() {
  if (!selected) throw new Error("Choose a stop first");
  const photoFile = $("#photo").files[0] || null;
  if (photoFile && photoFile.size > 2 * 1024 * 1024) throw new Error("Photo exceeds the 2 MB offline pilot limit");
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
    health: $("#health").value,
    notes: $("#notes").value.trim(),
    photo: photoFile ? { name: photoFile.name, type: photoFile.type, base64: await toBase64(photoFile) } : null
  };
}
async function sha256(base64) { const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)); const hash = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""); }

async function sync(item) {
  const photoItemId = `${item.id}-ITEM-1`;
  const mediaId = `${item.id}-PM`;
  const capture = { id: item.id, technicianId: principal, clientId: item.stop.clientId, wallId: item.stop.wallId, moduleId: item.moduleId, workorderId: item.stop.workOrderId, deviceId: "field-browser", capturedAt: item.createdAt, notes: item.notes, items: [
    { type: "photo", label: "Field proof photo", value: item.photo ? "pending proof upload" : "no photo", metadata: { moduleId: item.moduleId, source: "technician-camera" } },
    { type: "water", label: "Water added", value: item.water, unit: "L" },
    { type: "nutrient", label: "Nutrient added", value: item.nutrient, unit: "ml" },
    { type: "health-check", label: "Visual health score", value: item.health, unit: "score", metadata: { moduleId: item.moduleId, telemetry: item.latestReadings || [] } }
  ] };
  await json("/api/mobile/capture-batches", { method: "POST", headers, body: JSON.stringify(capture) });
  if (item.photo) {
    const bytes = Uint8Array.from(atob(item.photo.base64), (c) => c.charCodeAt(0));
    const media = { id: mediaId, clientId: item.stop.clientId, wallId: item.stop.wallId, moduleId: item.moduleId, workorderId: item.stop.workOrderId, captureBatchId: item.id, captureItemId: photoItemId, category: "visit-photo", filename: item.photo.name || "field-photo.jpg", contentType: item.photo.type, byteSize: bytes.length, sha256: await sha256(item.photo.base64), source: "technician-mobile", metadata: { privacy: "plant-zone-only", capturedOffline: true, cameraDevice: "technician-phone" } };
    await json("/api/proof/media-intents", { method: "POST", headers, body: JSON.stringify(media) });
    await json(`/api/proof/media-evidence/${encodeURIComponent(mediaId)}/upload`, { method: "POST", headers, body: JSON.stringify({ fileBase64: item.photo.base64, uploadedAt: item.createdAt }) });
  }
  if (item.reminder?.id) await json("/api/mobile/reminder-actions", { method: "POST", headers, body: JSON.stringify({ reminderId: item.reminder.id, status: "completed", actionType: item.reminder.actionType || "visit-record", clientId: item.stop.clientId, wallId: item.stop.wallId, workorderId: item.stop.workOrderId, moduleId: item.moduleId, captureBatchId: item.id, note: "Completed from technician mobile capture." }) });
}

async function submit(offlineOnly = false) {
  let item = null;
  try {
    item = await createPayload();
    if (offlineOnly) { enqueue(item); setState("Saved offline"); return; }
    setState("Syncing"); await sync(item); setState("Synced"); $("#capture-form").reset(); await load();
  } catch (error) {
    if (!offlineOnly && item && selected) { try { enqueue(item, error.message); } catch (queueError) { setState(queueError.message, "error"); return; } }
    setState(error.message || "Saved offline", "error");
  }
}

async function flushQueue() {
  const pending = queueItems(); if (!pending.length) return;
  setState(`Syncing ${pending.length}`); const remaining = [];
  for (const item of pending) { try { await sync(item); } catch (error) { remaining.push({ ...item, attempts: Number(item.attempts || 0) + 1, lastError: error.message, lastAttemptAt: new Date().toISOString() }); } }
  saveQueue(remaining); setState(remaining.length ? `${remaining.length} pending` : "Queue synced", remaining.length ? "error" : "");
}

$("#capture-form").addEventListener("submit", (event) => { event.preventDefault(); submit(false); });
$("#queue").onclick = () => submit(true);
$("#module").onchange = () => loadModuleStatus();
$("#refresh").onclick = () => load().catch((error) => setState(error.message, "error"));
$("#flush-queue").onclick = () => flushQueue();
window.addEventListener("online", flushQueue);
window.addEventListener("offline", () => setState("Offline · save locally", "error"));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/mobile-service-worker.js").catch(() => {});
renderQueue(); load().then(flushQueue).catch((error) => setState(error.message, "error"));
