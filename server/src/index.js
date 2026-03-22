import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import pool from './db/pool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage });

app.disable('x-powered-by');
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

if (process.env.SERVE_CLIENT === 'true') {
  const clientDist = path.join(__dirname, '..', 'public');
  app.use(express.static(clientDist));
  app.get('/', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Public routes
app.post('/api/track', async (req, res) => {
  const { page, referrer } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  await pool.query(
    'INSERT INTO page_views (page, referrer, user_agent, ip) VALUES ($1,$2,$3,$4)',
    [page || '/', referrer || '', req.headers['user-agent'] || '', ip || '']
  );
  res.json({ ok: true });
});

app.post('/api/submit', async (req, res) => {
  const { name, business_name, service, message, phone, budget } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  const result = await pool.query(
    'INSERT INTO submissions (name, business_name, service, message, phone, budget) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, business_name, service, message, phone, budget]
  );
  res.json({ ok: true, id: result.rows[0].id });
});

app.get('/api/services', async (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM services WHERE is_active = true';
  const params = [];
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  query += ' ORDER BY is_featured DESC, sort_order ASC, id ASC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.get('/api/testimonials', async (req, res) => {
  const result = await pool.query('SELECT * FROM testimonials WHERE is_active = true ORDER BY id ASC');
  res.json(result.rows);
});

app.get('/api/projects', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM projects WHERE is_active = true ORDER BY is_featured DESC, sort_order ASC, id ASC'
  );
  res.json(result.rows);
});

// Admin auth
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const adminRes = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
  const admin = adminRes.rows[0];
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, username: admin.username });
});

app.post('/api/admin/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  const adminRes = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
  const admin = adminRes.rows[0];
  if (!admin || !bcrypt.compareSync(current_password, admin.password)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(new_password, 10);
  await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ ok: true });
});

// Admin submissions
app.get('/api/admin/submissions', authMiddleware, async (req, res) => {
  const { status } = req.query;
  let q = 'SELECT * FROM submissions';
  const params = [];
  if (status) {
    params.push(status);
    q += ` WHERE status = $${params.length}`;
  }
  q += ' ORDER BY created_at DESC';
  const result = await pool.query(q, params);
  res.json(result.rows);
});

app.patch('/api/admin/submissions/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/submissions/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM submissions WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Admin services
app.get('/api/admin/services', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM services ORDER BY category, sort_order, id');
  res.json(result.rows);
});

app.post('/api/admin/services', authMiddleware, async (req, res) => {
  const { category, name, price_min, price_max, unit, features, is_featured, is_active } = req.body;
  const result = await pool.query(
    `INSERT INTO services (category, name, price_min, price_max, unit, features, is_featured, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [category, name, price_min, price_max, unit || 'project', features || '', !!is_featured, is_active !== false]
  );
  res.json({ ok: true, id: result.rows[0].id });
});

app.put('/api/admin/services/:id', authMiddleware, async (req, res) => {
  const { category, name, price_min, price_max, unit, features, is_featured, is_active } = req.body;
  await pool.query(
    `UPDATE services SET category=$1, name=$2, price_min=$3, price_max=$4, unit=$5, features=$6, is_featured=$7, is_active=$8 WHERE id=$9`,
    [category, name, price_min, price_max, unit, features, !!is_featured, !!is_active, req.params.id]
  );
  res.json({ ok: true });
});

app.delete('/api/admin/services/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Admin testimonials
app.get('/api/admin/testimonials', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM testimonials ORDER BY id DESC');
  res.json(result.rows);
});

app.post('/api/admin/testimonials', authMiddleware, async (req, res) => {
  const { author_name, business_name, city, content, rating } = req.body;
  const result = await pool.query(
    'INSERT INTO testimonials (author_name, business_name, city, content, rating) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [author_name, business_name, city, content, rating || 5]
  );
  res.json({ ok: true, id: result.rows[0].id });
});

app.put('/api/admin/testimonials/:id', authMiddleware, async (req, res) => {
  const { author_name, business_name, city, content, rating, is_active } = req.body;
  await pool.query(
    'UPDATE testimonials SET author_name=$1, business_name=$2, city=$3, content=$4, rating=$5, is_active=$6 WHERE id=$7',
    [author_name, business_name, city, content, rating, !!is_active, req.params.id]
  );
  res.json({ ok: true });
});

app.delete('/api/admin/testimonials/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Admin projects
app.get('/api/admin/projects', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY is_featured DESC, sort_order ASC, id ASC');
  res.json(result.rows);
});

app.post('/api/admin/projects', authMiddleware, async (req, res) => {
  const { title, industry, summary, stack, outcome, image_url, is_featured, is_active, sort_order } = req.body;
  const result = await pool.query(
    `INSERT INTO projects (title, industry, summary, stack, outcome, image_url, is_featured, is_active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [title, industry, summary, stack, outcome, image_url || '', !!is_featured, is_active !== false, sort_order || 0]
  );
  res.json({ ok: true, id: result.rows[0].id });
});

app.put('/api/admin/projects/:id', authMiddleware, async (req, res) => {
  const { title, industry, summary, stack, outcome, image_url, is_featured, is_active, sort_order } = req.body;
  await pool.query(
    `UPDATE projects
     SET title=$1, industry=$2, summary=$3, stack=$4, outcome=$5, image_url=$6, is_featured=$7, is_active=$8, sort_order=$9
     WHERE id=$10`,
    [title, industry, summary, stack, outcome, image_url || '', !!is_featured, !!is_active, sort_order || 0, req.params.id]
  );
  res.json({ ok: true });
});

app.post('/api/admin/projects/reorder', authMiddleware, async (req, res) => {
  const order = Array.isArray(req.body) ? req.body : req.body.order;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order payload' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of order) {
      await client.query('UPDATE projects SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Reorder failed' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/projects/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const imageUrl = `/uploads/${req.file.filename}`;
  await pool.query('UPDATE projects SET image_url = $1 WHERE id = $2', [imageUrl, req.params.id]);
  res.json({ ok: true, image_url: imageUrl });
});

app.delete('/api/admin/projects/:id', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Admin analytics
app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  const totalViews = await pool.query('SELECT COUNT(*)::int AS c FROM page_views');
  const todayViews = await pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE created_at::date = CURRENT_DATE");
  const weekViews = await pool.query("SELECT COUNT(*)::int AS c FROM page_views WHERE created_at >= NOW() - INTERVAL '7 days'");
  const totalLeads = await pool.query('SELECT COUNT(*)::int AS c FROM submissions');
  const newLeads = await pool.query("SELECT COUNT(*)::int AS c FROM submissions WHERE status = 'new'");
  const weekLeads = await pool.query("SELECT COUNT(*)::int AS c FROM submissions WHERE created_at >= NOW() - INTERVAL '7 days'");
  const viewsByDay = await pool.query(`
    SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day ASC
  `);
  const leadsByService = await pool.query(`
    SELECT service, COUNT(*)::int AS count
    FROM submissions
    WHERE service IS NOT NULL AND service <> ''
    GROUP BY service
    ORDER BY count DESC
    LIMIT 8
  `);
  const recentLeads = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5');
  res.json({
    totalViews: totalViews.rows[0].c,
    todayViews: todayViews.rows[0].c,
    weekViews: weekViews.rows[0].c,
    totalLeads: totalLeads.rows[0].c,
    newLeads: newLeads.rows[0].c,
    weekLeads: weekLeads.rows[0].c,
    viewsByDay: viewsByDay.rows,
    leadsByService: leadsByService.rows,
    recentLeads: recentLeads.rows,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
