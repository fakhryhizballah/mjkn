require('dotenv').config();
const express    = require('express');
const sequelize  = require('./config/database');
const routes     = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ──────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-username, x-password, x-token');
  next();
});
app.use(express.json());

// ── Routes ────────────────────────────────────────────────
app.use('/', routes);

// ── Fallback — root & 404 ─────────────────────────────────
app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(201).json({ metadata: { message: 'Methode tersebut tidak bisa digunakan...!!!', code: 201 } });
  }
  res.type('text').send(
    `Selamat Datang di Web Service Antrean BPJS Mobile JKN FKTL\n\n` +
    `Endpoint tersedia:\n` +
    `  GET  /auth\n` +
    `  POST /statusantrean\n` +
    `  POST /ambilantrean\n` +
    `  POST /checkinantrean\n` +
    `  POST /batalantrean\n` +
    `  POST /sisaantrean\n` +
    `  POST /jadwaloperasirs\n` +
    `  POST /jadwaloperasipasien\n` +
    `  POST /pasienbaru\n`
  );
});

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('[DB] MariaDB connected');
    app.listen(PORT, () => console.log(`[APP] Running on port ${PORT}`));
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });
