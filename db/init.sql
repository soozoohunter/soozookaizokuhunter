CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  filename VARCHAR(255),
  fingerprint VARCHAR(64),
  ipfs_hash TEXT,
  cloud_url TEXT,
  dmca_flag BOOLEAN DEFAULT FALSE,
  tx_hash VARCHAR(66),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
