(function () {
  const LOGO = `
    <svg width="26" height="26" viewBox="0 0 80 80" fill="none">
      <rect x="8" y="8" width="56" height="56" rx="10" transform="rotate(8 40 40)" fill="#141210"/>
      <text x="14" y="58" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="white" font-style="italic">e</text>
      <path d="M26 62 Q38 74 54 66 Q64 60 58 50" stroke="#2d22c8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M33 68 Q44 78 58 70" stroke="#2d22c8" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0.55"/>
    </svg>`;

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

  async function mount({ requireAdmin = false } = {}) {
    const user = await app.requireUser({ requireAdmin });
    if (!user) return null;
    const root = document.getElementById("app-root");
    if (!root) return user;
    root.innerHTML = navHTML(user, window.location.pathname);
    document.getElementById("signout-btn").addEventListener("click", app.signOut);
    return user;
  }

  window.shell = { mount };
})();
