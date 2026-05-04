"use strict";

const express = require("express");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");

const { query, getSetting } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function buildPayload({ merchantId, reference, amount }) {
  // Simplified QRIS-like payload (placeholder until external API is wired in CMS).
  return [
    "00020101021226",
    `ID${merchantId || "ESAKU"}`,
    `RR${reference}`,
    `AM${Math.round(amount)}`,
    "5303360",
    "5802ID",
    "6304XXXX"
  ].join("");
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 1000) {
      return res
        .status(400)
        .json({ error: "Amount must be at least IDR 1.000" });
    }
    const fees = await getSetting("fees");
    const provider = await getSetting("qris_provider");
    const expiryMinutes = Number(provider?.expiry_minutes || 15);

    const flatPercent = Number(fees?.qris_flat_percent || 0.7);
    const fee = Math.round((amount * flatPercent) / 100);
    const netAmount = amount - fee;

    const reference =
      "ES" +
      crypto.randomBytes(6).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const payload = buildPayload({
      merchantId: provider?.merchant_id,
      reference,
      amount
    });
    const qrImage = await QRCode.toDataURL(payload, { width: 360, margin: 1 });

    const id = uuid();
    await query(
      `INSERT INTO qris_orders
        (id, user_id, amount, fee, net_amount, reference, qr_payload, qr_image, status, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        req.user.sub,
        amount,
        fee,
        netAmount,
        reference,
        payload,
        qrImage,
        expiresAt
      ]
    );
    res.json({
      ok: true,
      order: {
        id,
        reference,
        amount,
        fee,
        net_amount: netAmount,
        qr_image: qrImage,
        qr_payload: payload,
        expires_at: expiresAt.toISOString(),
        status: "pending"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate QRIS" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const rows = await query(
    "SELECT * FROM qris_orders WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const order = rows[0];
  if (order.status === "pending" && new Date(order.expires_at) < new Date()) {
    await query("UPDATE qris_orders SET status='expired' WHERE id=?", [
      order.id
    ]);
    order.status = "expired";
  }
  res.json({ order });
});

router.get("/", requireAuth, async (req, res) => {
  const rows = await query(
    `SELECT id, reference, amount, fee, net_amount, status, expires_at, paid_at, created_at
     FROM qris_orders WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 50`,
    [req.user.sub]
  );
  res.json({ orders: rows });
});

// Mock "payment" endpoint to mark a QRIS as paid (dev/admin convenience until provider webhook is wired)
router.post("/:id/mock-pay", requireAuth, async (req, res) => {
  const rows = await query(
    "SELECT * FROM qris_orders WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.sub]
  );
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const order = rows[0];
  if (order.status !== "pending") {
    return res.status(400).json({ error: `Order already ${order.status}` });
  }
  if (new Date(order.expires_at) < new Date()) {
    await query("UPDATE qris_orders SET status='expired' WHERE id=?", [order.id]);
    return res.status(400).json({ error: "Order expired" });
  }
  // credit user balance net of platform fee
  const userRows = await query(
    "SELECT balance FROM users WHERE id = ? FOR UPDATE",
    [order.user_id]
  );
  const newBalance = Number(userRows[0].balance) + Number(order.net_amount);
  await query("UPDATE users SET balance = ? WHERE id = ?", [
    newBalance,
    order.user_id
  ]);
  await query(
    "UPDATE qris_orders SET status='paid', paid_at = NOW() WHERE id = ?",
    [order.id]
  );
  await query(
    `INSERT INTO transactions (id, user_id, type, amount, balance_after, reference, description)
     VALUES (?, ?, 'qris_in', ?, ?, ?, ?)`,
    [
      uuid(),
      order.user_id,
      order.net_amount,
      newBalance,
      order.reference,
      `QRIS payment received (gross IDR ${order.amount}, fee IDR ${order.fee})`
    ]
  );
  res.json({ ok: true, balance: newBalance });
});

module.exports = router;
