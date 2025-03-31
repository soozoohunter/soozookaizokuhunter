-- 創建 users, works, infringements 表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  fingerprint VARCHAR(255),
  cloudinaryUrl TEXT,
  userId INT REFERENCES users(id) ON DELETE CASCADE,
  fileType VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infringements (
  id SERIAL PRIMARY KEY,
  workId INT REFERENCES works(id) ON DELETE CASCADE,
  infringingUrl TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  infringerEmail VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
