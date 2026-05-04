(function () {
  function navItems(role) {
    const base = [
      { href: "/dashboard", key: "side.dashboard", icon: "dashboard" },
      { href: "/generate-qris", key: "side.qris", icon: "qrcode" },
      { href: "/withdrawal", key: "side.withdrawal", icon: "wallet" },
      { href: "/transactions", key: "side.transactions", icon: "list" }
    ];
    if (role === "admin") {
      base.push({ href: "/admin", key: "side.cms", icon: "cog" });
    }
    return base;
  }

  const ICONS = {
    dashboard:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    qrcode:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14v7"/><path d="M14 20h6"/></svg>',
    wallet:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M16 12h2"/><path d="M3 10h18"/></svg>',
    list:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    cog:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  };

  function shellHTML(user) {
    const items = navItems(user.role);
    const current = window.location.pathname;
    const links = items
      .map(
        (it) => `
      <a href="${it.href}" class="sidebar-link ${
          current === it.href ? "active" : ""
        }">
        <span>${ICONS[it.icon] || ""}</span>
        <span data-i18n="${it.key}"></span>
      </a>`
      )
      .join("");

    const initials = (user.name || user.email || "?")
      .split(/\s+|@/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return `
      <div class="min-h-screen flex">
        <aside class="hidden md:flex w-64 flex-col gap-2 p-4 border-r border-ink-900/5 dark:border-cream-100/5 bg-cream-100 dark:bg-ink-800/60">
          <a href="/" class="flex items-center gap-2 font-display font-bold text-lg px-2 py-3">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink-900 text-cream-50 dark:bg-cream-100 dark:text-ink-900">e</span>
            Esaku
          </a>
          <nav class="flex flex-col gap-1 mt-2">${links}</nav>
          <div class="mt-auto">
            <button id="signout-btn" class="sidebar-link w-full text-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span data-i18n="side.signout">Sign out</span>
            </button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col min-w-0">
          <header class="h-16 border-b border-ink-900/5 dark:border-cream-100/5 bg-cream-50 dark:bg-ink-900 flex items-center justify-between px-4 md:px-6">
            <div class="flex items-center gap-2">
              <button id="mobile-nav-btn" class="md:hidden btn-ghost" aria-label="Menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span class="font-display font-semibold" id="page-title"></span>
            </div>
            <div class="flex items-center gap-2">
              <button id="lang-toggle" class="btn-ghost" aria-label="Toggle language" title="Language">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span id="lang-label" class="text-xs font-semibold">EN</span>
              </button>
              <button id="theme-toggle" class="btn-ghost" aria-label="Toggle theme" title="Theme">
                <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                <svg id="icon-moon" class="hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </button>
              <a href="/profile" class="btn-secondary !px-3" title="Profile">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-cream-50 dark:bg-cream-100 dark:text-ink-900 text-xs font-bold">${initials}</span>
                <span class="hidden sm:inline">${user.name || user.email}</span>
              </a>
            </div>
          </header>

          <main id="page-main" class="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-7xl w-full mx-auto"></main>
        </div>
      </div>
    `;
  }

  async function mountShell({ requireAdmin = false, pageTitleKey = "" } = {}) {
    const user = await app.requireUser({ requireAdmin });
    if (!user) return null;

    const root = document.getElementById("app-root");
    const content = document.getElementById("page-content");
    if (!root || !content) {
      console.error("shell: missing #app-root or #page-content");
      return null;
    }
    root.innerHTML = shellHTML(user);
    document.getElementById("page-main").appendChild(content);
    content.classList.remove("hidden");

    if (pageTitleKey) {
      const t = document.getElementById("page-title");
      t.setAttribute("data-i18n", pageTitleKey);
    }

    document.getElementById("signout-btn")?.addEventListener("click", app.signOut);

    // Reapply theme & i18n now that DOM is in place
    if (window.theme) window.theme.setTheme(window.theme.getTheme());
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      window.theme.setTheme(window.theme.getTheme() === "dark" ? "light" : "dark");
    });
    document.getElementById("lang-toggle")?.addEventListener("click", () => {
      window.i18n.setLang(window.i18n.getLang() === "en" ? "id" : "en");
    });
    if (window.i18n) window.i18n.apply();

    return user;
  }

  window.shell = { mount: mountShell };
})();
