"use strict";

const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await query(
      `SELECT id, type, amount, balance_after, reference, description, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [req.user.sub, limit]
    );
    res.json({ transactions: rows });
  } catch (err) {
    console.error("[transactions] fetch error:", err);
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

module.exports = router;
