const principal = "fm-lead";
const headers = { "x-dr-forest-principal": principal };
const $ = (selector) => document.querySelector(selector);
const aiReviewState = { diagnoses: [] };
const evidenceControlState = { latestId: null };
const remediationState = { moduleItems: [], task: null };
const dispatchState = { tasks: [], selected: new Set(), nextCursor: null, summary: {} };
const maintenanceImportState = { batch: null };
const workforceState = { candidates: [], serviceDate: "", taskIds: [] };
const maintenancePlanningState = { calendar: null };
const inventoryState = { overview: null };
const deviceCareState = { records: [] };
const contractState = { overview: null };
const releaseEvidenceLedgerState = { payload: null };
const moduleQueryState = { search: "", status: "", cursor: null, total: 0, hasMore: false, items: [] };
const fieldCycleImportState = { preview: null, loaded: false, request: null };
const pilotReconciliationState = { payload: null, request: null };
function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char])); }
async function api(path, options = {}) { const response = await fetch(path, { ...options, cache: "no-store", headers: { ...headers, ...(options.headers || {}) }, credentials: "include" }); const body = await response.json().catch(() => ({})); if (!response.ok) { const error = new Error(body.error || `Request failed (${response.status})`); error.code = body.code; error.details = body.details; throw error; } return body; }
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
function notificationLabel(item) { return item.eventType === "mobile.capture.exception" ? "Field exception" : item.eventType === "telemetry.alert.opened" ? "Sensor alert" : item.eventType === "remediation.task.sla-escalated" ? "Remediation SLA" : item.eventType === "reliability.job.failed" ? "Automation failure" : item.eventType === "reliability.job.recovered" ? "Automation recovered" : item.eventType; }
function renderNotifications(notifications, summary = {}) {
  const due = Number(summary.due || 0);
  $("#notification-count").textContent = due;
  $("#notification-state").textContent = `${due} due · ${Number(summary.failed || 0)} failed`;
  $("#notification-list").innerHTML = notifications.length ? notifications.slice(0, 8).map((item) => `<article class="notification-item"><div><strong>${escapeHtml(notificationLabel(item))} · ${escapeHtml(item.wallId || item.clientId || "platform")}</strong><span>${escapeHtml(item.status)} · ${escapeHtml(item.severity)} · ${escapeHtml(item.attempts)} attempt${item.attempts === 1 ? "" : "s"}</span><small>${escapeHtml(item.lastError ? `Last error: ${item.lastError}` : item.deliveredAt ? `Delivered ${formatTime(item.deliveredAt)}` : `Next attempt ${formatTime(item.nextAttemptAt)}`)}</small></div><span class="module-state ${["failed", "retry"].includes(item.status) ? "warn" : ""}">${escapeHtml(item.status)}</span></article>`).join("") : "<p class=\"empty\">No outbound notifications yet.</p>";
}
function intervalLabel(seconds) { const value=Number(seconds)||0; if(value>=86400)return `${Math.round(value/86400)}d`; if(value>=3600)return `${Math.round(value/3600)}h`; return `${Math.max(1,Math.round(value/60))}m`; }
function renderReliability(payload = {}) {
  const jobs=payload.jobs||[]; const summary=payload.summary||{};
  $("#reliability-risk-count").textContent=Number(summary.atRisk||0);
  $("#reliability-state").textContent=`${Number(summary.healthy||0)} healthy · ${Number(summary.atRisk||0)} at risk · ${Number(summary.openIncidents||0)} open`;
  $("#reliability-list").innerHTML=jobs.length?jobs.map((job)=>`<article class="reliability-item"><div><strong>${escapeHtml(job.label)}</strong><span>Expected every ${escapeHtml(intervalLabel(job.expectedIntervalSeconds))} · stale after ${escapeHtml(intervalLabel(job.staleAfterSeconds))}</span><small>${escapeHtml(job.lastFinishedAt?`Last ${job.lastStatus} ${formatTime(job.lastFinishedAt)}${job.lastDurationMs!==null?` · ${job.lastDurationMs}ms`:""}`:job.reason)}</small></div><b class="reliability-state ${escapeHtml(job.state)}">${escapeHtml(job.state.replaceAll("_"," "))}</b></article>`).join(""):"<p class=\"empty\">No background jobs registered.</p>";
}
function renderCommissioningSummary(payload = {}) { $("#commissioning-gap-count").textContent = Number(payload.summary?.actionRequired || 0); }
function renderDeviceCare(payload = {}) {
  deviceCareState.records = payload.records || [];
  const summary = payload.summary || {};
  $("#device-care-state").textContent = `${Number(summary.actionRequired || 0)} action · ${Number(summary.calibrationDue || 0)} due · ${Number(summary.fault || 0) + Number(summary.quarantined || 0)} fault`;
  const ordered = [...deviceCareState.records].sort((a, b) => Number(b.profileStatus === "unmanaged" || ["due", "fault", "quarantined"].includes(b.calibrationState) || ["fault", "quarantined"].includes(b.status)) - Number(a.profileStatus === "unmanaged" || ["due", "fault", "quarantined"].includes(a.calibrationState) || ["fault", "quarantined"].includes(a.status)));
  $("#device-care-list").innerHTML = ordered.slice(0, 30).map((record) => { const state = record.profileStatus === "unmanaged" ? "unmanaged" : ["fault", "quarantined"].includes(record.status) ? record.status : record.calibrationState; const due = record.nextCalibrationDueAt ? `Calibration ${formatTime(record.nextCalibrationDueAt)}` : "Calibration not scheduled"; return `<article class="device-care-item"><div><strong>${escapeHtml(record.label)} · ${escapeHtml(record.type.toUpperCase())}</strong><span>${escapeHtml(record.moduleId || record.wallId)} · ${escapeHtml(record.serialNumber || "Physical profile missing")}</span><small>${escapeHtml(due)} · registry ${escapeHtml(record.registryStatus)}${record.lastSeenAt ? ` · seen ${escapeHtml(formatTime(record.lastSeenAt))}` : " · no heartbeat"}</small></div><div class="device-care-actions"><b class="device-care-state ${escapeHtml(state)}">${escapeHtml(state.replaceAll("_", " "))}</b><button type="button" data-device-care="${escapeHtml(record.deviceId)}">${record.profileStatus === "unmanaged" ? "Create profile" : "Record action"}</button></div></article>`; }).join("") || "<p class=\"empty\">No registered devices.</p>";
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
function renderMaintenancePlanning(payload = {}) {
  maintenancePlanningState.calendar = payload;
  const summary = payload.summary || {};
  const items = (payload.occurrences || []).filter((item) => !["Completed", "Cancelled"].includes(item.workOrderStatus));
  const technicians = payload.technicians || [];
  $("#maintenance-plan-count").textContent = Number(summary.overduePlans || 0);
  $("#maintenance-state").textContent = `${Number(summary.activePlans || 0)} active plans · ${Number(summary.unassigned || 0)} unassigned`;
  $("#maintenance-plan-state").textContent = Number(summary.overduePlans || 0) ? `${summary.overduePlans} plan gap${summary.overduePlans === 1 ? "" : "s"} need generation` : `${Number(summary.dueThrough || 0)} due through selected horizon`;
  $("#maintenance-plan-list").innerHTML = items.length ? items.slice(0, 30).map((item) => {
    const assignment = item.assignment;
    const options = technicians.map((technician) => `<option value="${escapeHtml(technician.id)}" ${assignment?.technicianId === technician.id ? "selected" : ""}>${escapeHtml(technician.displayName)}</option>`).join("");
    return `<article class="maintenance-plan-item"><div><strong>${escapeHtml(item.wallId)} · ${escapeHtml(item.serviceType)}</strong><span>${escapeHtml(item.serviceDate)} · ${escapeHtml(item.workOrderId)} · ${escapeHtml(item.workOrderStatus || "Scheduled")}</span><small>${escapeHtml((item.tasks || []).join(" · "))}</small></div><div class="maintenance-assignment"><select data-maintenance-technician="${escapeHtml(item.workOrderId)}" aria-label="Technician for ${escapeHtml(item.workOrderId)}"><option value="">Unassigned</option>${options}</select><button data-maintenance-assign="${escapeHtml(item.workOrderId)}" data-service-date="${escapeHtml(item.serviceDate)}" type="button">${assignment ? "Update" : "Assign"}</button>${assignment ? `<a href="${escapeHtml(fieldLink({ workOrderId: item.workOrderId, wallId: item.wallId }))}">Phone route</a>` : ""}</div><b class="maintenance-state ${assignment ? "assigned" : "unassigned"}">${assignment ? escapeHtml(assignment.technicianId) : "Needs owner"}</b></article>`;
  }).join("") : "<p class=\"empty\">No generated preventive work orders in this window.</p>";
}
function renderInventory(payload = {}) {
  inventoryState.overview = payload;
  const summary = payload.summary || {};
  const readiness = payload.routeReadiness || {};
  $("#inventory-low-count").textContent = Number(summary.lowStockWarehouse || 0);
  $("#inventory-state").textContent = `${Number(summary.lowStockWarehouse || 0)} warehouse low · ${Number(readiness.unreservedWorkOrders || 0)} assigned WOs unreserved`;
  const itemSelect = $("#inventory-sku"); const currentSku = itemSelect.value;
  itemSelect.innerHTML = (payload.items || []).map((item) => `<option value="${escapeHtml(item.sku)}">${escapeHtml(item.name)} · ${escapeHtml(item.unit)}</option>`).join("");
  if (currentSku && [...itemSelect.options].some((option) => option.value === currentSku)) itemSelect.value = currentSku;
  const kitSelect = $("#inventory-destination"); const currentKit = kitSelect.value;
  kitSelect.innerHTML = `<option value="">Select kit</option>` + (payload.locations || []).filter((item) => item.kind === "technician-kit").map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
  if (currentKit && [...kitSelect.options].some((option) => option.value === currentKit)) kitSelect.value = currentKit;
  const workOrderSelect = $("#inventory-work-order"); const currentWorkOrder = workOrderSelect.value;
  workOrderSelect.innerHTML = `<option value="">Select for reservation</option>` + (readiness.assignments || []).map((item) => `<option value="${escapeHtml(item.workOrderId)}" data-technician="${escapeHtml(item.technicianId)}">${escapeHtml(item.workOrderId)} · ${escapeHtml(item.technicianId)}${item.reserved ? " · reserved" : ""}</option>`).join("");
  if (currentWorkOrder && [...workOrderSelect.options].some((option) => option.value === currentWorkOrder)) workOrderSelect.value = currentWorkOrder;
  const balances = payload.balances || [];
  $("#inventory-list").innerHTML = balances.length ? balances.map((item) => `<article class="inventory-item"><div><strong>${escapeHtml(item.name)} · ${escapeHtml(item.sku)}</strong><span>${escapeHtml(item.onHand)} on hand · ${escapeHtml(item.reserved)} reserved · ${escapeHtml(item.available)} available</span><small>Reorder at ${escapeHtml(item.reorderPoint)} ${escapeHtml(item.unit)}</small></div><div class="inventory-location"><strong>${escapeHtml(item.locationLabel)}</strong><span>${escapeHtml(item.locationKind.replaceAll("-", " "))}</span></div><b class="inventory-level ${item.lowStock ? "low" : ""}">${item.lowStock ? "Low stock" : "Available"}</b></article>`).join("") : "<p class=\"empty\">No inventory balances recorded.</p>";
  const receiptSku = $("#inventory-receipt-sku"); const currentReceiptSku = receiptSku.value;
  receiptSku.innerHTML = (payload.items || []).map((item) => `<option value="${escapeHtml(item.sku)}">${escapeHtml(item.name)} · ${escapeHtml(item.unit)}</option>`).join("");
  if (currentReceiptSku && [...receiptSku.options].some((option) => option.value === currentReceiptSku)) receiptSku.value = currentReceiptSku;
  const lots = payload.lots || []; const pendingCounts = (payload.stockCounts || []).filter((item) => item.status === "submitted");
  $("#inventory-trace-state").textContent = `${Number(summary.expiringLots || 0)} expiring · ${pendingCounts.length} count review`;
  $("#inventory-lot-list").innerHTML = lots.length ? lots.slice(0, 16).map((lot) => `<article class="inventory-item inventory-lot"><div><strong>${escapeHtml(lot.sku)} · ${escapeHtml(lot.lotCode)}</strong><span>${escapeHtml(lot.supplier)} · expires ${escapeHtml(lot.expiryDate)}</span><small>${escapeHtml(lot.id)}</small></div><div class="inventory-location"><strong>${escapeHtml((payload.locations || []).find((item) => item.id === lot.locationId)?.label || lot.locationId)}</strong><span>${escapeHtml(lot.onHand)} ${escapeHtml(lot.unit)}</span></div><b class="inventory-level ${lot.daysToExpiry <= 30 ? "low" : ""}">${lot.daysToExpiry <= 0 ? "Expired" : `${lot.daysToExpiry}d`}</b></article>`).join("") : "<p class=\"empty\">No traceable lots with stock.</p>";
  $("#inventory-count-list").innerHTML = pendingCounts.length ? pendingCounts.map((count) => `<article class="inventory-count"><div><strong>${escapeHtml(count.id)} · ${escapeHtml(count.locationId)}</strong><span>${escapeHtml(count.countedBy)} · ${escapeHtml(new Date(count.countedAt).toLocaleString())}</span><small>${escapeHtml(count.lines.map((line) => `${line.lotCode} ${line.expectedQuantity}→${line.countedQuantity}`).join(" · "))}</small></div><div class="inventory-count-actions"><input data-count-note="${escapeHtml(count.id)}" aria-label="Review note" placeholder="Review note" maxlength="160"><button type="button" data-count-review="approved" data-count-id="${escapeHtml(count.id)}">Approve</button><button type="button" data-count-review="rejected" data-count-id="${escapeHtml(count.id)}">Reject</button></div></article>`).join("") : "<p class=\"empty\">No stock counts awaiting review.</p>";
  $("#inventory-count-list").querySelectorAll("[data-count-review]").forEach((button) => button.addEventListener("click", () => reviewInventoryCount(button)));
}
async function reviewInventoryCount(button) {
  const countId = button.dataset.countId; const decision = button.dataset.countReview;
  const note = document.querySelector(`[data-count-note="${CSS.escape(countId)}"]`)?.value.trim();
  if (!note) { $("#inventory-notice").textContent = "Add a review note before approving or rejecting the count."; return; }
  button.disabled = true; $("#inventory-notice").textContent = `${decision === "approved" ? "Applying" : "Rejecting"} counted variance…`;
  try { await api(`/api/inventory/counts/${encodeURIComponent(countId)}/review`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ decision, note }) }); await load(); $("#inventory-notice").textContent = `Stock count ${countId} ${decision}.`; }
  catch (error) { $("#inventory-notice").textContent = error.message; button.disabled = false; }
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
function renderFieldServiceCycles(payload = {}) {
  const cycles = payload.cycles || [];
  const gate = payload.gate || {};
  const preview = fieldCycleImportState.preview;
  let html = "";
  if (preview) {
    html = "<strong>" + escapeHtml(preview.filename) + " · " + escapeHtml(preview.totalRows) + " rows</strong><span>" + escapeHtml(preview.validRows) + " valid · " + escapeHtml(preview.invalidRows) + " blocked · " + escapeHtml(preview.gate?.status || "syntax checked") + "</span>";
    if (preview.errors?.length) html += "<span class=\"import-error\">" + escapeHtml(preview.errors.slice(0, 3).map((item) => "Row " + item.rowNumber + ": " + item.messages.join("; ")).join(" | ")) + "</span>";
  } else if (cycles.length) {
    html = "<strong>" + escapeHtml(cycles.length) + " field-service cycle" + (cycles.length === 1 ? "" : "s") + " in ledger</strong><span>Evidence gate: " + escapeHtml(gate.status || "not evaluated") + " · " + escapeHtml(gate.completedCount || 0) + " completed · " + escapeHtml(gate.clientCount || 0) + " clients</span>";
  } else {
    html = "<p class=\"empty\">No field-service cycles imported yet.</p>";
  }
  $("#field-cycle-import-result").innerHTML = html;
  $("#field-cycle-import-apply").disabled = !preview || Number(preview.invalidRows) > 0 || Number(preview.validRows) < 1;
}
function refreshFieldServiceCycles(force = false) {
  if (fieldCycleImportState.request) return fieldCycleImportState.request;
  if (fieldCycleImportState.loaded && !force) return Promise.resolve();
  const request = api("/api/field-service/cycles?limit=100").then((payload) => {
    fieldCycleImportState.loaded = true;
    renderFieldServiceCycles(payload);
  }).catch((error) => {
    renderFieldServiceCycles();
    $("#field-cycle-import-notice").textContent = "Field-service ledger unavailable: " + error.message;
  }).finally(() => {
    if (fieldCycleImportState.request === request) fieldCycleImportState.request = null;
  });
  fieldCycleImportState.request = request;
  return request;
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
function renderOperationalHealth(report = {}) {
  const summary = report.summary || {};
  const avg = summary.averageScore === null || summary.averageScore === undefined ? "--" : summary.averageScore;
  $("#health-esg-state").textContent = `${Number(summary.scoredAssets || 0)}/${Number(summary.assets || 0)} scored · ${Number(summary.averageConfidence || 0) * 100}% confidence`;
  $("#health-summary").innerHTML = `<div><strong>${escapeHtml(avg)}</strong><span>average score</span></div><div><strong>${Number(summary.completeScores || 0)}</strong><span>complete</span></div><div><strong>${Number(summary.partialScores || 0)}</strong><span>partial</span></div><div><strong>${Number(summary.noDataAssets || 0)}</strong><span>no data</span></div>`;
  $("#health-list").innerHTML = (report.assets || []).length ? report.assets.slice(0, 20).map((asset) => { const score = asset.score === null ? "--" : asset.score; const driver = asset.drivers?.[0] || "No active exception driver."; const persisted = asset.persistedSnapshot ? ` · persisted ${formatTime(asset.persistedSnapshot.calculatedAt)}` : " · not persisted"; return `<article class="health-item"><div><strong>${escapeHtml(asset.name)} · ${escapeHtml(asset.wallId)}</strong><span>${escapeHtml(asset.status)} · ${escapeHtml(asset.confidence * 100)}% evidence coverage${escapeHtml(persisted)}</span><small>${escapeHtml(driver)}</small></div><b class="health-band ${escapeHtml(asset.band)}">${escapeHtml(score)}</b></article>`; }).join("") : "<p class=\"empty\">No living assets in scope.</p>";
}
function renderEsgLedger(payload = {}, observations = []) {
  const summary = payload.metrics || [];
  $("#esg-ledger-state").textContent = `${escapeHtml(payload.status || "partial")} · ${escapeHtml(payload.period?.periodStart?.slice(0, 10) || "--")} to ${escapeHtml(payload.period?.periodEnd?.slice(0, 10) || "--")}`;
  $("#esg-summary").innerHTML = `<div><strong>${escapeHtml(payload.status || "partial")}</strong><span>${Number(payload.counts?.captureBatches || 0)} field batches · ${Number(payload.counts?.observations || 0)} observations</span><small>Measured facts, master-data facts and estimates remain separated.</small></div>`;
  $("#esg-metric-list").innerHTML = summary.length ? summary.map((item) => `<article class="esg-metric-item"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.method)}</span></div><b class="esg-status ${escapeHtml(item.status)}">${escapeHtml(item.value === null || item.value === undefined ? "--" : `${item.value}${item.unit ? ` ${item.unit}` : ""}`)}</b></article>`).join("") : "<p class=\"empty\">No ESG metrics available.</p>";
  $("#esg-gap-list").innerHTML = (payload.gaps || []).slice(0, 8).map((gap) => `<li>${escapeHtml(gap)}</li>`).join("") || "<li>No evidence gaps in this period.</li>";
  $("#esg-observation-list").innerHTML = observations.length ? `<div class="esg-observation-heading">Recent structured observations</div>${observations.slice(0, 6).map((item) => `<article class="esg-observation-item"><div><strong>${escapeHtml(item.category)} · ${escapeHtml(item.clientId)}</strong><span>${escapeHtml(item.note)}</span><small>${escapeHtml(formatTime(item.observedAt))}${item.evidenceRef ? ` · ${escapeHtml(item.evidenceRef)}` : ""}</small></div><b>${item.rating === null ? "recorded" : `${escapeHtml(item.rating)}/100`}</b></article>`).join("")}` : "<p class=\"empty\">No structured observations yet.</p>";
}
function renderEsgObservationScope(payload = {}) {
  const clientSelect = $("#esg-observation-client");
  const current = clientSelect.value;
  clientSelect.innerHTML = (payload.clients || []).map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.name || client.id)}</option>`).join("");
  if (current && (payload.clients || []).some((client) => client.id === current)) clientSelect.value = current;
}
function moduleQueryUrl(cursor = null) {
  const params = new URLSearchParams({ limit: "20" });
  if (moduleQueryState.search) params.set("search", moduleQueryState.search);
  if (moduleQueryState.status) params.set("status", moduleQueryState.status);
  if (cursor) params.set("cursor", cursor);
  return `/api/modules?${params.toString()}`;
}
function renderModulePage(payload = {}, append = false) {
  const incoming = payload.modules || [];
  moduleQueryState.items = append ? [...moduleQueryState.items, ...incoming] : incoming;
  moduleQueryState.total = Number(payload.page?.total ?? moduleQueryState.items.length);
  moduleQueryState.cursor = payload.page?.nextCursor || null;
  moduleQueryState.hasMore = Boolean(payload.page?.hasMore);
  const page = payload.page || {};
  $("#module-query-state").textContent = `${moduleQueryState.items.length} of ${moduleQueryState.total} modules${page.hasMore ? " · more available" : ""}`;
  $("#module-load-more").hidden = !moduleQueryState.hasMore;
  $("#modules-list").innerHTML = moduleQueryState.items.length ? moduleQueryState.items.map((module) => { const hasData = (module.latestReadings || []).length > 0; const gap = Object.values(module.monitoringDevices || {}).some((device) => device.state === "not_connected") || !hasData; return `<article class="module-item"><div><strong>${escapeHtml(module.label)}</strong><span>${escapeHtml(module.id)} · ${escapeHtml(module.assetId)} · ${escapeHtml(module.zone || "No zone")} · ${hasData ? `${module.latestReadings.length}/4 metrics` : "No telemetry yet"}</span></div><span class="module-state ${gap ? "warn" : ""}">${gap ? "Needs setup" : "Connected"}</span></article>`; }).join("") : "<p>No modules match this search.</p>";
}
async function loadModulePage(append = false) {
  const payload = await api(moduleQueryUrl(append ? moduleQueryState.cursor : null));
  renderModulePage(payload, append);
  return payload;
}
const goLiveGateMeta = Object.freeze({
  "full-postgres-migration": { owner: "Platform / cloud", next: "Apply the complete PostgreSQL migration and capture the production preflight report." },
  "offhost-restore-drill": { owner: "Platform / cloud", next: "Upload an encrypted backup and restore it into a separate database." },
  "real-device-pilot": { owner: "Device / field", next: "Run one signed sensor reading and one camera capture from physical devices." },
  "multi-client-pilot": { owner: "FM operations", next: "Complete repeated service cycles for at least two real client accounts." },
  "monitoring-verified": { owner: "Platform / SRE", next: "Exercise alert delivery, acknowledgement and recovery on the hosted service." },
  "ai-provider-verified": { owner: "AI / horticulture", next: "Evaluate a real vision provider with labelled captures and human review." },
  "media-scan-verified": { owner: "Platform / security", next: "Verify the production malware-scanning path for proof and camera media." }
});
function goLiveStateLabel(state) { return state === "verified" ? "Verified" : state === "submitted" ? "Awaiting review" : state === "rejected" ? "Rejected" : state === "expired" ? "Expired" : "Unverified"; }
function pilotCheckStateLabel(state) { return state === "ready" ? "Ready" : state === "deferred" ? "Deferred" : "Awaiting data"; }
function renderPilotChecklist({ modules = {}, route = {}, maintenanceImports = {}, workforce = {}, captures = {}, esgLedger = {} } = {}) {
  const moduleTotal = Number(modules.page?.total ?? modules.modules?.length ?? 0);
  const imports = maintenanceImports.batches || [];
  const candidates = workforce.candidates || [];
  const captureBatches = captures.batches || [];
  const syncedCaptures = captureBatches.filter((item) => item.syncStatus === "synced");
  const checks = [
    { label: "Pilot scope", detail: moduleTotal >= 3 ? `${moduleTotal} modules in catalogue · select three in Admin.` : "At least three modules are needed before the pilot can start.", state: moduleTotal >= 3 ? "ready" : "awaiting" },
    { label: "Airtable handoff", detail: imports.some((item) => item.status === "applied") ? "An applied maintenance import is available for the test run." : "Waiting for the first approved Airtable maintenance export.", state: imports.some((item) => item.status === "applied") ? "ready" : "awaiting" },
    { label: "Route plan", detail: route.route?.length ? `${route.route.length} route stops are available for assignment.` : "Generate or assign the first pilot route.", state: route.route?.length ? "ready" : "awaiting" },
    { label: "Technician capacity", detail: candidates.some((item) => item.eligible) ? "At least one eligible technician is available." : "No eligible technician is currently available for the selected date.", state: candidates.some((item) => item.eligible) ? "ready" : "awaiting" },
    { label: "Technician evidence", detail: captureBatches.length ? `${captureBatches.length} field capture batch${captureBatches.length === 1 ? "" : "es"} recorded.` : "Waiting for the first technician capture.", state: captureBatches.length ? "ready" : "awaiting" },
    { label: "Client proof view", detail: syncedCaptures.length ? `${syncedCaptures.length} synced capture batch${syncedCaptures.length === 1 ? "" : "es"} can be checked in the client portal.` : "Client proof is waiting for a synced field capture.", state: syncedCaptures.length ? "ready" : "awaiting" },
    { label: "ESG baseline", detail: esgLedger.status === "complete" ? "The selected period has a complete ESG ledger." : "Generate the ESG period ledger after the pilot evidence is recorded.", state: esgLedger.status === "complete" ? "ready" : "awaiting" }
  ];
  const ready = checks.filter((item) => item.state === "ready").length;
  const waiting = checks.filter((item) => item.state === "awaiting").length;
  $("#pilot-state").textContent = waiting ? `${waiting} steps awaiting data` : "Ready to run";
  $("#pilot-summary").innerHTML = `<div><strong>${ready}/${checks.length}</strong><span>pilot steps ready</span><small>${waiting ? "The next inputs are Airtable rows and technician evidence." : "The internal pilot checklist is complete."}</small></div><a class="pilot-link" href="#release-evidence-panel">Production gates stay separate</a>`;
  $("#pilot-checklist").innerHTML = checks.map((item) => `<article class="pilot-check ${escapeHtml(item.state)}"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></div><b>${escapeHtml(pilotCheckStateLabel(item.state))}</b></article>`).join("");
}
function pilotReconciliationStateLabel(state) { return state === "ready" ? "Candidate" : state === "attention" ? "Attention" : "Awaiting data"; }
function renderPilotReconciliation(payload = {}) {
  const summary = payload.summary || {};
  const state = payload.status || "awaiting-data";
  $("#pilot-reconciliation-state").textContent = pilotReconciliationStateLabel(state);
  $("#pilot-reconciliation-summary").innerHTML = [
    [`${Number(summary.readyChecks || 0)}/${Number(summary.totalChecks || 0)}`, "checks ready"],
    [Number(summary.modules || 0), "modules in scope"],
    [`${Number(summary.syncedCaptureBatches || 0)}/${Number(summary.captureBatches || 0)}`, "capture batches synced"],
    [`${Number(summary.modulesWithFreshTelemetry || 0)}/${Number(summary.modules || 0)}`, "modules with fresh telemetry"],
    [`${Number(summary.modulesWithFreshCamera || 0)}/${Number(summary.modules || 0)}`, "cameras fresh"],
    [escapeHtml(summary.esgLedgerStatus || "not-generated"), "ESG ledger"]
  ].map(([value, label]) => `<div><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  $("#pilot-reconciliation-list").innerHTML = (payload.checks || []).map((item) => `<article class="pilot-reconciliation-check ${escapeHtml(item.state)}"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span><small>Next: ${escapeHtml(item.next)}</small></div><b>${escapeHtml(pilotReconciliationStateLabel(item.state))}</b></article>`).join("") || "<p class=\"empty\">No reconciliation checks returned.</p>";
  $("#pilot-reconciliation-notice").textContent = payload.claimBoundary || "Pilot closeout control only.";
}
async function refreshPilotReconciliation(force = false) {
  if (pilotReconciliationState.request && !force) return pilotReconciliationState.request;
  const request = api("/api/ops/pilot-reconciliation");
  pilotReconciliationState.request = request;
  try {
    const payload = await request;
    pilotReconciliationState.payload = payload;
    renderPilotReconciliation(payload);
    return payload;
  } finally {
    if (pilotReconciliationState.request === request) pilotReconciliationState.request = null;
  }
}
function renderGoLiveOverview(payload = {}) {
  const requirements = payload.requirements || [];
  const verified = Number(payload.verifiedCount || 0);
  const total = Number(payload.requiredCount || requirements.length);
  const outstanding = Math.max(0, total - verified);
  $("#go-live-state").textContent = payload.ready ? "Candidate" : `${outstanding} gate${outstanding === 1 ? "" : "s"} open`;
  $("#go-live-summary").innerHTML = `<div><strong>${verified}/${total}</strong><span>external gates verified</span><small>Official production readiness remains 65% until all evidence and repeated operations are accepted.</small></div><a class="go-live-link" href="#release-evidence-panel">Open evidence ledger</a>`;
  $("#go-live-list").innerHTML = requirements.length ? requirements.map((item) => {
    const state = item.state || "missing";
    const meta = goLiveGateMeta[item.key] || { owner: "Platform team", next: "Complete and retain dated external evidence." };
    const detail = item.latest ? `${item.latest.submittedBy || "Unknown submitter"} · observed ${formatTime(item.latest.observedAt)}` : meta.next;
    return `<article class="go-live-gate ${escapeHtml(state)}"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(meta.owner)} · ${escapeHtml(detail)}</span></div><b>${escapeHtml(goLiveStateLabel(state))}</b></article>`;
  }).join("") : "<p class=\"empty\">No production requirements configured.</p>";
}
function renderEvidenceControl(storage, latest = null) { const evidence = storage.evidenceSnapshots || {}; const counts = evidence.counts || {}; const latestMeta = evidence.latestSnapshot || null; evidenceControlState.latestId = latestMeta?.id || null; $("#snapshot-state").textContent = `${Number(counts.snapshots || 0)} stored · ${Number(counts.verified || 0)} verified`; $("#snapshot-summary").innerHTML = latest ? `<div><strong>${escapeHtml(latest.snapshotId)}</strong><span>${escapeHtml(latest.signatureStatus)} · ${escapeHtml(latest.verificationStatus)} · ${escapeHtml(latest.scope)}</span><small>SHA-256 ${escapeHtml(latest.sha256.slice(0, 16))}… · expires ${escapeHtml(latest.expiresAt || "not set")}</small></div>` : latestMeta ? `<div><strong>${escapeHtml(latestMeta.id)}</strong><span>Persisted ledger record · status detail loading</span><small>SHA-256 ${escapeHtml(latestMeta.sha256.slice(0, 16))}…</small></div>` : "<p class=\"empty\">No persisted snapshot yet.</p>"; $("#verify-snapshot").disabled = !evidenceControlState.latestId; }
function renderReleaseEvidence(payload = {}) {
  releaseEvidenceLedgerState.payload = payload;
  const requirements = payload.requirements || [];
  const summary = payload;
  $("#release-evidence-state").textContent = `${Number(summary.verifiedCount || 0)}/${Number(summary.requiredCount || requirements.length)} verified · ${Number(summary.missingCount || 0)} missing`;
  $("#release-evidence-summary").innerHTML = `<div><strong>${summary.ready ? "Release gates complete" : "Release gates blocked"}</strong><span>${Number(summary.verifiedCount || 0)} verified · ${Number(summary.submittedCount || 0)} awaiting review · ${Number(summary.expiredCount || 0)} expired</span><small>These records support release decisions; they do not replace external evidence.</small></div>`;
  const requirementSelect = $("#release-evidence-requirement");
  const currentRequirement = requirementSelect.value;
  requirementSelect.innerHTML = requirements.map((item) => `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}</option>`).join("");
  if (currentRequirement && requirements.some((item) => item.key === currentRequirement)) requirementSelect.value = currentRequirement;
  $("#release-evidence-list").innerHTML = requirements.length ? requirements.map((item) => {
    const record = item.latest;
    const state = item.state || "missing";
    const details = record ? `${record.submittedBy} · observed ${formatTime(record.observedAt)}${record.expiresAt ? ` · expires ${formatTime(record.expiresAt)}` : ""}` : "No evidence submission recorded";
    const artifact = record ? `<small>${escapeHtml(record.artifactRef)} · SHA-256 ${escapeHtml(record.artifactSha256.slice(0, 16))}…</small>` : "";
    const actions = record && state === "submitted" ? `<div class="release-evidence-actions"><input data-release-evidence-note="${escapeHtml(record.id)}" aria-label="Review note for ${escapeHtml(item.label)}" placeholder="Independent review note" maxlength="500"><button type="button" data-release-evidence-review="${escapeHtml(record.id)}" data-decision="verified" data-updated-at="${escapeHtml(record.updatedAt)}">Verify</button><button type="button" data-release-evidence-review="${escapeHtml(record.id)}" data-decision="rejected" data-updated-at="${escapeHtml(record.updatedAt)}">Reject</button></div>` : "";
    return `<article class="release-evidence-item"><div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span><small>${escapeHtml(details)}</small>${artifact}</div><b class="${escapeHtml(state)}">${escapeHtml(state)}</b>${actions}</article>`;
  }).join("") : "<p class=\"empty\">No release evidence requirements configured.</p>";
  if (!$("#release-evidence-observed").value) $("#release-evidence-observed").value = remediationTimeInput(new Date());
  renderGoLiveOverview(payload);
}
function contractActionFor(contract) { if (contract.status === "draft") return "activate"; if (contract.status === "active") return "suspend"; if (contract.status === "suspended") return "resume"; return null; }
function refreshContractChangeForm() {
  const contractId = $("#contract-change-contract").value;
  const contract = (contractState.overview?.contracts || []).find((item) => item.id === contractId);
  if (!contract) { $("#contract-change-submit").disabled = true; return; }
  $("#contract-change-submit").disabled = false;
  $("#contract-change-plan").value = contract.planName || "";
  $("#contract-change-start").value = contract.startDate || "";
  $("#contract-change-end").value = contract.endDate || "";
  $("#contract-change-visits").value = contract.visitsPerMonth || 1;
}
function refreshContractWalls() {
  const clientId = $("#contract-client").value;
  const walls = (contractState.overview?.walls || []).filter((wall) => wall.clientId === clientId);
  $("#contract-walls").innerHTML = walls.length ? walls.map((wall) => `<label><input type="checkbox" name="contract-wall" value="${escapeHtml(wall.id)}"><span>${escapeHtml(wall.name || wall.id)}<small>${escapeHtml(wall.location || wall.id)}</small></span></label>`).join("") : "<p class=\"contract-empty\">No living assets belong to this client.</p>";
}
function renderServiceContracts(payload = {}) {
  contractState.overview = payload;
  const summary = payload.summary || {};
  $("#contract-gap-count").textContent = Number(summary.uncoveredWalls || 0);
  $("#contract-state").textContent = `${Number(summary.active || 0)} active · ${Number(summary.uncoveredWalls || 0)} uncovered · ${Number(summary.expiringSoon || 0)} expiring`;
  const selectedClient = $("#contract-client").value;
  $("#contract-client").innerHTML = (payload.clients || []).map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.name || client.id)}</option>`).join("");
  if (selectedClient && (payload.clients || []).some((client) => client.id === selectedClient)) $("#contract-client").value = selectedClient;
  refreshContractWalls();
  const activeContracts = (payload.contracts || []).filter((contract) => contract.status === "active");
  const selectedChangeContract = $("#contract-change-contract").value;
  $("#contract-change-contract").innerHTML = activeContracts.map((contract) => { const client = (payload.clients || []).find((item) => item.id === contract.clientId); return `<option value="${escapeHtml(contract.id)}">${escapeHtml(contract.contractNumber)} · ${escapeHtml(client?.name || contract.clientId)}</option>`; }).join("");
  if (selectedChangeContract && activeContracts.some((contract) => contract.id === selectedChangeContract)) $("#contract-change-contract").value = selectedChangeContract;
  refreshContractChangeForm();
  const performance = payload.performance?.summary || {};
  const attainment = performance.attainmentRate === null || performance.attainmentRate === undefined ? "No completed SLA" : `${Math.round(Number(performance.attainmentRate) * 100)}% on time`;
  $("#contract-performance").innerHTML = `<div class="contract-performance-item"><strong>${escapeHtml(attainment)}</strong><span>SLA attainment / 履约准时率 · ${Number(performance.completedTasks || 0)} completed</span></div><div class="contract-performance-item"><strong>${Number(performance.openOverdueTasks || 0)}</strong><span>open overdue / 未结逾期</span></div><div class="contract-performance-item"><strong>${Number(payload.performance?.unlinkedTasks || 0)}</strong><span>unlinked tasks / 未关联工单</span></div>`;
  const pending = payload.changeRequests || [];
  $("#contract-change-list").innerHTML = pending.length ? pending.map((change) => { const contract = (payload.contracts || []).find((item) => item.id === change.contractId); return `<article class="contract-change-item"><div><strong>${escapeHtml(change.requestType)} · ${escapeHtml(contract?.contractNumber || change.contractId)}</strong><span>${escapeHtml(change.requestedTerms?.planName || "Terms update")} · v${Number(change.baseVersionNo || 1)} base · requested by ${escapeHtml(change.requestedBy)}</span><small>${escapeHtml(change.note)} · ${escapeHtml(change.requestedAt)}</small></div><div class="contract-change-actions"><input data-contract-change-note="${escapeHtml(change.id)}" aria-label="Review note for ${escapeHtml(change.id)}" placeholder="Review note"><button class="contract-action" data-contract-change-review="${escapeHtml(change.id)}" data-decision="approve" data-expected-updated-at="${escapeHtml(contract?.updatedAt || change.baseUpdatedAt)}" type="button">Approve</button><button class="contract-action" data-contract-change-review="${escapeHtml(change.id)}" data-decision="reject" data-expected-updated-at="${escapeHtml(contract?.updatedAt || change.baseUpdatedAt)}" type="button">Reject</button></div></article>`; }).join("") : "";
  $("#contract-list").innerHTML = (payload.contracts || []).length ? payload.contracts.map((contract) => {
    const client = (payload.clients || []).find((item) => item.id === contract.clientId);
    const action = contractActionFor(contract);
    const terminal = ["terminated"].includes(contract.status);
    const actions = terminal ? "" : `<div class="contract-actions"><input data-contract-note="${escapeHtml(contract.id)}" aria-label="Audit note for ${escapeHtml(contract.contractNumber)}" placeholder="Required audit note"><button class="contract-action" data-contract-action="${escapeHtml(contract.id)}" data-action="${escapeHtml(action || "terminate")}" data-updated-at="${escapeHtml(contract.updatedAt)}" type="button">${escapeHtml(action ? action[0].toUpperCase() + action.slice(1) : "Terminate")}</button>${action && action !== "activate" ? `<button class="contract-action" data-contract-action="${escapeHtml(contract.id)}" data-action="terminate" data-updated-at="${escapeHtml(contract.updatedAt)}" type="button">Terminate</button>` : ""}</div>`;
    const fee = new Intl.NumberFormat("en-HK", { style: "currency", currency: contract.currency || "HKD", maximumFractionDigits: 0 }).format(Number(contract.monthlyFee || 0));
    return `<article class="contract-item"><div><strong>${escapeHtml(contract.contractNumber)} · ${escapeHtml(contract.planName)}</strong><span>${escapeHtml(client?.name || contract.clientId)} · ${contract.wallIds.length} asset${contract.wallIds.length === 1 ? "" : "s"}</span><small>${escapeHtml(contract.startDate)} to ${escapeHtml(contract.endDate)} · ${fee}/month · ${contract.visitsPerMonth} visit${contract.visitsPerMonth === 1 ? "" : "s"}</small></div><div><strong>Service ${escapeHtml(contract.serviceWindowStart)}-${escapeHtml(contract.serviceWindowEnd)}</strong><span>Resolution: C ${contract.sla.critical.resolutionHours}h · H ${contract.sla.high.resolutionHours}h · N ${contract.sla.normal.resolutionHours}h · L ${contract.sla.low.resolutionHours}h</span><small>${contract.evidenceRequired ? "Photo and service evidence required" : "Service evidence optional"}</small></div><span class="contract-status ${escapeHtml(contract.effectiveState)}">${escapeHtml(contract.effectiveState)}</span>${actions}</article>`;
  }).join("") : "<p class=\"contract-empty\">No service contracts are recorded.</p>";
}
async function refreshServiceContractPanel() {
  const payload = await api("/api/service-contracts");
  renderServiceContracts(payload);
  renderEsgObservationScope(payload);
  return payload;
}
let dashboardLoad = null;
async function fetchDashboard() {
  $("#notice").textContent = "";
  if (!$("#workforce-date").value) $("#workforce-date").value = localDateValue();
  if (!$("#maintenance-through-date").value) $("#maintenance-through-date").value = localDateValue(new Date(Date.now() + 30 * 86400000));
  if (!$("#contract-start").value) $("#contract-start").value = localDateValue();
  if (!$("#contract-end").value) $("#contract-end").value = localDateValue(new Date(Date.now() + 365 * 86400000));
  if (!$("#esg-period-end").value) $("#esg-period-end").value = localDateValue();
  if (!$("#esg-period-start").value) $("#esg-period-start").value = localDateValue(new Date(Date.now() - 90 * 86400000));
  if (!$("#esg-observation-at").value) $("#esg-observation-at").value = remediationTimeInput(new Date());
  const maintenanceQuery = new URLSearchParams({ fromDate: localDateValue(), throughDate: $("#maintenance-through-date").value });
  const [reminders, route, modules, alerts, diagnoses, captures, notifications, timeline, quality, storage, dispatch, maintenanceImports, workforce, maintenanceCalendar, inventory, reliability, commissioning, deviceLifecycle, serviceContracts, releaseEvidence, healthReport, esgLedger, esgObservations] = await Promise.all([api("/api/mobile/reminders"), api("/api/mobile/route"), api("/api/modules"), api("/api/telemetry/alerts?statuses=open,acknowledged"), api("/api/ai/visual-diagnoses?statuses=queued,running"), api("/api/mobile/capture-batches"), api("/api/notifications?limit=20"), api("/api/ops/timeline?limit=24"), api("/api/ops/quality"), api("/api/storage"), api("/api/remediation/tasks?statuses=open,assigned,in_progress&limit=50"), api("/api/admin/imports/maintenance?limit=5"), api(`/api/workforce/candidates?serviceDate=${encodeURIComponent($("#workforce-date").value)}`), api(`/api/maintenance/calendar?${maintenanceQuery.toString()}`), api("/api/inventory/overview"), api("/api/ops/reliability"), api("/api/commissioning"), api("/api/device-lifecycle"), api("/api/service-contracts"), api("/api/production/evidence"), api("/api/ops/health"), api(`/api/esg/ledger?periodStart=${encodeURIComponent(new Date(`${$("#esg-period-start").value}T00:00:00.000Z`).toISOString())}&periodEnd=${encodeURIComponent(new Date(`${$("#esg-period-end").value}T23:59:59.999Z`).toISOString())}`), api("/api/esg/observations?limit=20")]);
  const open = reminders.counts?.open ?? reminders.items?.length ?? 0;
  $("#open-count").textContent = open;
  $("#stop-count").textContent = route.route?.length || 0;
  $("#module-count").textContent = Number(quality.summary?.modules ?? modules.page?.total ?? modules.modules?.length ?? 0);
  $("#device-gap-count").textContent = Number(quality.summary?.moduleUnready ?? (modules.modules || []).filter((item) => Object.values(item.monitoringDevices || {}).some((device) => device.state === "not_connected") || !(item.latestReadings || []).length).length);
  $("#alert-count").textContent = alerts.alerts?.filter((item) => item.status === "open").length || 0;
  $("#ai-count").textContent = diagnoses.diagnoses?.length || 0;
  $("#route-state").textContent = `${route.route?.length || 0} stops`;
  $("#reminder-list").innerHTML = reminders.items?.length ? reminders.items.slice(0, 8).map((item) => `<article class="reminder ${item.priority === "high" || item.priority === "critical" ? "urgent" : ""}"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.reason)}</span><small>${escapeHtml(item.due || "Scheduled")}</small></div><a href="${escapeHtml(item.mobileAction?.path || "mobile.html")}">Start</a></article>`).join("") : "<p>No open reminders.</p>";
  $("#route-list").innerHTML = route.route?.length ? route.route.map((stop) => `<article class="route-item"><div><strong>${escapeHtml(stop.assetName || stop.asset?.name || stop.wallId)}</strong><span>${escapeHtml(stop.workOrderId)} · ${escapeHtml(stop.due || "Scheduled")} · ${stop.modules?.length || 0} modules</span></div><a href="mobile.html?workOrderId=${encodeURIComponent(stop.workOrderId)}&wallId=${encodeURIComponent(stop.wallId)}">Open</a></article>`).join("") : "<p>No assigned stops today.</p>";
  renderModulePage(modules);
  renderPilotChecklist({ modules, route, maintenanceImports, workforce, captures, esgLedger });
  renderAlerts(alerts.alerts || [], route.route || []);
  renderAiQueue(diagnoses.diagnoses || []);
  renderCaptures(captures.batches || []);
  renderNotifications(notifications.notifications || [], notifications.summary || {});
  renderReliability(reliability);
  renderCommissioningSummary(commissioning);
  renderDeviceCare(deviceLifecycle);
  renderTimeline(timeline);
  renderQuality(quality);
  renderDispatchQueue(dispatch);
  renderWorkforce(workforce);
  renderMaintenancePlanning(maintenanceCalendar);
  renderInventory(inventory);
  renderServiceContracts(serviceContracts);
  renderOperationalHealth(healthReport);
  renderEsgLedger(esgLedger, esgObservations.observations || []);
  renderEsgObservationScope(serviceContracts);
  renderMaintenanceImports(maintenanceImports);
  renderReleaseEvidence(releaseEvidence);
  const latest = storage.evidenceSnapshots?.latestSnapshot?.id ? await api(`/api/proof/evidence-snapshots/${encodeURIComponent(storage.evidenceSnapshots.latestSnapshot.id)}`) : null;
  renderEvidenceControl(storage, latest);
}
async function load({ refresh = true } = {}) {
  if (dashboardLoad) {
    await dashboardLoad;
    return refresh ? load() : undefined;
  }
  const request = fetchDashboard();
  dashboardLoad = request;
  try { return await request; } finally { if (dashboardLoad === request) dashboardLoad = null; }
}
const aiReviewDialog = $("#ai-review-dialog");
const remediationDialog = $("#remediation-dialog");
const deviceCareDialog = $("#device-care-dialog");
function remediationTimeInput(value) { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function openDeviceCare(record) {
  const profileMode = record.profileStatus === "unmanaged";
  $("#device-care-id").value = record.deviceId; $("#device-care-updated-at").value = record.updatedAt || ""; $("#device-care-mode").value = profileMode ? "profile" : "action";
  $("#device-care-title").textContent = profileMode ? "Create service profile" : "Record device action"; $("#device-care-context").textContent = `${record.label} · ${record.deviceId} · ${record.moduleId || record.wallId}`;
  $("#device-profile-fields").hidden = !profileMode; $("#device-action-fields").hidden = profileMode;
  $("#device-care-serial").required = profileMode; $("#device-care-serial").value = record.serialNumber || ""; $("#device-care-manufacturer").value = record.manufacturer || ""; $("#device-care-model").value = record.model || ""; $("#device-care-interval").value = record.calibrationIntervalDays || 180; $("#device-care-last-calibrated").value = remediationTimeInput(record.lastCalibratedAt); $("#device-care-warranty").value = remediationTimeInput(record.warrantyExpiresAt);
  $("#device-care-action").value = ["fault", "quarantined"].includes(record.status) ? "returned_to_service" : "calibrated"; $("#device-care-work-order").value = ""; $("#device-care-evidence").value = ""; $("#device-care-replacement").value = ""; $("#device-care-note").value = ""; $("#device-care-error").textContent = "";
  deviceCareDialog.showModal();
}
async function saveDeviceCare(event) {
  event.preventDefault(); const deviceId = $("#device-care-id").value; const profileMode = $("#device-care-mode").value === "profile";
  const body = profileMode ? { serialNumber: $("#device-care-serial").value.trim(), manufacturer: $("#device-care-manufacturer").value.trim() || null, model: $("#device-care-model").value.trim() || null, calibrationIntervalDays: Number($("#device-care-interval").value), lastCalibratedAt: $("#device-care-last-calibrated").value ? new Date($("#device-care-last-calibrated").value).toISOString() : null, warrantyExpiresAt: $("#device-care-warranty").value ? new Date($("#device-care-warranty").value).toISOString() : null, note: $("#device-care-note").value.trim() || null }
    : { action: $("#device-care-action").value, expectedUpdatedAt: $("#device-care-updated-at").value, workOrderId: $("#device-care-work-order").value.trim() || null, evidenceRef: $("#device-care-evidence").value.trim() || null, replacementDeviceId: $("#device-care-replacement").value.trim() || null, note: $("#device-care-note").value.trim() || null };
  const button = $("#device-care-submit"); button.disabled = true; $("#device-care-error").textContent = "";
  try { await api(`/api/device-lifecycle/${encodeURIComponent(deviceId)}/${profileMode ? "profile" : "actions"}`, { method: profileMode ? "PUT" : "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); deviceCareDialog.close(); await load({ refresh: true }); $("#device-care-notice").textContent = `${deviceId} ${profileMode ? "profile saved" : "action recorded"}.`; } catch (error) { $("#device-care-error").textContent = error.message; } finally { button.disabled = false; }
}
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
    try { await api(`/api/remediation/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewDecision, reviewNote }) }); remediationDialog.close(); await load({ refresh: true }); }
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
    remediationDialog.close(); await load({ refresh: true });
  } catch (error) { $("#remediation-error").textContent = error.message; } finally { submit.disabled = false; }
}
function openAiReview(diagnosis) { aiReviewState.diagnosis = diagnosis; $("#ai-review-id").value = diagnosis.id; $("#ai-review-context").textContent = `${diagnosis.moduleId} · capture ${diagnosis.captureId} · current status ${diagnosis.status}. Manual review is recorded separately from an external provider result.`; $("#ai-review-status").value = "completed"; $("#ai-review-confidence").value = ""; $("#ai-review-provider").value = diagnosis.provider || ""; $("#ai-review-model").value = diagnosis.model || ""; $("#ai-review-note").value = ""; $("#ai-review-error").textContent = ""; aiReviewDialog.showModal(); }
async function startAiDiagnosis(id) { await api(`/api/ai/visual-diagnoses/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "running", provider: "pending-provider", model: "awaiting-callback", result: { stage: "running", evidenceBasis: "Awaiting external AI provider callback." } }) }); await load({ refresh: true }); }
async function saveAiReview(event) { event.preventDefault(); const status = $("#ai-review-status").value; const note = $("#ai-review-note").value.trim(); const confidenceText = $("#ai-review-confidence").value.trim(); const confidence = confidenceText === "" ? null : Number(confidenceText); if (!note) { $("#ai-review-error").textContent = "A result or failure note is required."; return; } if (status === "completed" && (confidence === null || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) { $("#ai-review-error").textContent = "Completed reviews require confidence from 0 to 1."; return; } const result = { summary: note, reviewedBy: principal, reviewMode: "human-assisted", evidenceBasis: "Provider output or operator review; not an automatic horticulture claim." }; await api(`/api/ai/visual-diagnoses/${encodeURIComponent($("#ai-review-id").value)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, confidence: status === "completed" ? confidence : null, provider: $("#ai-review-provider").value.trim() || "operator-review", model: $("#ai-review-model").value.trim() || "operator-review", result, errorCode: status === "failed" ? "AI_REVIEW_FAILED" : null }) }); aiReviewDialog.close(); await load({ refresh: true }); }
$("#refresh").onclick = () => load({ refresh: true }).catch((error) => { $("#notice").textContent = error.message; });
$("#reliability-scan").onclick = async () => { const button=$("#reliability-scan"); button.disabled=true; $("#reliability-notice").textContent="Checking scheduled job freshness…"; try { const result=await api("/api/ops/reliability/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}); renderReliability(result); $("#reliability-notice").textContent=`Check complete · ${result.scan.opened} opened · ${result.scan.recovered} recovered`; await load(); } catch(error){$("#reliability-notice").textContent=error.message;} finally{button.disabled=false;} };
$("#health-recompute").onclick = async () => { const button = $("#health-recompute"); button.disabled = true; $("#health-esg-notice").textContent = "Recomputing evidence-backed health…"; try { const result = await api("/api/ops/health/recompute", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: "{}" }); await load(); $("#health-esg-notice").textContent = `Health recomputed · ${result.summary.scoredAssets}/${result.summary.assets} assets scored.`; } catch (error) { $("#health-esg-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#esg-generate").onclick = async () => { const button = $("#esg-generate"); button.disabled = true; $("#health-esg-notice").textContent = "Generating ESG period ledger…"; try { const body = { periodStart: new Date(`${$("#esg-period-start").value}T00:00:00.000Z`).toISOString(), periodEnd: new Date(`${$("#esg-period-end").value}T23:59:59.999Z`).toISOString() }; const result = await api("/api/esg/ledger/recompute", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); await load(); $("#health-esg-notice").textContent = `ESG ledger saved · ${result.ledger.status} · ${result.ledger.period.periodStart.slice(0, 10)} to ${result.ledger.period.periodEnd.slice(0, 10)}.`; } catch (error) { $("#health-esg-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#esg-observation-form").onsubmit = async (event) => { event.preventDefault(); const button = $("#esg-observation-submit"); button.disabled = true; $("#health-esg-notice").textContent = "Saving structured ESG observation…"; try { const rating = $("#esg-observation-rating").value; const body = { clientId: $("#esg-observation-client").value, wallId: $("#esg-observation-wall").value.trim() || null, moduleId: $("#esg-observation-module").value.trim() || null, category: $("#esg-observation-category").value, rating: rating === "" ? null : Number(rating), observedAt: new Date($("#esg-observation-at").value).toISOString(), note: $("#esg-observation-note").value.trim(), evidenceRef: $("#esg-observation-evidence").value.trim() || null }; await api("/api/esg/observations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); event.target.reset(); $("#esg-observation-at").value = remediationTimeInput(new Date()); await load(); $("#health-esg-notice").textContent = "Observation saved to the ESG evidence ledger."; } catch (error) { $("#health-esg-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#ai-review-cancel").onclick = () => aiReviewDialog.close(); $("#ai-review-form").onsubmit = saveAiReview;
$("#remediation-cancel").onclick = () => remediationDialog.close(); $("#remediation-form").onsubmit = saveRemediation;
$("#device-care-cancel").onclick = () => deviceCareDialog.close(); $("#device-care-form").onsubmit = saveDeviceCare;
$("#dispatch-filter").onchange = renderDispatchTasks;
$("#dispatch-select-all").onchange = () => { const visible = dispatchState.tasks.filter((task) => $("#dispatch-filter").value === "overdue" ? task.sla?.level > 0 : $("#dispatch-filter").value === "pending" ? task.reviewStatus === "pending" : $("#dispatch-filter").value === "unassigned" ? !task.assignedTo : true); for (const task of visible) { if ($("#dispatch-select-all").checked) dispatchState.selected.add(task.id); else dispatchState.selected.delete(task.id); } renderDispatchTasks(); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); };
$("#workforce-date").onchange = () => refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; });
$("#maintenance-through-date").onchange = () => load().catch((error) => { $("#maintenance-notice").textContent = error.message; });
$("#contract-client").onchange = refreshContractWalls;
$("#contract-change-contract").onchange = refreshContractChangeForm;
$("#release-evidence-form").onsubmit = async (event) => {
  event.preventDefault();
  const observedAt = new Date($("#release-evidence-observed").value);
  const expiresAt = $("#release-evidence-expires").value ? new Date($("#release-evidence-expires").value) : null;
  if (Number.isNaN(observedAt.getTime()) || (expiresAt && Number.isNaN(expiresAt.getTime()))) { $("#release-evidence-notice").textContent = "Enter valid evidence dates."; return; }
  const button = $("#release-evidence-submit-button"); button.disabled = true; $("#release-evidence-notice").textContent = "Submitting evidence for independent review…";
  try {
    const result = await api("/api/production/evidence", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ requirementKey: $("#release-evidence-requirement").value, artifactRef: $("#release-evidence-ref").value.trim(), artifactSha256: $("#release-evidence-sha").value.trim(), observedAt: observedAt.toISOString(), expiresAt: expiresAt ? expiresAt.toISOString() : null, note: $("#release-evidence-note").value.trim() }) });
    event.target.reset(); $("#release-evidence-observed").value = remediationTimeInput(new Date()); await load(); $("#release-evidence-notice").textContent = `${result.record.requirementLabel || result.record.requirementKey} submitted for independent review.`;
  } catch (error) { $("#release-evidence-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#contract-form").onsubmit = async (event) => {
  event.preventDefault();
  const wallIds = [...document.querySelectorAll('input[name="contract-wall"]:checked')].map((input) => input.value);
  if (!wallIds.length) { $("#contract-notice").textContent = "Select at least one living asset."; return; }
  const responseHours = { critical: 1, high: 4, normal: 8, low: 24 };
  const resolutionHours = { critical: $("#contract-sla-critical").value, high: $("#contract-sla-high").value, normal: $("#contract-sla-normal").value, low: $("#contract-sla-low").value };
  const body = { clientId: $("#contract-client").value, contractNumber: $("#contract-number").value.trim(), planName: $("#contract-plan").value.trim(), startDate: $("#contract-start").value, endDate: $("#contract-end").value, currency: "HKD", monthlyFee: Number($("#contract-fee").value), visitsPerMonth: Number($("#contract-visits").value), serviceWindowStart: $("#contract-window-start").value, serviceWindowEnd: $("#contract-window-end").value, evidenceRequired: $("#contract-evidence").checked, wallIds, note: $("#contract-note").value.trim(), sla: Object.fromEntries(Object.keys(responseHours).map((priority) => [priority, { responseHours: responseHours[priority], resolutionHours: Number(resolutionHours[priority]) }])) };
  const button = $("#contract-submit"); button.disabled = true; $("#contract-notice").textContent = "Creating contract draft…";
  try { const result = await api("/api/service-contracts", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); await refreshServiceContractPanel(); $("#contract-create").open = false; $("#contract-number").value = ""; $("#contract-notice").textContent = `${result.contract.contractNumber} created as draft. Review and activate it when the signed agreement is effective.`; } catch (error) { $("#contract-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#contract-change-form").onsubmit = async (event) => {
  event.preventDefault();
  const contractId = $("#contract-change-contract").value;
  const contract = (contractState.overview?.contracts || []).find((item) => item.id === contractId);
  if (!contract) { $("#contract-notice").textContent = "Choose an active contract first."; return; }
  const button = $("#contract-change-submit"); button.disabled = true; $("#contract-notice").textContent = "Submitting contract change request…";
  try {
    const body = { requestType: $("#contract-change-type").value, terms: { planName: $("#contract-change-plan").value.trim(), startDate: $("#contract-change-start").value, endDate: $("#contract-change-end").value, visitsPerMonth: Number($("#contract-change-visits").value) }, note: $("#contract-change-note").value.trim() };
    const result = await api(`/api/service-contracts/${encodeURIComponent(contractId)}/changes`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) });
    await refreshServiceContractPanel(); $("#contract-change").open = false; $("#contract-change-note").value = ""; $("#contract-notice").textContent = `${result.change.requestType} request recorded for ${contract.contractNumber}.`;
  } catch (error) { $("#contract-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#field-cycle-import-form").onsubmit = async (event) => { event.preventDefault(); const file = $("#field-cycle-import-file").files[0]; if (!file) return; const button = $("#field-cycle-import-preview"); button.disabled = true; $("#field-cycle-import-notice").textContent = "Checking field-service rows and client scope…"; try { const csv = await file.text(); const result = await api("/api/admin/field-service/cycles/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, csv }) }); fieldCycleImportState.preview = { ...result, filename: file.name, csv }; renderFieldServiceCycles({ cycles: [], gate: result.gate }); $("#field-cycle-import-notice").textContent = result.invalidRows ? "Preview blocked. Fix every row before applying." : "Preview stored. Apply writes only the validated rows."; } catch (error) { fieldCycleImportState.preview = null; renderFieldServiceCycles(); $("#field-cycle-import-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#field-cycle-import").ontoggle = () => { if ($("#field-cycle-import").open) void refreshFieldServiceCycles(); };
$("#field-cycle-import-apply").onclick = async () => { const preview = fieldCycleImportState.preview; if (!preview?.csv) return; const button = $("#field-cycle-import-apply"); button.disabled = true; $("#field-cycle-import-notice").textContent = "Applying field-service cycles after relationship checks…"; try { const result = await api("/api/admin/field-service/cycles/import", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ filename: preview.filename, csv: preview.csv }) }); fieldCycleImportState.preview = null; await load(); await refreshFieldServiceCycles(true); $("#field-cycle-import-notice").textContent = result.total + " field-service cycle" + (result.total === 1 ? "" : "s") + " imported into the operational ledger."; } catch (error) { $("#field-cycle-import-notice").textContent = error.message; button.disabled = false; } };
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-release-evidence-review]");
  if (!button) return;
  const recordId = button.dataset.releaseEvidenceReview;
  const note = document.querySelector(`[data-release-evidence-note="${CSS.escape(recordId)}"]`)?.value.trim();
  if (!note) { $("#release-evidence-notice").textContent = "Enter a review note before deciding release evidence."; return; }
  button.disabled = true; $("#release-evidence-notice").textContent = `Recording ${button.dataset.decision}…`;
  try {
    await api(`/api/production/evidence/${encodeURIComponent(recordId)}/review`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ decision: button.dataset.decision, expectedUpdatedAt: button.dataset.updatedAt, reviewNote: note }) });
    await load(); $("#release-evidence-notice").textContent = `Evidence ${button.dataset.decision}.`;
  } catch (error) { $("#release-evidence-notice").textContent = error.message; button.disabled = false; }
});
document.addEventListener("click", async (event) => {
  const reviewButton = event.target.closest("[data-contract-change-review]");
  if (reviewButton) {
    const changeId = reviewButton.dataset.contractChangeReview;
    const note = document.querySelector(`[data-contract-change-note="${CSS.escape(changeId)}"]`)?.value.trim();
    if (!note) { $("#contract-notice").textContent = "Enter a review note before deciding a contract change."; return; }
    reviewButton.disabled = true; $("#contract-notice").textContent = `Recording ${reviewButton.dataset.decision}…`;
    try { await api(`/api/service-contract-changes/${encodeURIComponent(changeId)}/review`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ decision: reviewButton.dataset.decision, expectedContractUpdatedAt: reviewButton.dataset.expectedUpdatedAt, reviewNote: note }) }); await refreshServiceContractPanel(); $("#contract-notice").textContent = `Contract change ${reviewButton.dataset.decision}d and version history updated.`; } catch (error) { $("#contract-notice").textContent = error.message; reviewButton.disabled = false; }
    return;
  }
  const button = event.target.closest("[data-contract-action]");
  if (!button) return;
  const contractId = button.dataset.contractAction;
  const note = document.querySelector(`[data-contract-note="${CSS.escape(contractId)}"]`)?.value.trim();
  if (!note) { $("#contract-notice").textContent = "Enter an audit note before changing a contract."; return; }
  button.disabled = true; $("#contract-notice").textContent = `Recording ${button.dataset.action}…`;
  try {
    const result = await api(`/api/service-contracts/${encodeURIComponent(contractId)}/actions`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ action: button.dataset.action, expectedUpdatedAt: button.dataset.updatedAt, note }) });
    await refreshServiceContractPanel();
    $("#contract-notice").textContent = `${result.contract.contractNumber} is now ${result.contract.effectiveState}.`;
  } catch (error) { $("#contract-notice").textContent = error.message; button.disabled = false; }
});
$("#maintenance-generate-form").onsubmit = async (event) => {
  event.preventDefault();
  const button = $("#maintenance-generate"); button.disabled = true; $("#maintenance-notice").textContent = "Generating due work orders with duplicate protection…";
  try {
    const result = await api("/api/maintenance/generate", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ fromDate: localDateValue(), throughDate: $("#maintenance-through-date").value }) });
    await load();
    $("#maintenance-notice").textContent = `${result.run.generatedCount} work order${result.run.generatedCount === 1 ? "" : "s"} generated · ${result.run.skippedCount} already existed`;
  } catch (error) { $("#maintenance-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#inventory-action-form").onsubmit = async (event) => {
  event.preventDefault();
  const action = event.submitter?.value || "transfer";
  const overview = inventoryState.overview || {};
  const warehouse = (overview.locations || []).find((item) => item.kind === "warehouse");
  const workOrderId = $("#inventory-work-order").value;
  const selectedWorkOrder = $("#inventory-work-order").selectedOptions[0];
  const sku = $("#inventory-sku").value;
  const quantity = Number($("#inventory-quantity").value);
  const destinationLocationId = $("#inventory-destination").value;
  if (!warehouse) { $("#inventory-notice").textContent = "Warehouse location is not configured."; return; }
  if (!sku || !Number.isFinite(quantity) || quantity <= 0) { $("#inventory-notice").textContent = "Choose an SKU and enter a positive quantity."; return; }
  if (action === "reserve" && !workOrderId) { $("#inventory-notice").textContent = "Choose a work order before reserving stock."; return; }
  if (action === "transfer" && !destinationLocationId) { $("#inventory-notice").textContent = "Choose a technician route kit."; return; }
  const button = event.submitter; button.disabled = true; $("#inventory-notice").textContent = action === "reserve" ? "Reserving stock…" : "Loading route kit…";
  try {
    if (action === "reserve") {
      await api("/api/inventory/reservations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ workOrderId, technicianId: selectedWorkOrder?.dataset.technician || null, sourceLocationId: warehouse.id, sku, quantity }) });
    } else {
      await api("/api/inventory/transactions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ type: "transfer", sourceLocationId: warehouse.id, destinationLocationId, workOrderId: workOrderId || null, sku, quantity, note: workOrderId ? `Route kit load for ${workOrderId}` : "Route kit replenishment" }) });
    }
    await load();
    $("#inventory-notice").textContent = action === "reserve" ? `${quantity} ${sku} reserved for ${workOrderId}.` : `${quantity} ${sku} loaded to route kit.`;
    $("#inventory-quantity").value = "";
  } catch (error) { $("#inventory-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#inventory-receipt-form").onsubmit = async (event) => {
  event.preventDefault(); const overview = inventoryState.overview || {}; const warehouse = (overview.locations || []).find((item) => item.kind === "warehouse");
  if (!warehouse) { $("#inventory-notice").textContent = "Warehouse location is not configured."; return; }
  const body = { locationId: warehouse.id, sku: $("#inventory-receipt-sku").value, lotCode: $("#inventory-lot-code").value.trim(), supplier: $("#inventory-supplier").value.trim(), quantity: Number($("#inventory-receipt-quantity").value), expiryDate: $("#inventory-expiry").value, receivedDate: localDateValue(), note: "Received and checked by FM inventory control" };
  const button = event.submitter; button.disabled = true; $("#inventory-notice").textContent = "Receiving traceable lot…";
  try { const result = await api("/api/inventory/lots/receive", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); event.target.reset(); await load(); $("#inventory-notice").textContent = `${result.lot.sku} lot ${result.lot.lotCode} received and added to FEFO allocation.`; }
  catch (error) { $("#inventory-notice").textContent = error.message; } finally { button.disabled = false; }
};
$("#dispatch-due-at").onchange = () => { if ($("#dispatch-due-at").value) $("#workforce-date").value = $("#dispatch-due-at").value.slice(0, 10); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); };
$("#module-query-form").onsubmit = async (event) => { event.preventDefault(); moduleQueryState.search = $("#module-search").value.trim(); moduleQueryState.status = $("#module-status").value; moduleQueryState.cursor = null; $("#module-query-submit").disabled = true; try { await loadModulePage(false); } catch (error) { $("#module-query-state").textContent = error.message; } finally { $("#module-query-submit").disabled = false; } };
$("#module-load-more").onclick = async () => { const button = $("#module-load-more"); button.disabled = true; try { await loadModulePage(true); } catch (error) { $("#module-query-state").textContent = error.message; } finally { button.disabled = false; } };
$("#dispatch-load-more").onclick = () => loadMoreDispatch().catch((error) => { $("#dispatch-notice").textContent = error.message; });
$("#dispatch-sla-scan").onclick = async () => { const button = $("#dispatch-sla-scan"); button.disabled = true; $("#dispatch-notice").textContent = "Scanning active SLA deadlines…"; try { const result = await api("/api/remediation/sla-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); $("#dispatch-notice").textContent = `${result.scanned} scanned · ${result.escalated} newly escalated`; await load(); } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#dispatch-bulk-form").onsubmit = async (event) => { event.preventDefault(); const taskIds = [...dispatchState.selected]; if (!taskIds.length) { $("#dispatch-notice").textContent = "Select at least one task."; return; } const body = { taskIds, expectedUpdatedAtById: Object.fromEntries(taskIds.map((id) => [id, dispatchState.tasks.find((task) => task.id === id)?.updatedAt])) }; const assignedTo = $("#dispatch-assigned-to").value.trim(); const dueAt = $("#dispatch-due-at").value; const priority = $("#dispatch-priority").value; const status = $("#dispatch-status").value; if (assignedTo) body.assignedTo = assignedTo; if (dueAt) body.dueAt = new Date(dueAt).toISOString(); if (priority) body.priority = priority; if (status) body.status = status; if (Object.keys(body).length === 2) { $("#dispatch-notice").textContent = "Choose an assignment, due time, priority or status."; return; } const button = $("#dispatch-apply"); button.disabled = true; $("#dispatch-notice").textContent = "Applying dispatch update…"; try { const result = await api("/api/remediation/tasks/bulk", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); dispatchState.selected.clear(); await load(); $("#dispatch-notice").textContent = `${result.updated} task${result.updated === 1 ? "" : "s"} updated`; } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-form").onsubmit = async (event) => { event.preventDefault(); const file = $("#maintenance-import-file").files[0]; if (!file) return; const button = $("#maintenance-import-preview"); button.disabled = true; $("#maintenance-import-notice").textContent = "Validating CSV against current asset master data…"; try { const result = await api("/api/admin/imports/maintenance/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, csv: await file.text() }) }); renderMaintenancePreview(result.batch); $("#maintenance-import-notice").textContent = result.duplicate ? "This exact file was already previewed." : "Preview stored. Apply is enabled only when every row is valid."; await load(); } catch (error) { $("#maintenance-import-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-apply").onclick = async () => { const batch = maintenanceImportState.batch; if (!batch) return; const button = $("#maintenance-import-apply"); button.disabled = true; $("#maintenance-import-notice").textContent = "Applying validated maintenance rows…"; try { const result = await api(`/api/admin/imports/maintenance/${encodeURIComponent(batch.id)}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); renderMaintenancePreview(result.batch); await load(); $("#maintenance-import-notice").textContent = `${result.imported} maintenance row${result.imported === 1 ? "" : "s"} imported into work orders.`; } catch (error) { const conflictCount = Number(error.details?.conflictCount || 0); $("#maintenance-import-notice").textContent = conflictCount ? `${error.message} · ${conflictCount} row${conflictCount === 1 ? "" : "s"} need a newer Airtable export.` : error.message; button.disabled = false; } };
$("#persist-snapshot").onclick = async () => { const button = $("#persist-snapshot"); button.disabled = true; $("#snapshot-notice").textContent = "Persisting current evidence package…"; try { const result = await api("/api/proof/evidence-snapshots", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); $("#snapshot-notice").textContent = `${result.snapshotId} persisted · ${result.signatureStatus}`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#verify-snapshot").onclick = async () => { const button = $("#verify-snapshot"); if (!evidenceControlState.latestId) return; button.disabled = true; $("#snapshot-notice").textContent = "Verifying latest snapshot…"; try { const result = await api(`/api/proof/evidence-snapshots/${encodeURIComponent(evidenceControlState.latestId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Reviewed from FM Lead evidence control." }) }); $("#snapshot-notice").textContent = `${result.snapshotId} verification: ${result.verificationStatus}`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = !evidenceControlState.latestId; } };
$("#sweep-snapshots").onclick = async () => { const button = $("#sweep-snapshots"); button.disabled = true; $("#snapshot-notice").textContent = "Running retention sweep…"; try { const result = await api("/api/proof/evidence-snapshots/retention-sweep", { method: "POST" }); $("#snapshot-notice").textContent = `Retention sweep complete · ${Number(result.expiredCount || 0)} expired`; await load(); } catch (error) { $("#snapshot-notice").textContent = error.message; } finally { button.disabled = false; } };
document.addEventListener("click", async (event) => {
  const deviceCare = event.target.closest("[data-device-care]");
  if (deviceCare) { const record = deviceCareState.records.find((item) => item.deviceId === deviceCare.dataset.deviceCare); if (record) openDeviceCare(record); return; }
  const button = event.target.closest("[data-maintenance-assign]");
  if (!button) return;
  const workOrderId = button.dataset.maintenanceAssign;
  const select = [...document.querySelectorAll("[data-maintenance-technician]")].find((item) => item.dataset.maintenanceTechnician === workOrderId);
  const technicianId = select?.value;
  if (!technicianId) { $("#maintenance-notice").textContent = "Choose a technician before assigning."; return; }
  button.disabled = true;
  try {
    await api("/api/workforce/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType: "work-order", targetId: workOrderId, technicianId, serviceDate: button.dataset.serviceDate }) });
    await load();
    $("#maintenance-notice").textContent = `${workOrderId} is now visible on ${technicianId}'s phone route.`;
  } catch (error) { $("#maintenance-notice").textContent = error.message; button.disabled = false; }
});
document.addEventListener("click", async (event) => { const aiStart = event.target.closest("[data-ai-start]"); const aiReview = event.target.closest("[data-ai-review]"); const remediationCreate = event.target.closest("[data-remediation-create]"); const remediationEdit = event.target.closest("[data-remediation-edit]"); if (aiStart) { aiStart.disabled = true; try { await startAiDiagnosis(aiStart.dataset.aiStart); } catch (error) { $("#notice").textContent = error.message; aiStart.disabled = false; } return; } if (aiReview) { const diagnosis = aiReviewState.diagnoses.find((item) => item.id === aiReview.dataset.aiReview); if (diagnosis) openAiReview(diagnosis); return; } if (remediationCreate) { const item = remediationState.moduleItems.find((candidate) => candidate.moduleId === remediationCreate.dataset.remediationCreate); if (item) openRemediationCreate(item); return; } if (remediationEdit) { const item = remediationState.moduleItems.find((candidate) => candidate.moduleId === remediationEdit.dataset.remediationModule); if (item?.remediationTask) openRemediationEdit(item, item.remediationTask); return; } const button = event.target.closest("[data-alert-status]"); if (!button) return; button.disabled = true; try { await api(`/api/telemetry/alerts/${encodeURIComponent(button.dataset.alertStatus)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus, resolutionNote: "Handled from Today operations queue." }) }); await load(); } catch (error) { $("#notice").textContent = error.message; button.disabled = false; } });
$("#pilot-reconciliation-refresh").onclick = async () => { const button = $("#pilot-reconciliation-refresh"); button.disabled = true; $("#pilot-reconciliation-notice").textContent = "Refreshing scoped closeout data…"; try { await refreshPilotReconciliation(true); } catch (error) { $("#pilot-reconciliation-notice").textContent = error.message; } finally { button.disabled = false; } };
load().then(() => refreshPilotReconciliation()).catch((error) => { $("#notice").textContent = error.message; });
