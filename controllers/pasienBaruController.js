const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { fail, DATE_RE, today, getOne, getRow, execute } = require('../helpers/db');

exports.pasienBaru = async (req, res) => {
  const { nomorkartu, nik, nomorkk, nama, jeniskelamin, tanggallahir, nohp,
          alamat, kodeprop, namaprop, kodedati2, namadati2, kodekec, namakec,
          kodekel, namakel, rw, rt } = req.body;

  // Validasi
  if (!nomorkartu)           return fail(res, 'Nomor Kartu tidak boleh kosong');
  if (nomorkartu.length !== 13) return fail(res, 'Nomor Kartu harus 13 digit');
  if (!/^\d{13}$/.test(nomorkartu)) return fail(res, 'Format Nomor Kartu tidak sesuai');
  if (!nik)                  return fail(res, 'NIK tidak boleh kosong ');
  if (nik.length !== 16)     return fail(res, 'NIK harus 16 digit ');
  if (!/^\d{16}$/.test(nik)) return fail(res, 'Format NIK tidak sesuai');
  if (!nomorkk)              return fail(res, 'Nomor KK tidak boleh kosong ');
  if (nomorkk.length !== 16) return fail(res, 'Nomor KK harus 16 digit ');
  if (!/^\d{16}$/.test(nomorkk)) return fail(res, 'Format Nomor KK tidak sesuai');
  if (!nama)                 return fail(res, 'Nama tidak boleh kosong');
  if (/['\\]/.test(nama))    return fail(res, 'Format Nama salah');
  if (!jeniskelamin)         return fail(res, 'Jenis Kelamin tidak boleh kosong');
  if (!/^[LP]$/.test(jeniskelamin)) return fail(res, 'Jenis Kelmain tidak ditemukan');
  if (!tanggallahir)         return fail(res, 'Tanggal Lahir tidak boleh kosong');
  if (!DATE_RE.test(tanggallahir)) return fail(res, 'Format Tanggal Lahir tidak sesuai, format yang benar adalah yyyy-mm-dd');
  if (tanggallahir > today()) return fail(res, 'Tanggal lahir pasien salah');
  if (!nohp)                 return fail(res, 'No.HP tidak boleh kosong');
  if (/['\\]/.test(nohp))    return fail(res, 'Format No.HP salah');
  if (!alamat)               return fail(res, 'Alamat tidak boleh kosong');
  if (/['\\]/.test(alamat))  return fail(res, 'Format Alamat salah');
  if (!kodeprop)             return fail(res, 'Kode Propinsi tidak boleh kosong');
  if (!namaprop)             return fail(res, 'Nama Propinsi tidak boleh kosong');
  if (!kodedati2)            return fail(res, 'Kode Kabupaten tidak boleh kosong');
  if (!namadati2)            return fail(res, 'Nama Kabupaten tidak boleh kosong');
  if (!kodekec)              return fail(res, 'Kode Kecamatan tidak boleh kosong');
  if (/['\\]/.test(kodekec)) return fail(res, 'Format Kode Kecamatan salah');
  if (!namakec)              return fail(res, 'Nama Kecamatan tidak boleh kosong');
  if (/['\\]/.test(namakec)) return fail(res, 'Format Nama Kecamatan salah');
  if (!kodekel)              return fail(res, 'Kode Kelurahan tidak boleh kosong');
  if (/['\\]/.test(kodekel)) return fail(res, 'Format Kode Kelurahan salah');
  if (!namakel)              return fail(res, 'Nama Kelurahan tidak boleh kosong');
  if (/['\\]/.test(namakel)) return fail(res, 'Format Nama Kelurahan salah');
  if (!rw)                   return fail(res, 'RW tidak boleh kosong');
  if (/['\\]/.test(rw))      return fail(res, 'Format RW salah');
  if (!rt)                   return fail(res, 'RT tidak boleh kosong');
  if (/['\\]/.test(rt))      return fail(res, 'Format RT salah');

  // Cek duplikat
  const exist = await getOne(
    `SELECT no_rkm_medis FROM pasien WHERE no_ktp=:nik AND no_peserta=:kartu LIMIT 1`,
    { nik, kartu: nomorkartu }
  );
  if (exist) return fail(res, 'Pasien dengan NIK dan No.Kartu tersebut sudah terdaftar');

  // Generate NORM
  const setrm = await getRow(`SELECT * FROM set_urut_no_rkm_medis`);
  const awalantahun = setrm?.tahun === 'Yes' ? new Date().getFullYear().toString().slice(-2) : '';
  const awalanbulan = setrm?.bulan === 'Yes' ? String(new Date().getMonth() + 1).padStart(2, '0') : '';

  let norm = '';
  const posisi = setrm?.posisi_tahun_bulan || 'Depan';
  const urutan = setrm?.urutan || 'Straight';

  const getMax = async (col, field) => {
    const q = urutan === 'Straight'
      ? `SELECT IFNULL(MAX(CONVERT(${col}(no_rkm_medis,6),signed)),0)+1 FROM set_no_rkm_medis`
      : urutan === 'Terminal'
      ? `SELECT IFNULL(MAX(CONVERT(CONCAT(SUBSTRING(${col}(no_rkm_medis,6),5,2),SUBSTRING(${col}(no_rkm_medis,6),3,2),SUBSTRING(${col}(no_rkm_medis,6),1,2)),signed)),0)+1 FROM set_no_rkm_medis`
      : `SELECT IFNULL(MAX(CONVERT(CONCAT(SUBSTRING(${col}(no_rkm_medis,6),3,2),SUBSTRING(${col}(no_rkm_medis,6),1,2),SUBSTRING(${col}(no_rkm_medis,6),5,2)),signed)),0)+1 FROM set_no_rkm_medis`;
    return getOne(q);
  };

  let nourut = '';
  const max = posisi === 'Depan' ? await getMax('RIGHT') : await getMax('LEFT');
  const maxPad = String(max).padStart(6, '0');

  if (urutan === 'Straight') {
    nourut = maxPad;
  } else if (urutan === 'Terminal') {
    nourut = maxPad.slice(4, 6) + maxPad.slice(2, 4) + maxPad.slice(0, 2);
  } else {
    nourut = maxPad.slice(2, 4) + maxPad.slice(0, 2) + maxPad.slice(4, 6);
  }

  if (posisi === 'Depan') {
    norm = awalantahun + awalanbulan + nourut;
  } else {
    norm = (awalanbulan + awalantahun).length > 0 ? `${nourut}-${awalanbulan}${awalantahun}` : nourut;
  }

  const t = await sequelize.transaction();
  try {
    // Upsert wilayah
    await sequelize.query(`INSERT IGNORE INTO kelurahan VALUES('0',:v)`, { replacements:{v:namakel}, transaction:t, type:QueryTypes.INSERT });
    await sequelize.query(`INSERT IGNORE INTO kecamatan VALUES('0',:v)`, { replacements:{v:namakec}, transaction:t, type:QueryTypes.INSERT });
    await sequelize.query(`INSERT IGNORE INTO kabupaten VALUES('0',:v)`, { replacements:{v:namadati2}, transaction:t, type:QueryTypes.INSERT });
    await sequelize.query(`INSERT IGNORE INTO propinsi VALUES('0',:v)`,  { replacements:{v:namaprop}, transaction:t, type:QueryTypes.INSERT });

    const kdkel = await getOne(`SELECT kd_kel FROM kelurahan WHERE nm_kel=:v`, { v:namakel });
    const kdkec = await getOne(`SELECT kd_kec FROM kecamatan WHERE nm_kec=:v`, { v:namakec });
    const kdkab = await getOne(`SELECT kd_kab FROM kabupaten WHERE nm_kab=:v`, { v:namadati2 });
    const kdprop= await getOne(`SELECT kd_prop FROM propinsi WHERE nm_prop=:v`, { v:namaprop });

    await sequelize.query(
      `INSERT INTO pasien VALUES(:norm,:nama,:nik,:jk,'-',:tgl,'-',:alamat,'-','-','JOMBLO','-',CURDATE(),:nohp,'0','-','SAUDARA','-',:carabayar,:kartu,:kdkel,:kdkec,:kdkab,'-',:alamat,:namakel,:namakec,:namadati2,'-','1','1','1','-','-',:kdprop,:namaprop)`,
      { replacements: { norm, nama, nik, jk: jeniskelamin, tgl: tanggallahir, alamat, nohp,
          carabayar: process.env.CARA_BAYAR || 'JKN', kartu: nomorkartu,
          kdkel, kdkec, kdkab, namakel, namakec, namadati2, kdprop, namaprop },
        transaction: t, type: QueryTypes.INSERT }
    );

    await sequelize.query(`DELETE FROM set_no_rkm_medis`, { transaction: t, type: QueryTypes.DELETE });
    await sequelize.query(`INSERT INTO set_no_rkm_medis VALUES(:norm)`, { replacements: { norm }, transaction: t, type: QueryTypes.INSERT });

    await t.commit();

    return res.status(200).json({
      response: { norm },
      metadata: { message: 'Pasien berhasil mendapatkann nomor RM, silahkan lanjutkan ke booking. Pasien tidak perlu ke admisi', code: 200 }
    });
  } catch (e) {
    await t.rollback();
    return fail(res, 'Maaf Terjadi Kesalahan, Hubungi Admnistrator..');
  }
};
