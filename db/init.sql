CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'shortVideo',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  fingerprint VARCHAR(255),
  fileType VARCHAR(20),
  userId INT,
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
