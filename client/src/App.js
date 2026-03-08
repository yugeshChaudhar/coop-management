import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// API Base URL - dynamically set based on environment
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:3001/uploads/${path}`;
};

// Login Page
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Cooperative Management</h2>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <div className="password-input-wrapper">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Cooperative</h2>
        <p>Management System</p>
      </div>
      <nav className="sidebar-nav">
        <Link to="/dashboard" className="nav-item">
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>
        <Link to="/members" className="nav-item">
          <span className="nav-icon">👥</span>
          Members
        </Link>
        <Link to="/loans" className="nav-item">
          <span className="nav-icon">💰</span>
          Loans
        </Link>
        <Link to="/shares" className="nav-item">
          <span className="nav-icon">📈</span>
          Shares
        </Link>
        <Link to="/savings" className="nav-item">
          <span className="nav-icon">🏦</span>
          Savings
        </Link>
        <Link to="/monthly-savings" className="nav-item">
          <span className="nav-icon">📅</span>
          Monthly Savings
        </Link>
        <Link to="/citizenship" className="nav-item">
          <span className="nav-icon">🪪</span>
          Citizenship
        </Link>
        <Link to="/profile" className="nav-item">
          <span className="nav-icon">👤</span>
          Profile
        </Link>
      </nav>
    </div>
  );
}

// Dashboard
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Welcome to Sanduk Saving and Credit Cooperative Ltd.</h1>
          <div className="header-actions">
            {user && <span className="user-name">{user.full_name || user.username}</span>}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Welcome, {user?.full_name || user?.username || 'Administrator'}!</h2>
            <p>Manage your cooperative members, loans, shares, and savings all in one place.</p>
          </div>
          <div className="about-section">
            <div className="about-card">
              <h3>About Sanduk</h3>
              <p>अन्तर्राष्ट्रिय सहकारीका मूल्य, मान्यता र सिद्धान्तहरुका आधारमा सदस्यहरुको छरिएर रहेको स्रोत र साधनलाई एकीकृत गरी सदस्यहरुको निर्वाचित प्रतिनिधिबाट संचालित एवं प्रजातान्त्रिक पद्धतिबाट नियमित सहकारी संस्थाको माध्यमद्वारा हामी प्रत्येक सदस्यहरुको आर्थिक, सामाजिक तथा सांस्कृतिक विकासको लागि एक सहकारी संस्थाको गठन गरी संचालन गर्न आवश्यक भएकाले, सहकारी ऐन, २०४८ को दफा १२ को उपदफा (१) ले दिएको अधिकार प्रयोग गरी सन्दुक बचत तथा ऋण सहकारी संस्था लि. को सञ्चालनका लागि मिति २०६९/०६/०२ मा बसेको प्रथम प्रारम्भिक भेलाको निर्णय बमोजिम यो विनियम तर्जुमा गरी मिति २०६९/०६/११ गते बसेको दोस्रो प्रारम्भिक भेलाले सर्वसम्मतबाट पारित गरेको छ ।</p>
            </div>
          </div>
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Members</h3>
                <p className="stat-number">{stats.members}</p>
              </div>
              <div className="stat-card">
                <h3>Active Loans</h3>
                <p className="stat-number">{stats.activeLoans}</p>
              </div>
              <div className="stat-card">
                <h3>Active Savings</h3>
                <p className="stat-number">{stats.activeSavings}</p>
              </div>
              <div className="stat-card">
                <h3>Active Shares</h3>
                <p className="stat-number">{stats.activeShares}</p>
              </div>
            </div>
          )}
          <div className="info-cards">
            <div className="info-card quick-links-card">
              <h3>Quick Links</h3>
              <div className="quick-links">
                <Link to="/members" className="quick-link-btn member">
                  <span className="link-icon">👤</span>
                  <span>Add New Member</span>
                </Link>
                <Link to="/loans" className="quick-link-btn loan">
                  <span className="link-icon">💰</span>
                  <span>Create Loan</span>
                </Link>
                <Link to="/savings" className="quick-link-btn savings">
                  <span className="link-icon">🏦</span>
                  <span>New Savings Account</span>
                </Link>
                <Link to="/shares" className="quick-link-btn share">
                  <span className="link-icon">📈</span>
                  <span>Purchase Shares</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Members Page
function MembersPage() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    member_number: '', member_name: '', address: '', phone: '',
    email: '', membership_type: 'Saving', joined_date_bs: '', status: 'Active'
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [savingsAccounts, setSavingsAccounts] = useState({});
  const [loanAccounts, setLoanAccounts] = useState({});
  const [shareAccounts, setShareAccounts] = useState({});

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const membersData = data.data || data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `${API_BASE}/members/${editingId}` : `${API_BASE}/members`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        alert(editingId ? 'Member updated successfully!' : 'Member added successfully!');
        setForm({ member_number: '', member_name: '', address: '', phone: '', email: '', membership_type: 'Saving', joined_date_bs: '', status: 'Active' });
        setEditingId(null);
        setShowModal(false);
        fetchMembers();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/members/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
  };

  const handleEdit = (member) => {
    setForm(member);
    setEditingId(member.id);
    setShowModal(true);
  };

  const handleView = async (member) => {
    setViewingMember(member);
    try {
      const token = localStorage.getItem('token');
      const [savingsRes, loanRes, shareRes] = await Promise.all([
        fetch(`${API_BASE}/savings/member/${member.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/loans/member/${member.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/shares/member/${member.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const [savingsData, loanData, shareData] = await Promise.all([savingsRes.json(), loanRes.json(), shareRes.json()]);
      setSavingsAccounts(prev => ({ ...prev, [member.id]: (savingsData.data || savingsData || []) }));
      setLoanAccounts(prev => ({ ...prev, [member.id]: (loanData.data || loanData || []) }));
      setShareAccounts(prev => ({ ...prev, [member.id]: (shareData.data || shareData || []) }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const generateMemberNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setForm(prev => ({ ...prev, member_number: `MEM/${year}/${random}` }));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Members Management</h1>
          <button className="btn-primary" onClick={() => { setForm({ member_number: '', member_name: '', address: '', phone: '', email: '', membership_type: 'Saving', joined_date_bs: '', status: 'Active' }); setEditingId(null); setShowModal(true); }}>+ Add Member</button>
        </header>
        <div className="page-content">
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>{editingId ? 'Edit Member' : 'Add New Member'}</h3>
                  <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Member Number</label>
                      <div className="input-with-btn">
                        <input type="text" value={form.member_number} onChange={e => setForm({...form, member_number: e.target.value})} required placeholder="MEM/2024/001" />
                        <button type="button" className="btn-generate" onClick={generateMemberNumber}>Generate</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Member Name</label>
                      <input type="text" value={form.member_name} onChange={e => setForm({...form, member_name: e.target.value})} required placeholder="Full Name" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone Number" />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email Address" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Address</label>
                      <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" />
                    </div>
                    <div className="form-group">
                      <label>Membership Type</label>
                      <select value={form.membership_type} onChange={e => setForm({...form, membership_type: e.target.value})}>
                        <option value="Saving">Saving</option>
                        <option value="Share">Share</option>
                        <option value="Loan">Loan</option>
                        <option value="Normal">Normal</option>
                        <option value="Chairperson">Chairperson</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Joined Date (BS)</label>
                      <input type="text" value={form.joined_date_bs} onChange={e => setForm({...form, joined_date_bs: e.target.value})} placeholder="2081-01-01" />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add Member'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {viewingMember && (
            <div className="modal-overlay" onClick={() => setViewingMember(null)}>
              <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Member Details</h3>
                  <button className="close-btn" onClick={() => setViewingMember(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-section">
                    <h4>Personal Information</h4>
                    <div className="detail-grid">
                      <div><strong>Member Number:</strong> {viewingMember.member_number}</div>
                      <div><strong>Name:</strong> {viewingMember.member_name}</div>
                      <div><strong>Phone:</strong> {viewingMember.phone}</div>
                      <div><strong>Email:</strong> {viewingMember.email}</div>
                      <div><strong>Address:</strong> {viewingMember.address}</div>
                      <div><strong>Type:</strong> {viewingMember.membership_type}</div>
                      <div><strong>Joined:</strong> {viewingMember.joined_date_bs}</div>
                      <div><strong>Status:</strong> {viewingMember.status}</div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Savings Accounts</h4>
                    {savingsAccounts[viewingMember.id]?.length > 0 ? (
                      <div className="account-list">
                        {savingsAccounts[viewingMember.id].map(s => (
                          <div key={s.id} className="account-item">
                            <span>Account: {s.account_number}</span>
                            <span>Balance: Rs. {s.current_balance?.toLocaleString()}</span>
                            <span>Type: {s.account_type}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="no-data">No savings accounts</p>}
                  </div>
                  <div className="detail-section">
                    <h4>Loan Accounts</h4>
                    {loanAccounts[viewingMember.id]?.length > 0 ? (
                      <div className="account-list">
                        {loanAccounts[viewingMember.id].map(l => (
                          <div key={l.id} className="account-item loan-item">
                            <span>Loan: {l.loan_number}</span>
                            <span>Amount: Rs. {l.principal_amount?.toLocaleString()}</span>
                            <span>Balance: Rs. {l.remaining_balance?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="no-data">No loan accounts</p>}
                  </div>
                  <div className="detail-section">
                    <h4>Share Accounts</h4>
                    {shareAccounts[viewingMember.id]?.length > 0 ? (
                      <div className="account-list">
                        {shareAccounts[viewingMember.id].map(s => (
                          <div key={s.id} className="account-item share-item">
                            <span>Shares: {s.share_number}</span>
                            <span>Shares: {s.number_of_shares}</span>
                            <span>Amount: Rs. {s.total_amount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="no-data">No share accounts</p>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewingMember(null)}>Close</button>
                  <button className="btn-primary" onClick={() => { handleEdit(viewingMember); setViewingMember(null); }}>Edit</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member No.</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td>{member.member_number}</td>
                    <td>{member.member_name}</td>
                    <td>{member.phone}</td>
                    <td>{member.email}</td>
                    <td><span className={`badge ${member.membership_type?.toLowerCase()}`}>{member.membership_type}</span></td>
                    <td><span className={`status-badge ${member.status?.toLowerCase()}`}>{member.status}</span></td>
                    <td>
                      <button className="btn-sm" onClick={() => handleView(member)}>View</button>
                      <button className="btn-sm" onClick={() => handleEdit(member)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(member.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loans Page
function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    loan_number: '', member_id: '', loan_type: 'Personal', principal_amount: '',
    interest_rate: '12', loan_term_months: '12', loan_started_date_bs: '',
    disbursement_date: '', maturity_date: '', purpose: '', collateral_details: '',
    guarantor_name: '', guarantor_phone: '', guarantor_citizenship: '', status: 'active'
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingLoan, setViewingLoan] = useState(null);
  const [repaymentModal, setRepaymentModal] = useState(false);
  const [repaymentForm, setRepaymentForm] = useState({
    loan_id: '', payment_amount: '', principal_paid: '', interest_paid: '',
    payment_date: '', payment_date_bs: '', payment_method: 'cash', receipt_number: '', notes: ''
  });
  const [repayments, setRepayments] = useState([]);
  const [repaymentSummary, setRepaymentSummary] = useState(null);

  useEffect(() => { fetchLoans(); fetchMembers(); }, []);

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/loans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const loansData = data.data || data || [];
      setLoans(Array.isArray(loansData) ? loansData : []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const membersData = data.data || data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchRepayments = async (loanId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/loans/${loanId}/repayments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRepayments(data.data || []);
      setRepaymentSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching repayments:', error);
      setRepayments([]);
      setRepaymentSummary(null);
    }
  };

  const generateLoanNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setForm(prev => ({ ...prev, loan_number: `LN/${year}/${random}` }));
  };

  const calculateMaturity = () => {
    if (form.disbursement_date && form.loan_term_months) {
      const start = new Date(form.disbursement_date);
      start.setMonth(start.getMonth() + parseInt(form.loan_term_months));
      setForm(prev => ({ ...prev, maturity_date: start.toISOString().split('T')[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `${API_BASE}/loans/${editingId}` : `${API_BASE}/loans`;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? form : { ...form, remaining_balance: parseFloat(form.principal_amount) };
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        alert(editingId ? 'Loan updated successfully!' : 'Loan created successfully!');
        setForm({
          loan_number: '', member_id: '', loan_type: 'Personal', principal_amount: '',
          interest_rate: '12', loan_term_months: '12', loan_started_date_bs: '',
          disbursement_date: '', maturity_date: '', purpose: '', collateral_details: '',
          guarantor_name: '', guarantor_phone: '', guarantor_citizenship: '', status: 'active'
        });
        setEditingId(null);
        setShowModal(false);
        fetchLoans();
      } else {
        alert('Error saving loan');
      }
    } catch (error) {
      console.error('Error saving loan:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleRepayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/loans/${repaymentForm.loan_id}/repayment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repaymentForm)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setRepaymentForm({
          loan_id: '', payment_amount: '', principal_paid: '', interest_paid: '',
          payment_date: '', payment_date_bs: '', payment_method: 'cash', receipt_number: '', notes: ''
        });
        setRepaymentModal(false);
        fetchLoans();
      } else {
        alert(data.error || 'Error processing repayment');
      }
    } catch (error) {
      console.error('Error processing repayment:', error);
      alert('Error: ' + error.message);
    }
  };

  const openRepaymentModal = (loan) => {
    setRepaymentForm({
      loan_id: loan.id,
      payment_amount: '',
      principal_paid: '',
      interest_paid: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_date_bs: '',
      payment_method: 'cash',
      receipt_number: '',
      notes: ''
    });
    setRepaymentModal(true);
  };

  // Auto-calculate total payment when principal or interest changes
  const updatePaymentAmount = (field, value) => {
    const updated = { ...repaymentForm, [field]: value };
    const principal = parseFloat(updated.principal_paid) || 0;
    const interest = parseFloat(updated.interest_paid) || 0;
    updated.payment_amount = (principal + interest).toString();
    setRepaymentForm(updated);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/loans/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchLoans();
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  const handleEdit = (loan) => {
    setForm(loan);
    setEditingId(loan.id);
    setShowModal(true);
  };

  const handleView = (loan) => {
    setViewingLoan(loan);
    fetchRepayments(loan.id);
  };

  const getMemberName = (id) => members.find(m => m.id == id)?.member_name || 'Unknown';

  const getPaidPercentage = (loan) => {
    const principal = parseFloat(loan.principal_amount) || 1;
    const remaining = parseFloat(loan.remaining_balance) || 0;
    return Math.round(((principal - remaining) / principal) * 100);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Loans Management</h1>
          <button className="btn-primary" onClick={() => { setForm({ loan_number: '', member_id: '', loan_type: 'Personal', principal_amount: '', interest_rate: '12', loan_term_months: '12', loan_started_date_bs: '', disbursement_date: '', maturity_date: '', purpose: '', collateral_details: '', guarantor_name: '', guarantor_phone: '', guarantor_citizenship: '', status: 'active' }); setEditingId(null); setShowModal(true); }}>+ Create Loan</button>
        </header>
        <div className="page-content">
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>{editingId ? 'Edit Loan' : 'Create New Loan'}</h3>
                  <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Loan Number</label>
                      <div className="input-with-btn">
                        <input type="text" value={form.loan_number} onChange={e => setForm({...form, loan_number: e.target.value})} required placeholder="LN/2024/0001" />
                        <button type="button" className="btn-generate" onClick={generateLoanNumber}>Generate</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Member</label>
                      <select value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} required>
                        <option value="">Select Member</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.member_number} - {m.member_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Loan Type</label>
                      <select value={form.loan_type} onChange={e => setForm({...form, loan_type: e.target.value})}>
                        <option value="Personal">Personal</option>
                        <option value="Business">Business</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Housing">Housing</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Principal Amount (Rs.)</label>
                      <input type="number" value={form.principal_amount} onChange={e => setForm({...form, principal_amount: e.target.value})} required placeholder="100000" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Interest Rate (%)</label>
                      <input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm({...form, interest_rate: e.target.value})} required placeholder="12" />
                    </div>
                    <div className="form-group">
                      <label>Loan Term (Months)</label>
                      <input type="number" value={form.loan_term_months} onChange={e => setForm({...form, loan_term_months: e.target.value})} required placeholder="12" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date (BS)</label>
                      <input type="text" value={form.loan_started_date_bs} onChange={e => setForm({...form, loan_started_date_bs: e.target.value})} placeholder="2080/01/01" />
                    </div>
                    <div className="form-group">
                      <label>Disbursement Date</label>
                      <input type="date" value={form.disbursement_date} onChange={e => { setForm({...form, disbursement_date: e.target.value}); calculateMaturity(); }} />
                    </div>
                    <div className="form-group">
                      <label>Maturity Date</label>
                      <input type="date" value={form.maturity_date} onChange={e => setForm({...form, maturity_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Purpose of loan"></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Collateral Details</label>
                      <input type="text" value={form.collateral_details} onChange={e => setForm({...form, collateral_details: e.target.value})} placeholder="Collateral information" />
                    </div>
                    <div className="form-group">
                      <label>Guarantor Name</label>
                      <input type="text" value={form.guarantor_name} onChange={e => setForm({...form, guarantor_name: e.target.value})} placeholder="Guarantor name" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Guarantor Phone</label>
                      <input type="tel" value={form.guarantor_phone} onChange={e => setForm({...form, guarantor_phone: e.target.value})} placeholder="Guarantor phone" />
                    </div>
                    <div className="form-group">
                      <label>Guarantor Citizenship No.</label>
                      <input type="text" value={form.guarantor_citizenship} onChange={e => setForm({...form, guarantor_citizenship: e.target.value})} placeholder="Guarantor citizenship number" />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editingId ? 'Update Loan' : 'Create Loan'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {repaymentModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Record Loan Repayment</h3>
                  <button className="close-btn" onClick={() => setRepaymentModal(false)}>×</button>
                </div>
                <form onSubmit={handleRepayment}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Loan Number</label>
                      <input type="text" value={loans.find(l => l.id == repaymentForm.loan_id)?.loan_number || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>Member</label>
                      <input type="text" value={getMemberName(loans.find(l => l.id == repaymentForm.loan_id)?.member_id)} disabled />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Remaining Balance (Rs.)</label>
                      <input type="text" value={`Rs. ${parseFloat(loans.find(l => l.id == repaymentForm.loan_id)?.remaining_balance || 0).toLocaleString()}`} disabled />
                    </div>
                    <div className="form-group">
                      <label>Total Payment (Rs.)</label>
                      <input type="number" value={repaymentForm.payment_amount} disabled placeholder="Auto-calculated" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Principal Payment (Rs.)</label>
                      <input type="number" value={repaymentForm.principal_paid} onChange={e => updatePaymentAmount('principal_paid', e.target.value)} required min="0" placeholder="Principal amount" />
                    </div>
                    <div className="form-group">
                      <label>Interest Payment (Rs.)</label>
                      <input type="number" value={repaymentForm.interest_paid} onChange={e => updatePaymentAmount('interest_paid', e.target.value)} required min="0" placeholder="Interest amount" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Payment Date</label>
                      <input type="date" value={repaymentForm.payment_date} onChange={e => setRepaymentForm({...repaymentForm, payment_date: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Payment Date (BS)</label>
                      <input type="text" value={repaymentForm.payment_date_bs} onChange={e => setRepaymentForm({...repaymentForm, payment_date_bs: e.target.value})} placeholder="2081/01/01" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select value={repaymentForm.payment_method} onChange={e => setRepaymentForm({...repaymentForm, payment_method: e.target.value})}>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Receipt Number</label>
                      <input type="text" value={repaymentForm.receipt_number} onChange={e => setRepaymentForm({...repaymentForm, receipt_number: e.target.value})} placeholder="Receipt #" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input type="text" value={repaymentForm.notes} onChange={e => setRepaymentForm({...repaymentForm, notes: e.target.value})} placeholder="Additional notes" />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Record Payment</button>
                    <button type="button" className="btn-secondary" onClick={() => setRepaymentModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {viewingLoan && (
            <div className="modal-overlay" onClick={() => setViewingLoan(null)}>
              <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Loan Details</h3>
                  <button className="close-btn" onClick={() => setViewingLoan(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-section">
                    <h4>Loan Information</h4>
                    <div className="detail-grid">
                      <div><strong>Loan Number:</strong> {viewingLoan.loan_number}</div>
                      <div><strong>Member:</strong> {getMemberName(viewingLoan.member_id)}</div>
                      <div><strong>Type:</strong> {viewingLoan.loan_type}</div>
                      <div><strong>Principal:</strong> Rs. {parseFloat(viewingLoan.principal_amount || 0).toLocaleString()}</div>
                      <div><strong>Interest Rate:</strong> {viewingLoan.interest_rate}%</div>
                      <div><strong>Term:</strong> {viewingLoan.loan_term_months} months</div>
                      <div><strong>Start Date (BS):</strong> {viewingLoan.loan_started_date_bs}</div>
                      <div><strong>Disbursement:</strong> {viewingLoan.disbursement_date}</div>
                      <div><strong>Maturity:</strong> {viewingLoan.maturity_date}</div>
                      <div><strong>Status:</strong> <span className={`status-badge ${viewingLoan.status}`}>{viewingLoan.status}</span></div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Repayment Progress</h4>
                    <div className="loan-progress-container">
                      <div className="loan-progress-bar">
                        <div className="loan-progress-fill" style={{ width: `${getPaidPercentage(viewingLoan)}%` }}></div>
                      </div>
                      <div className="loan-progress-info">
                        <span>Paid: Rs. {parseFloat((viewingLoan.principal_amount || 0) - (viewingLoan.remaining_balance || 0)).toLocaleString()} ({getPaidPercentage(viewingLoan)}%)</span>
                        <span>Remaining: Rs. {parseFloat(viewingLoan.remaining_balance || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    {repaymentSummary && (
                      <div className="detail-grid" style={{ marginTop: '12px' }}>
                        <div><strong>Total Payments:</strong> {repaymentSummary.payment_count}</div>
                        <div><strong>Total Paid:</strong> Rs. {parseFloat(repaymentSummary.total_paid || 0).toLocaleString()}</div>
                        <div><strong>Principal Paid:</strong> Rs. {parseFloat(repaymentSummary.total_principal || 0).toLocaleString()}</div>
                        <div><strong>Interest Paid:</strong> Rs. {parseFloat(repaymentSummary.total_interest || 0).toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  {repayments.length > 0 && (
                    <div className="detail-section">
                      <h4>Payment History</h4>
                      <div className="table-container" style={{ maxHeight: '250px', overflow: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Principal (Rs.)</th>
                              <th>Interest (Rs.)</th>
                              <th>Total (Rs.)</th>
                              <th>Method</th>
                              <th>Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {repayments.map(r => (
                              <tr key={r.id}>
                                <td>{r.payment_date_bs || r.payment_date}</td>
                                <td>Rs. {parseFloat(r.principal_paid).toLocaleString()}</td>
                                <td>Rs. {parseFloat(r.interest_paid).toLocaleString()}</td>
                                <td>Rs. {parseFloat(r.payment_amount).toLocaleString()}</td>
                                <td>{r.payment_method}</td>
                                <td>{r.receipt_number || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewingLoan.purpose && <div className="detail-section"><h4>Purpose</h4><p>{viewingLoan.purpose}</p></div>}
                  {viewingLoan.collateral_details && <div className="detail-section"><h4>Collateral</h4><p>{viewingLoan.collateral_details}</p></div>}
                  {(viewingLoan.guarantor_name || viewingLoan.guarantor_phone || viewingLoan.guarantor_citizenship) && (
                    <div className="detail-section">
                      <h4>Guarantor Information</h4>
                      <div className="detail-grid">
                        <div><strong>Name:</strong> {viewingLoan.guarantor_name}</div>
                        <div><strong>Phone:</strong> {viewingLoan.guarantor_phone}</div>
                        <div><strong>Citizenship:</strong> {viewingLoan.guarantor_citizenship}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewingLoan(null)}>Close</button>
                  <button className="btn-warning" onClick={() => { openRepaymentModal(viewingLoan); setViewingLoan(null); }} disabled={viewingLoan.status === 'paid'}>Record Payment</button>
                  <button className="btn-primary" onClick={() => { handleEdit(viewingLoan); setViewingLoan(null); }}>Edit Loan</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Loan No.</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Rate</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id}>
                    <td>{l.loan_number}</td>
                    <td>{getMemberName(l.member_id)}</td>
                    <td>{l.loan_type}</td>
                    <td>Rs. {parseFloat(l.principal_amount || 0).toLocaleString()}</td>
                    <td>{l.interest_rate}%</td>
                    <td>
                      <div className="mini-progress">
                        <div className="mini-progress-bar">
                          <div className="mini-progress-fill" style={{ width: `${getPaidPercentage(l)}%` }}></div>
                        </div>
                        <span className="mini-progress-text">{getPaidPercentage(l)}%</span>
                      </div>
                    </td>
                    <td>Rs. {parseFloat(l.remaining_balance || 0).toLocaleString()}</td>
                    <td><span className={`status-badge ${l.status}`}>{l.status}</span></td>
                    <td>
                      <button className="btn-sm" onClick={() => handleView(l)}>View</button>
                      <button className="btn-sm btn-warning" onClick={() => openRepaymentModal(l)} disabled={l.status === 'paid'}>Pay</button>
                      <button className="btn-sm" onClick={() => handleEdit(l)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(l.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shares Page
function SharesPage() {
  const [shares, setShares] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    share_number: '', member_id: '', number_of_shares: '', share_price: '100',
    total_amount: '', purchase_date_bs: '', status: 'active'
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingShare, setViewingShare] = useState(null);

  useEffect(() => { fetchShares(); fetchMembers(); }, []);

  const fetchShares = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/shares`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const sharesData = data.data || data || [];
      setShares(Array.isArray(sharesData) ? sharesData : []);
    } catch (error) {
      console.error('Error fetching shares:', error);
      setShares([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const membersData = data.data || data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const generateShareNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setForm(prev => ({ ...prev, share_number: `SH/${year}/${random}` }));
  };

  const calculateTotal = () => {
    if (form.number_of_shares && form.share_price) {
      setForm(prev => ({ ...prev, total_amount: parseInt(form.number_of_shares) * parseFloat(form.share_price) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `${API_BASE}/shares/${editingId}` : `${API_BASE}/shares`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert(editingId ? 'Share updated successfully!' : 'Share created successfully!');
        setForm({
          share_number: '', member_id: '', number_of_shares: '', share_price: '100',
          total_amount: '', purchase_date_bs: '', status: 'active'
        });
        setEditingId(null);
        setShowModal(false);
        fetchShares();
      } else {
        alert('Error saving share');
      }
    } catch (error) {
      console.error('Error saving share:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this share?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/shares/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchShares();
      } catch (error) {
        console.error('Error deleting share:', error);
      }
    }
  };

  const handleEdit = (share) => {
    setForm(share);
    setEditingId(share.id);
    setShowModal(true);
  };

  const handleView = (share) => {
    setViewingShare(share);
  };

  const getMemberName = (id) => members.find(m => m.id == id)?.member_name || 'Unknown';

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Shares Management</h1>
          <button className="btn-primary" onClick={() => { setForm({ share_number: '', member_id: '', number_of_shares: '', share_price: '100', total_amount: '', purchase_date_bs: '', status: 'active' }); setEditingId(null); setShowModal(true); }}>+ Purchase Shares</button>
        </header>
        <div className="page-content">
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>{editingId ? 'Edit Share' : 'Purchase New Shares'}</h3>
                  <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Share Number</label>
                      <div className="input-with-btn">
                        <input type="text" value={form.share_number} onChange={e => setForm({...form, share_number: e.target.value})} required placeholder="SH/2024/001" />
                        <button type="button" className="btn-generate" onClick={generateShareNumber}>Generate</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Member</label>
                      <select value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} required>
                        <option value="">Select Member</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.member_number} - {m.member_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Shares</label>
                      <input type="number" value={form.number_of_shares} onChange={e => { setForm({...form, number_of_shares: e.target.value}); calculateTotal(); }} required placeholder="10" />
                    </div>
                    <div className="form-group">
                      <label>Share Price (Rs.)</label>
                      <input type="number" value={form.share_price} onChange={e => { setForm({...form, share_price: e.target.value}); calculateTotal(); }} required placeholder="100" />
                    </div>
                    <div className="form-group">
                      <label>Total Amount (Rs.)</label>
                      <input type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} required placeholder="1000" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Purchase Date (BS)</label>
                      <input type="text" value={form.purchase_date_bs} onChange={e => setForm({...form, purchase_date_bs: e.target.value})} placeholder="2080/01/15" />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editingId ? 'Update Share' : 'Purchase Shares'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {viewingShare && (
            <div className="modal-overlay" onClick={() => setViewingShare(null)}>
              <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Share Details</h3>
                  <button className="close-btn" onClick={() => setViewingShare(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-section">
                    <h4>Share Information</h4>
                    <div className="detail-grid">
                      <div><strong>Share Number:</strong> {viewingShare.share_number}</div>
                      <div><strong>Member:</strong> {getMemberName(viewingShare.member_id)}</div>
                      <div><strong>Number of Shares:</strong> {viewingShare.number_of_shares}</div>
                      <div><strong>Share Price:</strong> Rs. {parseFloat(viewingShare.share_price || 0).toLocaleString()}</div>
                      <div><strong>Total Amount:</strong> Rs. {parseFloat(viewingShare.total_amount || 0).toLocaleString()}</div>
                      <div><strong>Purchase Date:</strong> {viewingShare.purchase_date_bs}</div>
                      <div><strong>Status:</strong> {viewingShare.status}</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewingShare(null)}>Close</button>
                  <button className="btn-primary" onClick={() => { handleEdit(viewingShare); setViewingShare(null); }}>Edit Share</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Share No.</th>
                  <th>Member</th>
                  <th>Shares</th>
                  <th>Price/Share</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shares.map(s => (
                  <tr key={s.id}>
                    <td>{s.share_number}</td>
                    <td>{getMemberName(s.member_id)}</td>
                    <td>{s.number_of_shares}</td>
                    <td>Rs. {parseFloat(s.share_price || 0).toLocaleString()}</td>
                    <td>Rs. {parseFloat(s.total_amount || 0).toLocaleString()}</td>
                    <td>{s.purchase_date_bs}</td>
                    <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                    <td>
                      <button className="btn-sm" onClick={() => handleView(s)}>View</button>
                      <button className="btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Savings Page
function SavingsPage() {
  const [savings, setSavings] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    account_number: '', member_id: '', account_type: 'regular',
    current_balance: '0', deposit_amount: '', saving_start_date_bs: '',
    interest_rate: '6', status: 'active'
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingSaving, setViewingSaving] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    savings_id: '', member_id: '', withdrawal_amount: '', withdrawal_date: '', reason: ''
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [viewingWithdrawals, setViewingWithdrawals] = useState(null);

  useEffect(() => { fetchSavings(); fetchMembers(); }, []);

  const fetchSavings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/savings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const savingsData = data.data || data || [];
      setSavings(Array.isArray(savingsData) ? savingsData : []);
    } catch (error) {
      console.error('Error fetching savings:', error);
      setSavings([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const membersData = data.data || data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchWithdrawals = async (savingsId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/savings/${savingsId}/withdrawals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWithdrawals(data.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    }
  };

  const generateAccountNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setForm(prev => ({ ...prev, account_number: `SAV/${year}/${random}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `${API_BASE}/savings/${editingId}` : `${API_BASE}/savings`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert(editingId ? 'Savings account updated successfully!' : 'Savings account created successfully!');
        setForm({
          account_number: '', member_id: '', account_type: 'regular',
          current_balance: '0', deposit_amount: '', saving_start_date_bs: '',
          interest_rate: '6', status: 'active'
        });
        setEditingId(null);
        setShowModal(false);
        fetchSavings();
      } else {
        alert('Error saving account');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/savings/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(withdrawForm)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setWithdrawForm({
          savings_id: '', member_id: '', withdrawal_amount: '', withdrawal_date: '', reason: ''
        });
        setWithdrawModal(false);
        fetchSavings();
      } else {
        alert(data.error || 'Error processing withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Error: ' + error.message);
    }
  };

  const openWithdrawModal = (saving) => {
    setWithdrawForm({
      savings_id: saving.id,
      member_id: saving.member_id,
      withdrawal_amount: '',
      withdrawal_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
    setWithdrawModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings account?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/savings/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSavings();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const handleEdit = (saving) => {
    setForm(saving);
    setEditingId(saving.id);
    setShowModal(true);
  };

  const handleView = (saving) => {
    setViewingSaving(saving);
    fetchWithdrawals(saving.id);
  };

  const getMemberName = (id) => members.find(m => m.id == id)?.member_name || 'Unknown';

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Savings Accounts</h1>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => { setForm({ account_number: '', member_id: '', account_type: 'regular', current_balance: '0', deposit_amount: '', saving_start_date_bs: '', interest_rate: '6', status: 'active' }); setEditingId(null); setShowModal(true); }}>+ Create Account</button>
          </div>
        </header>
        <div className="page-content">
          {showModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>{editingId ? 'Edit Savings Account' : 'Create New Savings Account'}</h3>
                  <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Account Number</label>
                      <div className="input-with-btn">
                        <input type="text" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})} required placeholder="SAV/2024/0001" />
                        <button type="button" className="btn-generate" onClick={generateAccountNumber}>Generate</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Member</label>
                      <select value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})} required>
                        <option value="">Select Member</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.member_number} - {m.member_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Account Type</label>
                      <select value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})}>
                        <option value="regular">Regular</option>
                        <option value="fixed">Fixed Deposit</option>
                        <option value="current">Current</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Initial Deposit (Rs.)</label>
                      <input type="number" value={form.deposit_amount} onChange={e => setForm({...form, deposit_amount: e.target.value})} placeholder="1000" />
                    </div>
                    <div className="form-group">
                      <label>Current Balance (Rs.)</label>
                      <input type="number" value={form.current_balance} onChange={e => setForm({...form, current_balance: e.target.value})} required placeholder="0" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date (BS)</label>
                      <input type="text" value={form.saving_start_date_bs} onChange={e => setForm({...form, saving_start_date_bs: e.target.value})} placeholder="2080/01/01" />
                    </div>
                    <div className="form-group">
                      <label>Interest Rate (%)</label>
                      <input type="number" step="0.01" value={form.interest_rate} onChange={e => setForm({...form, interest_rate: e.target.value})} placeholder="6" />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editingId ? 'Update Account' : 'Create Account'}</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {withdrawModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Withdraw from Savings</h3>
                  <button className="close-btn" onClick={() => setWithdrawModal(false)}>×</button>
                </div>
                <form onSubmit={handleWithdraw}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Account Number</label>
                      <input type="text" value={savings.find(s => s.id == withdrawForm.savings_id)?.account_number || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>Member</label>
                      <input type="text" value={getMemberName(withdrawForm.member_id)} disabled />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Current Balance (Rs.)</label>
                      <input type="text" value={savings.find(s => s.id == withdrawForm.savings_id)?.current_balance || 0} disabled />
                    </div>
                    <div className="form-group">
                      <label>Withdraw Amount (Rs.)</label>
                      <input type="number" value={withdrawForm.withdrawal_amount} onChange={e => setWithdrawForm({...withdrawForm, withdrawal_amount: e.target.value})} required min="1" placeholder="Enter amount" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Withdrawal Date</label>
                      <input type="date" value={withdrawForm.withdrawal_date} onChange={e => setWithdrawForm({...withdrawForm, withdrawal_date: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Reason</label>
                      <input type="text" value={withdrawForm.reason} onChange={e => setWithdrawForm({...withdrawForm, reason: e.target.value})} placeholder="Personal use, etc." />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Process Withdrawal</button>
                    <button type="button" className="btn-secondary" onClick={() => setWithdrawModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {viewingSaving && (
            <div className="modal-overlay" onClick={() => setViewingSaving(null)}>
              <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Savings Account Details</h3>
                  <button className="close-btn" onClick={() => setViewingSaving(null)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-section">
                    <h4>Account Information</h4>
                    <div className="detail-grid">
                      <div><strong>Account Number:</strong> {viewingSaving.account_number}</div>
                      <div><strong>Member:</strong> {getMemberName(viewingSaving.member_id)}</div>
                      <div><strong>Type:</strong> {viewingSaving.account_type}</div>
                      <div><strong>Current Balance:</strong> Rs. {parseFloat(viewingSaving.current_balance || 0).toLocaleString()}</div>
                      <div><strong>Interest Rate:</strong> {viewingSaving.interest_rate}%</div>
                      <div><strong>Start Date:</strong> {viewingSaving.saving_start_date_bs}</div>
                      <div><strong>Status:</strong> {viewingSaving.status}</div>
                    </div>
                  </div>
                  
                  {withdrawals.length > 0 && (
                    <div className="detail-section">
                      <h4>Withdrawal History</h4>
                      <div className="table-container" style={{ maxHeight: '200px', overflow: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount (Rs.)</th>
                              <th>Reason</th>
                              <th>By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {withdrawals.map(w => (
                              <tr key={w.id}>
                                <td>{w.withdrawal_date}</td>
                                <td>Rs. {parseFloat(w.withdrawal_amount).toLocaleString()}</td>
                                <td>{w.reason || '-'}</td>
                                <td>{w.withdrawed_by}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setViewingSaving(null)}>Close</button>
                  <button className="btn-warning" onClick={() => { openWithdrawModal(viewingSaving); setViewingSaving(null); }}>Withdraw</button>
                  <button className="btn-primary" onClick={() => { handleEdit(viewingSaving); setViewingSaving(null); }}>Edit Savings</button>
                </div>
              </div>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Account No.</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Rate</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savings.map(s => (
                  <tr key={s.id}>
                    <td>{s.account_number}</td>
                    <td>{getMemberName(s.member_id)}</td>
                    <td>{s.account_type}</td>
                    <td>Rs. {parseFloat(s.current_balance || 0).toLocaleString()}</td>
                    <td>{s.interest_rate}%</td>
                    <td>{s.saving_start_date_bs}</td>
                    <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                    <td>
                      <button className="btn-sm" onClick={() => handleView(s)}>View</button>
                      <button className="btn-sm btn-warning" onClick={() => openWithdrawModal(s)} disabled={parseFloat(s.current_balance || 0) <= 0}>Withdraw</button>
                      <button className="btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Monthly Savings Page
function MonthlySavingsPage() {
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedSavingsId, setSelectedSavingsId] = useState('');
  const [selectedYear, setSelectedYear] = useState(2081);
  const [savings, setSavings] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);

  const months = [
    { name: 'Baisakh', bs: 1 }, { name: 'Jestha', bs: 2 }, { name: 'Ashadh', bs: 3 },
    { name: 'Shrawan', bs: 4 }, { name: 'Bhadra', bs: 5 }, { name: 'Ashoj', bs: 6 },
    { name: 'Kartik', bs: 7 }, { name: 'Mangsir', bs: 8 }, { name: 'Poush', bs: 9 },
    { name: 'Magh', bs: 10 }, { name: 'Falgun', bs: 11 }, { name: 'Chaitra', bs: 12 }
  ];

  useEffect(() => { fetchSavingsAccounts(); fetchMembers(); }, []);

  const fetchSavingsAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/savings?status=active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const accounts = data.data || data || [];
      setSavingsAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('Error fetching savings accounts:', error);
      setSavingsAccounts([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMembers(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id == memberId);
    return member?.member_name || 'Unknown Member';
  };

  const fetchMonthlySavings = async () => {
    if (selectedSavingsId && selectedYear) {
      try {
        const token = localStorage.getItem('token');
        // Fetch monthly savings for this savings account and year
        const res = await fetch(`${API_BASE}/monthly-savings?savings_id=${selectedSavingsId}&year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const response = await res.json();
        const data = response.data || [];
        setMonthlyData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching monthly savings:', error);
        setMonthlyData([]);
      }
    }
  };

  const fetchSavingsBalance = async () => {
    if (selectedSavingsId) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/savings/${selectedSavingsId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.data) {
          setCurrentBalance(parseFloat(data.data.current_balance || 0));
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setCurrentBalance(0);
      }
    }
  };

  // Update balance after saving/deleting monthly savings
  const updateSavingsBalance = async () => {
    if (selectedSavingsId) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/savings/${selectedSavingsId}/update-balance`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSavingsBalance();
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  useEffect(() => {
    if (selectedSavingsId && selectedYear) {
      fetchMonthlySavings();
      fetchSavingsBalance();
    }
  }, [selectedSavingsId, selectedYear]);

  const getAmount = (month) => {
    const entry = monthlyData.find(m => m.month === month);
    return entry ? entry.amount : savings[month] || '';
  };

  const totalSaved = monthlyData.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);

  const handleSave = async (month) => {
    const amount = savings[month];
    const existingEntry = monthlyData.find(m => m.month === month);
    const selectedAccount = savingsAccounts.find(s => s.id == selectedSavingsId);
    
    if (amount && selectedSavingsId && selectedAccount) {
      try {
        const token = localStorage.getItem('token');
        
        if (existingEntry) {
          await fetch(`${API_BASE}/monthly-savings/${existingEntry.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              savings_id: selectedSavingsId,
              member_id: selectedAccount.member_id,
              year: selectedYear,
              month: month,
              amount: parseFloat(amount)
            })
          });
          alert('Monthly savings updated!');
        } else {
          await fetch(`${API_BASE}/monthly-savings`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              savings_id: selectedSavingsId,
              member_id: selectedAccount.member_id,
              year: selectedYear,
              month: month,
              amount: parseFloat(amount)
            })
          });
          alert('Monthly savings saved!');
        }
        fetchMonthlySavings();
        updateSavingsBalance();
        setSavings(prev => ({ ...prev, [month]: undefined }));
      } catch (error) {
        console.error('Error saving:', error);
        alert('Error saving: ' + error.message);
      }
    }
  };

  const handleEdit = (month) => {
    const entry = monthlyData.find(m => m.month === month);
    if (entry) {
      setSavings(prev => ({ ...prev, [month]: entry.amount }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/monthly-savings/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchMonthlySavings();
        updateSavingsBalance();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const selectedAccount = savingsAccounts.find(s => s.id == selectedSavingsId);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Monthly Savings</h1>
          <p>Track monthly savings contributions (Bikram Sambat)</p>
        </header>
        <div className="page-content">
          <div className="form-row">
            <select value={selectedSavingsId} onChange={e => { setSelectedSavingsId(e.target.value); setMonthlyData([]); }}>
              <option value="">Select Savings Account</option>
              {savingsAccounts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.account_number} - {getMemberName(s.member_id)}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {[...Array(10)].map((_, i) => {
                const year = 2075 + i;
                return <option key={year} value={year}>{year} BS</option>;
              })}
            </select>
          </div>
          {selectedSavingsId && (
            <div className="monthly-content">
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Account</h3>
                  <p>{selectedAccount?.account_number || 'N/A'}</p>
                  <p className="small">{selectedAccount ? getMemberName(selectedAccount.member_id) : ''}</p>
                </div>
                <div className="summary-card">
                  <h3>Year</h3>
                  <p>{selectedYear} BS</p>
                </div>
                <div className="summary-card">
                  <h3>Current Balance</h3>
                  <p>Rs. {currentBalance.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Year Total</h3>
                  <p>Rs. {totalSaved.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Months Saved</h3>
                  <p>{monthlyData.length}/12</p>
                </div>
              </div>
              <div className="monthly-grid">
                <h3>Monthly Contributions</h3>
                <p className="helper-text">Select a month, enter amount, and click Save. Edit or Delete existing entries.</p>
                <div className="months-container">
                  {months.map(month => (
                    <div key={month.bs} className="month-card">
                      <div className="month-header">
                        <span className="month-name">{month.name}</span>
                        <span className="month-number">{month.bs}</span>
                      </div>
                      <div className="month-input">
                        <input
                          type="number"
                          value={getAmount(month.bs)}
                          onChange={e => setSavings(prev => ({ ...prev, [month.bs]: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="month-actions">
                        {monthlyData.find(m => m.month === month.bs) ? (
                          <>
                            <button className="btn-secondary" onClick={() => handleEdit(month.bs)}>Edit</button>
                            <button className="btn-danger" onClick={() => handleDelete(monthlyData.find(m => m.month === month.bs).id)}>Delete</button>
                          </>
                        ) : (
                          <button className="btn-primary" onClick={() => handleSave(month.bs)}>Save</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="yearly-overview">
                <h3>Yearly Overview - {selectedYear} BS</h3>
                <div className="yearly-chart">
                  {months.map(month => {
                    const entry = monthlyData.find(m => m.month === month.bs);
                    const amount = entry ? parseFloat(entry.amount) : 0;
                    const maxAmount = Math.max(...monthlyData.map(m => parseFloat(m.amount || 0)), 1000);
                    const height = Math.max((amount / maxAmount) * 150, 4);
                    const hasEntry = monthlyData.some(m => m.month === month.bs);
                    return (
                      <div key={month.bs} className={`chart-bar-container ${hasEntry ? 'has-data' : ''}`}>
                        <div className="chart-value">{amount > 0 ? `Rs. ${amount.toLocaleString()}` : '-'}</div>
                        <div className="chart-bar" style={{ height: `${height}px`, backgroundColor: amount > 0 ? '#10b981' : '#e5e7eb' }}></div>
                        <div className="chart-label">{month.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Citizenship Page with Table View
function CitizenshipPage() {
  const [selectedMember, setSelectedMember] = useState('');
  const [members, setMembers] = useState([]);
  const [allCitizenships, setAllCitizenships] = useState([]);
  const [citizenshipData, setCitizenshipData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [filter, setFilter] = useState('');
  const [photos, setPhotos] = useState({ photo: null, citizenship_front: null, citizenship_back: null });
  const [existingPhotos, setExistingPhotos] = useState({ photo: '', citizenship_front: '', citizenship_back: '' });
  
  const [formData, setFormData] = useState({
    full_name: '', citizenship_number: '', birth_date: '', birth_date_bs: '',
    nationality: '', marital_status: '', spouse_name: '', issued_date: '', issued_date_bs: '',
    issued_district: '', province: '', district: '', municipality: '',
    ward_number: '', tole: '', phone: '', email: '', gender: '', birth_place: '', religion: ''
  });

  useEffect(() => { fetchMembers(); fetchAllCitizenships(); }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const membersData = data.data || data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchAllCitizenships = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/citizenship`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAllCitizenships(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching citizenships:', error);
      setAllCitizenships([]);
    }
  };

  const handlePhotoChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setPhotos(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      form.append('member_id', selectedMember);
      
      if (photos.photo) form.append('photo', photos.photo);
      if (photos.citizenship_front) form.append('citizenship_front', photos.citizenship_front);
      if (photos.citizenship_back) form.append('citizenship_back', photos.citizenship_back);

      const token = localStorage.getItem('token');
      const url = editingId ? `${API_BASE}/citizenship/${editingId}` : `${API_BASE}/citizenship`;
      const method = editingId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      
      alert(editingId ? 'Citizenship details updated successfully!' : 'Citizenship details saved successfully!');
      resetForm();
      fetchAllCitizenships();
      fetchCitizenship();
    } catch (error) {
      console.error('Error saving citizenship:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitizenship = async () => {
    if (!selectedMember) {
      setCitizenshipData(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/citizenship/member/${selectedMember}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const doc = data.data || data || null;
      setCitizenshipData(doc);
      
      if (doc) {
        setFormData({
          full_name: doc.full_name || '', citizenship_number: doc.citizenship_number || '',
          birth_date: doc.birth_date || '', birth_date_bs: doc.birth_date_bs || '',
          nationality: doc.nationality || '', marital_status: doc.marital_status || '',
          spouse_name: doc.spouse_name || '', issued_date: doc.issued_date || '', issued_date_bs: doc.issued_date_bs || '',
          issued_district: doc.issued_district || '', province: doc.province || '',
          district: doc.district || '', municipality: doc.municipality || '',
          ward_number: doc.ward_number || '', tole: doc.tole || '',
          phone: doc.phone || '', email: doc.email || ''
        });
        setExistingPhotos({
          photo: doc.photo || '', citizenship_front: doc.citizenship_front || '', citizenship_back: doc.citizenship_back || ''
        });
      }
    } catch (error) {
      console.error('Error fetching citizenship:', error);
      setCitizenshipData(null);
    }
  };

  useEffect(() => {
    fetchCitizenship();
  }, [selectedMember]);

  const handleDeletePhoto = async (field, id) => {
    if (window.confirm(`Delete this ${field} photo?`)) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/citizenship/${id}/photo/${field}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchCitizenship();
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '', citizenship_number: '', birth_date: '', birth_date_bs: '',
      nationality: '', marital_status: '', spouse_name: '', issued_date: '', issued_date_bs: '',
      issued_district: '', province: '', district: '', municipality: '',
      ward_number: '', tole: '', phone: '', email: '', gender: '', birth_place: '', religion: ''
    });
    setPhotos({ photo: null, citizenship_front: null, citizenship_back: null });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEditFromTable = (doc) => {
    setSelectedMember(doc.member_id);
    setViewMode('form');
  };

  const handleViewFromTable = (doc) => {
    setSelectedDocument(doc);
    setShowDetailsModal(true);
  };

  const handleDeleteFromTable = async (id) => {
    if (window.confirm('Are you sure you want to delete this citizenship record?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/citizenship/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchAllCitizenships();
      } catch (error) {
        console.error('Error deleting citizenship:', error);
      }
    }
  };

  const filteredCitizenships = allCitizenships.filter(c => 
    c.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    c.citizenship_number?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Citizenship Details</h1>
          <p>Manage citizenship documents and personal information</p>
        </header>
        <div className="page-content">
          <div className="form-row">
            <select value={selectedMember} onChange={e => { setSelectedMember(e.target.value); setViewMode('table'); }}>
              <option value="">Select Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.member_number} - {m.member_name}</option>)}
            </select>
            <button className="btn-primary" onClick={() => { setSelectedMember(''); setViewMode('table'); resetForm(); }}>Clear Selection</button>
          </div>

          {selectedMember && (
            <div className="form-section">
              <div className="section-header">
                <h3>{editingId ? 'Edit Citizenship Details' : 'Add Citizenship Details'}</h3>
                <div className="header-actions">
                  <button className="btn-secondary" onClick={() => setViewMode('table')}>View All</button>
                  <button className="btn-primary" onClick={() => { setEditingId(citizenshipData?.id); setViewMode('form'); }}>{citizenshipData ? 'Edit Details' : 'Add Details'}</button>
                </div>
              </div>
              
              {viewMode === 'form' && (
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Citizenship Number</label>
                      <input type="text" value={formData.citizenship_number} onChange={e => setFormData({...formData, citizenship_number: e.target.value})} required />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Birth Date (AD)</label>
                      <input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Birth Date (BS)</label>
                      <input type="text" value={formData.birth_date_bs} onChange={e => setFormData({...formData, birth_date_bs: e.target.value})} placeholder="2080/01/01" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Issued District</label>
                      <input type="text" value={formData.issued_district} onChange={e => setFormData({...formData, issued_district: e.target.value})} placeholder="District where citizenship was issued" />
                    </div>
                    <div className="form-group">
                      <label>Issued Date (BS)</label>
                      <input type="text" value={formData.issued_date_bs} onChange={e => setFormData({...formData, issued_date_bs: e.target.value})} placeholder="2080/01/01" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select value={formData.marital_status} onChange={e => setFormData({...formData, marital_status: e.target.value})}>
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Spouse Name</label>
                      <input type="text" value={formData.spouse_name} onChange={e => setFormData({...formData, spouse_name: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-section-title">Address Information</div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Province</label>
                      <input type="text" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>District</label>
                      <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Municipality</label>
                      <input type="text" value={formData.municipality} onChange={e => setFormData({...formData, municipality: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Ward Number</label>
                      <input type="text" value={formData.ward_number} onChange={e => setFormData({...formData, ward_number: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tole/Street</label>
                      <input type="text" value={formData.tole} onChange={e => setFormData({...formData, tole: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-section-title">Contact Information</div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-section-title">Document Photos</div>
                  
                  <div className="photo-upload-section">
                    <div className="photo-upload-group">
                      <label>Profile Photo</label>
                      {existingPhotos.photo && (
                        <div className="photo-preview">
                          <img src={getImageUrl(existingPhotos.photo)} alt="Profile" />
                          <button type="button" className="btn-danger btn-sm" onClick={() => handleDeletePhoto('photo', citizenshipData?.id)}>Delete</button>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'photo')} />
                    </div>

                    <div className="photo-upload-group">
                      <label>Citizenship Front</label>
                      {existingPhotos.citizenship_front && (
                        <div className="photo-preview">
                          <img src={getImageUrl(existingPhotos.citizenship_front)} alt="Citizenship Front" />
                          <button type="button" className="btn-danger btn-sm" onClick={() => handleDeletePhoto('citizenship_front', citizenshipData?.id)}>Delete</button>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'citizenship_front')} />
                    </div>

                    <div className="photo-upload-group">
                      <label>Citizenship Back</label>
                      {existingPhotos.citizenship_back && (
                        <div className="photo-preview">
                          <img src={getImageUrl(existingPhotos.citizenship_back)} alt="Citizenship Back" />
                          <button type="button" className="btn-danger btn-sm" onClick={() => handleDeletePhoto('citizenship_back', citizenshipData?.id)}>Delete</button>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'citizenship_back')} />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}</button>
                    <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                  </div>
                </form>
              )}

              {viewMode === 'table' && citizenshipData && (
                <div className="citizenship-details">
                  <div className="details-grid">
                    <div><strong>Name:</strong> {citizenshipData.full_name}</div>
                    <div><strong>Citizenship No:</strong> {citizenshipData.citizenship_number}</div>
                    <div><strong>Birth Date:</strong> {citizenshipData.birth_date_bs} (BS) / {citizenshipData.birth_date} (AD)</div>
                    <div><strong>Gender:</strong> {citizenshipData.gender}</div>
                    <div><strong>Nationality:</strong> {citizenshipData.nationality}</div>
                    <div><strong>Marital Status:</strong> {citizenshipData.marital_status}</div>
                    <div><strong>Spouse:</strong> {citizenshipData.spouse_name}</div>
                    <div><strong>Address:</strong> {citizenshipData.tole}, Ward {citizenshipData.ward_number}, {citizenshipData.municipality}, {citizenshipData.district}, {citizenshipData.province}</div>
                    <div><strong>Phone:</strong> {citizenshipData.phone}</div>
                    <div><strong>Email:</strong> {citizenshipData.email}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="table-section">
            <div className="section-header">
              <h3>All Citizenship Records ({filteredCitizenships.length})</h3>
              <input type="text" placeholder="Search by name or citizenship number..." value={filter} onChange={e => setFilter(e.target.value)} className="search-input" />
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Citizenship No.</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitizenships.map(doc => (
                    <tr key={doc.id}>
                      <td>{doc.full_name}</td>
                      <td>{doc.citizenship_number}</td>
                      <td>{doc.tole}, {doc.municipality}, {doc.district}</td>
                      <td>{doc.phone}</td>
                      <td>
                        <button className="btn-sm" onClick={() => handleViewFromTable(doc)}>View</button>
                        <button className="btn-sm" onClick={() => handleEditFromTable(doc)}>Edit</button>
                        <button className="btn-sm btn-danger" onClick={() => handleDeleteFromTable(doc.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showDetailsModal && selectedDocument && (
            <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
              <div className="modal view-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Citizenship Details</h3>
                  <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="photo-gallery">
                    {selectedDocument.photo && (
                      <div className="photo-item">
                        <img src={getImageUrl(selectedDocument.photo)} alt="Profile" />
                        <span>Profile Photo</span>
                      </div>
                    )}
                    {selectedDocument.citizenship_front && (
                      <div className="photo-item">
                        <img src={getImageUrl(selectedDocument.citizenship_front)} alt="Citizenship Front" />
                        <span>Citizenship Front</span>
                      </div>
                    )}
                    {selectedDocument.citizenship_back && (
                      <div className="photo-item">
                        <img src={getImageUrl(selectedDocument.citizenship_back)} alt="Citizenship Back" />
                        <span>Citizenship Back</span>
                      </div>
                    )}
                  </div>
                  <div className="detail-section">
                    <h4>Personal Information</h4>
                    <div className="detail-grid">
                      <div><strong>Full Name:</strong> {selectedDocument.full_name}</div>
                      <div><strong>Citizenship Number:</strong> {selectedDocument.citizenship_number}</div>
                      <div><strong>Gender:</strong> {selectedDocument.gender}</div>
                      <div><strong>Birth Date:</strong> {selectedDocument.birth_date_bs} (BS) / {selectedDocument.birth_date} (AD)</div>
                      <div><strong>Birth Place:</strong> {selectedDocument.birth_place}</div>
                      <div><strong>Nationality:</strong> {selectedDocument.nationality}</div>
                      <div><strong>Religion:</strong> {selectedDocument.religion}</div>
                      <div><strong>Marital Status:</strong> {selectedDocument.marital_status}</div>
                      <div><strong>Spouse Name:</strong> {selectedDocument.spouse_name}</div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Address</h4>
                    <div className="detail-grid">
                      <div><strong>Province:</strong> {selectedDocument.province}</div>
                      <div><strong>District:</strong> {selectedDocument.district}</div>
                      <div><strong>Municipality:</strong> {selectedDocument.municipality}</div>
                      <div><strong>Ward:</strong> {selectedDocument.ward_number}</div>
                      <div><strong>Tole:</strong> {selectedDocument.tole}</div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Contact</h4>
                    <div className="detail-grid">
                      <div><strong>Phone:</strong> {selectedDocument.phone}</div>
                      <div><strong>Email:</strong> {selectedDocument.email}</div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Issued Information</h4>
                    <div className="detail-grid">
                      <div><strong>Issued District:</strong> {selectedDocument.issued_district}</div>
                      <div><strong>Issued Date:</strong> {selectedDocument.issued_date_bs || selectedDocument.issued_date}</div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                  <button className="btn-primary" onClick={() => { setShowDetailsModal(false); setSelectedMember(selectedDocument.member_id); setViewMode('form'); handleEditFromTable(selectedDocument); }}>Edit Details</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Page
function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '', email: '', username: '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setForm({
            full_name: data.user.full_name || '',
            email: data.user.email || '',
            username: data.user.username || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setExistingPhoto(data.user.profile_photo || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setForm({
            full_name: userData.full_name || '',
            email: userData.email || '',
            username: userData.username || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setExistingPhoto(userData.profile_photo || '');
        }
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('email', form.email);
      formData.append('username', form.username);
      
      if (photo) {
        formData.append('photo', photo);
      }

      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          setMessage('New passwords do not match!');
          setLoading(false);
          return;
        }
        formData.append('newPassword', form.newPassword);
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      
      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setExistingPhoto(data.user.profile_photo || '');
        setPhoto(null);
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Profile Settings</h1>
          <p>Manage your account settings</p>
        </header>
        <div className="page-content profile-page">
          <div className="profile-container">
            <div className="profile-sidebar">
              <div className="profile-photo-section">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="Preview" className="profile-photo" />
                ) : existingPhoto ? (
                  <img src={getImageUrl(existingPhoto)} alt="Profile" className="profile-photo" />
                ) : (
                  <div className="profile-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <label htmlFor="photo-upload" className="photo-upload-label">
                  {photo ? '📷 Photo Selected' : '📷 Change Photo'}
                </label>
                <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} />
              </div>
              <h3>{user.full_name || user.username}</h3>
              <span className="role-badge">{user.role}</span>
              <button className="btn-logout-sidebar" onClick={handleLogout}>Logout</button>
            </div>

            <div className="profile-content">
              <form onSubmit={handleSubmit}>
                <div className="form-section-title">Personal Information</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>

                <div className="form-section-title">Change Password</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                  </div>
                </div>

                {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App
function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/members" element={isAuthenticated() ? <MembersPage /> : <Navigate to="/" />} />
        <Route path="/loans" element={isAuthenticated() ? <LoansPage /> : <Navigate to="/" />} />
        <Route path="/shares" element={isAuthenticated() ? <SharesPage /> : <Navigate to="/" />} />
        <Route path="/savings" element={isAuthenticated() ? <SavingsPage /> : <Navigate to="/" />} />
        <Route path="/monthly-savings" element={isAuthenticated() ? <MonthlySavingsPage /> : <Navigate to="/" />} />
        <Route path="/citizenship" element={isAuthenticated() ? <CitizenshipPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={isAuthenticated() ? <ProfilePage /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

