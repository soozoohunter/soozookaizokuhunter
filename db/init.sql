-- db/init.sql

-- 1) users 表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  address VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'trial',
  is_trial_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


-- 2) trial_uploads 表
CREATE TABLE IF NOT EXISTS trial_uploads (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  address VARCHAR(255),
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  blockchain_tx VARCHAR(66) NOT NULL,
  certificate_url TEXT NOT NULL,
  fingerprint VARCHAR(50) NOT NULL,
  has_paid_certificate BOOLEAN NOT NULL DEFAULT FALSE,
  has_paid_scan BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_email ON trial_uploads(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_fingerprint ON trial_uploads(fingerprint);
CREATE INDEX IF NOT EXISTS idx_trial_user ON trial_uploads(user_id);


-- 3) pending_payments 表
CREATE TABLE IF NOT EXISTS pending_payments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  upload_id INT REFERENCES trial_uploads(id) ON DELETE CASCADE,
  feature VARCHAR(20) NOT NULL,
  amount INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON pending_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON pending_payments(status);


-- 4) 新增一張 "scan_reports" 表
-- 用來記錄每次對 trial_uploads 做「侵權偵測」之產生的報告
-- 您可自行擴充更多欄位，如 aggregator/fallback 搜尋結果 JSON、相似度最高分、人工標註等
CREATE TABLE IF NOT EXISTS scan_reports (
  id SERIAL PRIMARY KEY,
  upload_id INT REFERENCES trial_uploads(id) ON DELETE CASCADE,
  report_pdf_url TEXT NOT NULL,       -- 產生的掃描報告 PDF 存放處
  aggregator_summary JSONB,           -- aggregator / fallback / vectorSearch 的結果摘要
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_reports_upload_id ON scan_reports(upload_id);
