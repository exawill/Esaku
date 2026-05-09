"use strict";

require("dotenv").config();
const { ensureSchema, ensureAdminUser, closeDb } = require("../server/db");

(async () => {
  try {
    await ensureSchema();
    await ensureAdminUser();
    console.log("[esaku] schema + admin ready");
  } catch (err) {
    console.error("[esaku] init failed:", err);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
})();
