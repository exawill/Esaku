(function () {
  const IDR = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });

  function formatIDR(n) {
    return IDR.format(Number(n || 0));
  }

  function formatDate(d) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function unFmt(s) {
    return parseInt(String(s).replace(/\D/g, ""), 10) || 0;
  }

  function fmtAmt(s) {
    const n = unFmt(s);
    return n ? n.toLocaleString("id-ID") : "";
  }

  async function api(path, options = {}) {
    const opts = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "same-origin"
    };
    if (options.body !== undefined) opts.body = JSON.stringify(options.body);
    const res = await fetch(path, opts);
    let data = null;
    try { data = await res.json(); } catch (_e) {}
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function getMe() {
    try { return (await api("/api/auth/me")).user; } catch (_e) { return null; }
  }

  async function requireUser({ requireAdmin = false } = {}) {
    const user = await getMe();
    if (!user) { window.location.href = "/sign-in"; return null; }
    if (requireAdmin && user.role !== "admin") { window.location.href = "/dashboard"; return null; }
    return user;
  }

  async function signOut() {
    try { await api("/api/auth/sign-out", { method: "POST" }); } catch (_e) {}
    window.location.href = "/";
  }

  function showToast(msg, type = "info") {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function showConfirm(title, message, okText = "Ya, Lanjutkan") {
    return new Promise((resolve) => {
      let host = document.getElementById("modal-host");
      if (!host) {
        host = document.createElement("div");
        host.id = "modal-host";
        document.body.appendChild(host);
      }
      const el = document.createElement("div");
      el.className = "modal-overlay open";
      el.innerHTML = `
        <div class="modal-content" style="max-width:400px">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
          </div>
          <div class="modal-body">
            <p style="margin:0">${message}</p>
          </div>
          <div class="modal-footer" style="padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:12px">
            <button class="btn btn-outline btn-sm" id="modal-cancel">Batal</button>
            <button class="btn btn-dark btn-sm" id="modal-ok">${okText}</button>
          </div>
        </div>
      `;
      host.appendChild(el);
      document.body.style.overflow = "hidden";

      const close = (val) => {
        el.classList.remove("open");
        setTimeout(() => {
          el.remove();
          if (!host.children.length) document.body.style.overflow = "";
        }, 200);
        resolve(val);
      };

      el.querySelector("#modal-cancel").onclick = () => close(false);
      el.querySelector("#modal-ok").onclick = () => close(true);
      el.onclick = (e) => { if (e.target === el) close(false); };
    });
  }

  function esc(str) {
    if (!str) return "";
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(str).replace(/[&<>"']/g, (m) => map[m]);
  }

  window.app = {
    api, formatIDR, formatDate, unFmt, fmtAmt, esc,
    getMe, requireUser, signOut, showToast, confirm: showConfirm
  };
})();
