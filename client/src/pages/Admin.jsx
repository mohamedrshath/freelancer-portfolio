import { useEffect, useMemo, useState } from 'react';
import { apiFetch, setToken, getToken, authHeaders } from '../components/api.js';

export default function Admin() {
  const [token, setLocalToken] = useState(getToken());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [page, setPage] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ show: false, error: false, msg: '' });

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadDetail, setLeadDetail] = useState(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    name: '',
    category: 'popular',
    unit: 'project',
    price_min: '',
    price_max: '',
    features: '',
    is_featured: 0,
    is_active: 1,
  });

  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    id: '',
    author_name: '',
    business_name: '',
    city: '',
    content: '',
    rating: 5,
    is_active: 1,
  });

  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    document.body.classList.remove('home-body');
  }, []);

  useEffect(() => {
    if (token) {
      loadAnalytics();
      loadSubmissions('');
    }
  }, [token]);

  function toastMsg(msg, error = false) {
    setToast({ show: true, error, msg });
    setTimeout(() => setToast({ show: false, error: false, msg: '' }), 2500);
  }

  async function login() {
    try {
      const data = await apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(data.token);
      setLocalToken(data.token);
      setLoginError(false);
      setPage('analytics');
      setPassword('');
      setUsername(data.username);
      loadAnalytics();
      loadSubmissions('');
    } catch {
      setLoginError(true);
    }
  }

  function logout() {
    setToken('');
    setLocalToken('');
  }

  async function loadAnalytics() {
    try {
      const data = await apiFetch('/admin/analytics', { headers: authHeaders() });
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  }

  async function loadSubmissions(status = '') {
    try {
      const url = status ? `/admin/submissions?status=${status}` : '/admin/submissions';
      const data = await apiFetch(url, { headers: authHeaders() });
      setSubmissions(data);
    } catch {
      setSubmissions([]);
    }
  }

  async function loadServices() {
    const data = await apiFetch('/admin/services', { headers: authHeaders() });
    setServices(data);
  }

  async function loadTestimonials() {
    const data = await apiFetch('/admin/testimonials', { headers: authHeaders() });
    setTestimonials(data);
  }

  function openLead(lead) {
    setLeadDetail(lead);
    setLeadModalOpen(true);
  }

  async function updateLeadStatus(status) {
    if (!leadDetail) return;
    await apiFetch(`/admin/submissions/${leadDetail.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    setLeadModalOpen(false);
    toastMsg('Status updated');
    loadSubmissions(statusFilter);
  }

  async function deleteLead(id) {
    if (!confirm('Delete this submission?')) return;
    await apiFetch(`/admin/submissions/${id}`, { method: 'DELETE', headers: authHeaders() });
    toastMsg('Deleted');
    loadSubmissions(statusFilter);
  }

  function openServiceModal(s = null) {
    setServiceForm({
      id: s?.id || '',
      name: s?.name || '',
      category: s?.category || 'popular',
      unit: s?.unit || 'project',
      price_min: s?.price_min || '',
      price_max: s?.price_max || '',
      features: s?.features || '',
      is_featured: s?.is_featured ? 1 : 0,
      is_active: s === null ? 1 : (s?.is_active ? 1 : 0),
    });
    setServiceModalOpen(true);
  }

  async function saveService() {
    const body = {
      category: serviceForm.category,
      name: serviceForm.name,
      price_min: parseInt(serviceForm.price_min, 10),
      price_max: parseInt(serviceForm.price_max, 10),
      unit: serviceForm.unit,
      features: serviceForm.features,
      is_featured: parseInt(serviceForm.is_featured, 10),
      is_active: parseInt(serviceForm.is_active, 10),
    };
    const url = serviceForm.id ? `/admin/services/${serviceForm.id}` : '/admin/services';
    const method = serviceForm.id ? 'PUT' : 'POST';
    await apiFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    setServiceModalOpen(false);
    toastMsg('Service saved');
    loadServices();
  }

  async function deleteService(id) {
    if (!confirm('Delete this service?')) return;
    await apiFetch(`/admin/services/${id}`, { method: 'DELETE', headers: authHeaders() });
    toastMsg('Deleted');
    loadServices();
  }

  function openTestimonialModal(t = null) {
    setTestimonialForm({
      id: t?.id || '',
      author_name: t?.author_name || '',
      business_name: t?.business_name || '',
      city: t?.city || '',
      content: t?.content || '',
      rating: t?.rating || 5,
      is_active: t === null ? 1 : (t?.is_active ? 1 : 0),
    });
    setTestimonialModalOpen(true);
  }

  async function saveTestimonial() {
    const body = {
      author_name: testimonialForm.author_name,
      business_name: testimonialForm.business_name,
      city: testimonialForm.city,
      content: testimonialForm.content,
      rating: parseInt(testimonialForm.rating, 10),
      is_active: parseInt(testimonialForm.is_active, 10),
    };
    const url = testimonialForm.id ? `/admin/testimonials/${testimonialForm.id}` : '/admin/testimonials';
    const method = testimonialForm.id ? 'PUT' : 'POST';
    await apiFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    setTestimonialModalOpen(false);
    toastMsg('Saved');
    loadTestimonials();
  }

  async function deleteTestimonial(id) {
    if (!confirm('Delete this review?')) return;
    await apiFetch(`/admin/testimonials/${id}`, { method: 'DELETE', headers: authHeaders() });
    toastMsg('Deleted');
    loadTestimonials();
  }

  async function changePassword() {
    if (passForm.next !== passForm.confirm) {
      toastMsg('Passwords do not match', true);
      return;
    }
    const r = await apiFetch('/admin/change-password', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ current_password: passForm.current, new_password: passForm.next }),
    }).then(() => true).catch(() => false);
    if (r) toastMsg('Password updated');
    else toastMsg('Current password incorrect', true);
  }

  const filteredSubmissions = useMemo(() => {
    if (!search) return submissions;
    const q = search.toLowerCase();
    return submissions.filter((s) => [s.name, s.business_name, s.service, s.phone].join(' ').toLowerCase().includes(q));
  }, [submissions, search]);

  const pageTitles = {
    analytics: 'Analytics',
    submissions: 'Submissions',
    services: 'Services & Pricing',
    testimonials: 'Testimonials',
    settings: 'Settings',
  };

  return (
    <>
      {!token && (
        <div id="loginScreen">
          <div className="login-box">
            <div className="login-logo">devworks</div>
            <div className="login-sub">Admin Panel — Sign In</div>
            <label className="login-label">Username</label>
            <input type="text" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
            <label className="login-label">Password</label>
            <input type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && login()} />
            <button className="login-btn" onClick={login}>Sign In →</button>
            {loginError && <div className="login-error">Invalid username or password.</div>}
          </div>
        </div>
      )}

      <div id="sidebar">
        <div className="sidebar-logo">devworks <span>Admin Panel v1.0</span></div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <div className={`nav-item ${page === 'analytics' ? 'active' : ''}`} onClick={() => { setPage('analytics'); loadAnalytics(); }}><span className="icon">📊</span> Analytics</div>
          <div className="nav-section-label">Leads</div>
          <div className={`nav-item ${page === 'submissions' ? 'active' : ''}`} onClick={() => { setPage('submissions'); loadSubmissions(statusFilter); }}><span className="icon">📥</span> Submissions <span className="nav-badge">{analytics?.newLeads || 0}</span></div>
          <div className="nav-section-label">Content</div>
          <div className={`nav-item ${page === 'services' ? 'active' : ''}`} onClick={() => { setPage('services'); loadServices(); }}><span className="icon">⚙️</span> Services & Pricing</div>
          <div className={`nav-item ${page === 'testimonials' ? 'active' : ''}`} onClick={() => { setPage('testimonials'); loadTestimonials(); }}><span className="icon">⭐</span> Testimonials</div>
          <div className="nav-section-label">Account</div>
          <div className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}><span className="icon">🔑</span> Settings</div>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>↩ Sign Out</button>
        </div>
      </div>

      <div id="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitles[page]}</div>
          <div className="topbar-user"><span className="user-dot"></span> <span>{username}</span></div>
        </div>

        <div className={`page ${page === 'analytics' ? 'active' : ''}`} id="page-analytics">
          <div className="page-title-row">
            <div><div className="page-title">Analytics</div><div className="page-sub">Traffic and lead overview</div></div>
          </div>
          <div className="stats-grid" id="analyticsStats">
            <div className="stat-card orange"><div className="stat-label">Total Page Views</div><div className="stat-value">{analytics?.totalViews ?? 0}</div><div className="stat-sub">{analytics?.todayViews ?? 0} today</div></div>
            <div className="stat-card blue"><div className="stat-label">Views This Week</div><div className="stat-value">{analytics?.weekViews ?? 0}</div><div className="stat-sub">Last 7 days</div></div>
            <div className="stat-card gold"><div className="stat-label">Total Leads</div><div className="stat-value">{analytics?.totalLeads ?? 0}</div><div className="stat-sub">{analytics?.weekLeads ?? 0} this week</div></div>
            <div className="stat-card green"><div className="stat-label">New Leads</div><div className="stat-value">{analytics?.newLeads ?? 0}</div><div className="stat-sub">Awaiting response</div></div>
          </div>
          <div className="chart-wrap">
            <div className="chart-title">Page Views — Last 30 Days</div>
            <div className="bar-chart" id="viewsChart">
              {(analytics?.viewsByDay || []).map((v) => {
                const maxV = Math.max(...(analytics?.viewsByDay || [{ views: 1 }]).map((x) => x.views), 1);
                const height = Math.max(4, Math.round((v.views / maxV) * 100));
                return (
                  <div className="bar-wrap" key={v.day}>
                    <div className="bar" style={{ height }} title={`${v.day}: ${v.views} views`}></div>
                    <div className="bar-label">{v.day.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="two-col">
            <div className="table-wrap">
              <div className="table-header"><div className="table-header-title">Top Services (by leads)</div></div>
              <table><thead><tr><th>Service</th><th>Leads</th></tr></thead>
                <tbody>
                  {(analytics?.leadsByService || []).map((s) => (
                    <tr key={s.service}><td>{s.service}</td><td><strong style={{ color: 'var(--accent)' }}>{s.count}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-wrap">
              <div className="table-header"><div className="table-header-title">Recent Leads</div></div>
              <table><thead><tr><th>Name</th><th>Service</th><th>Date</th></tr></thead>
                <tbody>
                  {(analytics?.recentLeads || []).map((l) => (
                    <tr key={l.id}>
                      <td>{l.name}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--muted2)' }}>{l.service || '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--muted2)' }}>{(l.created_at || '').slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={`page ${page === 'submissions' ? 'active' : ''}`} id="page-submissions">
          <div className="page-title-row">
            <div><div className="page-title">Submissions</div><div className="page-sub">Contact form leads</div></div>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <select className="form-select" style={{ width: 140 }} onChange={(e) => { setStatusFilter(e.target.value); loadSubmissions(e.target.value); }}>
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
                <option value="spam">Spam</option>
              </select>
              <input type="text" className="search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Business</th><th>Service</th><th>Budget</th><th>Phone</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredSubmissions.length === 0 && (
                  <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon">📭</div><p>No submissions yet</p></div></td></tr>
                )}
                {filteredSubmissions.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ color: 'var(--muted2)' }}>{s.business_name || '—'}</td>
                    <td style={{ fontSize: '.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.service || '—'}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--muted2)' }}>{s.budget || '—'}</td>
                    <td><a href={`tel:${s.phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.phone}</a></td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td style={{ fontSize: '.78rem', color: 'var(--muted2)' }}>{(s.created_at || '').slice(0, 10)}</td>
                    <td>
                      <div className="btn-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openLead(s)}>View</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteLead(s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`page ${page === 'services' ? 'active' : ''}`} id="page-services">
          <div className="page-title-row">
            <div><div className="page-title">Services & Pricing</div><div className="page-sub">Manage what appears on your portfolio</div></div>
            <button className="btn btn-primary" onClick={() => openServiceModal()}>+ Add Service</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Price Range</th><th>Featured</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="cat-tag">{s.category}</span></td>
                    <td style={{ color: 'var(--gold)' }}>₹{s.price_min.toLocaleString('en-IN')} – ₹{s.price_max.toLocaleString('en-IN')}{s.unit === 'month' ? '/mo' : ''}</td>
                    <td>{s.is_featured ? <span style={{ color: 'var(--gold)' }}>★ Yes</span> : <span style={{ color: 'var(--muted)' }}>No</span>}</td>
                    <td><span className={s.is_active ? 'badge badge-closed' : 'badge badge-spam'}>{s.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <div className="btn-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openServiceModal(s)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteService(s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`page ${page === 'testimonials' ? 'active' : ''}`} id="page-testimonials">
          <div className="page-title-row">
            <div><div className="page-title">Testimonials</div><div className="page-sub">Client reviews shown on your portfolio</div></div>
            <button className="btn btn-primary" onClick={() => openTestimonialModal()}>+ Add Review</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Business</th><th>City</th><th>Review</th><th>Rating</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {testimonials.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.author_name}</strong></td>
                    <td style={{ color: 'var(--muted2)' }}>{t.business_name || '—'}</td>
                    <td style={{ color: 'var(--muted2)' }}>{t.city || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.82rem' }}>{t.content}</td>
                    <td style={{ color: 'var(--gold)' }}>{'★'.repeat(t.rating || 5)}</td>
                    <td><span className={t.is_active ? 'badge badge-closed' : 'badge badge-spam'}>{t.is_active ? 'Active' : 'Hidden'}</span></td>
                    <td>
                      <div className="btn-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openTestimonialModal(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTestimonial(t.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`page ${page === 'settings' ? 'active' : ''}`} id="page-settings">
          <div className="page-title-row"><div><div className="page-title">Settings</div><div className="page-sub">Account management</div></div></div>
          <div className="table-wrap" style={{ maxWidth: 440, padding: '2rem' }}>
            <div className="modal-title">Change Password</div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={passForm.current} onChange={(e) => setPassForm({ ...passForm, current: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={passForm.next} onChange={(e) => setPassForm({ ...passForm, next: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" onClick={changePassword}>Update Password</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${leadModalOpen ? 'open' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setLeadModalOpen(false)}>
        <div className="modal" style={{ width: 560 }}>
          <div className="modal-title">Lead Details</div>
          {leadDetail && (
            <div className="lead-detail">
              <p><strong>Name</strong>{leadDetail.name}</p>
              <p><strong>Business</strong>{leadDetail.business_name || '—'}</p>
              <p><strong>Phone</strong><a href={`tel:${leadDetail.phone}`} style={{ color: 'var(--accent)' }}>{leadDetail.phone}</a></p>
              <p><strong>Service</strong>{leadDetail.service || '—'}</p>
              <p><strong>Budget</strong>{leadDetail.budget || '—'}</p>
              <p><strong>Message</strong>{leadDetail.message || '—'}</p>
              <p><strong>Submitted</strong>{leadDetail.created_at}</p>
            </div>
          )}
          <div className="modal-footer">
            <select className="form-select" defaultValue={leadDetail?.status || 'new'} onChange={(e) => updateLeadStatus(e.target.value)}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
              <option value="spam">Spam</option>
            </select>
            <button className="btn btn-primary" onClick={() => updateLeadStatus(leadDetail?.status || 'new')}>Save Status</button>
            <button className="btn btn-ghost" onClick={() => setLeadModalOpen(false)}>Close</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${serviceModalOpen ? 'open' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setServiceModalOpen(false)}>
        <div className="modal">
          <div className="modal-title">{serviceForm.id ? 'Edit Service' : 'Add Service'}</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Service Name</label><input className="form-input" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Unit</label><select className="form-select" value={serviceForm.unit} onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })}><option value="project">Project</option><option value="month">Month</option></select></div>
            <div className="form-group"><label className="form-label">Price Min</label><input className="form-input" type="number" value={serviceForm.price_min} onChange={(e) => setServiceForm({ ...serviceForm, price_min: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Price Max</label><input className="form-input" type="number" value={serviceForm.price_max} onChange={(e) => setServiceForm({ ...serviceForm, price_max: e.target.value })} /></div>
            <div className="form-group full"><label className="form-label">Features (comma separated)</label><textarea className="form-textarea" value={serviceForm.features} onChange={(e) => setServiceForm({ ...serviceForm, features: e.target.value })}></textarea></div>
            <div className="form-group"><label className="form-label">Featured</label><div className={`toggle ${serviceForm.is_featured ? 'on' : ''}`} onClick={() => setServiceForm({ ...serviceForm, is_featured: serviceForm.is_featured ? 0 : 1 })}></div></div>
            <div className="form-group"><label className="form-label">Active</label><div className={`toggle ${serviceForm.is_active ? 'on' : ''}`} onClick={() => setServiceForm({ ...serviceForm, is_active: serviceForm.is_active ? 0 : 1 })}></div></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setServiceModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveService}>Save Service</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${testimonialModalOpen ? 'open' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setTestimonialModalOpen(false)}>
        <div className="modal">
          <div className="modal-title">{testimonialForm.id ? 'Edit Review' : 'Add Review'}</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={testimonialForm.author_name} onChange={(e) => setTestimonialForm({ ...testimonialForm, author_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Business</label><input className="form-input" value={testimonialForm.business_name} onChange={(e) => setTestimonialForm({ ...testimonialForm, business_name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">City</label><input className="form-input" value={testimonialForm.city} onChange={(e) => setTestimonialForm({ ...testimonialForm, city: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Rating</label><input className="form-input" type="number" value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })} /></div>
            <div className="form-group full"><label className="form-label">Review</label><textarea className="form-textarea" value={testimonialForm.content} onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}></textarea></div>
            <div className="form-group"><label className="form-label">Active</label><div className={`toggle ${testimonialForm.is_active ? 'on' : ''}`} onClick={() => setTestimonialForm({ ...testimonialForm, is_active: testimonialForm.is_active ? 0 : 1 })}></div></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setTestimonialModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTestimonial}>Save Review</button>
          </div>
        </div>
      </div>

      <div id="toast" className={`${toast.show ? 'show' : ''} ${toast.error ? 'error' : ''}`}>{toast.msg}</div>
    </>
  );
}
