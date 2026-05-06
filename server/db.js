"use strict";

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "esaku",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(120) NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    oauth_provider VARCHAR(40) NULL,
    oauth_subject VARCHAR(190) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS qris_orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    reference VARCHAR(64) UNIQUE NOT NULL,
    qr_payload TEXT NOT NULL,
    qr_image LONGTEXT NULL,
    status ENUM('pending','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    CONSTRAINT fk_qris_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS withdrawals (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    method ENUM('bank','ewallet') NOT NULL,
    destination VARCHAR(190) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    fee DECIMAL(18,2) NOT NULL,
    total_debit DECIMAL(18,2) NOT NULL,
    status ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
    note VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    CONSTRAINT fk_wd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    type ENUM('qris_in','withdrawal_out','fee','adjustment') NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    reference VARCHAR(64) NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS cms_settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

const DEFAULT_SETTINGS = {
  qris_provider: {
    provider: "internal",
    api_base_url: "",
    api_key: "",
    merchant_id: "",
    expiry_minutes: 15
  },
  fees: {
    qris_flat_percent: 0.7,
    withdrawal_bank_fee_idr: 6500,
    withdrawal_ewallet_fee_idr: 2500,
    withdrawal_min_idr: 50000
  },
  branding: {
    logo_url: "/assets/logo.svg",
    banner_url: "/assets/banner.svg",
    site_name: "Esaku"
  }
};

// Column-level migrations applied after the base CREATE TABLEs. Each entry
// adds a column if it is not already present. Schema-evolution lives here
// so older deployments stay forward-compatible.
const COLUMN_MIGRATIONS = [
  {
    table: "users",
    column: "device_id",
    ddl: "ALTER TABLE users ADD COLUMN device_id VARCHAR(64) NULL",
    index: { name: "idx_users_device", ddl: "CREATE INDEX idx_users_device ON users (device_id)" }
  }
];

async function applyColumnMigrations() {
  for (const m of COLUMN_MIGRATIONS) {
    const cols = await query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [m.table, m.column]
    );
    if (!cols.length) {
      await query(m.ddl);
    }
    if (m.index) {
      const idx = await query(
        "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
        [m.table, m.index.name]
      );
      if (!idx.length) {
        await query(m.index.ddl);
      }
    }
  }
}

async function ensureSchema() {
  // If DB env not configured, skip silently and let routes return graceful errors.
  if (!process.env.DB_HOST) {
    console.warn("[esaku] DB_HOST not set; skipping schema bootstrap");
    return;
  }
  for (const stmt of SCHEMA_STATEMENTS) {
    await query(stmt);
  }
  await applyColumnMigrations();
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await query(
      "INSERT IGNORE INTO cms_settings (`key`, value) VALUES (?, ?)",
      [key, JSON.stringify(value)]
    );
  }
}

async function ensureAdminUser() {
  if (!process.env.DB_HOST) return;
  const email = process.env.ADMIN_EMAIL || "Admin@esaku.xyz";
  const rows = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (rows.length) return;
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(tempPassword, 10);
  await query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'admin')",
    [uuid(), email, hash, "Esaku Admin"]
  );
  console.log(
    `[esaku] Default admin created -> ${email} :: temporary password: ${tempPassword}`
  );
  console.log("[esaku] Save this password now; it is shown only once.");
}

async function getSetting(key) {
  const rows = await query("SELECT value FROM cms_settings WHERE `key` = ?", [
    key
  ]);
  if (!rows.length) return DEFAULT_SETTINGS[key] || null;
  const raw = rows[0].value;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function setSetting(key, value) {
  await query(
    "INSERT INTO cms_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
    [key, JSON.stringify(value)]
  );
}

module.exports = {
  pool,
  query,
  ensureSchema,
  ensureAdminUser,
  getSetting,
  setSetting,
  DEFAULT_SETTINGS
};
