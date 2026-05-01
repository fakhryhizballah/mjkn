const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    auth,
    statusAntrean,
    ambilAntrean,
    checkinAntrean,
    batalAntrean,
    sisaAntrean,
    jadwalOperasiRS,
    jadwalOperasiPasien,
    pasienBaru,
    initalize
} = require('../controllers');

// Auth
router.get('/auth', auth);

// Public routes
router.get('/', initalize);

// Protected routes
router.post('/statusantrean', authMiddleware, statusAntrean);
router.post('/ambilantrean', authMiddleware, ambilAntrean);
router.post('/checkinantrean', authMiddleware, checkinAntrean);
router.post('/batalantrean', authMiddleware, batalAntrean);
router.post('/sisaantrean', authMiddleware, sisaAntrean);
// router.post('/jadwaloperasirs', authMiddleware, jadwalOperasiRS);
// router.post('/jadwaloperasipasien', authMiddleware, jadwalOperasiPasien);
// router.post('/pasienbaru', authMiddleware, pasienBaru);

module.exports = router;