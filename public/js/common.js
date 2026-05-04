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
    return date.toLocaleString(window.i18n?.getLang() === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
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
    try {
      data = await res.json();
    } catch (_e) {
      /* ignore */
    }
    if (!res.ok) {
      const message = (data && data.error) || `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function getMe() {
    try {
      return (await api("/api/auth/me")).user;
    } catch (_e) {
      return null;
    }
  }

  async function requireUser({ requireAdmin = false } = {}) {
    const user = await getMe();
    if (!user) {
      window.location.href = "/sign-in";
      return null;
    }
    if (requireAdmin && user.role !== "admin") {
      window.location.href = "/dashboard";
      return null;
    }
    return user;
  }

  async function signOut() {
    try {
      await api("/api/auth/sign-out", { method: "POST" });
    } catch (_e) {
      /* ignore */
    }
    window.location.href = "/";
  }

  function showToast(msg, type = "info") {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      host.className =
        "fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    const color =
      type === "error"
        ? "bg-red-600 text-white"
        : type === "success"
        ? "bg-emerald-600 text-white"
        : "bg-ink-800 text-cream-50";
    el.className = `pointer-events-auto rounded-2xl px-4 py-2.5 text-sm shadow-soft ${color}`;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  window.app = { api, formatIDR, formatDate, getMe, requireUser, signOut, showToast };
})();
