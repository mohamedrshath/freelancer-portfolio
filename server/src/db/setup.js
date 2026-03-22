import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

(async () => {
  try {
    await pool.query(schemaSql);
    console.log('Database schema applied');
  } catch (err) {
    console.error('Failed to apply schema', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
