import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../components/api.js';

const PRICING_TABS = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'business', label: 'Business Software' },
  { key: 'industry', label: 'Industry Systems' },
  { key: 'web', label: 'Web & Apps' },
  { key: 'backend', label: 'Backend & API' },
  { key: 'monthly', label: 'Monthly Plans' },
];

const STATIC_CATEGORIES = [
  {
    icon: '🏪',
    title: 'Business & Retail Systems',
    desc: 'Billing, inventory, POS, employee & customer management. Tailored for shops, retail chains, and SMEs.',
    price: '₹15,000 – ₹1,50,000',
  },
  {
    icon: '🍽️',
    title: 'Hospitality & Food Systems',
    desc: 'Restaurant & hotel management, online ordering, table booking, and kitchen display systems.',
    price: '₹20,000 – ₹2,00,000',
  },
  {
    icon: '🏥',
    title: 'Healthcare & Clinic Systems',
    desc: 'Hospital, pharmacy, and clinic systems with billing, patient records, and appointment tracking.',
    price: '₹30,000 – ₹2,50,000',
  },
  {
    icon: '🏫',
    title: 'Education Systems',
    desc: 'School & college ERP systems with student, fee, and exam management modules.',
    price: '₹40,000 – ₹2,00,000',
  },
  {
    icon: '🌐',
    title: 'Web & SaaS Products',
    desc: 'Custom web apps, SaaS dashboards, and modern business websites built to scale.',
    price: '₹10,000 – ₹5,00,000',
  },
  {
    icon: '⚙️',
    title: 'Backend & API Services',
    desc: 'API development, payment integrations, and performance optimization for existing software.',
    price: '₹5,000 – ₹30,000',
  },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('popular');
  const [form, setForm] = useState({
    name: '',
    business_name: '',
    service: '',
    message: '',
    phone: '',
    budget: 'Under ₹20,000',
  });
  const [submitStatus, setSubmitStatus] = useState('idle');

  useEffect(() => {
    document.body.classList.add('home-body');
    return () => document.body.classList.remove('home-body');
  }, []);

  useEffect(() => {
    apiFetch('/track', {
      method: 'POST',
      body: JSON.stringify({ page: '/', referrer: document.referrer }),
    }).catch(() => undefined);

    apiFetch('/services').then(setServices).catch(() => setServices([]));
    apiFetch('/testimonials').then(setTestimonials).catch(() => setTestimonials([]));
    apiFetch('/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    if (!cursor || !ring) return;

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const animCursor = () => {
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(animCursor);
    };

    document.addEventListener('mousemove', onMove);
    animCursor();

    return () => {
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  const pricingItems = useMemo(() => {
    return services.filter((s) => s.category === activeTab);
  }, [services, activeTab]);

  const serviceGroups = useMemo(() => {
    const labels = {
      popular: '🔥 Most Popular',
      business: 'Business Software',
      industry: 'Industry Systems',
      web: 'Web & Apps',
      backend: 'Quick Services',
      monthly: 'Monthly Plans',
    };
    const grouped = {};
    services.forEach((s) => {
      grouped[s.category] = grouped[s.category] || [];
      grouped[s.category].push(s);
    });
    return Object.keys(labels).map((key) => ({ key, label: labels[key], items: grouped[key] || [] }));
  }, [services]);

  async function handleSubmit() {
    if (!form.name || !form.phone) return;
    setSubmitStatus('sending');
    try {
      await apiFetch('/submit', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitStatus('sent');
    } catch {
      setSubmitStatus('idle');
    }
  }

  return (
    <>
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cursorRing"></div>

      <nav>
        <div className="nav-logo">dev<span>works</span></div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#process">Process</a></li>
          <li><a href="#reviews">Reviews</a></li>
        </ul>
        <a href="#contact" className="nav-cta">Get a Quote →</a>
      </nav>

      <section className="hero">
        <div className="hero-grid-bg"></div>
        <div className="hero-glow"></div>
        <div className="hero-glow2"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Available for new projects · Chennai, India
          </div>
          <h1>I Build Software<br />That <em>Runs</em><br />Your Business.</h1>
          <p className="hero-sub">
            From <strong>shop billing systems</strong> to <strong>hospital management platforms</strong> — custom software built fast, built right, and built to grow with you.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">Start a Project →</a>
            <a href="#pricing" className="btn-secondary">View Pricing</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-num">50+</div>
              <div className="stat-label">Services Offered</div>
            </div>
            <div>
              <div className="stat-num">₹2K</div>
              <div className="stat-label">Starting Price</div>
            </div>
            <div>
              <div className="stat-num">24hr</div>
              <div className="stat-label">Response Time</div>
            </div>
            <div>
              <div className="stat-num">100%</div>
              <div className="stat-label">Custom Built</div>
            </div>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <div className="services-header reveal">
          <div>
            <div className="section-label">What I Do</div>
            <h2 className="section-title">Software for Every<br />Kind of Business</h2>
          </div>
          <p className="section-desc">Whether you run a shop, clinic, school, or restaurant — I build the system that makes it run smoother.</p>
        </div>
        <div className="service-categories reveal">
          {STATIC_CATEGORIES.map((c) => (
            <div className="service-cat" key={c.title}>
              <span className="cat-icon">{c.icon}</span>
              <div className="cat-title">{c.title}</div>
              <div className="cat-desc">{c.desc}</div>
              <span className="cat-price">{c.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="pricing-header reveal">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple, Fixed-Price Packages</h2>
          <p className="section-desc">Choose a package or request a custom quote. Every system is tailor-made for your business.</p>
        </div>
        <div className="pricing-tabs">
          {PRICING_TABS.map((t) => (
            <button
              key={t.key}
              className={`pricing-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="pricing-grid reveal" id="pricingGrid">
          {pricingItems.map((item) => (
            <div className={`price-card ${item.is_featured ? 'featured' : ''}`} key={item.id}>
              <div className="price-name">{item.name}</div>
              <div className="price-range">₹{item.price_min.toLocaleString('en-IN')} – ₹{item.price_max.toLocaleString('en-IN')}</div>
              <div className="price-note">One-time project fee{item.unit === 'month' ? ' (monthly)' : ''}</div>
              <hr className="price-divider" />
              {String(item.features || '').split(',').filter(Boolean).map((f) => (
                <div className="price-feature" key={f}>{f}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="projects">
        <div className="reveal">
          <div className="section-label">Projects</div>
          <h2 className="section-title">Recent Systems Built<br />For Real Businesses</h2>
          <p className="section-desc">A few highlights from delivery work across retail, hospitality, and services.</p>
        </div>
        <div className="project-grid reveal">
          {projects.map((p) => (
            <div className="project-card" key={p.id}>
              {p.image_url ? <img className="project-img" src={p.image_url} alt={p.title} /> : null}
              <div className="project-meta">
                <span className="project-tag">{p.industry || 'Business'}</span>
                {p.is_featured ? <span className="project-tag featured">Featured</span> : null}
              </div>
              <div className="project-title">{p.title}</div>
              <div className="project-desc">{p.summary}</div>
              {p.outcome ? <div className="project-outcome">Outcome: {p.outcome}</div> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>How It Works</div>
          <h2 className="section-title">Simple 5-Step Process</h2>
          <p className="section-desc" style={{ margin: '0.5rem auto 0' }}>From first message to live software — here is exactly what to expect.</p>
        </div>
        <div className="process-steps reveal">
          {[
            ['01', 'Discovery Call', 'We discuss your business needs, goals, and the features you want in your system.'],
            ['02', 'Proposal & Quote', 'You get a clear breakdown of features, timeline, and fixed price — no surprises.'],
            ['03', 'Design & Build', 'I build your software with regular updates so you are never in the dark.'],
            ['04', 'Review & Revise', 'You test the system. We fix, tweak, and improve until you are satisfied.'],
            ['05', 'Launch & Support', 'Go live with full training. Ongoing maintenance plans available monthly.'],
          ].map(([num, title, desc]) => (
            <div className="process-step" key={num}>
              <div className="step-num">{num}</div>
              <div className="step-title">{title}</div>
              <div className="step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="reviews">
        <div className="reveal">
          <div className="section-label">Client Reviews</div>
          <h2 className="section-title">Businesses That<br />Trust My Work</h2>
        </div>
        <div className="testimonials-grid reveal">
          {testimonials.map((t) => (
            <div className="testimonial" key={t.id}>
              <div className="stars">{'★'.repeat(t.rating || 5)}</div>
              <div className="testimonial-quote">{t.content}</div>
              <div className="testimonial-author">
                <div className="author-avatar">{(t.author_name || 'A')[0]}</div>
                <div>
                  <div className="author-name">{t.author_name}</div>
                  <div className="author-biz">{t.business_name}{t.city ? `, ${t.city}` : ''}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-wrap">
          <div className="reveal contact-info">
            <div className="section-label">Get In Touch</div>
            <h2 className="section-title">Let's Build<br />Something Great</h2>
            <p className="section-desc" style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>Tell me about your business and what you need. I will get back to you within 24 hours with a clear quote.</p>
            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <div className="contact-item-label">Email</div>
                  <div className="contact-item-val">hello@devworks.in</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div>
                  <div className="contact-item-label">WhatsApp</div>
                  <div className="contact-item-val">+91 98XXX XXXXX</div>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <div className="contact-item-label">Location</div>
                  <div className="contact-item-val">Chennai, Tamil Nadu</div>
                </div>
              </div>
            </div>
          </div>
          <div className="contact-form reveal">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input type="text" className="form-input" placeholder="Rajesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input type="text" className="form-input" placeholder="Kumar Enterprises" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Service Needed</label>
              <select className="form-select" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                <option value="">Select a service...</option>
                {serviceGroups.map((g) => (
                  <optgroup key={g.key} label={g.label}>
                    {g.items.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tell Me About Your Business</label>
              <textarea className="form-textarea" placeholder="Describe your business and what you want the software to do..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp</label>
                <input type="text" className="form-input" placeholder="+91 98XXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Budget Range</label>
                <select className="form-select" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                  <option>Under ₹20,000</option>
                  <option>₹20,000 – ₹50,000</option>
                  <option>₹50,000 – ₹1,00,000</option>
                  <option>₹1,00,000 – ₹3,00,000</option>
                  <option>₹3,00,000+</option>
                </select>
              </div>
            </div>
            <button className="form-submit" onClick={handleSubmit} disabled={submitStatus !== 'idle'}>
              {submitStatus === 'sent' ? "✓ Message Sent! I'll reply within 24 hours." : 'Send Message & Get Free Quote →'}
            </button>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-logo">devworks</div>
        <div className="footer-copy">© 2025 DevWorks. All rights reserved. Chennai, India.</div>
        <div className="footer-links">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </>
  );
}
