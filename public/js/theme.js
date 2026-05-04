(function () {
  const STORAGE_KEY = "esaku_theme";

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const sun = document.getElementById("icon-sun");
    const moon = document.getElementById("icon-moon");
    if (sun && moon) {
      sun.classList.toggle("hidden", theme === "dark");
      moon.classList.toggle("hidden", theme !== "dark");
    }
  }

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }

  // Apply immediately to avoid FOUC
  applyTheme(getTheme());

  window.theme = { getTheme, setTheme };

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getTheme());
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
      });
    }
  });
})();
