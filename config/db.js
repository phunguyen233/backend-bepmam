const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'db.kcbennzbfdcdpthnwrvb.supabase.co',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Phunguyen1@',
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
