"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

const DB_CLIENT = process.env.DB_CLIENT || (process.env.DB_HOST ? "mysql" : "sqlite");
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "..", "data", "esaku.sqlite");

let pool = null;
let sqliteDb = null;

function ensureDataDirectory() {
  if (DB_CLIENT !== "sqlite") return;
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function createSqliteConnection() {
  ensureDataDirectory();
  const sqlite3 = require("sqlite3").verbose();
  sqliteDb = new sqlite3.Database(DB_FILE);
  await runSqlite("PRAGMA foreign_keys = ON");
}

async function runSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function allSqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function query(sql, params = []) {
  if (DB_CLIENT === "mysql") {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA") || trimmed.startsWith("WITH")) {
    return await allSqlite(sql, params);
  }

  await runSqlite(sql, params);
  return [];
}

function createMysqlPool() {
  const mysql = require("mysql2/promise");
  return mysql.createPool({
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
}

const SQLITE_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    balance NUMERIC NOT NULL DEFAULT 0,
    oauth_provider TEXT,
    oauth_subject TEXT,
    device_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS qris_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    fee NUMERIC NOT NULL DEFAULT 0,
    net_amount NUMERIC NOT NULL DEFAULT 0,
    reference TEXT UNIQUE NOT NULL,
    qr_payload TEXT NOT NULL,
    qr_image TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TEXT NOT NULL,
    paid_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_qris_user ON qris_orders (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_qris_status ON qris_orders (status)`,

  `CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    method TEXT NOT NULL,
    destination TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    fee NUMERIC NOT NULL,
    total_debit NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wd_user ON withdrawals (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_wd_status ON withdrawals (status)`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    reference TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tx_user_created ON transactions (user_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS cms_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`
];

const MYSQL_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(120) NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    oauth_provider VARCHAR(40) NULL,
    oauth_subject VARCHAR(190) NULL,
    device_id VARCHAR(64) NULL,
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
    key VARCHAR(100) PRIMARY KEY,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

const DEFAULT_SETTINGS = {
  qris_provider: {
    provider: "internal",
    api_type: "snap",
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

const COLUMN_MIGRATIONS = [
  {
    table: "users",
    column: "device_id",
    ddl: "ALTER TABLE users ADD COLUMN device_id VARCHAR(64) NULL",
    index: { name: "idx_users_device", ddl: "CREATE INDEX idx_users_device ON users (device_id)" }
  }
];

async function columnExists(table, column) {
  if (DB_CLIENT === "mysql") {
    const cols = await query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [table, column]
    );
    return cols.length > 0;
  }

  if (!sqliteDb) return false;
  const cols = await query(`PRAGMA table_info(${table})`);
  return cols.some((row) => row.name === column);
}

async function indexExists(table, indexName) {
  if (DB_CLIENT === "mysql") {
    const idx = await query(
      "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
      [table, indexName]
    );
    return idx.length > 0;
  }

  if (!sqliteDb) return false;
  const idx = await query(`PRAGMA index_list(${table})`);
  return idx.some((row) => row.name === indexName);
}

async function applyColumnMigrations() {
  for (const m of COLUMN_MIGRATIONS) {
    const exists = await columnExists(m.table, m.column);
    if (!exists) {
      await query(m.ddl);
    }
    if (m.index) {
      const hasIndex = await indexExists(m.table, m.index.name);
      if (!hasIndex) {
        await query(m.index.ddl);
      }
    }
  }
}

async function initDb() {
  if (DB_CLIENT === "mysql") {
    pool = createMysqlPool();
  } else {
    await createSqliteConnection();
  }
}

async function ensureSchema() {
  await initDb();

  const statements = DB_CLIENT === "mysql" ? MYSQL_SCHEMA_STATEMENTS : SQLITE_SCHEMA_STATEMENTS;
  for (const stmt of statements) {
    await query(stmt);
  }

  await applyColumnMigrations();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const insertStatement =
      DB_CLIENT === "mysql"
        ? "INSERT IGNORE INTO cms_settings (key, value) VALUES (?, ?)"
        : "INSERT OR IGNORE INTO cms_settings (key, value) VALUES (?, ?)";
    await query(insertStatement, [key, JSON.stringify(value)]);
  }
}

async function ensureAdminUser() {
  await initDb();
  const email = process.env.ADMIN_EMAIL || "Admin@esaku.xyz";
  const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
  const hash = await bcrypt.hash(adminPassword, 10);
  const rows = await query("SELECT id FROM users WHERE email = ?", [email]);
  if (rows.length) {
    await query("UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?", [hash, email]);
    console.log(`[esaku] Admin password ensured for ${email}`);
    return;
  }
  await query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'admin')",
    [uuid(), email, hash, "Esaku Admin"]
  );
  console.log(`[esaku] Default admin created -> ${email} :: password: ${adminPassword}`);
}

async function getSetting(key) {
  await initDb();
  const rows = await query("SELECT value FROM cms_settings WHERE key = ?", [key]);
  if (!rows.length) return DEFAULT_SETTINGS[key] || null;
  const raw = rows[0].value;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function setSetting(key, value) {
  await initDb();
  if (DB_CLIENT === "mysql") {
    await query(
      "INSERT INTO cms_settings (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [key, JSON.stringify(value)]
    );
  } else {
    await query(
      "INSERT INTO cms_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, JSON.stringify(value)]
    );
  }
}

async function closeDb() {
  if (DB_CLIENT === "mysql" && pool) {
    await pool.end();
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = {
  query,
  ensureSchema,
  ensureAdminUser,
  getSetting,
  setSetting,
  closeDb,
  DEFAULT_SETTINGS
};
