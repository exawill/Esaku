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
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const PUBLIC_DIR = path.join(__dirname, "..", IS_PROD ? "dist" : "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Per-browser device cookie (issued on first request, read on every request)
app.use(deviceCookie);

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { error: "Too many requests, please try again later." }
});
app.use("/api", apiLimiter);

// Serve static files (Vite dist in prod, legacy public in dev)
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

// Catch-all: serve React app (SPA routing)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not found" });
  }
  const indexFile = path.join(PUBLIC_DIR, "index.html");
  res.sendFile(indexFile, (err) => {
    if (err) res.status(404).send("Not found");
  });
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
