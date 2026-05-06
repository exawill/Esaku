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

  window.app = {
    api, formatIDR, formatDate, unFmt, fmtAmt,
    getMe, requireUser, signOut, showToast
  };
})();
