(function () {
  const LOGO = `
    <svg width="26" height="26" viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210"/>
      <text x="14" y="58" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="white" font-style="italic">e</text>
      <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#2d22c8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M33 68 Q44 78 58 70" stroke="#2d22c8" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.55"/>
    </svg>`;

  const BELL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

  function navItems(role) {
    const base = [
      { href: "/dashboard", label: "Dasbor" },
      { href: "/generate-qris", label: "Buat QRIS" },
      { href: "/transactions", label: "Riwayat" },
      { href: "/withdrawal", label: "Cairkan" }
    ];
    if (role === "admin") base.push({ href: "/admin", label: "CMS Admin" });
    return base;
  }

  function initialsFor(user) {
    return (user.name || user.email || "?")
      .split(/\s+|@/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  }

  function navHTML(user, current) {
    const items = navItems(user.role);
    return `
      <nav class="app-nav">
        <div class="nav-inner">
          <a href="/" class="nav-logo">${LOGO}<span>Esaku</span></a>
          <div class="nav-links">
            ${items
              .map(
                (it) =>
                  `<a href="${it.href}" class="${current === it.href ? "is-active" : ""}">${it.label}</a>`
              )
              .join("")}
          </div>
          <div class="nav-cta">
            <a href="/transactions" class="notif-bell" id="notif-bell" title="Notifikasi">
              ${BELL_ICON}
              <span class="notif-badge" id="notif-badge"></span>
              <span class="notif-ping" id="notif-ping"></span>
            </a>
            <a href="/profile" class="user-pill" title="Profil">
              <span class="avatar">${initialsFor(user)}</span>
              <span>${user.name || user.email}</span>
            </a>
            <button id="signout-btn" class="btn btn-outline btn-sm">Keluar</button>
          </div>
        </div>
      </nav>
    `;
  }

  let lastTxId = null;
  let pollHandle = null;

  async function checkNotifications() {
    try {
      const data = await app.api("/api/transactions?limit=1");
      const txs = data.transactions || [];
      const latestId = txs.length > 0 ? txs[0].id : 0;

      if (lastTxId !== null && latestId !== lastTxId) {
        triggerPing();
      }
      lastTxId = latestId;
    } catch (_e) { /* silently fail */ }
  }

  function triggerPing() {
    const badge = document.getElementById("notif-badge");
    const ping = document.getElementById("notif-ping");
    const bell = document.getElementById("notif-bell");
    if (!badge) return;
    badge.classList.add("show");
    ping.classList.add("show");
    bell.classList.add("has-notif");
    // Remove ping ring animation after it plays
    setTimeout(() => { if (ping) ping.classList.remove("show"); }, 1500);
  }

  function clearNotification() {
    const badge = document.getElementById("notif-badge");
    const bell = document.getElementById("notif-bell");
    if (badge) badge.classList.remove("show");
    if (bell) bell.classList.remove("has-notif");
  }

  async function mount({ requireAdmin = false } = {}) {
    const user = await app.requireUser({ requireAdmin });
    if (!user) return null;
    const root = document.getElementById("app-root");
    if (!root) return user;
    root.innerHTML = navHTML(user, window.location.pathname);
    document.getElementById("signout-btn").addEventListener("click", app.signOut);

    // Clear badge when clicking bell
    const bell = document.getElementById("notif-bell");
    if (bell) {
      bell.addEventListener("click", () => clearNotification());
    }

    // Start polling for new transactions every 15s
    checkNotifications();
    pollHandle = setInterval(checkNotifications, 15000);

    return user;
  }

  window.shell = { mount, pingNotification: triggerPing };
})();
