"use strict";

require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { ensureSchema, ensureAdminUser } = require("./db");
const { deviceCookie } = require("./middleware/device");
const authRoutes = require("./routes/auth");
const qrisRoutes = require("./routes/qris");
const withdrawalRoutes = require("./routes/withdrawal");
const transactionRoutes = require("./routes/transactions");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Per-browser device cookie (issued on first request, read on every request)
app.use(deviceCookie);

// API rate limiter
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Redirect any *.html URL to the clean version (before static so files aren't served directly)
const HTML_REDIRECT_OVERRIDES = {
  index: "/",
  auth: "/sign-in"
};
app.get(/^\/(.*)\.html$/, (req, res) => {
  const stem = req.params[0];
  const target = HTML_REDIRECT_OVERRIDES[stem] || "/" + stem;
  return res.redirect(301, target);
});

// Static assets (no extension fall-through for HTML)
app.use(
  express.static(PUBLIC_DIR, {
    extensions: false,
    index: false
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/qris", qrisRoutes);
app.use("/api/withdrawal", withdrawalRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Clean URL routing — map /name => /name.html, redirect /name.html => /name
const PAGES = {
  "/": "index.html",
  "/demo": "demo.html",
  "/sign-in": "auth.html",
  "/sign-up": "auth.html",
  "/dashboard": "dashboard.html",
  "/generate-qris": "generate-qris.html",
  "/withdrawal": "withdrawal.html",
  "/transactions": "transactions.html",
  "/profile": "profile.html",
  "/admin": "admin.html"
};

for (const [route, file] of Object.entries(PAGES)) {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, file));
  });
}

// 404 fallback
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

(async () => {
  try {
    await ensureSchema();
    await ensureAdminUser();
    app.listen(PORT, () => {
      console.log(`[esaku] running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[esaku] failed to start:", err);
    process.exit(1);
  }
})();
