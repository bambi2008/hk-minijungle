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
  if (!$("#maintenance-through-date").value) $("#maintenance-through-date").value = localDateValue(new Date(Date.now() + 30 * 86400000));
  const maintenanceQuery = new URLSearchParams({ fromDate: localDateValue(), throughDate: $("#maintenance-through-date").value });
  const [reminders, route, modules, alerts, diagnoses, captures, notifications, timeline, quality, storage, dispatch, maintenanceImports, workforce, maintenanceCalendar, inventory, reliability, commissioning, deviceLifecycle] = await Promise.all([api("/api/mobile/reminders"), api("/api/mobile/route"), api("/api/modules"), api("/api/telemetry/alerts?statuses=open,acknowledged"), api("/api/ai/visual-diagnoses?statuses=queued,running"), api("/api/mobile/capture-batches"), api("/api/notifications?limit=20"), api("/api/ops/timeline?limit=24"), api("/api/ops/quality"), api("/api/storage"), api("/api/remediation/tasks?statuses=open,assigned,in_progress&limit=50"), api("/api/admin/imports/maintenance?limit=5"), api(`/api/workforce/candidates?serviceDate=${encodeURIComponent($("#workforce-date").value)}`), api(`/api/maintenance/calendar?${maintenanceQuery.toString()}`), api("/api/inventory/overview"), api("/api/ops/reliability"), api("/api/commissioning"), api("/api/device-lifecycle")]);
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
  renderReliability(reliability);
  renderCommissioningSummary(commissioning);
  renderDeviceCare(deviceLifecycle);
  renderTimeline(timeline);
  renderQuality(quality);
  renderDispatchQueue(dispatch);
  renderWorkforce(workforce);
  renderMaintenancePlanning(maintenanceCalendar);
  renderInventory(inventory);
  renderMaintenanceImports(maintenanceImports);
  const latest = storage.evidenceSnapshots?.latestSnapshot?.id ? await api(`/api/proof/evidence-snapshots/${encodeURIComponent(storage.evidenceSnapshots.latestSnapshot.id)}`) : null;
  renderEvidenceControl(storage, latest);
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
  try { await api(`/api/device-lifecycle/${encodeURIComponent(deviceId)}/${profileMode ? "profile" : "actions"}`, { method: profileMode ? "PUT" : "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); deviceCareDialog.close(); await load(); $("#device-care-notice").textContent = `${deviceId} ${profileMode ? "profile saved" : "action recorded"}.`; } catch (error) { $("#device-care-error").textContent = error.message; } finally { button.disabled = false; }
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
$("#reliability-scan").onclick = async () => { const button=$("#reliability-scan"); button.disabled=true; $("#reliability-notice").textContent="Checking scheduled job freshness…"; try { const result=await api("/api/ops/reliability/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}); renderReliability(result); await load(); $("#reliability-notice").textContent=`Check complete · ${result.scan.opened} opened · ${result.scan.recovered} recovered`; } catch(error){$("#reliability-notice").textContent=error.message;} finally{button.disabled=false;} };
$("#ai-review-cancel").onclick = () => aiReviewDialog.close(); $("#ai-review-form").onsubmit = saveAiReview;
$("#remediation-cancel").onclick = () => remediationDialog.close(); $("#remediation-form").onsubmit = saveRemediation;
$("#device-care-cancel").onclick = () => deviceCareDialog.close(); $("#device-care-form").onsubmit = saveDeviceCare;
$("#dispatch-filter").onchange = renderDispatchTasks;
$("#dispatch-select-all").onchange = () => { const visible = dispatchState.tasks.filter((task) => $("#dispatch-filter").value === "overdue" ? task.sla?.level > 0 : $("#dispatch-filter").value === "pending" ? task.reviewStatus === "pending" : $("#dispatch-filter").value === "unassigned" ? !task.assignedTo : true); for (const task of visible) { if ($("#dispatch-select-all").checked) dispatchState.selected.add(task.id); else dispatchState.selected.delete(task.id); } renderDispatchTasks(); refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; }); };
$("#workforce-date").onchange = () => refreshWorkforceCandidates().catch((error) => { $("#workforce-notice").textContent = error.message; });
$("#maintenance-through-date").onchange = () => load().catch((error) => { $("#maintenance-notice").textContent = error.message; });
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
$("#dispatch-load-more").onclick = () => loadMoreDispatch().catch((error) => { $("#dispatch-notice").textContent = error.message; });
$("#dispatch-sla-scan").onclick = async () => { const button = $("#dispatch-sla-scan"); button.disabled = true; $("#dispatch-notice").textContent = "Scanning active SLA deadlines…"; try { const result = await api("/api/remediation/sla-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); await load(); $("#dispatch-notice").textContent = `${result.scanned} scanned · ${result.escalated} newly escalated`; } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#dispatch-bulk-form").onsubmit = async (event) => { event.preventDefault(); const taskIds = [...dispatchState.selected]; if (!taskIds.length) { $("#dispatch-notice").textContent = "Select at least one task."; return; } const body = { taskIds, expectedUpdatedAtById: Object.fromEntries(taskIds.map((id) => [id, dispatchState.tasks.find((task) => task.id === id)?.updatedAt])) }; const assignedTo = $("#dispatch-assigned-to").value.trim(); const dueAt = $("#dispatch-due-at").value; const priority = $("#dispatch-priority").value; const status = $("#dispatch-status").value; if (assignedTo) body.assignedTo = assignedTo; if (dueAt) body.dueAt = new Date(dueAt).toISOString(); if (priority) body.priority = priority; if (status) body.status = status; if (Object.keys(body).length === 2) { $("#dispatch-notice").textContent = "Choose an assignment, due time, priority or status."; return; } const button = $("#dispatch-apply"); button.disabled = true; $("#dispatch-notice").textContent = "Applying dispatch update…"; try { const result = await api("/api/remediation/tasks/bulk", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) }); dispatchState.selected.clear(); await load(); $("#dispatch-notice").textContent = `${result.updated} task${result.updated === 1 ? "" : "s"} updated`; } catch (error) { $("#dispatch-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-form").onsubmit = async (event) => { event.preventDefault(); const file = $("#maintenance-import-file").files[0]; if (!file) return; const button = $("#maintenance-import-preview"); button.disabled = true; $("#maintenance-import-notice").textContent = "Validating CSV against current asset master data…"; try { const result = await api("/api/admin/imports/maintenance/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, csv: await file.text() }) }); renderMaintenancePreview(result.batch); $("#maintenance-import-notice").textContent = result.duplicate ? "This exact file was already previewed." : "Preview stored. Apply is enabled only when every row is valid."; await load(); } catch (error) { $("#maintenance-import-notice").textContent = error.message; } finally { button.disabled = false; } };
$("#maintenance-import-apply").onclick = async () => { const batch = maintenanceImportState.batch; if (!batch) return; const button = $("#maintenance-import-apply"); button.disabled = true; $("#maintenance-import-notice").textContent = "Applying validated maintenance rows…"; try { const result = await api(`/api/admin/imports/maintenance/${encodeURIComponent(batch.id)}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); renderMaintenancePreview(result.batch); await load(); $("#maintenance-import-notice").textContent = `${result.imported} maintenance row${result.imported === 1 ? "" : "s"} imported into work orders.`; } catch (error) { $("#maintenance-import-notice").textContent = error.message; button.disabled = false; } };
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
load().catch((error) => { $("#notice").textContent = error.message; });
