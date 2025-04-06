require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const axios = require('axios');
const Web3 = require('web3');
const cloudinary = require('cloudinary').v2;

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection pool
const pool = new Pool({
  host: 'db',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
});

// Ensure required tables exist (basic schema)
(async () => {
  const client = await pool.connect();
  try {
    // Users table: id, email, password_hash, verified, verify_token
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        verify_token VARCHAR(255)
      );
    `);
    // Files table: id, user_id, filename, ipfs_hash, fingerprint, tx_hash, cloudinary_id, uploaded_at, dmca_reported
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255),
        ipfs_hash VARCHAR(100),
        fingerprint VARCHAR(64),
        tx_hash VARCHAR(66),
        cloudinary_id VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        dmca_reported BOOLEAN DEFAULT FALSE
      );
    `);
  } finally {
    client.release();
  }
})().catch(err => console.error("DB init error:", err.stack));

// Configure Cloudinary if credentials are provided
let useCloudinary = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });
  useCloudinary = true;
}

// Configure Web3 for Ganache
const web3 = new Web3('http://ganache:8545');  // Ganache RPC URL

// Simple middleware to authenticate JWT tokens for protected routes
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;  // payload contains user id and email
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Multer setup for file uploads (store in memory for processing)
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    // Hash the password
    const password_hash = bcrypt.hashSync(password, 10);
    // Create a verification token
    const verify_token = crypto.randomBytes(20).toString('hex');
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, verify_token) VALUES ($1, $2, $3) RETURNING id',
      [email, password_hash, verify_token]
    );
    // In a real app, send verification email with the token link:
    // e.g., sendEmail(email, `Click to verify: ${CLIENT_URL}/verify?token=${verify_token}`)
    console.log(`Verification token for ${email}: ${verify_token}`);
    // For demo, auto-verify user to simplify (comment out the next two lines if using actual email verification)
    await pool.query('UPDATE users SET verified = TRUE WHERE id = $1', [result.rows[0].id]);
    return res.json({ message: 'Registered successfully. Please check your email to verify your account.' });
  } catch (err) {
    if (err.code === '23505') {  // unique_violation for email
      return res.status(400).json({ error: 'Email is already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Email verification endpoint
app.get('/api/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send("Invalid verification token");
  try {
    const result = await pool.query('UPDATE users SET verified = TRUE, verify_token = NULL WHERE verify_token = $1 RETURNING email', [token]);
    if (result.rowCount === 0) {
      return res.status(400).send("Invalid or expired verification token");
    }
    // In a real scenario, you might redirect to a frontend page. Here we just confirm:
    res.send("Email verified! You can now log in.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// User login endpoint (returns JWT)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = await pool.query('SELECT id, password_hash, verified FROM users WHERE email=$1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    // Check password
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.verified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your account.' });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route: upload file
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const userId = req.user.id;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileBuffer = req.file.buffer;
    // Compute SHA-256 fingerprint of original file
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    let compressedBuffer = fileBuffer;
    // If it's an image, compress it using Sharp
    if (mimeType.startsWith('image/')) {
      try {
        compressedBuffer = await sharp(fileBuffer)
                            .resize({ width: 1024, fit: 'inside' })  // resize large images
                            .jpeg({ quality: 80 })
                            .toBuffer();
      } catch (err) {
        console.warn("Image compression failed, using original image buffer");
        compressedBuffer = fileBuffer;
      }
    }
    // Upload to Cloudinary (if configured)
    let cloudinaryId = null;
    let cloudinaryUrl = null;
    if (useCloudinary) {
      try {
        // Use upload_stream for buffer
        const uploadOptions = { resource_type: "auto", public_id: undefined };
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          stream.end(compressedBuffer);
        });
        cloudinaryId = result.public_id;
        cloudinaryUrl = result.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
      }
    }
    // Add file to IPFS via local node
    let ipfsHash = null;
    try {
      const ipfsRes = await axios({
        method: 'post',
        url: 'http://ipfs:5001/api/v0/add',
        headers: { 'Content-Type': 'multipart/form-data' },
        data: (() => {
          // We construct FormData manually to send to IPFS HTTP API
          const FormData = require('form-data');
          const form = new FormData();
          form.append('file', compressedBuffer, { filename: originalName });
          return form;
        })()
      });
      if (ipfsRes.data && ipfsRes.data.Hash) {
        ipfsHash = ipfsRes.data.Hash;
      }
    } catch (err) {
      console.error("IPFS upload failed:", err);
    }
    // Call FastAPI service for fingerprint scan
    let scanResult = null;
    try {
      const resp = await axios.post(`${process.env.FASTAPI_URL || 'http://fastapi:8000'}/scan`, { fingerprint: fileHash });
      scanResult = resp.data;  // e.g., { match: false }
    } catch (err) {
      console.error("FastAPI scan request failed:", err);
    }
    // Record on blockchain (Ganache) by sending a transaction with the IPFS hash in data
    let txHash = null;
    try {
      const accounts = await web3.eth.getAccounts();
      txHash = await web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[0],  // sending to self (could be to another account or contract)
        value: '0', 
        data: web3.utils.asciiToHex(ipfsHash || 'upload:' + Date.now())  // embed ipfsHash or a marker
      }).then(receipt => receipt.transactionHash);
    } catch (err) {
      console.error("Blockchain transaction failed:", err);
    }
    // Save file record in Postgres
    const result = await pool.query(
      `INSERT INTO files (user_id, filename, ipfs_hash, fingerprint, tx_hash, cloudinary_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [userId, originalName, ipfsHash, fileHash, txHash, cloudinaryId]
    );
    const fileId = result.rows[0].id;
    res.json({
      id: fileId,
      filename: originalName,
      ipfs_hash: ipfsHash,
      fingerprint: fileHash,
      tx_hash: txHash,
      cloudinary_url: cloudinaryUrl,
      scan: scanResult
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Protected route: list files uploaded by the logged-in user
app.get('/api/files', authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT id, filename, ipfs_hash, fingerprint, tx_hash, cloudinary_id, uploaded_at, dmca_reported FROM files WHERE user_id=$1 ORDER BY uploaded_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not retrieve files' });
  }
});

// Protected route: delete an uploaded file (user deletes their own file)
app.delete('/api/files/:id', authenticate, async (req, res) => {
  const userId = req.user.id;
  const fileId = req.params.id;
  try {
    // Verify file exists and belongs to user
    const fileRes = await pool.query('SELECT * FROM files WHERE id=$1 AND user_id=$2', [fileId, userId]);
    if (fileRes.rowCount === 0) {
      return res.status(404).json({ error: 'File not found or not accessible' });
    }
    const file = fileRes.rows[0];
    // If Cloudinary was used, delete the file from Cloudinary
    if (useCloudinary && file.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(file.cloudinary_id, { resource_type: "image" });
      } catch (err) {
        console.warn("Cloudinary deletion failed (file may not exist):", err);
      }
    }
    // Remove file record from DB
    await pool.query('DELETE FROM files WHERE id=$1', [fileId]);
    // (Optional: one could also unpin from IPFS or mark for GC, but IPFS GC not triggered here)
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// DMCA report endpoint (could be called by admin or content owner)
app.post('/api/report_dmca', authenticate, async (req, res) => {
  const { fileId, reason } = req.body;
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });
  try {
    // Find the file (no ownership check here, assume admin usage or external reporter simulation)
    const fileRes = await pool.query('SELECT * FROM files WHERE id=$1', [fileId]);
    if (fileRes.rowCount === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    // Mark file as reported in DB
    await pool.query('UPDATE files SET dmca_reported = TRUE WHERE id=$1', [fileId]);
    // If an external DMCA API is configured (RapidAPI), send a request (simulation)
    if (process.env.DMCA_API_KEY) {
      // Note: This is a placeholder. In a real scenario, you'd use the specific DMCA API endpoint and format.
      console.log(`DMCA report sent via RapidAPI for file ${fileId}, reason: ${reason || 'n/a'}`);
      // e.g., axios.post('https://dmca-api.endpoint', { fileUrl: ..., reason: ...}, { headers: { 'x-rapidapi-key': ... }})
    } else {
      console.log(`DMCA report logged for file ${fileId}, reason: ${reason || 'n/a'}`);
    }
    res.json({ message: 'DMCA report submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DMCA report failed' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
