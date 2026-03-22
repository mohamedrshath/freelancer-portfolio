const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5500')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ─── Middleware ───────────────────────────────────────────────
app.disable('x-powered-by');
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve frontend

// ─── Database Setup ───────────────────────────────────────────
const db = new Database('./portfolio.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    business_name TEXT,
    service TEXT,
    message TEXT,
    phone TEXT,
    budget TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    price_min INTEGER NOT NULL,
    price_max INTEGER NOT NULL,
    unit TEXT DEFAULT 'project',
    features TEXT,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    business_name TEXT,
    city TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page TEXT DEFAULT '/',
    referrer TEXT,
    user_agent TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default admin (username: admin, password: admin123)
const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Default admin created: admin / admin123');
}

// Seed sample services if empty
const serviceCount = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
if (serviceCount === 0) {
  const seedServices = [
    ['popular', 'Shop Billing / POS System', 15000, 50000, 'project', 'Product catalog,Invoice printing,Daily sales report', 1],
    ['popular', 'Restaurant Management System', 30000, 120000, 'project', 'Table & order management,Menu & billing,Kitchen display', 0],
    ['popular', 'Inventory Management System', 15000, 60000, 'project', 'Stock tracking,Low stock alerts,Supplier management', 1],
    ['popular', 'Booking System', 20000, 120000, 'project', 'Online bookings,Calendar view,SMS reminders', 0],
    ['popular', 'Business Website', 5000, 25000, 'project', 'Mobile responsive,Contact form,Google Maps', 0],
    ['business', 'Business Management System', 30000, 150000, 'project', 'Multi-module system,User roles,Reports & analytics', 0],
    ['business', 'CRM System', 30000, 120000, 'project', 'Lead tracking,Follow-up reminders,Sales pipeline', 0],
    ['business', 'Employee Management System', 20000, 70000, 'project', 'Attendance,Payroll,Leave management', 0],
    ['industry', 'Hospital Management System', 50000, 250000, 'project', 'Patient records,Billing & pharmacy,Doctor scheduling', 0],
    ['industry', 'School Management System', 40000, 200000, 'project', 'Admissions,Fee management,Exam & results', 1],
    ['industry', 'Hotel Management System', 50000, 200000, 'project', 'Room booking,Check-in/out,Billing & reports', 0],
    ['industry', 'Gym Management System', 20000, 80000, 'project', 'Member profiles,Renewals & billing,Attendance', 0],
    ['web', 'Full Stack Web Application', 40000, 200000, 'project', 'Frontend + backend,Database design,API + auth', 0],
    ['web', 'SaaS Application', 80000, 500000, 'project', 'Multi-tenant,Subscription billing,Admin dashboard', 1],
    ['web', 'ERP System', 100000, 600000, 'project', 'All business modules,Role-based access,Reporting engine', 0],
    ['backend', 'REST API Development', 5000, 30000, 'project', 'RESTful design,Documentation,Authentication', 0],
    ['backend', 'Payment Gateway Integration', 5000, 25000, 'project', 'Razorpay / Stripe,UPI support,Refund handling', 1],
    ['monthly', 'Website Maintenance', 2000, 15000, 'month', 'Updates & backups,Bug fixes,Content changes', 1],
    ['monthly', 'Technical Support', 2000, 10000, 'month', 'Priority support,24hr response,Phone / WhatsApp', 0],
    ['monthly', 'Software Maintenance', 5000, 25000, 'month', 'Feature updates,Performance tuning,Security patches', 0],
  ];
  const ins = db.prepare('INSERT INTO services (category, name, price_min, price_max, unit, features, is_featured) VALUES (?,?,?,?,?,?,?)');
  seedServices.forEach((s, i) => ins.run(...s));
  console.log('✅ Sample services seeded');
}

// Seed sample testimonials if empty
const testCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c;
if (testCount === 0) {
  const seedT = [
    ['Rajesh Kumar', 'Pharmacy Owner', 'Chennai', 'The billing software saved us hours every day. Fast delivery and explained everything clearly.', 5],
    ['Priya Nair', 'Restaurant Owner', 'Coimbatore', 'Our restaurant management system tracks orders, tables, and staff. Very professional work.', 5],
    ['Suresh Babu', 'School Principal', 'Madurai', 'Parents, teachers, and admin all have their own access. Excellent delivery and support.', 5],
    ['Meena Devi', 'Retail Shop Owner', 'Trichy', 'From inventory to billing to reports — the retail system handles everything. Staff learned it in a day!', 5],
    ['Anand Sharma', 'Travel Agency', 'Hyderabad', 'Got a full business website with booking system for a very fair price. Looks extremely professional.', 5],
    ['Karthik Rajan', 'Gym Owner', 'Bangalore', 'The gym system handles memberships, renewals, and payments automatically. Best investment this year.', 5],
  ];
  const ins = db.prepare('INSERT INTO testimonials (author_name, business_name, city, content, rating) VALUES (?,?,?,?,?)');
  seedT.forEach(t => ins.run(...t));
  console.log('✅ Sample testimonials seeded');
}

