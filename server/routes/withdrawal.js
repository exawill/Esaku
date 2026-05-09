"use strict";

const express = require("express");
const { v4: uuid } = require("uuid");

const { query, getSetting } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/quote", requireAuth, async (req, res) => {
  try {
    const fees = await getSetting("fees");
    res.json({
      fees: {
        bank: Number(fees?.withdrawal_bank_fee_idr || 6500),
        ewallet: Number(fees?.withdrawal_ewallet_fee_idr || 2500),
        min: Number(fees?.withdrawal_min_idr || 50000)
      }
    });
  } catch (err) {
    console.error("[withdrawal] quote error:", err);
    res.status(500).json({ error: "Failed to load fees" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { amount, method, destination } = req.body || {};
    const amt = Number(amount);
    if (!["bank", "ewallet"].includes(method)) {
      return res.status(400).json({ error: "Invalid method" });
    }
    if (!destination || String(destination).trim().length < 4) {
      return res.status(400).json({ error: "Destination required" });
    }
    const fees = await getSetting("fees");
    const min = Number(fees.withdrawal_min_idr || 50000);
    if (!Number.isFinite(amt) || amt < min) {
      return res
        .status(400)
        .json({ error: `Minimum withdrawal is IDR ${min.toLocaleString("id-ID")}` });
    }
    const fee =
      method === "bank"
        ? Number(fees.withdrawal_bank_fee_idr || 6500)
        : Number(fees.withdrawal_ewallet_fee_idr || 2500);
    const totalDebit = amt;
    const netAmount = amt - fee;
    
    if (netAmount <= 0) {
      return res.status(400).json({ error: "Nominal pencairan tidak cukup untuk membayar biaya transfer" });
    }

    const userRows = await query("SELECT balance FROM users WHERE id = ?", [
      req.user.sub
    ]);
    const balance = Number(userRows[0]?.balance || 0);
    if (balance < totalDebit) {
      return res.status(400).json({
        error: `Insufficient balance. You need IDR ${totalDebit.toLocaleString("id-ID")}`
      });
    }
    const newBalance = balance - totalDebit;
    const id = uuid();
    await query("UPDATE users SET balance = ? WHERE id = ?", [
      newBalance,
      req.user.sub
    ]);
    await query(
      `INSERT INTO withdrawals (id, user_id, method, destination, amount, fee, total_debit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, req.user.sub, method, destination, netAmount, fee, totalDebit]
    );
    await query(
      `INSERT INTO transactions (id, user_id, type, amount, balance_after, reference, description)
       VALUES (?, ?, 'withdrawal_out', ?, ?, ?, ?)`,
      [
        uuid(),
        req.user.sub,
        -totalDebit,
        newBalance,
        id,
        `Withdrawal via ${method} to ${destination} (fee IDR ${fee})`
      ]
    );
    res.json({
      ok: true,
      withdrawal: { id, amount: netAmount, fee, total_debit: totalDebit, status: "pending" },
      balance: newBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, method, destination, amount, fee, total_debit, status, created_at, completed_at
       FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.sub]
    );
    res.json({ withdrawals: rows });
  } catch (err) {
    console.error("[withdrawal] fetch error:", err);
    res.status(500).json({ error: "Failed to load withdrawals" });
  }
});

module.exports = router;
