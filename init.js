// db/init.js 鈥� Initialise la base PostgreSQL
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./postgres');

async function initDB() {
  console.log('馃殌 Initialisation de la base OtAkU+...');
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('鉁� Sch茅ma cr茅茅 avec succ猫s !');
  } catch (err) {
    console.error('鉂� Erreur init DB :', err.message);
  } finally {
    await pool.end();
  }
}

initDB();