// ─── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── PUBLIC ROUTES ────────────────────────────────────────────

// Track page view
app.post('/api/track', (req, res) => {
  const { page, referrer } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  db.prepare('INSERT INTO page_views (page, referrer, user_agent, ip) VALUES (?,?,?,?)')
    .run(page || '/', referrer || '', req.headers['user-agent'] || '', ip);
  res.json({ ok: true });
});

// Submit contact form
app.post('/api/submit', (req, res) => {
  const { name, business_name, service, message, phone, budget } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  const result = db.prepare(
    'INSERT INTO submissions (name, business_name, service, message, phone, budget) VALUES (?,?,?,?,?,?)'
  ).run(name, business_name, service, message, phone, budget);
  res.json({ ok: true, id: result.lastInsertRowid });
});

// Get active services (for portfolio frontend)
app.get('/api/services', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM services WHERE is_active = 1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY is_featured DESC, sort_order ASC, id ASC';
  res.json(db.prepare(query).all(...params));
});

// Get active testimonials (for portfolio frontend)
app.get('/api/testimonials', (req, res) => {
  res.json(db.prepare('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY id ASC').all());
});

// ─── ADMIN AUTH ───────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: admin.username });
});

app.post('/api/admin/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, admin.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  db.prepare('UPDATE admins SET password = ? WHERE id = ?')
    .run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ ok: true });
});

// ─── ADMIN: SUBMISSIONS ───────────────────────────────────────
app.get('/api/admin/submissions', authMiddleware, (req, res) => {
  const { status } = req.query;
  let q = 'SELECT * FROM submissions';
  const params = [];
  if (status) { q += ' WHERE status = ?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...params));
});

app.patch('/api/admin/submissions/:id', authMiddleware, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/submissions/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ADMIN: SERVICES ─────────────────────────────────────────
app.get('/api/admin/services', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY category, sort_order, id').all());
});

app.post('/api/admin/services', authMiddleware, (req, res) => {
  const { category, name, price_min, price_max, unit, features, is_featured, is_active } = req.body;
  const result = db.prepare(
    'INSERT INTO services (category, name, price_min, price_max, unit, features, is_featured, is_active) VALUES (?,?,?,?,?,?,?,?)'
  ).run(category, name, price_min, price_max, unit || 'project', features || '', is_featured ? 1 : 0, is_active !== false ? 1 : 0);
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.put('/api/admin/services/:id', authMiddleware, (req, res) => {
  const { category, name, price_min, price_max, unit, features, is_featured, is_active } = req.body;
  db.prepare(
    'UPDATE services SET category=?, name=?, price_min=?, price_max=?, unit=?, features=?, is_featured=?, is_active=? WHERE id=?'
  ).run(category, name, price_min, price_max, unit, features, is_featured ? 1 : 0, is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/services/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ADMIN: TESTIMONIALS ──────────────────────────────────────
app.get('/api/admin/testimonials', authMiddleware, (req, res) => {
  res.json(db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all());
});

app.post('/api/admin/testimonials', authMiddleware, (req, res) => {
  const { author_name, business_name, city, content, rating } = req.body;
  const result = db.prepare(
    'INSERT INTO testimonials (author_name, business_name, city, content, rating) VALUES (?,?,?,?,?)'
  ).run(author_name, business_name, city, content, rating || 5);
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.put('/api/admin/testimonials/:id', authMiddleware, (req, res) => {
  const { author_name, business_name, city, content, rating, is_active } = req.body;
  db.prepare(
    'UPDATE testimonials SET author_name=?, business_name=?, city=?, content=?, rating=?, is_active=? WHERE id=?'
  ).run(author_name, business_name, city, content, rating, is_active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/testimonials/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── ADMIN: ANALYTICS ─────────────────────────────────────────
app.get('/api/admin/analytics', authMiddleware, (req, res) => {
  const totalViews = db.prepare('SELECT COUNT(*) as c FROM page_views').get().c;
  const todayViews = db.prepare("SELECT COUNT(*) as c FROM page_views WHERE date(created_at) = date('now')").get().c;
  const weekViews = db.prepare("SELECT COUNT(*) as c FROM page_views WHERE created_at >= datetime('now', '-7 days')").get().c;
  const totalLeads = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
  const newLeads = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'new'").get().c;
  const weekLeads = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE created_at >= datetime('now', '-7 days')").get().c;
  const viewsByDay = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as views
    FROM page_views WHERE created_at >= datetime('now', '-30 days')
    GROUP BY day ORDER BY day ASC
  `).all();
  const leadsByService = db.prepare(`
    SELECT service, COUNT(*) as count FROM submissions
    WHERE service IS NOT NULL AND service != ''
    GROUP BY service ORDER BY count DESC LIMIT 8
  `).all();
  const recentLeads = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5').all();
  res.json({ totalViews, todayViews, weekViews, totalLeads, newLeads, weekLeads, viewsByDay, leadsByService, recentLeads });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Login: admin / admin123\n`);
});
