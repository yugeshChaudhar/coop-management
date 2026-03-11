require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cooperative-secret-key-2024';

// PostgreSQL connection pool
const getPool = () => {
  const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cooperative'}`;
  const useSSL = connectionString.includes('sslmode=require');
  
  return new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });
};

const pool = getPool();

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001', 'https://coop-management-ifem.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve React app in production
const clientBuildPath = path.join(__dirname, 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

// Initialize Database Tables
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        profile_photo TEXT,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS citizenship_details (
        id SERIAL PRIMARY KEY,
        member_id INTEGER,
        citizenship_number VARCHAR(255) UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        gender VARCHAR(50),
        birth_date DATE,
        birth_date_bs VARCHAR(50),
        birth_place TEXT,
        nationality VARCHAR(100),
        religion VARCHAR(100),
        marital_status VARCHAR(50),
        spouse_name TEXT,
        photo TEXT,
        citizenship_front TEXT,
        citizenship_back TEXT,
        issued_district VARCHAR(100),
        issued_date DATE,
        issued_date_bs VARCHAR(50),
        province VARCHAR(100),
        district VARCHAR(100),
        municipality VARCHAR(100),
        ward_number VARCHAR(50),
        tole VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        member_number VARCHAR(255) UNIQUE NOT NULL,
        member_name TEXT NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        membership_type VARCHAR(50) DEFAULT 'Saving',
        joined_date_bs VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        citizenship_id INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loan_accounts (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL,
        loan_number VARCHAR(255) UNIQUE NOT NULL,
        loan_type VARCHAR(100) NOT NULL,
        principal_amount DECIMAL(15,2) NOT NULL,
        interest_rate DECIMAL(5,2) NOT NULL,
        loan_term_months INTEGER NOT NULL,
        loan_started_date_bs VARCHAR(50),
        disbursement_date DATE,
        maturity_date DATE,
        purpose TEXT,
        status VARCHAR(50) DEFAULT 'active',
        remaining_balance DECIMAL(15,2),
        collateral_details TEXT,
        guarantor_name TEXT,
        guarantor_phone VARCHAR(50),
        guarantor_citizenship VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS share_accounts (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL,
        share_number VARCHAR(255) UNIQUE NOT NULL,
        number_of_shares INTEGER NOT NULL,
        share_price DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        purchase_date_bs VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS savings_accounts (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL,
        account_number VARCHAR(255) UNIQUE NOT NULL,
        account_type VARCHAR(50) DEFAULT 'regular',
        current_balance DECIMAL(15,2) DEFAULT 0,
        deposit_amount DECIMAL(15,2) DEFAULT 0,
        saving_start_date_bs VARCHAR(50),
        interest_rate DECIMAL(5,2) DEFAULT 6,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS monthly_savings (
        id SERIAL PRIMARY KEY,
        savings_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        deposit_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS savings_withdrawals (
        id SERIAL PRIMARY KEY,
        savings_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        withdrawal_amount DECIMAL(15,2) NOT NULL,
        withdrawal_date DATE,
        reason TEXT,
        withdrawed_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loan_repayments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        payment_amount DECIMAL(15,2) NOT NULL,
        principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
        interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
        payment_date DATE,
        payment_date_bs VARCHAR(50),
        payment_method VARCHAR(50) DEFAULT 'cash',
        receipt_number VARCHAR(255),
        notes TEXT,
        recorded_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id INTEGER,
        details TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Database tables created successfully');
    
    // Create default admin user
    const userResult = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (userResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (username, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@cooperative.com', hashedPassword, 'Administrator', 'admin']
      );
      console.log('✓ Default admin user created: admin / admin123');
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Audit logging helper
async function logAudit(userId, action, tableName, recordId, details) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, action, tableName, recordId, details]
    );
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
}

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {

//, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role || 'admin']
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, username: user.username, email: user.email, name: user.full_name, photo: user.profile_photo, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple login endpoint (for Vercel frontend)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    
    if (!result.rows.length) {
      return res.json({ success: false });
    }
    
    if (password === result.rows[0].password) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, profile_photo, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile endpoint (alias for /api/auth/me)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, profile_photo, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, email } = req.body;
    
    await pool.query(
      'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
      [full_name, email, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
    const result = await pool.query(
      'SELECT id, username, email, full_name, profile_photo, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CITIZENSHIP ROUTES ============

app.post('/api/citizenship', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'citizenship_front', maxCount: 1 },
  { name: 'citizenship_back', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    
    const photo = req.files?.photo?.[0]?.filename;
    const citizenshipFront = req.files?.citizenship_front?.[0]?.filename;
    const citizenshipBack = req.files?.citizenship_back?.[0]?.filename;
    
    const result = await pool.query(`
      INSERT INTO citizenship_details (
        citizenship_number, full_name, gender, birth_date, birth_date_bs, birth_place,
        nationality, religion, marital_status, spouse_name, photo, citizenship_front, citizenship_back,
        issued_district, issued_date, issued_date_bs, province, district, municipality, ward_number, tole, phone, email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id
    `, [
      data.citizenship_number, data.full_name, data.gender, data.birth_date, data.birth_date_bs,
      data.birth_place, data.nationality, data.religion, data.marital_status, data.spouse_name,
      photo, citizenshipFront, citizenshipBack, data.issued_district, data.issued_date, data.issued_date_bs,
      data.province, data.district, data.municipality, data.ward_number, data.tole, data.phone, data.email
    ]);
    
    const id = result.rows[0].id;
    logAudit(req.user.id, 'CREATE', 'citizenship_details', id, `Created citizenship: ${data.citizenship_number}`);
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Citizenship number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/citizenship', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citizenship_details ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/citizenship/member/:memberId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citizenship_details WHERE member_id = $1', [req.params.memberId]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Citizenship not found for this member' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/citizenship/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citizenship_details WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Citizenship not found' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/citizenship/:id', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'citizenship_front', maxCount: 1 },
  { name: 'citizenship_back', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    const photo = req.files?.photo?.[0]?.filename;
    const citizenshipFront = req.files?.citizenship_front?.[0]?.filename;
    const citizenshipBack = req.files?.citizenship_back?.[0]?.filename;
    
    let query = `
      UPDATE citizenship_details SET
      citizenship_number = $1, full_name = $2, gender = $3, birth_date = $4, birth_date_bs = $5, birth_place = $6,
      nationality = $7, religion = $8, marital_status = $9, spouse_name = $10,
      issued_district = $11, issued_date = $12, issued_date_bs = $13, province = $14, district = $15, municipality = $16,
      ward_number = $17, tole = $18, phone = $19, email = $20
    `;
    const params = [
      data.citizenship_number, data.full_name, data.gender, data.birth_date, data.birth_date_bs,
      data.birth_place, data.nationality, data.religion, data.marital_status, data.spouse_name,
      data.issued_district, data.issued_date, data.issued_date_bs, data.province, data.district, data.municipality,
      data.ward_number, data.tole, data.phone, data.email
    ];
    
    let paramIndex = 21;
    if (photo) {
      query += `, photo = $${paramIndex}`;
      params.push(photo);
      paramIndex++;
    }
    if (citizenshipFront) {
      query += `, citizenship_front = $${paramIndex}`;
      params.push(citizenshipFront);
      paramIndex++;
    }
    if (citizenshipBack) {
      query += `, citizenship_back = $${paramIndex}`;
      params.push(citizenshipBack);
      paramIndex++;
    }
    
    query += ` WHERE id = $${paramIndex}`;
    params.push(req.params.id);
    
    await pool.query(query, params);
    
    logAudit(req.user.id, 'UPDATE', 'citizenship_details', req.params.id, 'Updated citizenship details');
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Citizenship number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citizenship/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM citizenship_details WHERE id = $1', [req.params.id]);
    logAudit(req.user.id, 'DELETE', 'citizenship_details', req.params.id, 'Deleted citizenship record');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MEMBERS ROUTES ============

app.post('/api/members', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const result = await pool.query(`
      INSERT INTO members (member_number, member_name, address, phone, email, membership_type, joined_date_bs, status, citizenship_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      data.member_number, data.member_name, data.address, data.phone, data.email,
      data.membership_type || 'Saving', data.joined_date_bs, data.status || 'Active',
      data.citizenship_id, req.user.id
    ]);
    
    const id = result.rows[0].id;
    logAudit(req.user.id, 'CREATE', 'members', id, `Created member: ${data.member_name}`);
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Member number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members', authenticateToken, async (req, res) => {
  try {
    const { search, type, status } = req.query;
    let query = 'SELECT * FROM members WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (member_name LIKE $${params.length} OR member_number LIKE $${params.length} OR phone LIKE $${params.length})`;
    }
    if (type) {
      params.push(type);
      query += ` AND membership_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    const member = result.rows[0];
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    await pool.query(`
      UPDATE members SET
      member_number = $1, member_name = $2, address = $3, phone = $4, email = $5,
      membership_type = $6, joined_date_bs = $7, status = $8, citizenship_id = $9
      WHERE id = $10
    `, [
      data.member_number, data.member_name, data.address, data.phone, data.email,
      data.membership_type, data.joined_date_bs, data.status, data.citizenship_id, req.params.id
    ]);
    
    logAudit(req.user.id, 'UPDATE', 'members', req.params.id, `Updated member: ${data.member_name}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Member number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/members/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
    logAudit(req.user.id, 'DELETE', 'members', req.params.id, 'Deleted member');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOAN ACCOUNTS ROUTES ============

app.post('/api/loan-accounts', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const result = await pool.query(`
      INSERT INTO loan_accounts (
        member_id, loan_number, loan_type, principal_amount, interest_rate, loan_term_months,
        loan_started_date_bs, disbursement_date, maturity_date, purpose, status, remaining_balance,
        collateral_details, guarantor_name, guarantor_phone, guarantor_citizenship
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id
    `, [
      data.member_id, data.loan_number, data.loan_type, data.principal_amount, data.interest_rate,
      data.loan_term_months, data.loan_started_date_bs, data.disbursement_date, data.maturity_date,
      data.purpose, data.status || 'active', data.principal_amount, data.collateral_details,
      data.guarantor_name, data.guarantor_phone, data.guarantor_citizenship
    ]);
    
    const id = result.rows[0].id;
    logAudit(req.user.id, 'CREATE', 'loan_accounts', id, `Created loan: ${data.loan_number}`);
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Loan number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loan-accounts', authenticateToken, async (req, res) => {
  try {
    const { member_id, status } = req.query;
    let query = `
      SELECT la.*, m.member_name, m.member_number 
      FROM loan_accounts la
      LEFT JOIN members m ON la.member_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (member_id) {
      params.push(member_id);
      query += ` AND la.member_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND la.status = $${params.length}`;
    }
    
    query += ' ORDER BY la.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loan-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT la.*, m.member_name, m.member_number 
      FROM loan_accounts la
      LEFT JOIN members m ON la.member_id = m.id
      WHERE la.id = $1
    `, [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Loan account not found' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/loan-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    await pool.query(`
      UPDATE loan_accounts SET
      loan_number = $1, loan_type = $2, principal_amount = $3, interest_rate = $4, loan_term_months = $5,
      loan_started_date_bs = $6, disbursement_date = $7, maturity_date = $8, purpose = $9,
      status = $10, remaining_balance = $11, collateral_details = $12,
      guarantor_name = $13, guarantor_phone = $14, guarantor_citizenship = $15
      WHERE id = $16
    `, [
      data.loan_number, data.loan_type, data.principal_amount, data.interest_rate, data.loan_term_months,
      data.loan_started_date_bs, data.disbursement_date, data.maturity_date, data.purpose,
      data.status, data.remaining_balance, data.collateral_details,
      data.guarantor_name, data.guarantor_phone, data.guarantor_citizenship, req.params.id
    ]);
    
    logAudit(req.user.id, 'UPDATE', 'loan_accounts', req.params.id, `Updated loan: ${data.loan_number}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Loan number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/loan-accounts/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM loan_accounts WHERE id = $1', [req.params.id]);
    logAudit(req.user.id, 'DELETE', 'loan_accounts', req.params.id, 'Deleted loan account');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOAN REPAYMENTS ROUTES ============

app.post('/api/loan-repayments', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert repayment record
      const result = await client.query(`
        INSERT INTO loan_repayments (
          loan_id, member_id, payment_amount, principal_paid, interest_paid,
          payment_date, payment_date_bs, payment_method, receipt_number, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        data.loan_id, data.member_id, data.payment_amount, data.principal_paid || 0,
        data.interest_paid || 0, data.payment_date, data.payment_date_bs,
        data.payment_method || 'cash', data.receipt_number, data.notes, req.user.username
      ]);
      
      // Update loan remaining balance
      await client.query(
        'UPDATE loan_accounts SET remaining_balance = remaining_balance - $1 WHERE id = $2',
        [data.payment_amount, data.loan_id]
      );
      
      // Check if loan is fully paid
      const loanResult = await client.query('SELECT remaining_balance FROM loan_accounts WHERE id = $1', [data.loan_id]);
      if (loanResult.rows[0] && parseFloat(loanResult.rows[0].remaining_balance) <= 0) {
        await client.query('UPDATE loan_accounts SET status = $1 WHERE id = $2', ['paid', data.loan_id]);
      }
      
      await client.query('COMMIT');
      
      const id = result.rows[0].id;
      logAudit(req.user.id, 'CREATE', 'loan_repayments', id, `Recorded repayment for loan: ${data.loan_id}`);
      
      res.json({ success: true, id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loan-repayments', authenticateToken, async (req, res) => {
  try {
    const { loan_id } = req.query;
    let query = `
      SELECT lr.*, m.member_name, la.loan_number
      FROM loan_repayments lr
      LEFT JOIN members m ON lr.member_id = m.id
      LEFT JOIN loan_accounts la ON lr.loan_id = la.id
      WHERE 1=1
    `;
    const params = [];
    
    if (loan_id) {
      params.push(loan_id);
      query += ` AND lr.loan_id = $${params.length}`;
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SHARE ACCOUNTS ROUTES ============

app.post('/api/share-accounts', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const result = await pool.query(`
      INSERT INTO share_accounts (
        member_id, share_number, number_of_shares, share_price, total_amount,
        purchase_date_bs, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      data.member_id, data.share_number, data.number_of_shares, data.share_price,
      data.total_amount, data.purchase_date_bs, data.status || 'active'
    ]);
    
    const id = result.rows[0].id;
    logAudit(req.user.id, 'CREATE', 'share_accounts', id, `Created share account: ${data.share_number}`);
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Share number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/share-accounts', authenticateToken, async (req, res) => {
  try {
    const { member_id, status } = req.query;
    let query = `
      SELECT sa.*, m.member_name, m.member_number 
      FROM share_accounts sa
      LEFT JOIN members m ON sa.member_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (member_id) {
      params.push(member_id);
      query += ` AND sa.member_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND sa.status = $${params.length}`;
    }
    
    query += ' ORDER BY sa.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/share-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.*, m.member_name, m.member_number 
      FROM share_accounts sa
      LEFT JOIN members m ON sa.member_id = m.id
      WHERE sa.id = $1
    `, [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Share account not found' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/share-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    await pool.query(`
      UPDATE share_accounts SET
      share_number = $1, number_of_shares = $2, share_price = $3, total_amount = $4,
      purchase_date_bs = $5, status = $6
      WHERE id = $7
    `, [
      data.share_number, data.number_of_shares, data.share_price, data.total_amount,
      data.purchase_date_bs, data.status, req.params.id
    ]);
    
    logAudit(req.user.id, 'UPDATE', 'share_accounts', req.params.id, `Updated share account: ${data.share_number}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Share number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/share-accounts/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM share_accounts WHERE id = $1', [req.params.id]);
    logAudit(req.user.id, 'DELETE', 'share_accounts', req.params.id, 'Deleted share account');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SAVINGS ACCOUNTS ROUTES ============

app.post('/api/savings-accounts', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const result = await pool.query(`
      INSERT INTO savings_accounts (
        member_id, account_number, account_type, current_balance, deposit_amount,
        saving_start_date_bs, interest_rate, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      data.member_id, data.account_number, data.account_type || 'regular',
      data.current_balance || 0, data.deposit_amount || 0,
      data.saving_start_date_bs, data.interest_rate || 6, data.status || 'active'
    ]);
    
    const id = result.rows[0].id;
    logAudit(req.user.id, 'CREATE', 'savings_accounts', id, `Created savings account: ${data.account_number}`);
    
    res.json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Account number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings-accounts', authenticateToken, async (req, res) => {
  try {
    const { member_id, status } = req.query;
    let query = `
      SELECT sa.*, m.member_name, m.member_number 
      FROM savings_accounts sa
      LEFT JOIN members m ON sa.member_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (member_id) {
      params.push(member_id);
      query += ` AND sa.member_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND sa.status = $${params.length}`;
    }
    
    query += ' ORDER BY sa.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings-accounts/member/:memberId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.*, m.member_name, m.member_number 
      FROM savings_accounts sa
      LEFT JOIN members m ON sa.member_id = m.id
      WHERE sa.member_id = $1
    `, [req.params.memberId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.*, m.member_name, m.member_number 
      FROM savings_accounts sa
      LEFT JOIN members m ON sa.member_id = m.id
      WHERE sa.id = $1
    `, [req.params.id]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Savings account not found' });
    }
    res.json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/savings-accounts/:id', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    await pool.query(`
      UPDATE savings_accounts SET
      account_number = $1, account_type = $2, current_balance = $3, deposit_amount = $4,
      saving_start_date_bs = $5, interest_rate = $6, status = $7
      WHERE id = $8
    `, [
      data.account_number, data.account_type, data.current_balance, data.deposit_amount,
      data.saving_start_date_bs, data.interest_rate, data.status, req.params.id
    ]);
    
    logAudit(req.user.id, 'UPDATE', 'savings_accounts', req.params.id, `Updated savings account: ${data.account_number}`);
    
    res.json({ success: true });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Account number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/savings-accounts/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM savings_accounts WHERE id = $1', [req.params.id]);
    logAudit(req.user.id, 'DELETE', 'savings_accounts', req.params.id, 'Deleted savings account');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MONTHLY SAVINGS ROUTES ============

app.post('/api/monthly-savings', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert monthly savings record
      const result = await client.query(`
        INSERT INTO monthly_savings (
          savings_id, member_id, year, month, amount, deposit_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        data.savings_id, data.member_id, data.year, data.month,
        data.amount, data.deposit_date, data.notes
      ]);
      
      // Update savings account balance
      await client.query(
        'UPDATE savings_accounts SET current_balance = current_balance + $1, deposit_amount = deposit_amount + $1 WHERE id = $2',
        [data.amount, data.savings_id]
      );
      
      await client.query('COMMIT');
      
      const id = result.rows[0].id;
      logAudit(req.user.id, 'CREATE', 'monthly_savings', id, `Added monthly savings: ${data.amount}`);
      
      res.json({ success: true, id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monthly-savings', authenticateToken, async (req, res) => {
  try {
    const { savings_id, member_id, year, month } = req.query;
    let query = `
      SELECT ms.*, m.member_name, m.member_number, sa.account_number
      FROM monthly_savings ms
      LEFT JOIN members m ON ms.member_id = m.id
      LEFT JOIN savings_accounts sa ON ms.savings_id = sa.id
      WHERE 1=1
    `;
    const params = [];
    
    if (savings_id) {
      params.push(savings_id);
      query += ` AND ms.savings_id = $${params.length}`;
    }
    if (member_id) {
      params.push(member_id);
      query += ` AND ms.member_id = $${params.length}`;
    }
    if (year) {
      params.push(year);
      query += ` AND ms.year = $${params.length}`;
    }
    if (month) {
      params.push(month);
      query += ` AND ms.month = $${params.length}`;
    }
    
    query += ' ORDER BY ms.year DESC, ms.month DESC, ms.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get members with savings accounts for dropdown
app.get('/api/monthly-savings/members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT m.id, m.member_name, m.member_number, sa.id as savings_id, sa.account_number
      FROM members m
      INNER JOIN savings_accounts sa ON m.id = sa.member_id
      WHERE sa.status = 'active'
      ORDER BY m.member_name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SAVINGS WITHDRAWALS ROUTES ============

app.post('/api/savings-withdrawals', authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert withdrawal record
      const result = await client.query(`
        INSERT INTO savings_withdrawals (
          savings_id, member_id, withdrawal_amount, withdrawal_date, reason, withdrawed_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        data.savings_id, data.member_id, data.withdrawal_amount,
        data.withdrawal_date, data.reason, data.withdrawed_by
      ]);
      
      // Update savings account balance
      await client.query(
        'UPDATE savings_accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [data.withdrawal_amount, data.savings_id]
      );
      
      await client.query('COMMIT');
      
      const id = result.rows[0].id;
      logAudit(req.user.id, 'CREATE', 'savings_withdrawals', id, `Withdrew: ${data.withdrawal_amount}`);
      
      res.json({ success: true, id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings-withdrawals', authenticateToken, async (req, res) => {
  try {
    const { savings_id, member_id } = req.query;
    let query = `
      SELECT sw.*, m.member_name, m.member_number, sa.account_number
      FROM savings_withdrawals sw
      LEFT JOIN members m ON sw.member_id = m.id
      LEFT JOIN savings_accounts sa ON sw.savings_id = sa.id
      WHERE 1=1
    `;
    const params = [];
    
    if (savings_id) {
      params.push(savings_id);
      query += ` AND sw.savings_id = $${params.length}`;
    }
    if (member_id) {
      params.push(member_id);
      query += ` AND sw.member_id = $${params.length}`;
    }
    
    query += ' ORDER BY sw.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD STATS ============

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get counts
    const membersCount = await pool.query('SELECT COUNT(*) as count FROM members WHERE status = $1', ['Active']);
    const loanAccountsCount = await pool.query('SELECT COUNT(*) as count FROM loan_accounts WHERE status = $1', ['active']);
    const shareAccountsCount = await pool.query('SELECT COUNT(*) as count FROM share_accounts WHERE status = $1', ['active']);
    const savingsAccountsCount = await pool.query('SELECT COUNT(*) as count FROM savings_accounts WHERE status = $1', ['active']);
    
    // Get totals
    const totalLoans = await pool.query('SELECT COALESCE(SUM(principal_amount), 0) as total FROM loan_accounts');
    const totalSavings = await pool.query('SELECT COALESCE(SUM(current_balance), 0) as total FROM savings_accounts');
    const totalShares = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM share_accounts');
    const totalLoanBalance = await pool.query('SELECT COALESCE(SUM(remaining_balance), 0) as total FROM loan_accounts');
    
    res.json({
      success: true,
      data: {
        totalMembers: parseInt(membersCount.rows[0].count),
        activeLoans: parseInt(loanAccountsCount.rows[0].count),
        activeShares: parseInt(shareAccountsCount.rows[0].count),
        activeSavings: parseInt(savingsAccountsCount.rows[0].count),
        totalLoanAmount: parseFloat(totalLoans.rows[0].total),
        totalSavingsAmount: parseFloat(totalSavings.rows[0].total),
        totalShareAmount: parseFloat(totalShares.rows[0].total),
        totalLoanBalance: parseFloat(totalLoanBalance.rows[0].total)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MEMBER DETAILS WITH ACCOUNTS ============

app.get('/api/members/:id/details', authenticateToken, async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // Get member info
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [memberId]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const member = memberResult.rows[0];
    
    // Get citizenship details
    const citizenshipResult = await pool.query(
      'SELECT * FROM citizenship_details WHERE id = $1 OR member_id = $1',
      [memberId]
    );
    const citizenship = citizenshipResult.rows[0] || null;
    
    // Get savings accounts
    const savingsResult = await pool.query(
      'SELECT * FROM savings_accounts WHERE member_id = $1',
      [memberId]
    );
    
    // Get loan accounts
    const loansResult = await pool.query(
      'SELECT * FROM loan_accounts WHERE member_id = $1',
      [memberId]
    );
    
    // Get share accounts
    const sharesResult = await pool.query(
      'SELECT * FROM share_accounts WHERE member_id = $1',
      [memberId]
    );
    
    // Get monthly savings history
    const monthlySavingsResult = await pool.query(`
      SELECT ms.*, sa.account_number
      FROM monthly_savings ms
      LEFT JOIN savings_accounts sa ON ms.savings_id = sa.id
      WHERE ms.member_id = $1
      ORDER BY ms.year DESC, ms.month DESC
      LIMIT 50
    `, [memberId]);
    
    // Get savings withdrawals
    const withdrawalsResult = await pool.query(
      'SELECT * FROM savings_withdrawals WHERE member_id = $1 ORDER BY created_at DESC',
      [memberId]
    );
    
    // Get loan repayments
    const repaymentsResult = await pool.query(`
      SELECT lr.*, la.loan_number
      FROM loan_repayments lr
      LEFT JOIN loan_accounts la ON lr.loan_id = la.id
      WHERE lr.member_id = $1
      ORDER BY lr.created_at DESC
    `, [memberId]);
    
    res.json({
      success: true,
      data: {
        member,
        citizenship,
        savingsAccounts: savingsResult.rows,
        loanAccounts: loansResult.rows,
        shareAccounts: sharesResult.rows,
        monthlySavings: monthlySavingsResult.rows,
        withdrawals: withdrawalsResult.rows,
        loanRepayments: repaymentsResult.rows
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ AUDIT LOGS ROUTES ============

app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await pool.query(`
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1
    `, [limit]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ============ START SERVER ============

async function startServer() {
  try {
    // Test database connection first
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL database');
    client.release();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  Local: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.log('\nMake sure PostgreSQL is running and create a database:');
    console.log('  createdb cooperative');
    console.log('\nOr set environment variables:');
    console.log('  export DB_HOST=localhost');
    console.log('  export DB_PORT=5432');
    console.log('  export DB_NAME=cooperative');
    console.log('  export DB_USER=postgres');
    console.log('  export DB_PASSWORD=your_password');
    process.exit(1);
  }
}

startServer();
