"use strict";

const crypto = require("crypto");

const COOKIE_NAME = "esaku_device";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Issue (or read) a long-lived per-browser UUID. Used to:
//   1. enforce one sign-up per browser (bot deterrent)
//   2. correlate audit/abuse signals later
function deviceCookie(req, res, next) {
  let id = req.cookies && req.cookies[COOKIE_NAME];
  // Reject obviously malformed values (not 36-char UUIDs)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "")) {
    id = crypto.randomUUID();
  }
  res.cookie(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR_MS,
    path: "/"
  });
  req.deviceId = id;
  next();
}

module.exports = { deviceCookie, COOKIE_NAME };
