CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fingerprints (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(66) UNIQUE NOT NULL,
  ipfs_cid VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  fingerprint VARCHAR(66),
  cloudinaryUrl TEXT,
  userId INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
