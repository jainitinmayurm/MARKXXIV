const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'meeting_db',
  password: 'Nitin@17934862', 
  port: 5432,
});

module.exports = pool;