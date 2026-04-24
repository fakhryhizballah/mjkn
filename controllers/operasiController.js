const { fail, DATE_RE, today, getAll } = require('../helpers/db');

const OPERASI_SQL = `
  SELECT bo.no_rawat, bo.tanggal, po.nm_perawatan,
    mpb.kd_poli_bpjs, mpb.nm_poli_bpjs, bo.status, p.no_peserta
  FROM booking_operasi bo
  INNER JOIN reg_periksa rp ON bo.no_rawat = rp.no_rawat
  INNER JOIN pasien p ON p.no_rkm_medis = rp.no_rkm_medis
  INNER JOIN paket_operasi po ON bo.kode_paket = po.kode_paket
  INNER JOIN maping_poli_bpjs mpb ON mpb.kd_poli_rs = rp.kd_poli`;

const mapStatus = (status) => status === 'Menunggu' ? 0 : 1;

// ─── JADWAL OPERASI RS ─────────────────────────────────────
exports.jadwalOperasiRS = async (req, res) => {
  const { tanggalawal, tanggalakhir } = req.body;

  if (!tanggalawal)  return fail(res, 'Tanggal Awal tidak boleh kosong');
  if (!DATE_RE.test(tanggalawal)) return fail(res, 'Format Tanggal Awal tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (today() > tanggalawal)  return fail(res, 'Tanggal Awal tidak berlaku mundur');
  if (!tanggalakhir) return fail(res, 'Tanggal Akhir tidak boleh kosong');
  if (!DATE_RE.test(tanggalakhir)) return fail(res, 'Format Tanggal Akhir tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (today() > tanggalakhir) return fail(res, 'Tanggal Akhir tidak berlaku mundur');
  if (tanggalawal > tanggalakhir) return fail(res, 'Format tanggal awal harus lebih kecil dari tanggal akhir');

  const rows = await getAll(
    OPERASI_SQL + ` WHERE bo.tanggal BETWEEN :awal AND :akhir ORDER BY bo.tanggal, bo.jam_mulai`,
    { awal: tanggalawal, akhir: tanggalakhir }
  );

  if (!rows.length) return fail(res, 'Maaf tidak ada Jadwal Operasi pada tanggal tersebut');

  return res.status(200).json({
    response: {
      list: rows.map(r => ({
        kodebooking: r.no_rawat,
        tanggaloperasi: r.tanggal,
        jenistindakan: r.nm_perawatan,
        kodepoli: r.kd_poli_bpjs,
        namapoli: r.nm_poli_bpjs,
        terlaksana: mapStatus(r.status),
        nopeserta: r.no_peserta,
        lastupdate: Date.now()
      }))
    },
    metadata: { message: 'Ok', code: 200 }
  });
};

// ─── JADWAL OPERASI PASIEN ─────────────────────────────────
exports.jadwalOperasiPasien = async (req, res) => {
  const { nopeserta } = req.body;

  if (!nopeserta)            return fail(res, 'Nomor Peserta tidak boleh kosong');
  if (nopeserta.length !== 13) return fail(res, 'Nomor Peserta harus 13 digit');
  if (!/^\d{13}$/.test(nopeserta)) return fail(res, 'Format Nomor Peserta tidak sesuai');

  const rows = await getAll(
    OPERASI_SQL + ` WHERE p.no_peserta = :np ORDER BY bo.tanggal, bo.jam_mulai`,
    { np: nopeserta }
  );

  if (!rows.length) return fail(res, 'Maaf anda tidak memiliki jadwal operasi');

  return res.status(200).json({
    response: {
      list: rows.map(r => ({
        kodebooking: r.no_rawat,
        tanggaloperasi: r.tanggal,
        jenistindakan: r.nm_perawatan,
        kodepoli: r.kd_poli_bpjs,
        namapoli: r.nm_poli_bpjs,
        terlaksana: mapStatus(r.status)
      }))
    },
    metadata: { message: 'Ok', code: 200 }
  });
};
