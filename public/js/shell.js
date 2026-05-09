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
    return app.esc(user.name || user.email || "?")
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
            <div class="notif-wrap" id="notif-wrap">
              <button class="notif-bell" id="notif-bell" title="Notifikasi" type="button">
                ${BELL_ICON}
                <span class="notif-badge" id="notif-badge"></span>
                <span class="notif-ping" id="notif-ping"></span>
              </button>
              <div class="notif-panel" id="notif-panel">
                <div class="notif-panel-header">
                  <span class="notif-panel-title">Notifikasi</span>
                  <button class="notif-clear-btn" id="notif-clear-btn" type="button">Tandai Dibaca</button>
                </div>
                <div class="notif-panel-body" id="notif-list">
                  <div class="notif-empty">Belum ada notifikasi.</div>
                </div>
              </div>
            </div>
            <a href="/profile" class="user-pill" title="Profil">
              <div class="avatar">${initialsFor(user)}</div>
              <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${app.esc(user.name || user.email)}</span>
            </a>
            <button id="signout-btn" class="btn btn-outline btn-sm">Keluar</button>
          </div>
        </div>
      </nav>
    `;
  }

  /* ── notification state ── */
  let lastTxId = null;
  let notifications = [];
  let pollHandle = null;
  let panelOpen = false;

  const TYPE_LABELS = {
    qris_in: "Pembayaran QRIS",
    withdrawal_out: "Pencairan Dana",
    fee: "Biaya MDR",
    adjustment: "Penyesuaian"
  };
  const TYPE_ICONS = {
    qris_in: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    withdrawal_out: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
    fee: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    adjustment: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`
  };

  function formatTimeAgo(dateStr) {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
    if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
    return Math.floor(diff / 86400) + " hari lalu";
  }

  function renderNotifList() {
    const host = document.getElementById("notif-list");
    if (!host) return;
    if (!notifications.length) {
      host.innerHTML = '<div class="notif-empty">Belum ada notifikasi.</div>';
      return;
    }
    host.innerHTML = notifications.map((n) => {
      const icon = TYPE_ICONS[n.type] || TYPE_ICONS.adjustment;
      const label = TYPE_LABELS[n.type] || n.type;
      const positive = Number(n.amount) >= 0;
      const amtClass = positive ? "notif-amt-green" : "notif-amt-red";
      const sign = positive ? "+" : "";
      return `
        <div class="notif-item${n.unread ? ' unread' : ''}">
          <div class="notif-icon ${n.type === 'qris_in' ? 'green' : n.type === 'withdrawal_out' ? 'red' : 'amber'}">${icon}</div>
          <div class="notif-body">
            <div class="notif-row-top">
              <span class="notif-label">${app.esc(label)}</span>
              <span class="notif-time">${formatTimeAgo(n.created_at)}</span>
            </div>
            <div class="notif-desc">${app.esc(n.description || "—")}</div>
            <div class="${amtClass}">${sign}${app.formatIDR(n.amount)}</div>
          </div>
        </div>`;
    }).join("");
  }

  async function checkNotifications() {
    try {
      const data = await app.api("/api/transactions?limit=10");
      const txs = data.transactions || [];
      if (!txs.length) return;

      const latestId = txs[0].id;
      if (lastTxId !== null && latestId !== lastTxId) {
        // Find new transactions
        const newOnes = txs.filter((t) => t.id > lastTxId);
        newOnes.forEach((t) => {
          notifications.unshift({ ...t, unread: true });
        });
        // Keep max 20
        notifications = notifications.slice(0, 20);
        triggerPing(newOnes.length);
        renderNotifList();
      } else if (lastTxId === null) {
        // Initial load — populate silently
        notifications = txs.map((t) => ({ ...t, unread: false }));
        renderNotifList();
      }
      lastTxId = latestId;
    } catch (_e) { /* silently fail */ }
  }

  function triggerPing(count) {
    const badge = document.getElementById("notif-badge");
    const ping = document.getElementById("notif-ping");
    const bell = document.getElementById("notif-bell");
    if (!badge) return;
    badge.classList.add("show");
    if (count) badge.textContent = count > 9 ? "9+" : count;
    ping.classList.add("show");
    bell.classList.add("has-notif");
    setTimeout(() => { if (ping) ping.classList.remove("show"); }, 1500);
  }

  function clearNotifications() {
    notifications.forEach((n) => n.unread = false);
    const badge = document.getElementById("notif-badge");
    const bell = document.getElementById("notif-bell");
    if (badge) { badge.classList.remove("show"); badge.textContent = ""; }
    if (bell) bell.classList.remove("has-notif");
    renderNotifList();
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById("notif-panel");
    if (panel) panel.classList.toggle("open", panelOpen);
  }

  async function mount({ requireAdmin = false } = {}) {
    const user = await app.requireUser({ requireAdmin });
    if (!user) return null;
    const root = document.getElementById("app-root");
    if (!root) return user;
    root.innerHTML = navHTML(user, window.location.pathname);
    document.getElementById("signout-btn").addEventListener("click", app.signOut);

    // Bell toggle
    const bell = document.getElementById("notif-bell");
    if (bell) bell.addEventListener("click", (e) => { e.preventDefault(); togglePanel(); });

    // Mark read button
    const clearBtn = document.getElementById("notif-clear-btn");
    if (clearBtn) clearBtn.addEventListener("click", () => clearNotifications());

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
      const wrap = document.getElementById("notif-wrap");
      if (panelOpen && wrap && !wrap.contains(e.target)) {
        panelOpen = false;
        document.getElementById("notif-panel").classList.remove("open");
      }
    });

    // Start polling
    checkNotifications();
    pollHandle = setInterval(checkNotifications, 15000);

    return user;
  }

  window.shell = { mount, pingNotification: () => triggerPing(1) };
})();
