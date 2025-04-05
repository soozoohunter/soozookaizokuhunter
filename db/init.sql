CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) DEFAULT 'shortVideoCreator',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  fingerprint VARCHAR(255),
  cloudinary_url TEXT,
  user_id INT,
  file_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infringements (
  id SERIAL PRIMARY KEY,
  work_id INT,
  infringing_url TEXT,
  status VARCHAR(50) DEFAULT 'detected',
  demanded_price DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
