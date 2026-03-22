import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from './pool.js';

dotenv.config();

const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'Arshath@77';

(async () => {
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'UPDATE admins SET password = $1 WHERE username = $2',
      [hash, username]
    );
    if (result.rowCount === 0) {
      await pool.query('INSERT INTO admins (username, password) VALUES ($1, $2)', [username, hash]);
      console.log(`Admin created: ${username} / ${password}`);
    } else {
      console.log(`Admin password updated: ${username} / ${password}`);
    }
  } catch (err) {
    console.error('Admin reset failed', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
