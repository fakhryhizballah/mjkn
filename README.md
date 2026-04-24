# API BPJS FKTL — Node.js / Express / Sequelize

Refaktor dari `index.php` ke Express.js + Sequelize (MariaDB).

## Struktur File

```
api-bpjs/
├── app.js                          # Entry point
├── .env.example                    # Template konfigurasi
├── config/
│   └── database.js                 # Koneksi Sequelize MariaDB
├── middleware/
│   ├── auth.js                     # authBasic (GET) & authToken (POST)
│   └── errorHandler.js             # Global error handler + asyncWrap
├── controllers/
│   ├── authController.js           # GET /auth → createToken
│   ├── statusAntreanController.js  # POST /statusantrean
│   ├── ambilAntreanController.js   # POST /ambilantrean
│   ├── antreanController.js        # POST /checkinantrean, /batalantrean, /sisaantrean
│   ├── operasiController.js        # POST /jadwaloperasirs, /jadwaloperasipasien
│   └── pasienBaruController.js     # POST /pasienbaru
├── routes/
│   └── index.js                    # Semua route terdaftar di sini
├── models/
│   └── Token.js                    # Model Sequelize untuk token_api
└── helpers/
    └── db.js                       # Helper: getOne, getRow, getAll, execute, insert
```

## Instalasi

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi DB dan credentials RS

npm install
npm start          # production
npm run dev        # development (nodemon)
```

## Tabel DDL yang Diperlukan

```sql
CREATE TABLE IF NOT EXISTS token_api (
  username VARCHAR(50) PRIMARY KEY,
  token    VARCHAR(64),
  expired  DATETIME
);
```

Tabel lain (`pasien`, `reg_periksa`, `referensi_mobilejkn_bpjs`, dll.) sudah ada dari SIMRS existing.

## Endpoint

| Method | Path                   | Header Auth               |
|--------|------------------------|---------------------------|
| GET    | /auth                  | x-username, x-password    |
| POST   | /statusantrean         | x-username, x-token       |
| POST   | /ambilantrean          | x-username, x-token       |
| POST   | /checkinantrean        | x-username, x-token       |
| POST   | /batalantrean          | x-username, x-token       |
| POST   | /sisaantrean           | x-username, x-token       |
| POST   | /jadwaloperasirs       | x-username, x-token       |
| POST   | /jadwaloperasipasien   | x-username, x-token       |
| POST   | /pasienbaru            | x-username, x-token       |

## Response Format

Sama persis dengan PHP original:

```json
// Sukses
{ "response": { ... }, "metadata": { "message": "Ok", "code": 200 } }

// Error
{ "metadata": { "message": "Pesan error", "code": 201 } }
```
