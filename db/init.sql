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

CREATE TABLE IF NOT EXISTS platform_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId INT NOT NULL,
  platformName VARCHAR(50) NOT NULL,
  accountId VARCHAR(100) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  accessToken TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 如果未安裝 pgcrypto 或 gen_random_uuid，可改用其他方式
-- 例如 id SERIAL primary key
-- 但此處示範 UUID
