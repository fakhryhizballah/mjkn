const express = require('express');
const router  = express.Router();

const { authBasic, authToken }   = require('../middleware/auth');
const { createToken }            = require('../controllers/authController');
const { statusAntrean }          = require('../controllers/statusAntreanController');
const { ambilAntrean }           = require('../controllers/ambilAntreanController');
const { checkinAntrean, batalAntrean, sisaAntrean } = require('../controllers/antreanController');
const { jadwalOperasiRS, jadwalOperasiPasien }      = require('../controllers/operasiController');
const { pasienBaru }             = require('../controllers/pasienBaruController');

// GET - auth
router.get('/auth', authBasic, createToken);

// POST - semua endpoint pakai authToken
router.post('/statusantrean',      authToken, statusAntrean);
router.post('/ambilantrean',       authToken, ambilAntrean);
router.post('/checkinantrean',     authToken, checkinAntrean);
router.post('/batalantrean',       authToken, batalAntrean);
router.post('/sisaantrean',        authToken, sisaAntrean);
router.post('/jadwaloperasirs',    authToken, jadwalOperasiRS);
router.post('/jadwaloperasipasien',authToken, jadwalOperasiPasien);
router.post('/pasienbaru',         authToken, pasienBaru);

module.exports = router;
