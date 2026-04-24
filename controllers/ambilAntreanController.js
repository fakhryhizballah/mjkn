const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { fail, DATE_RE, today, hariIndo, getOne, getRow, execute, insert } = require('../helpers/db');

const WAKTU_TUNGGU = parseInt(process.env.WAKTU_TUNGGU) || 10;

exports.ambilAntrean = async (req, res) => {
  const { nomorkartu, nik, nohp, kodepoli, kodedokter, tanggalperiksa, jampraktek, jeniskunjungan, nomorreferensi, norm } = req.body;

  // Validasi input
  if (!nomorkartu) return fail(res, 'Nomor Kartu tidak boleh kosong');
  if (nomorkartu.length !== 13) return fail(res, 'Nomor Kartu harus 13 digit');
  if (!/^\d{13}$/.test(nomorkartu)) return fail(res, 'Format Nomor Kartu tidak sesuai');
  if (!nik) return fail(res, 'NIK tidak boleh kosong ');
  if (nik.length !== 16) return fail(res, 'NIK harus 16 digit ');
  if (!/^\d{16}$/.test(nik)) return fail(res, 'Format NIK tidak sesuai');
  if (!nohp) return fail(res, 'No.HP tidak boleh kosong');
  if (/['\\]/.test(nohp)) return fail(res, 'Format No.HP salah');
  if (!kodepoli) return fail(res, 'Kode Poli tidak boleh kosong');
  if (/['\\]/.test(kodepoli)) return fail(res, 'Poli tidak ditemukan');
  if (!kodedokter) return fail(res, 'Kode Dokter tidak boleh kosong');
  if (/['\\]/.test(kodedokter)) return fail(res, 'Dokter tidak ditemukan');
  if (!tanggalperiksa) return fail(res, 'Tanggal tidak boleh kosong');
  if (!DATE_RE.test(tanggalperiksa)) return fail(res, 'Format Tanggal tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (today() > tanggalperiksa) return fail(res, 'Tanggal Periksa tidak berlaku');
  if (!jampraktek) return fail(res, 'Jam Praktek tidak boleh kosong');
  if (/['\\]/.test(jampraktek)) return fail(res, 'Jam Praktek tidak ditemukan');

  const kdpoli   = await getOne(`SELECT kd_poli_rs FROM maping_poli_bpjs WHERE kd_poli_bpjs = :kode`, { kode: kodepoli });
  const kddokter = await getOne(`SELECT kd_dokter FROM maping_dokter_dpjpvclaim WHERE kd_dokter_bpjs = :kode`, { kode: kodedokter });
  if (!kdpoli)   return fail(res, 'Poli tidak ditemukan');
  if (!kddokter) return fail(res, 'Dokter tidak ditemukan');

  const jammulai   = jampraktek.slice(0, 5);
  const jamselesai = jampraktek.slice(6, 11);
  const hari       = hariIndo(tanggalperiksa);

  const jadwal = await getRow(
    `SELECT j.kuota, p.nm_poli, d.nm_dokter, j.jam_mulai FROM jadwal j
     INNER JOIN poliklinik p ON p.kd_poli = j.kd_poli
     INNER JOIN dokter d ON d.kd_dokter = j.kd_dokter
     WHERE j.hari_kerja = :hari AND j.kd_dokter = :dokter AND j.kd_poli = :poli
       AND j.jam_mulai = :mulai AND j.jam_selesai = :selesai`,
    { hari, dokter: kddokter, poli: kdpoli, mulai: jammulai + ':00', selesai: jamselesai + ':00' }
  );
  if (!jadwal) return fail(res, 'Pendaftaran ke Poli ini tidak tersedia');

  // Cek duplikat booking
  const cekDuplikat = await getOne(
    `SELECT nobooking FROM referensi_mobilejkn_bpjs WHERE nomorkartu = :kartu AND kodepoli = :poli AND kodedokter = :dokter AND tanggalperiksa = :tgl AND status != 'Batal'`,
    { kartu: nomorkartu, poli: kodepoli, dokter: kodedokter, tgl: tanggalperiksa }
  );
  if (cekDuplikat) return fail(res, 'Maaf, Anda sudah terdaftar di antrian ini');

  const sisakuota = await getOne(
    `SELECT COUNT(no_rawat) FROM reg_periksa WHERE kd_poli = :poli AND kd_dokter = :dokter AND tgl_registrasi = :tgl`,
    { poli: kdpoli, dokter: kddokter, tgl: tanggalperiksa }
  );
  if (parseInt(sisakuota) >= parseInt(jadwal.kuota)) return fail(res, 'Kuota penuuuh...!');

  // Data pasien dari DB
  const datapeserta = await getRow(
    `SELECT p.no_rkm_medis,
      TIMESTAMPDIFF(YEAR, p.tgl_lahir, CURDATE()) AS tahun,
      TIMESTAMPDIFF(MONTH, p.tgl_lahir, CURDATE()) % 12 AS bulan,
      TIMESTAMPDIFF(DAY, p.tgl_lahir, CURDATE()) % 30 AS hari,
      p.nm_pasien, p.tgl_daftar,
      pk.nm_pasien AS namakeluarga, pk.alamat AS alamatpj,
      pk.nm_kel AS kelurahanpj, pk.nm_kec AS kecamatanpj,
      pk.nm_kab AS kabupatenpj, pk.nm_prop AS propinsipj,
      pk.hub_kel AS keluarga
    FROM pasien p
    LEFT JOIN pasien_keluarga pk ON pk.no_rkm_medis = p.no_rkm_medis
    WHERE p.no_ktp = :nik AND p.no_peserta = :kartu LIMIT 1`,
    { nik, kartu: nomorkartu }
  );
  if (!datapeserta) return fail(res, 'Data pasien tidak ditemukan');

  // Generate no_rawat & nobooking
  const maxRaw = await getOne(
    `SELECT IFNULL(MAX(CONVERT(RIGHT(no_rawat,6),signed)),0)+1 FROM reg_periksa WHERE tgl_registrasi = :tgl`,
    { tgl: tanggalperiksa }
  );
  const no_rawat  = tanggalperiksa.replace(/-/g, '/') + '/' + String(maxRaw).padStart(6, '0');

  const maxBook = await getOne(
    `SELECT IFNULL(MAX(CONVERT(RIGHT(nobooking,6),signed)),0)+1 FROM referensi_mobilejkn_bpjs WHERE tanggalperiksa = :tgl`,
    { tgl: tanggalperiksa }
  );
  const nobooking = tanggalperiksa.replace(/-/g, '') + String(maxBook).padStart(6, '0');

  // noReg = nomor urut antrian poli
  const noReg = await getOne(
    `SELECT IFNULL(MAX(CONVERT(RIGHT(no_reg,3),signed)),0)+1 FROM reg_periksa WHERE kd_poli=:poli AND kd_dokter=:dokter AND tgl_registrasi=:tgl`,
    { poli: kdpoli, dokter: kddokter, tgl: tanggalperiksa }
  );
  const noRegStr = String(noReg).padStart(3, '0');

  const statuspoli  = await getOne(
    `SELECT IF((SELECT COUNT(no_rkm_medis) FROM reg_periksa WHERE no_rkm_medis=:norm AND kd_poli=:poli)>0,'Lama','Baru')`,
    { norm: datapeserta.no_rkm_medis, poli: kdpoli }
  ) || 'Baru';
  const statusdaftar = datapeserta.tgl_daftar === tanggalperiksa ? '1' : '0';
  const dilayani     = noReg * WAKTU_TUNGGU;

  const jenisMap = { '1':'1 (Rujukan FKTP)','2':'2 (Rujukan Internal)','3':'3 (Kontrol)','4':'4 (Rujukan Antar RS)' };
  const jeniskunjunganStr = jenisMap[jeniskunjungan] || '1 (Rujukan FKTP)';

  let umur, sttsumur;
  if (datapeserta.tahun > 0) { umur = datapeserta.tahun; sttsumur = 'Th'; }
  else if (datapeserta.bulan > 0) { umur = datapeserta.bulan; sttsumur = 'Bl'; }
  else { umur = datapeserta.hari; sttsumur = 'Hr'; }

  const estimasi = new Date(`${tanggalperiksa} ${jadwal.jam_mulai}`).getTime() + dilayani * 60000;
  const sisakuotaFinal = parseInt(jadwal.kuota) - parseInt(sisakuota) - 1;
  const registrasilama = await getOne(`SELECT registrasilama FROM poliklinik WHERE kd_poli=:poli`, { poli: kdpoli });

  const t = await sequelize.transaction();
  try {
    await sequelize.query(
      `INSERT INTO referensi_mobilejkn_bpjs VALUES(
        :nobooking,:no_rawat,:nomorkartu,:nik,:nohp,:kodepoli,:statusdaftar,:norm,:tanggalperiksa,
        :kodedokter,:jampraktek,:jeniskunjungan,:nomorreferensi,:nomorantrean,:noReg,
        :estimasi,:sisakuota,:kuota,:sisakuota,:kuota,'Belum','0000-00-00 00:00:00','Belum')`,
      { replacements: { nobooking, no_rawat, nomorkartu, nik, nohp, kodepoli, statusdaftar, norm: datapeserta.no_rkm_medis,
          tanggalperiksa, kodedokter, jampraktek, jeniskunjungan: jeniskunjunganStr, nomorreferensi: nomorreferensi||'',
          nomorantrean: `${kdpoli}-${noRegStr}`, noReg: noRegStr, estimasi, sisakuota: sisakuotaFinal, kuota: jadwal.kuota },
        transaction: t, type: QueryTypes.INSERT }
    );

    await sequelize.query(
      `INSERT INTO reg_periksa VALUES(
        :noReg,:no_rawat,:tanggalperiksa,CURTIME(),:kddokter,:norm,:kdpoli,
        :namakeluarga,:alamatpj,:keluarga,:registrasilama,'Belum',
        :statusdaftarStr,'Ralan',:carabayar,:umur,:sttsumur,'Belum Bayar',:statuspoli)`,
      { replacements: { noReg: noRegStr, no_rawat, tanggalperiksa, kddokter, norm: datapeserta.no_rkm_medis, kdpoli,
          namakeluarga: datapeserta.namakeluarga||'', alamatpj: datapeserta.alamatpj||'',
          keluarga: datapeserta.keluarga||'', registrasilama: registrasilama||'',
          statusdaftarStr: statusdaftar === '1' ? 'Baru' : 'Lama',
          carabayar: process.env.CARA_BAYAR || 'JKN', umur, sttsumur, statuspoli },
        transaction: t, type: QueryTypes.INSERT }
    );

    await t.commit();

    return res.status(200).json({
      response: {
        nomorantrean: `${kdpoli}-${noRegStr}`,
        angkaantrean: parseInt(noReg),
        kodebooking: nobooking,
        pasienbaru: 0,
        norm: datapeserta.no_rkm_medis,
        namapoli: jadwal.nm_poli,
        namadokter: jadwal.nm_dokter,
        estimasidilayani: estimasi,
        sisakuotajkn: sisakuotaFinal,
        kuotajkn: parseInt(jadwal.kuota),
        sisakuotanonjkn: sisakuotaFinal,
        kuotanonjkn: parseInt(jadwal.kuota),
        keterangan: 'Peserta harap 30 menit lebih awal guna pencatatan administrasi.'
      },
      metadata: { message: 'Ok', code: 200 }
    });
  } catch (e) {
    await t.rollback();
    await execute(`UPDATE referensi_mobilejkn_bpjs SET status='Gagal',validasi=NOW() WHERE nobooking=:nb`, { nb: nobooking }).catch(() => {});
    return fail(res, 'Maaf terjadi kesalahan, hubungi Admnistrator..', 401);
  }
};
