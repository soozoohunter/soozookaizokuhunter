-- db/init.sql
CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_type VARCHAR(20),  -- 'short-video' or 'seller'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PlatformAccounts" (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES "Users"(id),
  platform VARCHAR(50),
  account_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Works" (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES "Users"(id),
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Infringements" (
  id SERIAL PRIMARY KEY,
  workId INTEGER REFERENCES "Works"(id),
  description TEXT,
  chainRef VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
