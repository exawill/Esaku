"use strict";

const express = require("express");
const { query, getSetting, setSetting, DEFAULT_SETTINGS, now } = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const users = await query("SELECT COUNT(*) AS c FROM users");
    const admins = await query("SELECT COUNT(*) AS c FROM users WHERE role='admin'");
    const balance = await query("SELECT COALESCE(SUM(balance),0) AS s FROM users");
    const pendingWd = await query(
      "SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS s FROM withdrawals WHERE status IN ('pending','processing')"
    );
    const paidQris = await query(
      "SELECT COUNT(*) AS c, COALESCE(SUM(amount),0) AS gross, COALESCE(SUM(fee),0) AS fee FROM qris_orders WHERE status='paid'"
    );

    // Revenue series (Pendapatan)
    const revenueRows = await query(`
      SELECT DATE(paid_at) as day, SUM(amount) as inflow
      FROM qris_orders
      WHERE status='paid' AND paid_at >= DATE('now', '-${days} days')
      GROUP BY day ORDER BY day ASC
    `);

    // Balance activity series
    // For simplicity, we show the daily net change in platform-wide balance
    const activityRows = await query(`
      SELECT DATE(created_at) as day, SUM(amount) as net_change
      FROM transactions
      WHERE created_at >= DATE('now', '-${days} days')
      GROUP BY day ORDER BY day ASC
    `);

    res.json({
      stats: {
        total_users: Number(users[0]?.c || 0),
        total_admins: Number(admins[0]?.c || 0),
        total_balance: Number(balance[0]?.s || 0),
        pending_withdrawals: { count: Number(pendingWd[0]?.c || 0), amount: Number(pendingWd[0]?.s || 0) },
        paid_qris: {
          count: Number(paidQris[0]?.c || 0),
          gross: Number(paidQris[0]?.gross || 0),
          fee_collected: Number(paidQris[0]?.fee || 0)
        }
      },
      revenue_series: revenueRows.map(r => ({ day: r.day, value: Number(r.inflow) })),
      balance_series: activityRows.map(r => ({ day: r.day, value: Number(r.net_change) }))
    });
  } catch (err) {
    console.error("[admin] stats error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const out = {};
    for (const key of keys) {
      out[key] = await getSetting(key);
    }
    res.json({ settings: out });
  } catch (err) {
    console.error("[admin] settings fetch error:", err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.put("/settings/:key", async (req, res) => {
  try {
    const key = req.params.key;
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      return res.status(400).json({ error: "Unknown setting key" });
    }

    if (key === "branding") {
      const fs = require("fs");
      const path = require("path");
      const crypto = require("crypto");
      
      let brandingData = { ...req.body };
      for (const field of ["logo_url", "banner_url"]) {
         if (brandingData[field] && brandingData[field].startsWith("data:image/")) {
            const matches = brandingData[field].match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
               let ext = matches[1].replace("+xml", "");
               if (ext === "jpeg") ext = "jpg";
               const filename = field.split("_")[0] + "_" + crypto.randomBytes(4).toString("hex") + "." + ext;
               const filepath = path.join(__dirname, "..", "..", "public", "assets", filename);
               fs.writeFileSync(filepath, Buffer.from(matches[2], "base64"));
               brandingData[field] = "/assets/" + filename;
            }
         }
      }
      await setSetting(key, brandingData);
      return res.json({ ok: true, settings: brandingData });
    }

    await setSetting(key, req.body || {});
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] settings update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const rows = await query(
      `SELECT id, email, name, role, balance, created_at FROM users ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("[admin] users fetch error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/withdrawals", async (_req, res) => {
  try {
    const rows = await query(
      `SELECT w.*, u.email FROM withdrawals w
       JOIN users u ON u.id = w.user_id
       ORDER BY w.created_at DESC LIMIT 200`
    );
    res.json({ withdrawals: rows });
  } catch (err) {
    console.error("[admin] withdrawals fetch error:", err);
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

router.post("/withdrawals/:id/complete", async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ error: "Withdrawal ID required" });
    await query(
      `UPDATE withdrawals SET status='completed', completed_at=${now()} WHERE id=?`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] withdrawal complete error:", err);
    res.status(500).json({ error: "Failed to complete withdrawal" });
  }
});

router.post("/withdrawals/:id/fail", async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ error: "Withdrawal ID required" });
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
      `UPDATE withdrawals SET status='failed', completed_at=${now()} WHERE id=?`,
      [w.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] withdrawal fail error:", err);
    res.status(500).json({ error: "Failed to fail withdrawal" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "User ID required" });
    
    // Prevent self-deletion
    if (id === req.user.sub) {
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    await query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin] user delete error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/reset-platform", async (req, res) => {
  try {
    // Clear all history
    await query("DELETE FROM transactions");
    await query("DELETE FROM qris_orders");
    await query("DELETE FROM withdrawals");
    // Reset all balances
    await query("UPDATE users SET balance = 0");
    
    res.json({ ok: true, message: "Platform data has been reset successfully." });
  } catch (err) {
    console.error("[admin] platform reset error:", err);
    res.status(500).json({ error: "Failed to reset platform data" });
  }
});

module.exports = router;
