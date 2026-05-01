const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const hashPass = (password, rounds = 12) => {
    return bcrypt.hashSync(password, rounds);
};

const createToken = (username, password) => {
    // Verifikasi username dan password dari database
    // Jika valid, buat token
    const token = jwt.sign(
        { username, password },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return token;
};

const cekToken = (token) => {
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return 'true';
    } catch (error) {
        return 'false';
    }
};

const hariIndo = (date) => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[new Date(date).getDay()];
};

const noRegPoli = async (kdPoli, kdDokter, tanggal) => {
    // Implementasi query untuk mendapatkan no_reg berikutnya
};

module.exports = {
    hashPass,
    createToken,
    cekToken,
    hariIndo,
    noRegPoli
};