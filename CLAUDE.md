# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Node.js/Express API for BPJS FKTL (Indonesian national health insurance) queue management system. Refactored from PHP (`index.php`) to Express.js + Sequelize with MariaDB backend.

## Commands

```bash
npm start          # Production: node app.js
npm run dev        # Development with nodemon
```

## Architecture

**Flat structure** - controllers and middleware live in root directory (not in `controllers/` or `middleware/` subdirectories):

```
Root files:
├── app.js                          # Entry point, Express setup
├── index.js                        # Alternative entry (unused)
├── db.js                           # Reusable DB helpers (getOne, getRow, getAll, execute, insert)
├── auth.js                         # Middleware: authBasic (GET) & authToken (POST)
├── routes/                         # Route definitions
└── config/                         # Database configuration
```

**Controllers** (all in root):
- `authController.js` - GET /auth - Generate API token
- `statusAntreanController.js` - POST /statusantrean - Queue status inquiry
- `ambilAntreanController.js` - POST /ambilantrean - Book new queue
- `antreanController.js` - POST /checkinantrean, /batalantrean, /sisaantrean
- `operasiController.js` - POST /jadwaloperasirs, /jadwaloperasipasien
- `pasienBaruController.js` - POST /pasienbaru - Register new patient

## Database

**Connection**: MariaDB via Sequelize, configured in `config/database.js` (create if missing).

**Required tables**:
```sql
-- API tokens
CREATE TABLE IF NOT EXISTS token_api (
  username VARCHAR(50) PRIMARY KEY,
  token    VARCHAR(64),
  expired  DATETIME
);

-- Queue bookings (exists from SIMRS)
referensi_mobilejkn_bpjs

-- Patient registrations (exists from SIMRS)
reg_periksa, pasien, jadwal, poliklinik, dokter, maping_poli_bpjs, maping_dokter_dpjpvclaim
```

## Environment Variables

Required in `.env`:
- `API_USERNAME` - API auth username
- `API_PASSWORD` - API auth password
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MariaDB connection
- `WAKTU_TUNGGU` - Wait time per patient in minutes (default: 10)
- `CARA_BAYAR` - Payment method (default: "JKN")
- `PORT` - Server port (default: 3000)

## API Endpoints

| Method | Path                   | Auth Header            |
|--------|------------------------|------------------------|
| GET    | /auth                  | x-username, x-password |
| POST   | /statusantrean         | x-username, x-token    |
| POST   | /ambilantrean          | x-username, x-token    |
| POST   | /checkinantrean        | x-username, x-token    |
| POST   | /batalantrean          | x-username, x-token    |
| POST   | /sisaantrean           | x-username, x-token    |
| POST   | /jadwaloperasirs       | x-username, x-token    |
| POST   | /jadwaloperasipasien   | x-username, x-token    |
| POST   | /pasienbaru            | x-username, x-token    |

## Response Format

```json
// Success
{ "response": { ... }, "metadata": { "message": "Ok", "code": 200 } }

// Error
{ "metadata": { "message": "Error message", "code": 201 } }
```

## Key Implementation Details

1. **Token authentication**: Tokens stored in `token_api` table, expire after 1 hour
2. **Queue number format**: `{kd_poli}-{no_reg}` (e.g., "POLI-001")
3. **Booking code format**: `{YYYYMMDD}{6-digit-sequence}` (e.g., "20260424000001")
4. **Input validation**: SQL injection prevention via regex `/['\\]/` on string inputs
5. **Transactions**: Queue booking uses DB transactions with rollback on failure
