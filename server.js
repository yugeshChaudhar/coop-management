const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cooperative-secret-key-2024';

// Middleware
app.use(cors());
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

// Initialize Database
const db = new Database('cooperative.db');

// Create tables FIRST
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    profile_photo TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS citizenship_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER,
    citizenship_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT,
    birth_date DATE,
    birth_date_bs TEXT,
    birth_place TEXT,
    nationality TEXT,
    religion TEXT,
    marital_status TEXT,
    spouse_name TEXT,
    photo TEXT,
    citizenship_front TEXT,
    citizenship_back TEXT,
    issued_district TEXT,
    issued_date DATE,
    issued_date_bs TEXT,
    province TEXT,
    district TEXT,
    municipality TEXT,
    ward_number TEXT,
    tole TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_number TEXT UNIQUE NOT NULL,
    member_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    membership_type TEXT DEFAULT 'Saving',
    joined_date DATE,
    status TEXT DEFAULT 'Active',
    citizenship_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loan_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    loan_number TEXT UNIQUE NOT NULL,
    loan_type TEXT NOT NULL,
    principal_amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    loan_term_months INTEGER NOT NULL,
    loan_started_date_bs TEXT,
    disbursement_date DATE,
    maturity_date DATE,
    purpose TEXT,
    status TEXT DEFAULT 'active',
    remaining_balance REAL,
    collateral_details TEXT,
    guarantor_name TEXT,
    guarantor_phone TEXT,
    guarantor_citizenship TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS share_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    share_number TEXT UNIQUE NOT NULL,
    number_of_shares INTEGER NOT NULL,
    share_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    purchase_date_bs TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS savings_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT DEFAULT 'regular',
    current_balance REAL DEFAULT 0,
    deposit_amount REAL DEFAULT 0,
    saving_start_date_bs TEXT,
    interest_rate REAL DEFAULT 6,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monthly_savings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    savings_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount REAL NOT NULL,
    deposit_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS savings_withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    savings_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    withdrawal_amount REAL NOT NULL,
    withdrawal_date DATE,
    reason TEXT,
    withdrawed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add status column to tables if not exists (migration for existing databases)
try {
  db.exec("ALTER TABLE savings_accounts ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE loan_accounts ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE share_accounts ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE monthly_savings ADD COLUMN savings_id INTEGER");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE monthly_savings ADD COLUMN member_id INTEGER");
} catch (e) {
  // Column already exists
}

// Create savings_withdrawals table if not exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      savings_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      withdrawal_amount REAL NOT NULL,
      withdrawal_date DATE,
      reason TEXT,
      withdrawed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (e) {
  // Table may already exist
}

// Create loan_repayments table if not exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS loan_repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      payment_amount REAL NOT NULL,
      principal_paid REAL NOT NULL DEFAULT 0,
      interest_paid REAL NOT NULL DEFAULT 0,
      payment_date DATE,
      payment_date_bs TEXT,
      payment_method TEXT DEFAULT 'cash',
      receipt_number TEXT,
      notes TEXT,
      recorded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (e) {
  // Table may already exist
}

// Create default admin user AFTER tables are created
const checkStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const existingUser = checkStmt.get('admin');

if (!existingUser) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const insertStmt = db.prepare('INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)');
  insertStmt.run('admin', 'admin@cooperative.com', hashedPassword, 'Administrator', 'admin');
  console.log('✓ Default admin user created: admin / admin123');
} else {
  console.log('✓ Admin user already exists');
}

// Audit logging helper
function logAudit(userId, action, tableName, recordId, details) {
  try {
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, action, tableName, recordId, details);
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
}

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
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
    
    const stmt = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword, role || 'admin');
    
    const token = jwt.sign({ id: result.lastInsertRowid, username, email, role: role || 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: result.lastInsertRowid, username, email, role: role || 'admin' }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
    const user = stmt.get(username, username);
    
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

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT id, username, email, full_name, profile_photo, role, created_at FROM users WHERE id = ?');
  const user = stmt.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user });
});

// ============ CITIZENSHIP ROUTES ============

app.post('/api/citizenship', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'citizenship_front', maxCount: 1 },
  { name: 'citizenship_back', maxCount: 1 }
]), (req, res) => {
  try {
    const data = req.body;
    
    const photo = req.files?.photo?.[0]?.filename;
    const citizenshipFront = req.files?.citizenship_front?.[0]?.filename;
    const citizenshipBack = req.files?.citizenship_back?.[0]?.filename;
    
    const stmt = db.prepare(`
      INSERT INTO citizenship_details (
        citizenship_number, full_name, gender, birth_date, birth_date_bs, birth_place,
        nationality, religion, marital_status, spouse_name, photo, citizenship_front, citizenship_back,
        issued_district, issued_date, issued_date_bs, province, district, municipality, ward_number, tole, phone, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.citizenship_number, data.full_name, data.gender, data.birth_date, data.birth_date_bs,
      data.birth_place, data.nationality, data.religion, data.marital_status, data.spouse_name,
      photo, citizenshipFront, citizenshipBack, data.issued_district, data.issued_date, data.issued_date_bs,
      data.province, data.district, data.municipality, data.ward_number, data.tole, data.phone, data.email
    );
    
    logAudit(req.user.id, 'CREATE', 'citizenship_details', result.lastInsertRowid, `Created citizenship: ${data.citizenship_number}`);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Citizenship number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/citizenship', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM citizenship_details ORDER BY created_at DESC');
    const results = stmt.all();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get citizenship by member ID (fallback endpoint)
app.get('/api/citizenship/member/:memberId', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM citizenship_details WHERE member_id = ?');
    const result = stmt.get(req.params.memberId);
    if (!result) {
      return res.status(404).json({ error: 'Citizenship not found for this member' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/citizenship/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM citizenship_details WHERE id = ?');
    const result = stmt.get(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Citizenship not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/citizenship/:id', authenticateToken, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'citizenship_front', maxCount: 1 },
  { name: 'citizenship_back', maxCount: 1 }
]), (req, res) => {
  try {
    const data = req.body;
    const photo = req.files?.photo?.[0]?.filename;
    const citizenshipFront = req.files?.citizenship_front?.[0]?.filename;
    const citizenshipBack = req.files?.citizenship_back?.[0]?.filename;
    
    let query = `
      UPDATE citizenship_details SET
      citizenship_number = ?, full_name = ?, gender = ?, birth_date = ?, birth_date_bs = ?, birth_place = ?,
      nationality = ?, religion = ?, marital_status = ?, spouse_name = ?,
      issued_district = ?, issued_date = ?, issued_date_bs = ?, province = ?, district = ?, municipality = ?,
      ward_number = ?, tole = ?, phone = ?, email = ?
    `;
    const params = [
      data.citizenship_number, data.full_name, data.gender, data.birth_date, data.birth_date_bs,
      data.birth_place, data.nationality, data.religion, data.marital_status, data.spouse_name,
      data.issued_district, data.issued_date, data.issued_date_bs, data.province, data.district, data.municipality,
      data.ward_number, data.tole, data.phone, data.email
    ];
    
    if (photo) {
      query += ', photo = ?';
      params.push(photo);
    }
    if (citizenshipFront) {
      query += ', citizenship_front = ?';
      params.push(citizenshipFront);
    }
    if (citizenshipBack) {
      query += ', citizenship_back = ?';
      params.push(citizenshipBack);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    const stmt = db.prepare(query);
    stmt.run(...params);
    
    logAudit(req.user.id, 'UPDATE', 'citizenship_details', req.params.id, 'Updated citizenship details');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citizenship/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM citizenship_details WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'citizenship_details', req.params.id, 'Deleted citizenship');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MEMBER ROUTES ============

app.post('/api/members', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    const memberNumber = `MBR-${Date.now().toString(36).toUpperCase()}`;
    
    const stmt = db.prepare('INSERT INTO members (member_number, member_name, address, phone, email, membership_type, joined_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(memberNumber, data.member_name, data.address, data.phone, data.email, data.membership_type || 'Saving', data.joined_date, data.status || 'Active');
    
    logAudit(req.user.id, 'CREATE', 'members', result.lastInsertRowid, `Created member: ${memberNumber}`);
    
    res.json({ success: true, id: result.lastInsertRowid, member_number: memberNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members', authenticateToken, (req, res) => {
  try {
    const { status, type } = req.query;
    let query = 'SELECT * FROM members';
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('membership_type = ?');
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM members WHERE id = ?');
    const result = stmt.get(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/members/:id', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare('UPDATE members SET member_name = ?, address = ?, phone = ?, email = ?, membership_type = ?, joined_date = ?, status = ? WHERE id = ?');
    stmt.run(data.member_name, data.address, data.phone, data.email, data.membership_type, data.joined_date, data.status, req.params.id);
    
    logAudit(req.user.id, 'UPDATE', 'members', req.params.id, 'Updated member details');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/members/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM members WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'members', req.params.id, 'Deleted member');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOAN ROUTES ============

app.post('/api/loans', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    const loanNumber = `LN-${Date.now().toString(36).toUpperCase()}`;
    
    const stmt = db.prepare('INSERT INTO loan_accounts (member_id, loan_number, loan_type, principal_amount, interest_rate, loan_term_months, loan_started_date_bs, disbursement_date, maturity_date, purpose, status, remaining_balance, collateral_details, guarantor_name, guarantor_phone, guarantor_citizenship) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(data.member_id, loanNumber, data.loan_type, data.principal_amount, data.interest_rate, data.loan_term_months, data.loan_started_date_bs, data.disbursement_date, data.maturity_date, data.purpose, data.status || 'active', data.principal_amount, data.collateral_details, data.guarantor_name, data.guarantor_phone, data.guarantor_citizenship);
    
    logAudit(req.user.id, 'CREATE', 'loan_accounts', result.lastInsertRowid, `Created loan: ${loanNumber}`);
    
    res.json({ success: true, id: result.lastInsertRowid, loan_number: loanNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loans', authenticateToken, (req, res) => {
  try {
    const { status, member_id } = req.query;
    let query = 'SELECT * FROM loan_accounts';
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (member_id) {
      conditions.push('member_id = ?');
      params.push(member_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loans/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM loan_accounts WHERE id = ?');
    const result = stmt.get(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/loans/:id', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare('UPDATE loan_accounts SET loan_type = ?, principal_amount = ?, interest_rate = ?, loan_term_months = ?, loan_started_date_bs = ?, disbursement_date = ?, maturity_date = ?, purpose = ?, status = ?, remaining_balance = ?, collateral_details = ?, guarantor_name = ?, guarantor_phone = ?, guarantor_citizenship = ? WHERE id = ?');
    stmt.run(data.loan_type, data.principal_amount, data.interest_rate, data.loan_term_months, data.loan_started_date_bs, data.disbursement_date, data.maturity_date, data.purpose, data.status, data.remaining_balance, data.collateral_details, data.guarantor_name, data.guarantor_phone, data.guarantor_citizenship, req.params.id);
    
    logAudit(req.user.id, 'UPDATE', 'loan_accounts', req.params.id, 'Updated loan details');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/loans/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM loan_accounts WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'loan_accounts', req.params.id, 'Deleted loan');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LOAN REPAYMENT ROUTES ============

app.post('/api/loans/:id/repayment', authenticateToken, (req, res) => {
  try {
    const loanId = req.params.id;
    const { payment_amount, principal_paid, interest_paid, payment_date, payment_date_bs, payment_method, receipt_number, notes } = req.body;
    
    // Get current loan
    const getLoan = db.prepare('SELECT * FROM loan_accounts WHERE id = ?');
    const loan = getLoan.get(loanId);
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    if (parseFloat(principal_paid) > parseFloat(loan.remaining_balance)) {
      return res.status(400).json({ error: 'Principal payment exceeds remaining balance' });
    }
    
    // Insert repayment record
    const insertStmt = db.prepare('INSERT INTO loan_repayments (loan_id, member_id, payment_amount, principal_paid, interest_paid, payment_date, payment_date_bs, payment_method, receipt_number, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = insertStmt.run(loanId, loan.member_id, payment_amount, principal_paid, interest_paid, payment_date, payment_date_bs, payment_method || 'cash', receipt_number, notes, req.user.username);
    
    // Update remaining balance
    const newBalance = parseFloat(loan.remaining_balance) - parseFloat(principal_paid);
    const newStatus = newBalance <= 0 ? 'paid' : loan.status;
    
    const updateStmt = db.prepare('UPDATE loan_accounts SET remaining_balance = ?, status = ? WHERE id = ?');
    updateStmt.run(Math.max(0, newBalance), newStatus, loanId);
    
    logAudit(req.user.id, 'CREATE', 'loan_repayments', result.lastInsertRowid, `Repayment of ${payment_amount} for loan ${loan.loan_number}`);
    
    res.json({ 
      success: true, 
      id: result.lastInsertRowid,
      new_remaining_balance: Math.max(0, newBalance),
      loan_status: newStatus,
      message: `Payment of Rs. ${payment_amount} recorded. Remaining balance: Rs. ${Math.max(0, newBalance)}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/loans/:id/repayments', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM loan_repayments WHERE loan_id = ? ORDER BY created_at DESC');
    const results = stmt.all(req.params.id);
    
    // Calculate totals
    const totalPaid = results.reduce((sum, r) => sum + parseFloat(r.payment_amount), 0);
    const totalPrincipal = results.reduce((sum, r) => sum + parseFloat(r.principal_paid), 0);
    const totalInterest = results.reduce((sum, r) => sum + parseFloat(r.interest_paid), 0);
    
    res.json({ 
      success: true, 
      data: results,
      summary: {
        total_paid: totalPaid,
        total_principal: totalPrincipal,
        total_interest: totalInterest,
        payment_count: results.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SHARE ROUTES ============

app.post('/api/shares', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    const shareNumber = `SH-${Date.now().toString(36).toUpperCase()}`;
    const sharePrice = 100;
    const totalAmount = (data.number_of_shares || 1) * sharePrice;
    
    const stmt = db.prepare('INSERT INTO share_accounts (member_id, share_number, number_of_shares, share_price, total_amount, purchase_date_bs, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(data.member_id, shareNumber, data.number_of_shares || 1, sharePrice, totalAmount, data.purchase_date_bs, 'active');
    
    logAudit(req.user.id, 'CREATE', 'share_accounts', result.lastInsertRowid, `Created share: ${shareNumber}`);
    
    res.json({ success: true, id: result.lastInsertRowid, share_number: shareNumber, total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shares', authenticateToken, (req, res) => {
  try {
    const { status, member_id } = req.query;
    let query = 'SELECT * FROM share_accounts';
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (member_id) {
      conditions.push('member_id = ?');
      params.push(member_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shares/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM share_accounts WHERE id = ?');
    const result = stmt.get(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Share not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shares/:id', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    const sharePrice = 100;
    const totalAmount = (data.number_of_shares || 1) * sharePrice;
    
    const stmt = db.prepare('UPDATE share_accounts SET number_of_shares = ?, share_price = ?, total_amount = ?, purchase_date_bs = ?, status = ? WHERE id = ?');
    stmt.run(data.number_of_shares, sharePrice, totalAmount, data.purchase_date_bs, data.status, req.params.id);
    
    logAudit(req.user.id, 'UPDATE', 'share_accounts', req.params.id, 'Updated share details');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shares/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM share_accounts WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'share_accounts', req.params.id, 'Deleted share account');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SAVINGS ROUTES ============

app.post('/api/savings', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    const accountNumber = `SAV-${Date.now().toString(36).toUpperCase()}`;
    
    const stmt = db.prepare('INSERT INTO savings_accounts (member_id, account_number, account_type, current_balance, deposit_amount, saving_start_date_bs, interest_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(data.member_id, accountNumber, data.account_type || 'regular', data.deposit_amount || 0, data.deposit_amount || 0, data.saving_start_date_bs, data.interest_rate || 6, data.status || 'active');
    
    logAudit(req.user.id, 'CREATE', 'savings_accounts', result.lastInsertRowid, `Created savings: ${accountNumber}`);
    
    res.json({ success: true, id: result.lastInsertRowid, account_number: accountNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings', authenticateToken, (req, res) => {
  try {
    const { status, member_id } = req.query;
    let query = `SELECT s.*, m.member_name 
                 FROM savings_accounts s 
                 LEFT JOIN members m ON s.member_id = m.id`;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (member_id) {
      conditions.push('s.member_id = ?');
      params.push(member_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY s.created_at DESC';
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`SELECT s.*, m.member_name 
                            FROM savings_accounts s 
                            LEFT JOIN members m ON s.member_id = m.id 
                            WHERE s.id = ?`);
    const result = stmt.get(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Savings not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/savings/:id', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare('UPDATE savings_accounts SET account_type = ?, saving_start_date_bs = ?, interest_rate = ?, status = ? WHERE id = ?');
    stmt.run(data.account_type, data.saving_start_date_bs, data.interest_rate, data.status, req.params.id);
    
    logAudit(req.user.id, 'UPDATE', 'savings_accounts', req.params.id, 'Updated savings details');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/savings/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM savings_accounts WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'savings_accounts', req.params.id, 'Deleted savings account');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get savings accounts by member
app.get('/api/savings/member/:memberId', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM savings_accounts WHERE member_id = ? ORDER BY created_at DESC');
    const results = stmt.all(req.params.memberId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loan accounts by member
app.get('/api/loans/member/:memberId', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM loan_accounts WHERE member_id = ? ORDER BY created_at DESC');
    const results = stmt.all(req.params.memberId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get share accounts by member
app.get('/api/shares/member/:memberId', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM share_accounts WHERE member_id = ? ORDER BY created_at DESC');
    const results = stmt.all(req.params.memberId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MONTHLY SAVINGS ROUTES ============

app.post('/api/monthly-savings', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    
    // Insert with savings_id and member_id
    const stmt = db.prepare('INSERT INTO monthly_savings (savings_id, member_id, year, month, amount, deposit_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(data.savings_id, data.member_id, data.year, data.month, data.amount, data.deposit_date, data.notes);
    
    logAudit(req.user.id, 'CREATE', 'monthly_savings', result.lastInsertRowid, `Added monthly savings for savings: ${data.savings_id}`);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/monthly-savings', authenticateToken, (req, res) => {
  try {
    const { savings_id, member_id, year } = req.query;
    let query = 'SELECT * FROM monthly_savings';
    const params = [];
    const conditions = [];
    
    if (savings_id) {
      conditions.push('savings_id = ?');
      params.push(savings_id);
    }
    if (member_id) {
      conditions.push('member_id = ?');
      params.push(member_id);
    }
    if (year) {
      conditions.push('year = ?');
      params.push(year);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY year DESC, month ASC';
    
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/monthly-savings/:id', authenticateToken, (req, res) => {
  try {
    const data = req.body;
    
    const stmt = db.prepare('UPDATE monthly_savings SET amount = ?, deposit_date = ?, notes = ? WHERE id = ?');
    stmt.run(data.amount, data.deposit_date, data.notes, req.params.id);
    
    logAudit(req.user.id, 'UPDATE', 'monthly_savings', req.params.id, 'Updated monthly savings');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/monthly-savings/:id', authenticateToken, (req, res) => {
  try {
    // Get the monthly savings entry first to know which savings account to update
    const getStmt = db.prepare('SELECT * FROM monthly_savings WHERE id = ?');
    const entry = getStmt.get(req.params.id);
    
    const stmt = db.prepare('DELETE FROM monthly_savings WHERE id = ?');
    stmt.run(req.params.id);
    
    logAudit(req.user.id, 'DELETE', 'monthly_savings', req.params.id, 'Deleted monthly savings');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update savings account balance from monthly savings
app.put('/api/savings/:id/update-balance', authenticateToken, (req, res) => {
  try {
    const savingsId = req.params.id;
    
    // Calculate total monthly savings for this account
    const calcStmt = db.prepare('SELECT SUM(amount) as total FROM monthly_savings WHERE savings_id = ?');
    const result = calcStmt.get(savingsId);
    const totalMonthly = result.total || 0;
    
    // Calculate total withdrawals for this account
    const withdrawCalcStmt = db.prepare('SELECT SUM(withdrawal_amount) as total FROM savings_withdrawals WHERE savings_id = ?');
    const withdrawResult = withdrawCalcStmt.get(savingsId);
    const totalWithdrawals = withdrawResult.total || 0;
    
    // Get initial deposit from savings account
    const getStmt = db.prepare('SELECT deposit_amount FROM savings_accounts WHERE id = ?');
    const savings = getStmt.get(savingsId);
    const initialDeposit = savings?.deposit_amount || 0;
    
    // Calculate new balance = initial deposit + all monthly contributions - all withdrawals
    const newBalance = initialDeposit + totalMonthly - totalWithdrawals;
    
    // Update the savings account
    const updateStmt = db.prepare('UPDATE savings_accounts SET current_balance = ? WHERE id = ?');
    updateStmt.run(newBalance, savingsId);
    
    logAudit(req.user.id, 'UPDATE', 'savings_accounts', savingsId, `Updated balance to ${newBalance}`);
    
    res.json({ success: true, new_balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SAVINGS WITHDRAWAL ROUTES ============

app.post('/api/savings/withdraw', authenticateToken, (req, res) => {
  try {
    const { savings_id, member_id, withdrawal_amount, withdrawal_date, reason } = req.body;
    
    // Get current savings balance
    const getSavings = db.prepare('SELECT current_balance, account_number FROM savings_accounts WHERE id = ?');
    const savings = getSavings.get(savings_id);
    
    if (!savings) {
      return res.status(404).json({ error: 'Savings account not found' });
    }
    
    if (savings.current_balance < withdrawal_amount) {
      return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
    }
    
    // Calculate new balance after withdrawal
    const newBalance = savings.current_balance - withdrawal_amount;
    
    // Insert withdrawal record
    const withdrawStmt = db.prepare('INSERT INTO savings_withdrawals (savings_id, member_id, withdrawal_amount, withdrawal_date, reason, withdrawed_by) VALUES (?, ?, ?, ?, ?, ?)');
    const result = withdrawStmt.run(savings_id, member_id, withdrawal_amount, withdrawal_date, reason, req.user.username);
    
    // Update savings account balance
    const updateStmt = db.prepare('UPDATE savings_accounts SET current_balance = ? WHERE id = ?');
    updateStmt.run(newBalance, savings_id);
    
    logAudit(req.user.id, 'CREATE', 'savings_withdrawals', result.lastInsertRowid, `Withdrawal of ${withdrawal_amount} from ${savings.account_number}`);
    
    res.json({ 
      success: true, 
      id: result.lastInsertRowid, 
      new_balance: newBalance,
      message: `Withdrawal of Rs. ${withdrawal_amount} successful. New balance: Rs. ${newBalance}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/savings/:id/withdrawals', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM savings_withdrawals WHERE savings_id = ? ORDER BY created_at DESC');
    const results = stmt.all(req.params.id);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROFILE ROUTES ============

app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, username, email, full_name, profile_photo, role, created_at FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const data = req.body;
    
    // Update basic info including username
    const stmt = db.prepare('UPDATE users SET full_name = ?, email = ?, username = ? WHERE id = ?');
    stmt.run(data.full_name, data.email, data.username || req.user.username, req.user.id);
    
    // Update photo if uploaded
    if (req.file) {
      const photoStmt = db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?');
      photoStmt.run(req.file.filename, req.user.id);
    }
    
    // Update password if provided
    if (data.newPassword) {
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      const pwStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
      pwStmt.run(hashedPassword, req.user.id);
    }
    
    // Fetch updated user
    const getStmt = db.prepare('SELECT id, username, email, full_name, profile_photo, role FROM users WHERE id = ?');
    const updatedUser = getStmt.get(req.user.id);
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile/photo', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const stmt = db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?');
    stmt.run(req.file.filename, req.user.id);
    res.json({ success: true, photo: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/profile/photo', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('UPDATE users SET profile_photo = NULL WHERE id = ?');
    stmt.run(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATS ROUTE ============

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const memberCount = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'Active'").get().count;
    const loanCount = db.prepare("SELECT COUNT(*) as count FROM loan_accounts WHERE status = 'active'").get().count;
    const savingsCount = db.prepare("SELECT COUNT(*) as count FROM savings_accounts WHERE status = 'active'").get().count;
    const shareCount = db.prepare("SELECT COUNT(*) as count FROM share_accounts WHERE status = 'active'").get().count;
    
    const totalSavings = db.prepare("SELECT SUM(current_balance) as total FROM savings_accounts WHERE status = 'active'").get().total || 0;
    const totalLoans = db.prepare("SELECT SUM(principal_amount) as total FROM loan_accounts WHERE status = 'active'").get().total || 0;
    
    res.json({
      success: true,
      stats: {
        members: memberCount,
        activeLoans: loanCount,
        activeSavings: savingsCount,
        activeShares: shareCount,
        totalSavings,
        totalLoans
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FILE SERVE ============

app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`\n🏦 Sanduk Cooperative Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   API Base: http://localhost:${PORT}/api`);
  console.log(`   ${new Date().toLocaleString()}\n`);
});
