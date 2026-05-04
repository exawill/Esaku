"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT id, email, name, role, balance, oauth_provider, created_at
     FROM users WHERE id = ?`,
    [req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json({ profile: rows[0] });
});

router.patch("/", requireAuth, async (req, res) => {
  const { name } = req.body || {};
  await query("UPDATE users SET name = ? WHERE id = ?", [
    name || null,
    req.user.sub
  ]);
  res.json({ ok: true });
});

router.post("/password", requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: "New password must be 8+ characters" });
  }
  const rows = await query(
    "SELECT password_hash FROM users WHERE id = ?",
    [req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  if (rows[0].password_hash) {
    const ok = await bcrypt.compare(current_password || "", rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Current password incorrect" });
  }
  const hash = await bcrypt.hash(new_password, 10);
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [
    hash,
    req.user.sub
  ]);
  res.json({ ok: true });
});

module.exports = router;
