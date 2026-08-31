(() => {
  "use strict";
  const root = document.querySelector("#customer-feedback-root");
  if (!root) return;
  const crops = { basil: "羅勒", tomato: "番茄", rosemary: "迷迭香", strawberry: "草莓", pepper: "辣椒" };
  const hypotheses = { "low-light": "缺光", underwatered: "缺水", overwatered: "過濕／積水", nutrition: "營養問題", pests: "蟲害或病害", healthy: "其實健康", other: "其他原因", "not-sure": "不確定，但判斷不對" };
  const outcomes = { better: "改善了", same: "沒有明顯變化", worse: "變差了" };
  const statuses = { pending: "待核實", verified: "人工已核實", rejected: "證據不足／未採納", "upload-pending": "照片待同步" };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = (value) => new Date(value).toLocaleString("zh-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const options = '<option value="1">1 天後</option><option value="2">2 天後</option><option value="3" selected>3 天後</option><option value="7">7 天後</option><option value="14">14 天後</option>';
  let context = null, draft = null, currentCase = null, flushing = false, dbPromise, deviceToken, photoURL, viewVersion = 0, followupURLs = [];
  try {
    deviceToken = localStorage.getItem("fivecropCaseDeviceKey");
    if (!/^[a-f0-9]{64}$/.test(deviceToken || "")) {
      deviceToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("fivecropCaseDeviceKey", deviceToken);
    }
  } catch { deviceToken = null; }
  root.innerHTML = `
    <div class="feedback-entry"><button type="button" id="feedback-open" hidden>判斷不對？告訴我們</button><button type="button" id="feedback-history">我的複查 <span id="feedback-due-count"></span></button></div>
    <p id="feedback-sync-status" class="feedback-micro" role="status"></p>
    <dialog id="feedback-dialog" aria-labelledby="feedback-title">
      <div class="feedback-sheet">
        <header><div><span class="feedback-eyebrow">GROW, NOTICE, LEARN</span><h2 id="feedback-title">一起把判斷做得更好</h2></div><button type="button" id="feedback-close" aria-label="關閉">×</button></header>
        <p id="feedback-message" role="status"></p>
        <form id="feedback-form" hidden>
          <p id="feedback-original" class="feedback-original"></p>
          <fieldset><legend>你認為更可能是？</legend><div class="feedback-chips">${Object.entries(hypotheses).map(([value, label]) => `<label><input type="radio" name="hypothesis" value="${value}" required><span>${label}</span></label>`).join("")}</div></fieldset>
          <label class="feedback-field">補充依據（選填）<textarea name="note" maxlength="1200" placeholder="例如：土一直濕，但這週幾乎沒曬到光。"></textarea></label>
          <label class="feedback-field">什麼時候回來看看？<select name="followupDays">${options}</select></label>
          <div class="feedback-consent"><p>點擊保存，會將這張壓縮照片、原診斷和你的反饋存入私有雲端病例，供後續複查。可在病例內刪除。</p><label><input type="checkbox" name="trainingConsent">另外同意：人工核實後，用照片及去識別案例改善 FiveCrop 模型。此項自願，可撤回，不影響使用。</label></div>
          <p class="feedback-micro">你的反饋先標記「待核實」，不會立即覆蓋診斷或成為訓練答案。</p>
          <button class="feedback-primary" type="submit">保存糾錯和照片</button>
        </form>
        <section id="feedback-history-panel" hidden><div class="feedback-history-tools"><button type="button" id="feedback-retry">重新同步</button><span>雲端病例，只對此裝置開放</span></div><div id="feedback-outbox"></div><div id="feedback-case-list"></div><button type="button" id="feedback-more" hidden>載入更早病例</button><p class="feedback-micro">提醒在 App 內顯示，不會在關閉 App 後發送推送。重裝 App 或清除網站資料會失去此裝置的病例憑證。</p></section>
        <section id="feedback-detail" hidden></section>
        <form id="feedback-followup" hidden>
          <fieldset><legend>和上一次相比，現在怎樣？</legend><div class="feedback-chips">${Object.entries(outcomes).map(([value, label]) => `<label><input type="radio" name="outcome" value="${value}" required><span>${label}</span></label>`).join("")}</div></fieldset>
          <label class="feedback-field">這段時間實際做了什麼？<textarea name="actionTaken" maxlength="800" required placeholder="例如：移到明亮窗邊，沒有改變澆水。也可以填尚未採取措施。"></textarea></label>
          <label class="feedback-field">新的觀察（選填）<textarea name="note" maxlength="1200" placeholder="例如：新葉較挺，但舊葉還是發黃。"></textarea></label>
          <label class="feedback-photo-input">拍一張同角度複查照（選填）<input type="file" name="photo" accept="image/jpeg,image/png,image/heic,image/heif" capture="environment"></label>
          <p id="feedback-followup-photo-status" class="feedback-micro"></p>
          <label class="feedback-field">下一次複查<select name="nextDays">${options}</select></label>
          <p class="feedback-micro">照片和記錄會保存到這個病例。改善不等於原因已被證實；我們保留完整過程供人工核查。</p>
          <button type="submit" class="feedback-primary">保存這次複查</button>
        </form>
      </div>
    </dialog>`;
  const $ = (id) => document.getElementById(id);
  const dialog = $("feedback-dialog");
  function database() {
    dbPromise ||= new Promise((resolve, reject) => {
      const request = indexedDB.open("fivecrop-feedback-v1", 1);
      request.onupgradeneeded = () => { request.result.createObjectStore("outbox", { keyPath: "id" }); request.result.createObjectStore("cache", { keyPath: "id" }); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("無法保存待同步資料，請允許 App 使用本機儲存"));
    });
    return dbPromise;
  }
  async function store(storeName, method, value) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, method === "getAll" || method === "get" ? "readonly" : "readwrite");
      const request = tx.objectStore(storeName)[method](value);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(new Error("本機資料保存失敗，請檢查可用空間後重試"));
      tx.onabort = tx.onerror;
    });
  }
  async function api(path, { method = "GET", body, binary = false } = {}) {
    if (!deviceToken) throw new Error("此裝置無法保存病例憑證，請允許本機儲存後重新開啟 App");
    const response = await fetch(`/api/learning${path}`, {
      method, headers: { Authorization: `Bearer ${deviceToken}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(40000), cache: "no-store"
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload.error || "雲端暫時無法連接，資料仍在本機待同步");
      error.status = response.status; throw error;
    }
    return binary ? response.blob() : response.json();
  }
  function message(text, error = false) { $("feedback-message").textContent = text; $("feedback-message").classList.toggle("feedback-error", error); }
  function panel(name, title) {
    viewVersion++;
    for (const id of ["feedback-form", "feedback-history-panel", "feedback-detail", "feedback-followup"]) $(id).hidden = id !== name;
    $("feedback-title").textContent = title;
    message("");
    if (!dialog.open) dialog.showModal();
  }
  async function updatePending() {
    const pending = await store("outbox", "getAll");
    $("feedback-sync-status").textContent = pending.length ? `${pending.length} 條反饋在此裝置待同步，尚未全部保存到雲端` : "";
    $("feedback-outbox").innerHTML = pending.length ? `<p class="feedback-warning">${pending.length} 條待同步，請勿清除 App 資料。</p>${pending.map((item) => `<div><p class="feedback-micro">${esc(item.label)}：${esc(item.error || "等待同步")}</p><button type="button" data-discard="${esc(item.id)}">不再重試這條記錄</button></div>`).join("")}` : "";
    return pending;
  }
  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      const pending = await store("outbox", "getAll");
      pending.sort((a, b) => a.at - b.at);
      const blockedCases = new Set();
      for (const item of pending) {
        const caseId = item.path === "/cases" ? item.body.id : item.path.split("/")[2];
        if (blockedCases.has(caseId)) continue;
        try {
          const result = await api(item.path, { method: item.method || "POST", body: item.body });
          if (result.id) await store("cache", "put", result);
          await store("outbox", "delete", item.id);
        } catch (error) {
          await store("outbox", "put", { ...item, error: error.message });
          // Block dependent follow-ups, not unrelated plants' records.
          blockedCases.add(caseId);
        }
      }
      await updatePending();
    } finally { flushing = false; }
  }
  async function queue(path, body, label) {
    const pending = await store("outbox", "getAll");
    if (pending.length >= 20) throw new Error("已有 20 條待同步資料，請先連網同步再繼續");
    await store("outbox", "put", { id: body.id, path, body, label, at: Date.now() });
    await updatePending();
    await flush();
    return !(await store("outbox", "get", body.id));
  }
  let nextCursor = null;
  function listCards(items, append = false) {
    const content = items.map((item) => `<button type="button" class="feedback-case-card" data-case="${esc(item.id)}"><span>${esc(crops[item.cropKey])} · ${esc(date(item.createdAt))}</span><strong>${esc(hypotheses[item.snapshot.hypothesis])}？ <small>${esc(statuses[item.status])}</small></strong><span>${esc(item.followups.length)} 次複查 · ${Date.parse(item.dueAt) <= Date.now() ? "現在可複查" : `${esc(date(item.dueAt))} 複查`}</span></button>`).join("");
    if (append) $("feedback-case-list").insertAdjacentHTML("beforeend", content);
    else $("feedback-case-list").innerHTML = content || '<p class="feedback-empty">還沒有糾錯病例。拍照診斷後，點「判斷不對？告訴我們」。</p>';
    $("feedback-more").hidden = !nextCursor;
  }
  async function history(append = false) {
    if (!append) panel("feedback-history-panel", "每一次觀察，都值得記住");
    await updatePending();
    try {
      const result = await api(`/cases${append && nextCursor ? `?before=${nextCursor}` : ""}`);
      nextCursor = result.nextCursor;
      for (const item of result.items) await store("cache", "put", item);
      listCards(result.items, append);
      const due = result.items.filter((item) => Date.parse(item.dueAt) <= Date.now()).length;
      $("feedback-due-count").textContent = due ? `· ${due} 盆待複查` : "";
    } catch (error) {
      const cached = await store("cache", "getAll");
      nextCursor = null;
      if (!append) listCards(cached.sort((a, b) => b.sequence - a.sequence));
      message(`${error.message}。下方若有病例，是此裝置上次保存的內容。`, true);
    }
  }
  async function detail(id) {
    panel("feedback-detail", "植物的觀察日記");
    const version = viewVersion; let loaded, offline = false;
    message("正在讀取病例…");
    try { loaded = await api(`/cases/${id}`); await store("cache", "put", loaded); }
    catch (error) { loaded = await store("cache", "get", id); offline = true; if (!loaded) { if (version === viewVersion) message(error.message, true); return; } }
    if (version !== viewVersion || !dialog.open) return;
    currentCase = loaded;
    followupURLs.forEach((url) => URL.revokeObjectURL(url)); followupURLs = [];
    message(offline ? "正在顯示本機快取，連網後可同步最新內容。" : "", offline);
    const item = currentCase;
    $("feedback-detail").innerHTML = `
      <p class="feedback-eyebrow">${esc(crops[item.cropKey])} · ${esc(statuses[item.status])}</p>
      <img id="feedback-baseline-photo" class="feedback-case-photo" alt="這次糾錯的原始植物照片" hidden>
      <div class="feedback-original"><span>原判斷</span><strong>${esc(item.snapshot.diagnosis)}</strong><p>你的判斷：${esc(hypotheses[item.snapshot.hypothesis])}</p><p>${esc(item.snapshot.note)}</p></div>
      <p>下一次複查：<strong>${esc(date(item.dueAt))}</strong></p>
      <p class="feedback-micro">${item.trainingEligible ? "已授權並核實，可列入訓練候選；尚未自動訓練。" : item.trainingConsent ? "你已同意模型改進；仍需完整證據與人工審核。" : "未授權模型改進，僅用於你的病例追蹤。"}</p>
      ${item.review ? `<p class="feedback-review-note">人工審核：${esc(item.review.diagnosis || statuses[item.review.status])}。${esc(item.review.evidence)}${item.status === "pending" ? "（有新證據，需重新審核）" : ""}</p>` : ""}
      <div class="feedback-timeline">${item.followups.map((entry) => `<article><span>${esc(date(entry.createdAt))}</span><strong>${esc(outcomes[entry.outcome])}</strong><p>實際措施：${esc(entry.actionTaken)}</p><p>${esc(entry.note)}</p>${entry.photo ? `<button type="button" data-followup-photo="${esc(entry.id)}">查看本次複查照片</button><img class="feedback-case-photo" id="followup-photo-${esc(entry.id)}" alt="這次複查的同角度照片" hidden>` : '<span class="feedback-micro">本次沒有附照片</span>'}</article>`).join("") || '<p class="feedback-empty">第一次複查時，記下你做了什麼、植物有何變化。</p>'}</div>
      ${item.followups.at(-1)?.outcome === "worse" ? '<p class="feedback-warning">已記錄變差。不要因為原建議而持續加量操作；請補拍整株、根區並尋求人工核查。</p>' : ""}
      <button type="button" id="feedback-add-followup" class="feedback-primary">記錄一次複查</button>
      <div class="feedback-secondary-actions"><button type="button" id="feedback-back-list">返回病例列表</button>${item.trainingConsent ? '<button type="button" id="feedback-withdraw">撤回模型改進授權</button>' : ""}<button type="button" id="feedback-delete">刪除此病例與照片</button></div>`;
    $("feedback-add-followup").onclick = () => { $("feedback-followup").reset(); followupPhoto = null; followupDraftId = crypto.randomUUID(); $("feedback-followup-photo-status").textContent = ""; panel("feedback-followup", `${crops[item.cropKey]}，現在怎樣了？`); };
    $("feedback-back-list").onclick = () => history();
    $("feedback-withdraw")?.addEventListener("click", async () => {
      try { await api(`/cases/${item.id}/consent`, { method: "POST", body: { id: crypto.randomUUID() } }); await detail(item.id); message("已撤回授權，不再列入後續訓練候選。已發布模型不能透過刪除資料倒退重訓。"); }
      catch (error) { message(`撤回尚未完成：${error.message}`, true); }
    });
    let deletionConfirmed = false;
    $("feedback-delete").onclick = async () => {
      // Inline confirmation also works in WKWebView without native JS-dialog delegates.
      if (!deletionConfirmed) { deletionConfirmed = true; $("feedback-delete").textContent = "確認永久刪除"; message("將永久刪除此病例、全部複查和私有照片，無法復原。再次點確認才會刪除。", true); return; }
      $("feedback-delete").disabled = true;
      try {
        try { await api(`/cases/${item.id}`, { method: "DELETE" }); } catch (error) { if (error.status !== 404) throw error; }
        const pending = await store("outbox", "getAll");
        for (const entry of pending.filter((entry) => entry.body?.id === item.id || entry.path.startsWith(`/cases/${item.id}/`))) await store("outbox", "delete", entry.id);
        await store("cache", "delete", item.id); await history(); message("病例與私有照片已刪除，無法復原。");
      } catch (error) { message(error.message, true); $("feedback-delete").disabled = false; }
    };
    if (photoURL) URL.revokeObjectURL(photoURL);
    try {
      const blob = await api(`/cases/${item.id}/photo`, { binary: true });
      if (version !== viewVersion || currentCase?.id !== item.id || $("feedback-detail").hidden) return;
      photoURL = URL.createObjectURL(blob); $("feedback-baseline-photo").src = photoURL; $("feedback-baseline-photo").hidden = false;
    } catch { /* Text timeline remains usable when photos are temporarily unavailable. */ }
  }
  async function compress(file) {
    if (file.size > 20000000) throw new Error("照片超過 20 MB，請選較小的照片");
    const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("無法讀取照片")); reader.readAsDataURL(file); });
    const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("這張照片格式無法讀取，請使用 JPEG 或直接拍照")); img.src = source; });
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.76);
  }
  let followupPhoto = null, followupDraftId = null;
  $("feedback-followup").elements.photo.onchange = async (event) => {
    followupPhoto = null;
    const file = event.target.files?.[0];
    if (!file) return;
    const button = $("feedback-followup").querySelector("button[type=submit]"); button.disabled = true;
    try { followupPhoto = await compress(file); $("feedback-followup-photo-status").textContent = "照片已在本機準備好，點保存才上傳。"; }
    catch (error) { message(error.message, true); event.target.value = ""; }
    finally { button.disabled = false; }
  };
  $("feedback-open").onclick = () => {
    if (!context?.ready) return;
    if (!context.receipt || !context.imageData) { panel("feedback-history-panel", "先更新這張照片的診斷"); message("這次診斷缺少新版照片憑證。請返回重新拍照識別，再提交糾錯。", true); return; }
    draft = { ...context, id: crypto.randomUUID() };
    $("feedback-form").reset();
    $("feedback-original").textContent = `${crops[draft.cropKey]} · 原判斷：${draft.diagnosis}`;
    panel("feedback-form", "哪裡判斷不對？");
  };
  $("feedback-form").onsubmit = async (event) => {
    event.preventDefault(); if (!draft) return;
    const form = event.currentTarget, button = form.querySelector("button[type=submit]"); button.disabled = true; message("正在保存…");
    try {
      const body = { id: draft.id, cropKey: draft.cropKey, plantId: draft.plantId, diagnosis: draft.diagnosis, action: draft.action, receipt: draft.receipt, imageData: draft.imageData, environment: draft.environment, hypothesis: form.elements.hypothesis.value, note: form.elements.note.value, followupDays: Number(form.elements.followupDays.value), trainingConsent: form.elements.trainingConsent.checked, storeConsent: true };
      const synced = await queue("/cases", body, `${crops[body.cropKey]}糾錯`);
      if (synced) { await detail(body.id); message("糾錯和照片已保存到私有雲端，狀態：待核實。"); }
      else { await history(); message("已保存在此裝置，雲端尚未同步。連網後點重新同步，請勿清除 App 資料。", true); }
    } catch (error) { message(error.message, true); }
    finally { button.disabled = false; }
  };
  $("feedback-followup").onsubmit = async (event) => {
    event.preventDefault(); if (!currentCase) return;
    const form = event.currentTarget, button = form.querySelector("button[type=submit]"); button.disabled = true; message("正在保存複查…");
    const id = currentCase.id;
    try {
      const synced = await queue(`/cases/${id}/followups`, { id: followupDraftId ||= crypto.randomUUID(), outcome: form.elements.outcome.value, actionTaken: form.elements.actionTaken.value, note: form.elements.note.value, imageData: followupPhoto, nextDays: Number(form.elements.nextDays.value) }, `${crops[currentCase.cropKey]}複查`);
      if (synced) { await detail(id); message("本次複查已保存，下一次複查時間已更新。"); }
      else { await history(); message("複查已保留在本機，尚待雲端同步。", true); }
    } catch (error) { message(error.message, true); }
    finally { button.disabled = false; }
  };
  $("feedback-history").onclick = () => history().catch((error) => message(error.message, true));
  $("feedback-more").onclick = () => history(true).catch((error) => message(error.message, true));
  $("feedback-retry").onclick = async () => { $("feedback-retry").disabled = true; try { await flush(); await history(); } catch (error) { message(error.message, true); } finally { $("feedback-retry").disabled = false; } };
  $("feedback-case-list").onclick = (event) => { const id = event.target.closest("[data-case]")?.dataset.case; if (id) detail(id).catch((error) => message(error.message, true)); };
  $("feedback-detail").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-followup-photo]"); if (!button || !currentCase) return;
    const version = viewVersion, eventId = button.dataset.followupPhoto, id = currentCase.id;
    button.disabled = true;
    try {
      const blob = await api(`/cases/${id}/photo?event=${eventId}`, { binary: true });
      if (version !== viewVersion) return;
      const url = URL.createObjectURL(blob); followupURLs.push(url);
      $(`followup-photo-${eventId}`).src = url; $(`followup-photo-${eventId}`).hidden = false; button.hidden = true;
    } catch (error) { if (version === viewVersion) { message(error.message, true); button.disabled = false; } }
  });
  $("feedback-outbox").onclick = async (event) => {
    const button = event.target.closest("[data-discard]");
    if (!button || flushing) return;
    if (!button.dataset.confirmed) { button.dataset.confirmed = "true"; button.textContent = "確認移除本機待同步記錄"; message("只會移除本機重試資料，無法復原；不會刪除已到雲端的病例。雲端病例請在列表中刪除。", true); return; }
    try { await store("outbox", "delete", button.dataset.discard); await updatePending(); message("這條本機待同步記錄已移除；雲端病例未被刪除。"); }
    catch (error) { message(error.message, true); }
  };
  $("feedback-close").onclick = () => dialog.close();
  dialog.addEventListener("close", () => { viewVersion++; if (photoURL) URL.revokeObjectURL(photoURL); followupURLs.forEach((url) => URL.revokeObjectURL(url)); followupURLs = []; });
  window.addEventListener("online", () => flush().catch(() => {}));
  window.addEventListener("pageshow", () => flush().catch(() => {}));
  window.FiveCropFeedback = {
    setContext(value) { context = value; $("feedback-open").hidden = !value.ready; }
  };
  store("cache", "getAll").then((items) => {
    const due = items.filter((item) => Date.parse(item.dueAt) <= Date.now()).length;
    $("feedback-due-count").textContent = due ? `· ${due} 例待複查` : "";
  }).catch(() => {});
  flush().catch(() => { $("feedback-sync-status").textContent = "本機待同步儲存不可用，請檢查裝置設定。"; });
})();
