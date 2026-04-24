const { fail, DATE_RE, today, hariIndo, getOne, getRow } = require('../helpers/db');

exports.statusAntrean = async (req, res) => {
  const { kodepoli, kodedokter, tanggalperiksa, jampraktek } = req.body;

  if (!kodepoli)        return fail(res, 'Kode Poli tidak boleh kosong');
  if (/['\\]/.test(kodepoli)) return fail(res, 'Poli tidak ditemukan');
  if (!kodedokter)      return fail(res, 'Kode Dokter tidak boleh kosong');
  if (/['\\]/.test(kodedokter)) return fail(res, 'Dokter tidak ditemukan');
  if (!tanggalperiksa)  return fail(res, 'Tanggal tidak boleh kosong');
  if (!DATE_RE.test(tanggalperiksa)) return fail(res, 'Format Tanggal tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (today() > tanggalperiksa) return fail(res, 'Tanggal Periksa tidak berlaku');
  if (!jampraktek)      return fail(res, 'Jam Praktek tidak boleh kosong');
  if (/['\\]/.test(jampraktek)) return fail(res, 'Jam Praktek tidak ditemukan');

  const kdpoli   = await getOne(`SELECT kd_poli_rs FROM maping_poli_bpjs WHERE kd_poli_bpjs = :kode`, { kode: kodepoli });
  const kddokter = await getOne(`SELECT kd_dokter FROM maping_dokter_dpjpvclaim WHERE kd_dokter_bpjs = :kode`, { kode: kodedokter });
  if (!kdpoli)   return fail(res, 'Poli tidak ditemukan');
  if (!kddokter) return fail(res, 'Dokter tidak ditemukan');

  const jammulai   = jampraktek.slice(0, 5);
  const jamselesai = jampraktek.slice(6, 11);
  const hari       = hariIndo(tanggalperiksa);

  const kuota = await getOne(
    `SELECT kuota FROM jadwal WHERE hari_kerja = :hari AND kd_dokter = :dokter AND kd_poli = :poli AND jam_mulai = :mulai AND jam_selesai = :selesai`,
    { hari, dokter: kddokter, poli: kdpoli, mulai: jammulai + ':00', selesai: jamselesai + ':00' }
  );
  if (!kuota) return fail(res, 'Pendaftaran ke Poli ini tidak tersedia');

  const data = await getRow(
    `SELECT p.nm_poli, d.nm_dokter,
      COUNT(r.kd_poli) AS total_antrean,
      IFNULL(SUM(CASE WHEN r.stts='Belum' THEN 1 ELSE 0 END),0) AS sisa_antrean,
      'Datanglah Minimal 30 Menit, jika no antrian anda terlewat, silakan konfirmasi ke bagian Pendaftaran atau Perawat Poli, Terima Kasih ..' AS keterangan
    FROM reg_periksa r
    INNER JOIN poliklinik p ON p.kd_poli = r.kd_poli
    INNER JOIN dokter d ON r.kd_dokter = d.kd_dokter
    WHERE r.tgl_registrasi = :tgl AND r.kd_poli = :poli AND r.kd_dokter = :dokter
      AND r.jam_reg BETWEEN :mulai AND :selesai`,
    { tgl: tanggalperiksa, poli: kdpoli, dokter: kddokter, mulai: jammulai + ':00', selesai: jamselesai + ':00' }
  );

  if (!data || parseInt(data.sisa_antrean) < 0)
    return fail(res, `Maaf belum ada antrian ditanggal ${tanggalperiksa}`);

  const antreanPanggil = await getOne(
    `SELECT no_reg FROM reg_periksa WHERE stts='Belum' AND kd_dokter=:dokter AND kd_poli=:poli AND tgl_registrasi=:tgl ORDER BY CONVERT(RIGHT(no_reg,3),signed) LIMIT 1`,
    { dokter: kddokter, poli: kdpoli, tgl: tanggalperiksa }
  );

  return res.status(200).json({
    response: {
      namapoli: data.nm_poli,
      namadokter: data.nm_dokter,
      totalantrean: parseInt(data.total_antrean),
      sisaantrean: Math.max(0, parseInt(data.sisa_antrean)),
      antreanpanggil: `${kdpoli}-${antreanPanggil}`,
      sisakuotajkn: parseInt(kuota) - parseInt(data.total_antrean),
      kuotajkn: parseInt(kuota),
      sisakuotanonjkn: parseInt(kuota) - parseInt(data.total_antrean),
      kuotanonjkn: parseInt(kuota),
      keterangan: data.keterangan
    },
    metadata: { message: 'Ok', code: 200 }
  });
};
