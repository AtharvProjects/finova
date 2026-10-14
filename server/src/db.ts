import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file stored locally in finova directory
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'finova.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliable concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('credit', 'debit')),
      category TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'analysed',
      risk_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'low' CHECK(risk_level IN ('low', 'moderate', 'high', 'critical')),
      risk_factors TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      risk_category TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      evidence TEXT NOT NULL,
      canonical_payload TEXT NOT NULL,
      canonical_hash TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'locally_verified',
      created_at TEXT NOT NULL,
      verified_at TEXT,
      onchain_tx_hash TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'success'
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON transactions(risk_level);
    CREATE INDEX IF NOT EXISTS idx_decisions_tx ON decisions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_trail(timestamp DESC);
  `);

  // Default system settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
  `);

  insertSetting.run('high_risk_threshold', '60');
  insertSetting.run('critical_risk_threshold', '80');
  insertSetting.run('large_tx_threshold', '500000');
  insertSetting.run('duplicate_window_hours', '24');
  insertSetting.run('blockchain_network', 'Ethereum Sepolia Testnet (EIP-712 / SHA-256 Mock)');
  insertSetting.run('contract_address', '0x8fB918A033a2510A145C334dF25B50A7E30a47Fe');
  insertSetting.run('simulated_rpc_status', 'connected');
}
