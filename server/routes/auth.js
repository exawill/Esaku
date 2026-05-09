"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");

const { query } = require("../db");
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth
} = require("../middleware/auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/sign-up", async (req, res) => {
  try {
    const { email, password, name, website } = req.body || {};

    // Honeypot — bots fill in `website`; humans never see it.
    if (typeof website === "string" && website.trim() !== "") {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be 8+ characters" });
    }

    // 1 user per browser cookie — bot deterrent. The device cookie is set by
    // middleware/device.js on every request, so it is always present here.
    const deviceId = req.deviceId || null;
    if (deviceId) {
      const sameDevice = await query(
        "SELECT id FROM users WHERE device_id = ? LIMIT 1",
        [deviceId]
      );
      if (sameDevice.length) {
        return res.status(409).json({
          error:
            "Akun sudah pernah dibuat dari peramban ini. Gunakan tombol Masuk, atau buat akun dari peramban lain."
        });
      }
    }

    const existing = await query("SELECT id FROM users WHERE email = ?", [
      email
    ]);
    if (existing.length) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const id = uuid();
    await query(
      "INSERT INTO users (id, email, password_hash, name, role, device_id) VALUES (?, ?, ?, ?, 'user', ?)",
      [id, email, hash, name || null, deviceId]
    );
    const token = signToken({ id, email, role: "user" });
    setAuthCookie(res, token);
    res.json({ ok: true, user: { id, email, name: name || null, role: "user" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sign-up failed" });
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const rows = await query(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ?",
      [email]
    );
    if (!rows.length || !rows[0].password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sign-in failed" });
  }
});

router.post("/sign-out", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const { readToken } = require("../middleware/auth");
  const { JWT_SECRET } = require("../middleware/auth");
  const jwt = require("jsonwebtoken");
  
  const token = readToken(req);
  if (!token) return res.json({ user: null });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const rows = await query(
      "SELECT id, email, name, role, balance FROM users WHERE id = ?",
      [payload.sub]
    );
    if (!rows.length) return res.json({ user: null });
    res.json({ user: rows[0] });
  } catch (err) {
    res.json({ user: null });
  }
});

// ---- Hostinger OAuth ----
const oauthStates = new Map();

router.get("/hostinger", (req, res) => {
  const clientId = process.env.HOSTINGER_CLIENT_ID;
  const redirectUri = process.env.HOSTINGER_REDIRECT_URI;
  const authorizeUrl = process.env.HOSTINGER_AUTHORIZE_URL;
  if (!clientId || !redirectUri || !authorizeUrl) {
    return res
      .status(503)
      .json({ error: "Hostinger OAuth not configured" });
  }
  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  const url = new URL(authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

router.get("/hostinger/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const expiry = oauthStates.get(state);
    if (!expiry || expiry < Date.now()) {
      return res.status(400).send("Invalid or expired OAuth state");
    }
    oauthStates.delete(state);

    const tokenResp = await fetch(process.env.HOSTINGER_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.HOSTINGER_CLIENT_ID,
        client_secret: process.env.HOSTINGER_CLIENT_SECRET,
        redirect_uri: process.env.HOSTINGER_REDIRECT_URI
      })
    });
    if (!tokenResp.ok) {
      return res.status(502).send("OAuth token exchange failed");
    }
    const tokenData = await tokenResp.json();
    const userResp = await fetch(process.env.HOSTINGER_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    if (!userResp.ok) {
      return res.status(502).send("OAuth userinfo failed");
    }
    const profile = await userResp.json();
    const email = profile.email;
    const subject = profile.sub || profile.id;
    if (!email) return res.status(400).send("OAuth did not return email");

    let userId;
    let role = "user";
    const deviceId = req.deviceId || null;
    const existing = await query(
      "SELECT id, role FROM users WHERE email = ? OR (oauth_provider='hostinger' AND oauth_subject = ?) LIMIT 1",
      [email, String(subject || "")]
    );
    if (existing.length) {
      userId = existing[0].id;
      role = existing[0].role;
      await query(
        "UPDATE users SET oauth_provider='hostinger', oauth_subject=?, name = COALESCE(name, ?), device_id = COALESCE(device_id, ?) WHERE id = ?",
        [String(subject || ""), profile.name || null, deviceId, userId]
      );
    } else {
      // Enforce 1 user per browser cookie on first-time OAuth sign-up too.
      if (deviceId) {
        const sameDevice = await query(
          "SELECT id FROM users WHERE device_id = ? LIMIT 1",
          [deviceId]
        );
        if (sameDevice.length) {
          return res.redirect("/sign-in?err=device_used");
        }
      }
      userId = uuid();
      await query(
        "INSERT INTO users (id, email, name, role, oauth_provider, oauth_subject, device_id) VALUES (?, ?, ?, 'user', 'hostinger', ?, ?)",
        [userId, email, profile.name || null, String(subject || ""), deviceId]
      );
    }
    const token = signToken({ id: userId, email, role });
    setAuthCookie(res, token);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth error");
  }
});

module.exports = router;
