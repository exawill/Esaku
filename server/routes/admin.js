"use strict";

const express = require("express");
const { query, getSetting, setSetting, DEFAULT_SETTINGS } = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);

router.get("/stats", async (_req, res) => {
  const [users] = await query("SELECT COUNT(*) AS c FROM users");
  const [admins] = await query("SELECT COUNT(*) AS c FROM users WHERE role='admin'");
  const [balance] = await query("SELECT COALESCE(SUM(balance),0) AS s FROM users");
  const [pendingWd] = await query(
    "SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS s FROM withdrawals WHERE status IN ('pending','processing')"
  );
  const [completedWd] = await query(
    "SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS s FROM withdrawals WHERE status='completed'"
  );
  const [paidQris] = await query(
    "SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS gross, COALESCE(SUM(fee),0) AS fee FROM qris_orders WHERE status='paid'"
  );
  res.json({
    stats: {
      total_users: Number(users.c || 0),
      total_admins: Number(admins.c || 0),
      total_balance: Number(balance.s || 0),
      pending_withdrawals: { count: Number(pendingWd.c || 0), amount: Number(pendingWd.s || 0) },
      completed_withdrawals: { count: Number(completedWd.c || 0), amount: Number(completedWd.s || 0) },
      paid_qris: {
        count: Number(paidQris.c || 0),
        gross: Number(paidQris.gross || 0),
        fee_collected: Number(paidQris.fee || 0)
      }
    }
  });
});

router.get("/settings", async (_req, res) => {
  const keys = Object.keys(DEFAULT_SETTINGS);
  const out = {};
  for (const key of keys) {
    out[key] = await getSetting(key);
  }
  res.json({ settings: out });
});

router.put("/settings/:key", async (req, res) => {
  const key = req.params.key;
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
    return res.status(400).json({ error: "Unknown setting key" });
  }
  await setSetting(key, req.body || {});
  res.json({ ok: true });
});

router.get("/users", async (_req, res) => {
  const rows = await query(
    `SELECT id, email, name, role, balance, created_at FROM users ORDER BY created_at DESC LIMIT 200`
  );
  res.json({ users: rows });
});

router.get("/withdrawals", async (_req, res) => {
  const rows = await query(
    `SELECT w.*, u.email FROM withdrawals w
     JOIN users u ON u.id = w.user_id
     ORDER BY w.created_at DESC LIMIT 200`
  );
  res.json({ withdrawals: rows });
});

router.post("/withdrawals/:id/complete", async (req, res) => {
  await query(
    "UPDATE withdrawals SET status='completed', completed_at=NOW() WHERE id=?",
    [req.params.id]
  );
  res.json({ ok: true });
});

router.post("/withdrawals/:id/fail", async (req, res) => {
  // refund balance
  const rows = await query("SELECT * FROM withdrawals WHERE id = ?", [
    req.params.id
  ]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const w = rows[0];
  if (w.status !== "pending" && w.status !== "processing") {
    return res
      .status(400)
      .json({ error: `Cannot fail withdrawal in status ${w.status}` });
  }
  const userRows = await query("SELECT balance FROM users WHERE id = ?", [
    w.user_id
  ]);
  const newBalance = Number(userRows[0].balance) + Number(w.total_debit);
  await query("UPDATE users SET balance = ? WHERE id = ?", [
    newBalance,
    w.user_id
  ]);
  await query(
    "UPDATE withdrawals SET status='failed', completed_at=NOW() WHERE id=?",
    [w.id]
  );
  res.json({ ok: true });
});

module.exports = router;
