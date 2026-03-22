import bcrypt from 'bcryptjs';
import pool from './pool.js';

const seedServices = [
  ['popular', 'Shop Billing / POS System', 15000, 50000, 'project', 'Product catalog,Invoice printing,Daily sales report', true],
  ['popular', 'Restaurant Management System', 30000, 120000, 'project', 'Table & order management,Menu & billing,Kitchen display', false],
  ['popular', 'Inventory Management System', 15000, 60000, 'project', 'Stock tracking,Low stock alerts,Supplier management', true],
  ['popular', 'Booking System', 20000, 120000, 'project', 'Online bookings,Calendar view,SMS reminders', false],
  ['popular', 'Business Website', 5000, 25000, 'project', 'Mobile responsive,Contact form,Google Maps', false],
  ['business', 'Business Management System', 30000, 150000, 'project', 'Multi-module system,User roles,Reports & analytics', false],
  ['business', 'CRM System', 30000, 120000, 'project', 'Lead tracking,Follow-up reminders,Sales pipeline', false],
  ['business', 'Employee Management System', 20000, 70000, 'project', 'Attendance,Payroll,Leave management', false],
  ['industry', 'Hospital Management System', 50000, 250000, 'project', 'Patient records,Billing & pharmacy,Doctor scheduling', false],
  ['industry', 'School Management System', 40000, 200000, 'project', 'Admissions,Fee management,Exam & results', true],
  ['industry', 'Hotel Management System', 50000, 200000, 'project', 'Room booking,Check-in/out,Billing & reports', false],
  ['industry', 'Gym Management System', 20000, 80000, 'project', 'Member profiles,Renewals & billing,Attendance', false],
  ['web', 'Full Stack Web Application', 40000, 200000, 'project', 'Frontend + backend,Database design,API + auth', false],
  ['web', 'SaaS Application', 80000, 500000, 'project', 'Multi-tenant,Subscription billing,Admin dashboard', true],
  ['web', 'ERP System', 100000, 600000, 'project', 'All business modules,Role-based access,Reporting engine', false],
  ['backend', 'REST API Development', 5000, 30000, 'project', 'RESTful design,Documentation,Authentication', false],
  ['backend', 'Payment Gateway Integration', 5000, 25000, 'project', 'Razorpay / Stripe,UPI support,Refund handling', true],
  ['monthly', 'Website Maintenance', 2000, 15000, 'month', 'Updates & backups,Bug fixes,Content changes', true],
  ['monthly', 'Technical Support', 2000, 10000, 'month', 'Priority support,24hr response,Phone / WhatsApp', false],
  ['monthly', 'Software Maintenance', 5000, 25000, 'month', 'Feature updates,Performance tuning,Security patches', false],
];

const seedTestimonials = [
  ['Rajesh Kumar', 'Pharmacy Owner', 'Chennai', 'The billing software saved us hours every day. Fast delivery and explained everything clearly.', 5],
  ['Priya Nair', 'Restaurant Owner', 'Coimbatore', 'Our restaurant management system tracks orders, tables, and staff. Very professional work.', 5],
  ['Suresh Babu', 'School Principal', 'Madurai', 'Parents, teachers, and admin all have their own access. Excellent delivery and support.', 5],
  ['Meena Devi', 'Retail Shop Owner', 'Trichy', 'From inventory to billing to reports - the retail system handles everything. Staff learned it in a day!', 5],
  ['Anand Sharma', 'Travel Agency', 'Hyderabad', 'Got a full business website with booking system for a very fair price. Looks extremely professional.', 5],
  ['Karthik Rajan', 'Gym Owner', 'Bangalore', 'The gym system handles memberships, renewals, and payments automatically. Best investment this year.', 5],
];

const seedProjects = [
  ['Pharmacy POS Suite', 'Healthcare', 'Multi-branch billing with inventory sync and purchase alerts.', 'Node.js, Postgres, React', 'Reduced billing time by 45%', '', true],
  ['Restaurant Ops Console', 'Hospitality', 'Table, order, and kitchen display system with live updates.', 'React, Express, WebSockets', 'Improved order accuracy by 30%', '', true],
  ['School ERP Portal', 'Education', 'Admissions, fee tracking, and parent portal in one place.', 'Postgres, Express, React', 'Cut admin workload by 50%', '', false],
  ['Retail Analytics Hub', 'Retail', 'Sales dashboards and smart reordering suggestions.', 'React, Node.js, Postgres', 'Stock-outs reduced by 28%', '', false],
];

(async () => {
  try {
    const adminRes = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
    if (adminRes.rowCount === 0) {
      const hash = bcrypt.hashSync('Arshath@77', 10);
      await pool.query('INSERT INTO admins (username, password) VALUES ($1, $2)', ['admin', hash]);
      console.log('Default admin created: admin / Arshath@77');
    }

    const serviceCount = await pool.query('SELECT COUNT(*)::int AS c FROM services');
    if (serviceCount.rows[0].c === 0) {
      const insertService = `
        INSERT INTO services (category, name, price_min, price_max, unit, features, is_featured)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `;
      for (const s of seedServices) {
        await pool.query(insertService, s);
      }
      console.log('Sample services seeded');
    }

    const testCount = await pool.query('SELECT COUNT(*)::int AS c FROM testimonials');
    if (testCount.rows[0].c === 0) {
      const insertTest = `
        INSERT INTO testimonials (author_name, business_name, city, content, rating)
        VALUES ($1,$2,$3,$4,$5)
      `;
      for (const t of seedTestimonials) {
        await pool.query(insertTest, t);
      }
      console.log('Sample testimonials seeded');
    }

    const projectCount = await pool.query('SELECT COUNT(*)::int AS c FROM projects');
    if (projectCount.rows[0].c === 0) {
      const insertProject = `
        INSERT INTO projects (title, industry, summary, stack, outcome, image_url, is_featured)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `;
      for (const p of seedProjects) {
        await pool.query(insertProject, p);
      }
      console.log('Sample projects seeded');
    }
  } catch (err) {
    console.error('Seed failed', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
