const principal = "fm-lead";
const headers = { "x-dr-forest-principal": principal };
const $ = (selector) => document.querySelector(selector);
const aiReviewState = { diagnoses: [] };
const evidenceControlState = { latestId: null };
const remediationState = { moduleItems: [], task: null };
const dispatchState = { tasks: [], selected: new Set(), nextCursor: null, summary: {} };
const maintenanceImportState = { batch: null };
const workforceState = { candidates: [], serviceDate: "", taskIds: [] };
function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char])); }
async function api(path, options = {}) { const response = await fetch(path, { ...options, cache: "no-store", headers: { ...headers, ...(options.headers || {}) }, credentials: "include" }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`); return body; }
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
function renderAiQueue(diagnoses) { aiReviewState.diagnoses = diagnoses; const queue = diagnoses.filter((item) => ["queued", "running"].includes(item.status)); $("#ai-list").innerHTML = queue.length ? queue.slice(0, 6).map((item) => { const action = item.status === "queued" ? `<button data-ai-start="${escapeHtml(item.id)}">Start</button>` : `<button data-ai-review="${escapeHtml(item.id)}">Review result</button>`; return `<article class="insight-item"><div><strong>${escapeHtml(item.moduleId)}</strong><span>Capture ${escapeHtml(item.captureId)}</span><small>${escapeHtml(item.status)} · requested by ${escapeHtml(item.requestedBy)} · result pending provider</small></div><div class="ai-actions"><span class="module-state warn">${escapeHtml(item.status)}</span>${action}</div></article>`; }).join("") : "<p class=\"empty\">No queued AI diagnosis.</p>"; }
function renderCaptures(batches) {
  $("#capture-list").innerHTML = batches.length ? batches.slice(0, 8).map((batch) => {
    const items = batch.items || [];
    const hasPhoto = items.some((item) => item.type === "photo" && item.value !== "no photo");
    const hasException = items.some((item) => item.type === "exception");
    const moduleLabel = batch.moduleId ? ` · ${batch.moduleId}` : " · whole wall";
    return `<article class="capture-item"><div><strong>${escapeHtml(batch.wallId)}${escapeHtml(moduleLabel)}</strong><span>${escapeHtml(batch.workorderId)} · ${escapeHtml(batch.technicianId)} · ${escapeHtml(formatTime(batch.capturedAt))}</span><small>${items.length} capture items · ${hasPhoto ? "photo" : "no photo"}${hasException ? " · exception" : ""}</small></div><span class="module-state ${hasException ? "warn" : ""}">${escapeHtml(batch.syncStatus || "synced")}</span></article>`;
  }).join("") : "<p class=\"empty\">No technician records synced yet.</p>";
}
function notificationLabel(item) { return item.eventType === "mobile.capture.exception" ? "Field exception" : item.eventType === "telemetry.alert.opened" ? "Sensor alert" : item.eventType === "remediation.task.sla-escalated" ? "Remediation SLA" : item.eventType; }
function renderNotifications(notifications, summary = {}) {
  const due = Number(summary.due || 0);
  $("#notification-count").textContent = due;
  $("#notification-state").textContent = `${due} due · ${Number(summary.failed || 0)} failed`;
  $("#notification-list").innerHTML = notifications.length ? notifications.slice(0, 8).map((item) => `<article class="notification-item"><div><strong>${escapeHtml(notificationLabel(item))} · ${escapeHtml(item.wallId || item.clientId || "platform")}</strong><span>${escapeHtml(item.status)} · ${escapeHtml(item.severity)} · ${escapeHtml(item.attempts)} attempt${item.attempts === 1 ? "" : "s"}</span><small>${escapeHtml(item.lastError ? `Last error: ${item.lastError}` : item.deliveredAt ? `Delivered ${formatTime(item.deliveredAt)}` : `Next attempt ${formatTime(item.nextAttemptAt)}`)}</small></div><span class="module-state ${["failed", "retry"].includes(item.status) ? "warn" : ""}">${escapeHtml(item.status)}</span></article>`).join("") : "<p class=\"empty\">No outbound notifications yet.</p>";
}
function dispatchSlaLabel(task) { return task.sla?.level ? `SLA L${task.sla.level} · ${Number(task.sla.overdueHours || 0).toFixed(1)}h overdue` : task.sla?.state === "due_soon" ? `Due in ${Number(task.sla.dueInHours || 0).toFixed(1)}h` : task.sla?.state === "scheduled" ? "Scheduled" : "No due time"; }
function localDateValue(value = new Date()) { const date = value instanceof Date ? value : new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function setTechnicianOptions(selector, candidates, emptyLabel) {
  const select = $(selector); const current = select.value; const options = candidates.map((item) => `<option value="${escapeHtml(item.technician.id)}" ${item.eligible ? "" : "disabled"}>${escapeHtml(item.technician.displayName)} · ${item.workload.remainingMinutes}m left${item.eligible ? "" : " · unavailable"}</option>`).join("");
  select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>${options}`;
  if (current && ![...select.options].some((option) => option.value === current)) select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(current)}">${escapeHtml(current)} · current</option>`);
  select.value = current;
}
function renderWorkforce(payload = {}) {
  workforceState.candidates = payload.candidates || []; workforceState.serviceDate = payload.serviceDate || workforceState.serviceDate; workforceState.taskIds = payload.taskIds || [];
  const eligible = workforceState.candidates.filter((item) => item.eligible); $("#workforce-ready-count").textContent = eligible.length; $("#workforce-state").textContent = `${eligible.length}/${workforceState.candidates.length} eligible · ${Number(payload.summary?.requestedMinutes || 0)}m requested`;
  $("#workforce-selection").textContent = workforceState.taskIds.length ? `${workforceState.taskIds.length} selected task${workforceState.taskIds.length === 1 ? "" : "s"} · only shared eligible technicians can be assigned` : "Current day capacity before a task is selected.";
  $("#workforce-list").innerHTML = workforceState.candidates.length ? workforceState.candidates.map((item) => `<article class="workforce-item"><div><strong>${escapeHtml(item.technician.displayName)}</strong><span>${escapeHtml(item.technician.skills.join(" · "))} · ${escapeHtml(item.technician.districts.join(" · "))}</span><small>${item.workload.allocatedMinutes}m allocated · ${item.workload.remainingMinutes}m remaining · shift ${escapeHtml(item.technician.shiftStart)}-${escapeHtml(item.technician.shiftEnd)}</small></div><b class="${item.eligible ? "ready" : "blocked"}">${item.eligible ? "Eligible" : escapeHtml(item.reasons[0] || "Blocked")}</b></article>`).join("") : "<p class=\"empty\">No technicians registered.</p>";
  setTechnicianOptions("#dispatch-assigned-to", workforceState.candidates, "No change"); setTechnicianOptions("#remediation-assigned-to", workforceState.candidates, "Unassigned");
}
async function refreshWorkforceCandidates() {
  const serviceDate = $("#workforce-date").value || localDateValue(); const taskIds = [...dispatchState.selected]; const query = new URLSearchParams({ serviceDate }); if (taskIds.length) query.set("taskIds", taskIds.join(","));
  const payload = await api(`/api/workforce/candidates?${query.toString()}`); renderWorkforce(payload); $("#workforce-notice").textContent = "";
}
function renderDispatchTasks() {
  const filter = $("#dispatch-filter").value;
  const tasks = dispatchState.tasks.filter((task) => filter === "overdue" ? task.sla?.level > 0 : filter === "pending" ? task.reviewStatus === "pending" : filter === "unassigned" ? !task.assignedTo : true);
  $("#dispatch-list").innerHTML = tasks.length ? tasks.map((task) => `<article class="dispatch-item"><input type="checkbox" data-dispatch-select="${escapeHtml(task.id)}" aria-label="Select ${escapeHtml(task.id)}" ${dispatchState.selected.has(task.id) ? "checked" : ""}><div><strong>${escapeHtml(task.moduleId)} · ${escapeHtml(task.workOrderId || "No work order")}</strong><span>${escapeHtml(task.status.replaceAll("_", " "))} · ${escapeHtml(task.priority)} · review ${escapeHtml(task.reviewStatus.replaceAll("_", " "))}</span><small>${escapeHtml((task.reasons || []).join(" · "))}</small></div><div class="dispatch-owner"><strong>${escapeHtml(task.assignedTo || "Unassigned")}</strong><span>${task.dueAt ? `Due ${escapeHtml(formatTime(task.dueAt))}` : "No due time"}</span><small>${task.escalationReason ? escapeHtml(task.escalationReason) : `Updated ${escapeHtml(formatTime(task.updatedAt))}`}</small></div><b class="sla-state ${task.sla?.level ? "overdue" : ""}">${escapeHtml(dispatchSlaLabel(task))}</b></article>`).join("") : "<p class=\"empty\">No tasks match this view.</p>";
  $("#dispatch-list").querySelectorAll("[data-dispatch-select]").forEach((checkbox) => checkbox.addEventListener("change", () => { if (checkbox.checked) dispatchState.selected.add(checkbox.dataset.dispatchSelect); else dispatchState.selected.delete(checkbox.dataset.dispatchSelect); $("#dispatch-select-all").checked = tasks.length > 0 && tasks.every((task) => dispatchState.selected.has(task.id)); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); }));
  $("#dispatch-select-all").checked = tasks.length > 0 && tasks.every((task) => dispatchState.selected.has(task.id));
}
function renderDispatchQueue(payload, append = false) {
  const incoming = payload.tasks || [];
  dispatchState.tasks = append ? [...dispatchState.tasks, ...incoming.filter((task) => !dispatchState.tasks.some((existing) => existing.id === task.id))] : incoming;
  if (!append) dispatchState.selected = new Set([...dispatchState.selected].filter((id) => dispatchState.tasks.some((task) => task.id === id)));
  dispatchState.nextCursor = payload.page?.nextCursor || null;
  dispatchState.summary = payload.summary || dispatchState.summary;
  $("#dispatch-state").textContent = `${Number(dispatchState.summary.active || 0)} active · ${Number(dispatchState.summary.unassigned || 0)} unassigned · ${Number(dispatchState.summary.pendingReview || 0)} review`;
  $("#remediation-overdue-count").textContent = Number(dispatchState.summary.overdue || 0);
  $("#dispatch-load-more").hidden = !dispatchState.nextCursor;
  renderDispatchTasks();
}
async function loadMoreDispatch() {
  if (!dispatchState.nextCursor) return;
  const result = await api(`/api/remediation/tasks?statuses=open,assigned,in_progress&limit=50&cursor=${encodeURIComponent(dispatchState.nextCursor)}`);
  renderDispatchQueue(result, true);
}
function renderMaintenanceImports(payload = {}) {
  const batches = payload.batches || [];
  $("#maintenance-import-history").innerHTML = batches.length ? batches.slice(0, 5).map((batch) => `<article class="import-history-item"><div><strong>${escapeHtml(batch.sourceFilename)}</strong><span>${escapeHtml(batch.rowCount)} rows · ${escapeHtml(formatTime(batch.createdAt))}</span></div><b>${escapeHtml(batch.status)}</b></article>`).join("") : "<p class=\"empty\">No maintenance imports yet.</p>";
}
function renderMaintenancePreview(batch) {
  maintenanceImportState.batch = batch;
  $("#import-state").textContent = `${batch.validCount} valid · ${batch.invalidCount} invalid`;
  $("#maintenance-import-result").innerHTML = `<strong>${escapeHtml(batch.sourceFilename)} · ${escapeHtml(batch.rowCount)} rows</strong><span>${escapeHtml(batch.validCount)} ready to import · ${escapeHtml(batch.invalidCount)} blocked</span>${batch.errors?.length ? `<span class="import-error">${escapeHtml(batch.errors.slice(0, 3).map((item) => `Row ${item.rowNumber}: ${item.messages.join("; ")}`).join(" · "))}</span>` : ""}`;
  $("#maintenance-import-apply").disabled = batch.status === "applied" || Number(batch.invalidCount) > 0;
}
function renderTimeline(timeline = {}) {
  const events = timeline.events || [];
  $("#timeline-state").textContent = `${Number(timeline.total || 0)} events · ${timeline.hasMore ? "more available" : "latest"}`;
  $("#timeline-list").innerHTML = events.length ? events.map((event) => `<article class="timeline-item"><span class="timeline-marker" aria-hidden="true"></span><div><strong>${escapeHtml(event.type)}</strong><span>${escapeHtml(event.entityType)} · ${escapeHtml(event.entityId)} · ${escapeHtml(event.actor)}</span><small>${escapeHtml(event.note || event.source)} · ${escapeHtml(formatTime(event.timestamp))}</small></div></article>`).join("") : "<p class=\"empty\">No operations events yet.</p>";
}
function renderQuality(quality = {}) {
  const gates = quality.gates || [];
  const thresholds = quality.thresholds || {};
  $("#quality-state").textContent = `${Number(quality.summary?.modules || 0)} modules · ${Number(quality.warnings?.length || 0)} attention items · telemetry ${Number(thresholds.telemetryStaleMinutes || 0)}m · camera ${Number(thresholds.cameraStaleMinutes || 0)}m`;
  $("#quality-list").innerHTML = gates.length ? gates.map((gate) => `<article class="quality-gate ${escapeHtml(gate.status)}"><div><strong>${escapeHtml(gate.label)}</strong><span>${escapeHtml(gate.detail)}</span></div><b>${escapeHtml(gate.status)}</b></article>`).join("") : "<p class=\"empty\">No quality signals available.</p>";
  const moduleItems = quality.moduleReadiness || [];
  remediationState.moduleItems = moduleItems;
  const unready = Number(quality.summary?.moduleUnready || 0);
  $("#module-quality-state").textContent = unready ? `${unready} need action · showing ${moduleItems.length}` : "All modules pass";
  $("#module-quality-list").innerHTML = moduleItems.length ? moduleItems.map((item) => {
    const task = item.remediationTask;
    const taskLabel = task?.reviewStatus === "pending" ? "FM review pending" : task?.reviewStatus === "rejected" ? "Returned to technician" : task?.status?.replaceAll("_", " ");
    const action = task ? `<div class="module-quality-actions"><span class="module-task-state ${task.status === "in_progress" ? "active" : ""}">${escapeHtml(taskLabel)}</span><button data-remediation-edit="${escapeHtml(task.id)}" data-remediation-module="${escapeHtml(item.moduleId)}" type="button">${task.reviewStatus === "pending" ? "Review" : "Update"}</button></div>` : `<div class="module-quality-actions"><span class="module-task-state">No task</span><button data-remediation-create="${escapeHtml(item.moduleId)}" type="button">Create task</button></div>`;
    return `<article class="module-quality-item"><div><strong>${escapeHtml(item.moduleId)} · ${escapeHtml(item.label)}</strong><span>${escapeHtml(item.reasons.join(" · "))}</span><small>${item.workOrderId ? `WO ${escapeHtml(item.workOrderId)} · ` : "No active WO · "}Telemetry ${escapeHtml(formatTime(item.lastTelemetryAt || "No reading"))} · Camera ${escapeHtml(formatTime(item.cameraLastSeenAt || "No heartbeat"))}</small></div><div class="module-quality-right"><b>${escapeHtml(item.status.replaceAll("-", " "))}</b>${action}</div></article>`;
  }).join("") : "<p class=\"empty\">No module-level action items.</p>";
}
function renderEvidenceControl(storage, latest = null) { const evidence = storage.evidenceSnapshots || {}; const counts = evidence.counts || {}; const latestMeta = evidence.latestSnapshot || null; evidenceControlState.latestId = latestMeta?.id || null; $("#snapshot-state").textContent = `${Number(counts.snapshots || 0)} stored · ${Number(counts.verified || 0)} verified`; $("#snapshot-summary").innerHTML = latest ? `<div><strong>${escapeHtml(latest.snapshotId)}</strong><span>${escapeHtml(latest.signatureStatus)} · ${escapeHtml(latest.verificationStatus)} · ${escapeHtml(latest.scope)}</span><small>SHA-256 ${escapeHtml(latest.sha256.slice(0, 16))}… · expires ${escapeHtml(latest.expiresAt || "not set")}</small></div>` : latestMeta ? `<div><strong>${escapeHtml(latestMeta.id)}</strong><span>Persisted ledger record · status detail loading</span><small>SHA-256 ${escapeHtml(latestMeta.sha256.slice(0, 16))}…</small></div>` : "<p class=\"empty\">No persisted snapshot yet.</p>"; $("#verify-snapshot").disabled = !evidenceControlState.latestId; }
async function load() {
  $("#notice").textContent = "";
  if (!$("#workforce-date").value) $("#workforce-date").value = localDateValue();
  const [reminders, route, modules, alerts, diagnoses, captures, notifications, timeline, quality, storage, dispatch, maintenanceImports, workforce] = await Promise.all([api("/api/mobile/reminders"), api("/api/mobile/route"), api("/api/modules"), api("/api/telemetry/alerts?statuses=open,acknowledged"), api("/api/ai/visual-diagnoses?statuses=queued,running"), api("/api/mobile/capture-batches"), api("/api/notifications?limit=20"), api("/api/ops/timeline?limit=24"), api("/api/ops/quality"), api("/api/storage"), api("/api/remediation/tasks?statuses=open,assigned,in_progress&limit=50"), api("/api/admin/imports/maintenance?limit=5"), api(`/api/workforce/candidates?serviceDate=${encodeURIComponent($("#workforce-date").value)}`)]);
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
  renderTimeline(timeline);
  renderQuality(quality);
  renderDispatchQueue(dispatch);
  renderWorkforce(workforce);
  renderMaintenanceImports(maintenanceImports);
  const latest = storage.evidenceSnapshots?.latestSnapshot?.id ? await api(`/api/proof/evidence-snapshots/${encodeURIComponent(storage.evidenceSnapshots.latestSnapshot.id)}`) : null;
  renderEvidenceControl(storage, latest);
}
const aiReviewDialog = $("#ai-review-dialog");
const remediationDialog = $("#remediation-dialog");
function remediationTimeInput(value) { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function configureRemediationReview(task = null) {
  const pending = task?.reviewStatus === "pending";
  $("#remediation-review-fields").hidden = !pending;
  $("#remediation-review-decision").value = "";
  $("#remediation-review-note").value = "";
  $("#remediation-review-state").textContent = pending ? `Submitted by ${task.submittedBy || "technician"} · ${formatTime(task.submittedAt)} · evidence ${task.evidenceRef || "completion note"}` : "";
  ["#remediation-status", "#remediation-priority", "#remediation-assigned-to", "#remediation-due-at"].forEach((selector) => { $(selector).disabled = pending; });
  ["#remediation-resolution-note", "#remediation-evidence-ref"].forEach((selector) => { $(selector).readOnly = pending; });
  $("#remediation-submit").textContent = pending ? "Record FM decision" : "Save task";
}
function openRemediationCreate(item) {
  remediationState.task = null;
  $("#remediation-title").textContent = "Create remediation task";
  $("#remediation-context").textContent = `${item.moduleId} · ${item.label} · ${item.reasons.join(" · ")}`;
  $("#remediation-id").value = "";
  $("#remediation-module-id").value = item.moduleId;
  $("#remediation-work-order-id").value = item.workOrderId || "";
  $("#remediation-source-key").value = item.status;
  $("#remediation-status").value = "open";
  $("#remediation-priority").value = "high";
  $("#remediation-assigned-to").value = "";
  $("#remediation-due-at").value = "";
  $("#remediation-resolution-note").value = "";
  $("#remediation-evidence-ref").value = "";
  $("#remediation-error").textContent = "";
  configureRemediationReview();
  remediationDialog.showModal();
}
function openRemediationEdit(item, task) {
  remediationState.task = task;
  $("#remediation-title").textContent = "Update remediation task";
  $("#remediation-context").textContent = `${item.moduleId} · ${item.label} · ${item.reasons.join(" · ")}`;
  $("#remediation-id").value = task.id;
  $("#remediation-module-id").value = item.moduleId;
  $("#remediation-work-order-id").value = task.workOrderId || item.workOrderId || "";
  $("#remediation-source-key").value = item.status;
  $("#remediation-status").value = task.status;
  $("#remediation-priority").value = task.priority || "normal";
  $("#remediation-assigned-to").value = task.assignedTo || "";
  $("#remediation-due-at").value = remediationTimeInput(task.dueAt);
  $("#remediation-resolution-note").value = task.resolutionNote || "";
  $("#remediation-evidence-ref").value = task.evidenceRef || "";
  $("#remediation-error").textContent = "";
  configureRemediationReview(task);
  remediationDialog.showModal();
}
async function saveRemediation(event) {
  event.preventDefault();
  const moduleId = $("#remediation-module-id").value;
  const taskId = $("#remediation-id").value;
  if (taskId && remediationState.task?.reviewStatus === "pending") {
    const reviewDecision = $("#remediation-review-decision").value;
    const reviewNote = $("#remediation-review-note").value.trim();
    if (!reviewDecision || !reviewNote) { $("#remediation-error").textContent = "Select approve or reject and enter an audit note."; return; }
    const submit = $("#remediation-submit"); submit.disabled = true; $("#remediation-error").textContent = "";
    try { await api(`/api/remediation/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewDecision, reviewNote }) }); remediationDialog.close(); await load(); }
    catch (error) { $("#remediation-error").textContent = error.message; } finally { submit.disabled = false; }
    return;
  }
  const assignedTo = $("#remediation-assigned-to").value.trim();
  const dueAt = $("#remediation-due-at").value;
  const body = { status: $("#remediation-status").value, priority: $("#remediation-priority").value, assignedTo: assignedTo || null, dueAt: dueAt ? new Date(dueAt).toISOString() : null, resolutionNote: $("#remediation-resolution-note").value.trim() || null, evidenceRef: $("#remediation-evidence-ref").value.trim() || null };
  if (!moduleId) return;
  if (!taskId) Object.assign(body, { moduleId, workOrderId: $("#remediation-work-order-id").value.trim() || null, sourceKey: $("#remediation-source-key").value, reasons: remediationState.moduleItems.find((item) => item.moduleId === moduleId)?.reasons || [] });
  const submit = $("#remediation-submit"); submit.disabled = true; $("#remediation-error").textContent = "";
  try {
    await api(taskId ? `/api/remediation/tasks/${encodeURIComponent(taskId)}` : "/api/remediation/tasks", { method: taskId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    remediationDialog.close(); await load();
  } catch (error) { $("#remediation-error").textContent = error.message; } finally { submit.disabled = false; }
}
function openAiReview(diagnosis) { aiReviewState.diagnosis = diagnosis; $("#ai-review-id").value = diagnosis.id; $("#ai-review-context").textContent = `${diagnosis.moduleId} · capture ${diagnosis.captureId} · current status ${diagnosis.status}. Manual review is recorded separately from an external provider result.`; $("#ai-review-status").value = "completed"; $("#ai-review-confidence").value = ""; $("#ai-review-provider").value = diagnosis.provider || ""; $("#ai-review-model").value = diagnosis.model || ""; $("#ai-review-note").value = ""; $("#ai-review-error").textContent = ""; aiReviewDialog.showModal(); }
async function startAiDiagnosis(id) { await api(`/api/ai/visual-diagnoses/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "running", provider: "pending-provider", model: "awaiting-callback", result: { stage: "running", evidenceBasis: "Awaiting external AI provider callback." } }) }); await load(); }
async function saveAiReview(event) { event.preventDefault(); const status = $("#ai-review-status").value; const note = $("#ai-review-note").value.trim(); const confidenceText = $("#ai-review-confidence").value.trim(); const confidence = confidenceText === "" ? null : Number(confidenceText); if (!note) { $("#ai-review-error").textContent = "A result or failure note is required."; return; } if (status === "completed" && (confidence === null || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) { $("#ai-review-error").textContent = "Completed reviews require confidence from 0 to 1."; return; } const result = { summary: note, reviewedBy: principal, reviewMode: "human-assisted", evidenceBasis: "Provider output or operator review; not an automatic horticulture claim." }; await api(`/api/ai/visual-diagnoses/${encodeURIComponent($("#ai-review-id").value)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, confidence: status === "completed" ? confidence : null, provider: $("#ai-review-provider").value.trim() || "operator-review", model: $("#ai-review-model").value.trim() || "operator-review", result, errorCode: status === "failed" ? "AI_REVIEW_FAILED" : null }) }); aiReviewDialog.close(); await load(); }
$("#refresh").onclick = () => load().catch((error) => { $("#notice").textContent = error.message; });
$("#ai-review-cancel").onclick = () => aiReviewDialog.close(); $("#ai-review-form").onsubmit = saveAiReview;
$("#remediation-cancel").onclick = () => remediationDialog.close(); $("#remediation-form").onsubmit = saveRemediation;
$("#dispatch-filter").onchange = renderDispatchTasks;
$("#dispatch-select-all").onchange = () => { const visible = dispatchState.tasks.filter((task) => $("#dispatch-filter").value === "overdue" ? task.sla?.level > 0 : $("#dispatch-filter").value === "pending" ? task.reviewStatus === "pending" : $("#dispatch-filter").value === "unassigned" ? !task.assignedTo : true); for (const task of visible) { if ($("#dispatch-select-all").checked) dispatchState.selected.add(task.id); else dispatchState.selected.delete(task.id); } renderDispatchTasks(); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); };
$("#workforce-date").onchange = () => refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; });
$("#dispatch-due-at").onchange = () => { if ($("#dispatch-due-at").value) $("#workforce-date").value = $("#dispatch-due-at").value.slice(0, 10); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); };
$("#dispatch-load-more").onclick = () => loadMoreDispatch().catch((error) => { $("#dispatch-notice").textContent = error.message; });
$("#dispatch-sla-scan").onclick = async () => { const button = $("#dispatch-sla-scan"); button.disabled = true; $("#dispatch-notice").textContent = "Scanning active SLA deadlines…"; try { const result = await api("/api/remediation/sla-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); await load(); $("#dispatch-notice").textContent = `${result.scanned} scanned · ${result.escalated} newly escalated`; } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#dispatch-bulk-form").onsubmit = async (event) => { event.preventDefault(); const taskIds = [...dispatchState.selected]; if (!taskIds.length) { $("#dispatch-notice").textContent = "Select at least one task."; return; } const body = { taskIds, expectedUpdatedAtById: Object.fromEntries(taskIds.map((id) => [id, dispatchState.tasks.find((task) => task.id === id)?.updatedAt])) }; const assignedTo = $("#dispatch-assigned-to").value.trim(); const dueAt = $("#dispatch-due-at").value; const priority = $("#dispatch-priority").value; const status = $("#dispatch-status").value; if (assignedTo) body.assignedTo = assignedTo; if (dueAt) body.dueAt = new Date(dueAt).toISOString(); if (priority) body.priority = priority; if (status) body.status = status; if (Object.keys(body).length === 2) { $("#dispatch-notice").textContent = "Choose an assignment, due time, priority or status."; return; } const button = $("#dispatch-apply"); button.disabled = true; $("#dispatch-notice").textContent = "Applying dispatch update…"; try { const result = await api("/api/remediation/tasks/bulk", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); dispatchState.selected.clear(); await load(); $("#dispatch-notice").textContent = `${result.updated} task${result.updated === 1 ? "" : "s"} updated`; } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-form").onsubmit = async (event) => { event.preventDefault(); const file = $("#maintenance-import-file").files[0]; if (!file) return; const button = $("#maintenance-import-preview"); button.disabled = true; $("#maintenance-import-notice").textContent = "Validating CSV against current asset master data…"; try { const result = await api("/api/admin/imports/maintenance/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, csv: await file.text() }) }); renderMaintenancePreview(result.batch); $("#maintenance-import-notice").textContent = result.duplicate ? "This exact file was already previewed." : "Preview stored. Apply is enabled only when every row is valid."; await load(); } catch (error) { $("#maintenance-import-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-apply").onclick = async () => { const batch = maintenanceImportState.batch; if (!batch) return; const button = $("#maintenance-import-apply"); button.disabled = true; $("#maintenance-import-notice").textContent = "Applying validated maintenance rows…"; try { const result = await api(`/api/admin/imports/maintenance/${encodeURIComponent(batch.id)}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); renderMaintenancePreview(result.batch); await load(); $("#maintenance-import-notice").textContent = `${result.imported} maintenance row${result.imported === 1 ? "" : "s"} imported into work orders.`; } catch (error) { $("#maintenance-import-notice").textContent = error.message; button.disabled = false; } };
$("#persist-snapshot").onclick = async () => { const button = $("#persist-snapshot"); button.disabled = true; $("#snapshot-notice").textContent = "Persisting current evidence package…"; try { const result = await api("/api/proof/evidence-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); $("#snapshot-notice").textContent = `${result.snapshotId} persisted · ${result.signatureStatus}`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#verify-snapshot").onclick = async () => { const button = $("#verify-snapshot"); if (!evidenceControlState.latestId) return; button.disabled = true; $("#snapshot-notice").textContent = "Verifying latest snapshot…"; try { const result = await api(`/api/proof/evidence-snapshots/${encodeURIComponent(evidenceControlState.latestId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Reviewed from FM Lead evidence control." }) }); $("#snapshot-notice").textContent = `${result.snapshotId} verification: ${result.verificationStatus}`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = !evidenceControlState.latestId; } };
$("#sweep-snapshots").onclick = async () => { const button = $("#sweep-snapshots"); button.disabled = true; $("#snapshot-notice").textContent = "Running retention sweep…"; try { const result = await api("/api/proof/evidence-snapshots/retention-sweep", { method: "POST" }); $("#snapshot-notice").textContent = `Retention sweep complete · ${Number(result.expiredCount || 0)} expired`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = false; } };
document.addEventListener("click", async (event) => { const aiStart = event.target.closest("[data-ai-start]"); const aiReview = event.target.closest("[data-ai-review]"); const remediationCreate = event.target.closest("[data-remediation-create]"); const remediationEdit = event.target.closest("[data-remediation-edit]"); if (aiStart) { aiStart.disabled = true; try { await startAiDiagnosis(aiStart.dataset.aiStart); } catch (error) { $("#notice").textContent = error.message; aiStart.disabled = false; } return; } if (aiReview) { const diagnosis = aiReviewState.diagnoses.find((item) => item.id === aiReview.dataset.aiReview); if (diagnosis) openAiReview(diagnosis); return; } if (remediationCreate) { const item = remediationState.moduleItems.find((candidate) => candidate.moduleId === remediationCreate.dataset.remediationCreate); if (item) openRemediationCreate(item); return; } if (remediationEdit) { const item = remediationState.moduleItems.find((candidate) => candidate.moduleId === remediationEdit.dataset.remediationModule); if (item?.remediationTask) openRemediationEdit(item, item.remediationTask); return; } const button = event.target.closest("[data-alert-status]"); if (!button) return; button.disabled = true; try { await api(`/api/telemetry/alerts/${encodeURIComponent(button.dataset.alertStatus)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus, resolutionNote: "Handled from Today operations queue." }) }); await load(); } catch (error) { $("#notice").textContent = error.message; button.disabled = false; } });
load().catch((error) => { $("#notice").textContent = error.message; });
