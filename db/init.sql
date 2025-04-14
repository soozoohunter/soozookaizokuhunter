CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'copyright',
  plan VARCHAR(50) DEFAULT 'BASIC',
  upload_videos INT DEFAULT 0,
  upload_images INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  uploaded_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
);
