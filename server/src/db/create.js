const { Client } = require('pg');

const passwords = ['', 'postgres', 'password', 'admin', '123456', 'root', 'navde'];

async function tryPasswords() {
  for (const pw of passwords) {
    const client = new Client({
      host: 'localhost', port: 5432, user: 'postgres', password: pw, database: 'postgres',
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Password is: "${pw}"`);
      
      const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'exceed'");
      if (res.rows.length === 0) {
        await client.query('CREATE DATABASE exceed');
        console.log('Database "exceed" created!');
      } else {
        console.log('Database "exceed" already exists.');
      }
      await client.end();
      return pw;
    } catch (err) {
      await client.end().catch(() => {});
    }
  }
  console.log('Could not connect with any common password.');
  console.log('Please set your PostgreSQL password in server/.env');
  console.log('DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/exceed');
}

tryPasswords();
