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
