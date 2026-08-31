(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const states = { pending: "待核實", verified: "已核實", rejected: "未採納", "upload-pending": "照片待上傳" };
  let token = "", cursor = null, current = null, urls = [], generation = 0;
  function say(text) { $("review-message").textContent = text; }
  function cleanup() { generation++; urls.forEach((url) => URL.revokeObjectURL(url)); urls = []; }
  async function api(path, body, binary = false) {
    const response = await fetch(`/api/learning${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: "no-store", signal: AbortSignal.timeout(40000) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "讀取失敗");
    return binary ? response.blob() : response.json();
  }
  async function list(more = false) {
    const result = await api(`/admin/cases${more && cursor ? `?before=${cursor}` : ""}`);
    cursor = result.nextCursor;
    const html = result.items.map((item) => `<button class="feedback-case-card" data-id="${esc(item.id)}"><span>${esc(item.cropKey)} · ${esc(new Date(item.createdAt).toLocaleString())}</span><strong>${esc(item.snapshot.hypothesis)} · ${esc(states[item.status])}</strong><span>${item.followups.length} 次複查 · ${item.trainingConsent ? "同意模型改進" : "僅限病例追蹤"}${item.snapshot.synthetic ? " · 測試樣本，不可訓練" : ""}</span></button>`).join("");
    if (more) $("review-list").insertAdjacentHTML("beforeend", html);
    else $("review-list").innerHTML = html || '<p class="feedback-empty">目前還沒有手機提交的病例。</p>';
    $("review-more").hidden = !cursor;
  }
  async function detail(id) {
    cleanup(); const mine = generation;
    const item = await api(`/admin/cases/${id}`);
    if (mine !== generation) return;
    current = item;
    $("review-detail").hidden = false;
    $("review-detail").innerHTML = `<h2>${esc(item.cropKey)} · ${esc(states[item.status])}</h2><p>原判斷：${esc(item.snapshot.diagnosis)}</p><p>原建議：${esc(item.snapshot.action)}</p><p>用戶認為：${esc(item.snapshot.hypothesis)}；${esc(item.snapshot.note)}</p><p>环境：${esc(JSON.stringify(item.snapshot.environment))}</p><p>來源：${esc(item.snapshot.vision.provider)} / ${esc(item.snapshot.vision.model)}；${esc(item.snapshot.analyzedAt)}</p><p>模型觀察：${esc(JSON.stringify(item.snapshot.vision.observations))}</p><img id="review-baseline" class="feedback-case-photo" alt="原始診斷照片"><div class="feedback-timeline">${item.followups.map((entry) => `<article><strong>${esc(entry.outcome)} · ${esc(new Date(entry.createdAt).toLocaleString())}</strong><p>實際措施：${esc(entry.actionTaken)}</p><p>${esc(entry.note)}</p>${entry.photo ? `<img class="feedback-case-photo" data-event="${esc(entry.id)}" alt="此次複查照片">` : "<p>未附照片</p>"}</article>`).join("")}</div>${item.review ? `<p>上次核實：${esc(item.review.diagnosis)}；${esc(item.review.evidence)}</p>` : ""}<form id="review-form"><label class="feedback-field">審核人<input name="reviewer" required maxlength="100"></label><label class="feedback-field">結論<select name="status"><option value="pending">繼續待核實</option><option value="verified">證據支持，人工核實</option><option value="rejected">未採納／證據不足</option></select></label><label class="feedback-field">核實後診斷<input name="diagnosis" maxlength="400"></label><label class="feedback-field">支持與排除原因的證據<textarea name="evidence" required maxlength="1200" placeholder="對照環境、原照和複查，說明原因；僅改善不能證明病因。"></textarea></label><label><input type="checkbox" name="independentAssessment">我已獨立核查環境與照片，不只依據用戶猜測或症狀改善。</label><p class="feedback-micro">訓練候選另需用戶自願授權、真實非測試案例、原照及複查照。新增複查會觸發重新審核。</p><button class="feedback-primary">保存人工審核</button></form>`;
    $("review-form").onsubmit = async (event) => {
      event.preventDefault(); const form = event.currentTarget, button = form.querySelector("button"); button.disabled = true;
      try {
        await api(`/admin/cases/${id}/review`, { id: crypto.randomUUID(), evidenceDigest: item.evidenceDigest, status: form.elements.status.value, reviewer: form.elements.reviewer.value, diagnosis: form.elements.diagnosis.value, evidence: form.elements.evidence.value, independentAssessment: form.elements.independentAssessment.checked });
        await detail(id); await list(); say("人工審核已保存。尚未啟動模型訓練。");
      } catch (error) { say(error.message); } finally { button.disabled = false; }
    };
    await Promise.all([null, ...item.followups.filter((entry) => entry.photo).map((entry) => entry.id)].map(async (eventId) => {
      try {
        const blob = await api(`/cases/${id}/photo${eventId ? `?event=${eventId}` : ""}`, null, true);
        if (mine !== generation) return;
        const url = URL.createObjectURL(blob); urls.push(url);
        const img = eventId ? document.querySelector(`[data-event="${eventId}"]`) : $("review-baseline");
        img.src = url;
      } catch { if (mine === generation) say("部分照片暫時讀取失敗，請刷新後再核實，不要依靠文字猜測。"); }
    }));
  }
  $("review-login").onsubmit = async (event) => {
    event.preventDefault(); token = $("review-token").value.trim(); $("review-token").value = "";
    try { await list(); $("review-workspace").hidden = false; $("review-login").hidden = true; say("憑證只保留於本頁記憶體，關閉或鎖定即清除。"); }
    catch (error) { token = ""; say(error.message); }
  };
  $("review-logout").onclick = () => { cleanup(); token = ""; current = null; $("review-list").innerHTML = ""; $("review-detail").innerHTML = ""; $("review-workspace").hidden = true; $("review-detail").hidden = true; $("review-login").hidden = false; say("已鎖定。"); };
  $("review-reload").onclick = () => list().catch((error) => say(error.message));
  $("review-more").onclick = () => list(true).catch((error) => say(error.message));
  $("review-list").onclick = (event) => { const id = event.target.closest("[data-id]")?.dataset.id; if (id) detail(id).catch((error) => say(error.message)); };
})();
