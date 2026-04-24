const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { fail, DATE_RE, today, getOne, getRow, execute } = require('../helpers/db');

const WAKTU_TUNGGU = parseInt(process.env.WAKTU_TUNGGU) || 10;

// ─── CHECKIN ───────────────────────────────────────────────
exports.checkinAntrean = async (req, res) => {
  const { kodebooking, waktu } = req.body;

  if (!kodebooking) return fail(res, 'Kode Booking tidak boleh kosong');
  if (/['\\]/.test(kodebooking)) return fail(res, 'Format Kode Booking salah');
  if (!waktu) return fail(res, 'Waktu tidak boleh kosong');

  const tanggal       = new Date(waktu).toISOString().slice(0, 10);
  const tanggalchekin = new Date(waktu).toISOString().slice(0, 19).replace('T', ' ');

  if (!DATE_RE.test(tanggal)) return fail(res, 'Format Tanggal Checkin tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (today() > tanggal)     return fail(res, 'Waktu Checkin tidak berlaku mundur');

  const booking = await getRow(
    `SELECT nobooking, tanggalperiksa, status, validasi, LEFT(jampraktek,5) AS jampraktek FROM referensi_mobilejkn_bpjs WHERE nobooking = :nb`,
    { nb: kodebooking }
  );
  if (!booking) return fail(res, 'Data Booking tidak ditemukan');
  if (booking.status === 'Batal')   return fail(res, `Booking Anda Sudah Dibatalkan pada tanggal ${booking.validasi}`);
  if (booking.status === 'Checkin') return fail(res, `Anda Sudah Checkin pada tanggal ${booking.validasi}`);

  if (booking.status === 'Belum') {
    const diff = await getOne(
      `SELECT TIMESTAMPDIFF(MINUTE, :jadwal, :chekin) AS diff`,
      { jadwal: `${booking.tanggalperiksa} ${booking.jampraktek}:00`, chekin: tanggalchekin }
    );
    if (parseInt(diff) >= 0) return fail(res, 'Chekin Anda sudah expired. Silahkan konfirmasi ke loket pendaftaran');

    const updated = await execute(
      `UPDATE referensi_mobilejkn_bpjs SET status='Checkin', validasi=NOW() WHERE nobooking = :nb`,
      { nb: kodebooking }
    );
    if (!updated) return fail(res, 'Maaf terjadi kesalahan, hubungi Admnistrator..', 401);
    return res.status(200).json({ metadata: { message: 'Ok', code: 200 } });
  }
};

// ─── BATAL ANTREAN ─────────────────────────────────────────
exports.batalAntrean = async (req, res) => {
  const { kodebooking, keterangan } = req.body;

  if (!kodebooking) return fail(res, 'Kode Booking tidak boleh kosong');
  if (/['\\]/.test(kodebooking)) return fail(res, 'Format Kode Booking salah');
  if (!keterangan)  return fail(res, 'Keterangan tidak boleh kosong');
  if (/['\\]/.test(keterangan)) return fail(res, 'Format Keterangan salah');

  const booking = await getRow(
    `SELECT nobooking, no_rawat, tanggalperiksa, status, validasi, nomorreferensi, norm FROM referensi_mobilejkn_bpjs WHERE nobooking = :nb`,
    { nb: kodebooking }
  );
  if (!booking) return fail(res, 'Data Booking tidak ditemukan');
  if (booking.status === 'Batal')   return fail(res, `Booking Anda Sudah Dibatalkan pada tanggal ${booking.validasi}`);
  if (today() > booking.tanggalperiksa) return fail(res, 'Pembatalan Antrean tidak berlaku mundur');
  if (booking.status === 'Checkin') return fail(res, `Anda Sudah Checkin Pada Tanggal ${booking.validasi}, Pendaftaran Tidak Bisa Dibatalkan`);

  if (booking.status === 'Belum') {
    const t = await sequelize.transaction();
    try {
      await sequelize.query(
        `UPDATE referensi_mobilejkn_bpjs SET status='Batal', validasi=NOW() WHERE nobooking = :nb`,
        { replacements: { nb: kodebooking }, transaction: t, type: QueryTypes.UPDATE }
      );
      await sequelize.query(
        `DELETE FROM reg_periksa WHERE no_rawat = :nr`,
        { replacements: { nr: booking.no_rawat }, transaction: t, type: QueryTypes.DELETE }
      );
      await sequelize.query(
        `INSERT INTO referensi_mobilejkn_bpjs_batal VALUES(:norm,:no_rawat,:nomorreferensi,NOW(),:ket,'Belum',:nb)`,
        { replacements: { norm: booking.norm, no_rawat: booking.no_rawat, nomorreferensi: booking.nomorreferensi||'', ket: keterangan, nb: kodebooking },
          transaction: t, type: QueryTypes.INSERT }
      );
      await t.commit();
      return res.status(200).json({ metadata: { message: 'Ok', code: 200 } });
    } catch (e) {
      await t.rollback();
      return fail(res, 'Maaf Terjadi Kesalahan, Hubungi Admnistrator..');
    }
  }
};

// ─── SISA ANTREAN ──────────────────────────────────────────
exports.sisaAntrean = async (req, res) => {
  const { kodebooking } = req.body;

  if (!kodebooking) return fail(res, 'Kode Booking tidak boleh kosong');
  if (/['\\]/.test(kodebooking)) return fail(res, 'Format Kode Booking salah');

  const booking = await getRow(
    `SELECT nobooking, no_rawat, tanggalperiksa, status, validasi, nomorreferensi, kodedokter, kodepoli, jampraktek FROM referensi_mobilejkn_bpjs WHERE nobooking = :nb`,
    { nb: kodebooking }
  );
  if (!booking) return fail(res, 'Data Booking tidak ditemukan');
  if (booking.status === 'Batal')  return fail(res, 'Data booking sudah dibatalkan');
  if (booking.status === 'Belum')  return fail(res, 'Anda belum melakukan checkin, Silahkan checkin terlebih dahulu');

  if (booking.status === 'Checkin') {
    const kodedokter = await getOne(`SELECT kd_dokter FROM maping_dokter_dpjpvclaim WHERE kd_dokter_bpjs=:kode`, { kode: booking.kodedokter });
    const kodepoli   = await getOne(`SELECT kd_poli_rs FROM maping_poli_bpjs WHERE kd_poli_bpjs=:kode`, { kode: booking.kodepoli });
    const noreg      = await getOne(`SELECT no_reg FROM reg_periksa WHERE no_rawat=:nr`, { nr: booking.no_rawat });

    const data = await getRow(
      `SELECT r.kd_poli, p.nm_poli, d.nm_dokter, r.no_reg,
        COUNT(r.no_rawat) AS total_antrean,
        IFNULL(SUM(CASE WHEN r.stts='Belum' THEN 1 ELSE 0 END),0) AS sisa_antrean
       FROM reg_periksa r
       INNER JOIN poliklinik p ON p.kd_poli = r.kd_poli
       INNER JOIN dokter d ON d.kd_dokter = r.kd_dokter
       WHERE r.kd_dokter=:dokter AND r.kd_poli=:poli AND r.tgl_registrasi=:tgl
         AND CONVERT(RIGHT(r.no_reg,3),signed) < CONVERT(RIGHT(:noreg,3),signed)`,
      { dokter: kodedokter, poli: kodepoli, tgl: booking.tanggalperiksa, noreg }
    );
    if (!data?.nm_poli) return fail(res, 'Data antrian tidak ditemukan');

    const antreanPanggil = await getOne(
      `SELECT no_reg FROM reg_periksa WHERE stts='Belum' AND kd_dokter=:dokter AND kd_poli=:poli AND tgl_registrasi=:tgl
       AND CONVERT(RIGHT(no_reg,3),signed)<=CONVERT(RIGHT(:noreg,3),signed) ORDER BY CONVERT(RIGHT(no_reg,3),signed) LIMIT 1`,
      { dokter: kodedokter, poli: kodepoli, tgl: booking.tanggalperiksa, noreg }
    );

    const sisa = Math.max(0, parseInt(data.sisa_antrean));
    return res.status(200).json({
      response: {
        nomorantrean: `${data.kd_poli}-${noreg}`,
        namapoli: data.nm_poli,
        namadokter: data.nm_dokter,
        sisaantrean: sisa,
        antreanpanggil: `${data.kd_poli}-${antreanPanggil}`,
        waktutunggu: sisa * WAKTU_TUNGGU * 1000,
        keterangan: 'Datanglah Minimal 30 Menit, jika no antrian anda terlewat, silakan konfirmasi ke bagian Pendaftaran atau Perawat Poli, Terima Kasih ..'
      },
      metadata: { message: 'Ok', code: 200 }
    });
  }
};
