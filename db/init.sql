CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'shortVideo',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  fingerprint VARCHAR(255),
  cloudinaryUrl TEXT,
  userId INT,
  fileType VARCHAR(20),
  chainRef VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infringements (
  id SERIAL PRIMARY KEY,
  workId INT,
  infringingUrl TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  demandedPrice DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 新增 platform_accounts 表，排除合法帳號
CREATE TABLE IF NOT EXISTS platform_accounts (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL,
  platform VARCHAR(50),
  accountId VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
