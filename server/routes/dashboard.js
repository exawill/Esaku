"use strict";

const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

    const userRow = (
      await query("SELECT balance FROM users WHERE id = ?", [req.user.sub])
    )[0];

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceStr = since.toISOString().slice(0, 19).replace("T", " ");

    const dailyRows = await query(
      `SELECT DATE(created_at) AS day,
              SUM(CASE WHEN type='qris_in' THEN amount ELSE 0 END) AS inflow,
              SUM(CASE WHEN type='withdrawal_out' THEN -amount ELSE 0 END) AS outflow
       FROM transactions
       WHERE user_id = ? AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [req.user.sub, sinceStr]
    );

    // Fill missing days with zero so the chart spans full window
    const map = new Map();
    for (const row of dailyRows) {
      const d = new Date(row.day).toISOString().slice(0, 10);
      map.set(d, {
        day: d,
        inflow: Number(row.inflow || 0),
        outflow: Number(row.outflow || 0)
      });
    }
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      series.push(map.get(d) || { day: d, inflow: 0, outflow: 0 });
    }

    const totals = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='qris_in' THEN amount END), 0) AS total_in,
         COALESCE(SUM(CASE WHEN type='withdrawal_out' THEN -amount END), 0) AS total_out,
         COUNT(CASE WHEN type='qris_in' THEN 1 END) AS qris_count
       FROM transactions WHERE user_id = ? AND created_at >= ?`,
      [req.user.sub, sinceStr]
    );

    res.json({
      balance: Number(userRow?.balance || 0),
      range_days: days,
      series,
      totals: {
        inflow: Number(totals[0]?.total_in || 0),
        outflow: Number(totals[0]?.total_out || 0),
        qris_count: Number(totals[0]?.qris_count || 0)
      }
    });
  } catch (err) {
    console.error("[dashboard] summary error:", err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

module.exports = router;
