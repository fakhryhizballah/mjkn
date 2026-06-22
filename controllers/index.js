const { Op, QueryTypes } = require("sequelize");
const {
    sequelize,
    maping_poli_bpjs,
    maping_dokter_dpjpvclaim,
    jadwal,
    poliklinik,
    dokter,
    reg_periksa,
    pasien,
    referensi_mobilejkn_bpjs,
    referensi_mobilejkn_bpjs_batal,
    booking_operasi,
    paket_operasi,
    setting
} = require("../models");
const { isValidDate } = require("../helpers");
const jwt = require('jsonwebtoken');
const  moment = require('moment');
const { dataLog, genLogId } = require('../helpers/loggers');

const WAKTU_TUNGGU = 10;

const initalize = async (req, res) => {
    
    try {
        // Mengambil nama_instansi dari tabel setting menggunakan Sequelize
        const instansi = await setting.findOne({
            attributes: ['nama_instansi']
        });

        // Fallback jika data instansi kosong
        const namaInstansi = instansi ? instansi.nama_instansi : 'RS Default';
        const tahun = new Date().getFullYear();

        // Membangun string output menggunakan Template Literals
        const responseText = `Selamat Datang di Web Service Antrean BPJS Mobile JKN FKTL ${namaInstansi} ${tahun}

Cara Menggunakan Web Service Antrean BPJS Mobile JKN FKTL : 
1. Mengambil Token, methode GET 
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/auth 
   Header gunakan x-username:user yang diberikan RS, x-password:pass yang diberikan RS
   Hasilnya : 
   {
      "response": {
         "token": "xxxxxxxxxxxxxxxxx"
      },
      "metadata": {
         "message": "Ok",
         "code": 200
      }
   }

2. Menampilkan status atrean poli, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/statusantrean 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "kodepoli":"XXX",
      "kodedokter":"XXXXX",
      "tanggalperiksa":"XXXX-XX-XX",
      "jampraktek":"XX:XX-XX:XX"
   }

   Hasilnya : 
   {
      "response": {
          "namapoli": "XXXXXXXXXXXXXX",
          "namadokter": "XXXXXXXXXXXXXX",
          "totalantrean": "X",
          "sisaantrean": "X",
          "antreanpanggil": "X-XX",
          "sisakuotajkn": "XX",
          "kuotajkn": "XX",
          "sisakuotanonjkn": "XX",
          "kuotanonjkn": "XX",
          "keterangan": "XXXXXXXXXXXXXX"
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

3. Mengambil atrean poli, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/ambilantrean 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "nomorkartu": "XXXXXXXXXXXXXX",
      "nik": "XXXXXXXXXXXXXXXXX",
      "nohp": "XXXXXXXX",
      "kodepoli": "XXX",
      "norm": "XXXXX",
      "tanggalperiksa": "XXXX-XX-XX",
      "kodedokter": "XXXXX",
      "jampraktek": "XX:XX-XX:XX",
      "jeniskunjungan": "x",
      "nomorreferensi": "XXXXXXXXXXXX"
   }

   Hasilnya : 
   {
      "response": {
          "nomorantrean": "X-XXX",
          "angkaantrean": "XXX",
          "kodebooking": "XXXXXXXXXXXXX",
          "pasienbaru": X,
          "norm": "XXXXXX",
          "namapoli": "XXXXXXXXXXXXXXX",
          "namadokter": "XXXXXXXXXXXXXXX",
          "estimasidilayani": XXXXXXX,
          "sisakuotajkn": "XX",
          "kuotajkn": "XX",
          "sisakuotanonjkn": "XXX",
          "kuotanonjkn": "XXX",
          "keterangan": "XXXXXXXXXXXXXXXX"
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

4. Melakukan checkin poli, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/checkinantrean 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "kodebooking": "XXXXXXXXXXXXXX",
      "waktu": XXXXXXXXXXX(timestamp milliseconds)
   }

   Hasilnya : 
   {
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

5. Membatalkan antrean poli dan hanya bisa dilakukan sebelum pasien checkin, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/batalantrean 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "kodebooking": "XXXXXXXXXXXXXX",
      "keterangan": "XXXXXXXXXXXXXXXXXXXXXXX"
   }

   Hasilnya : 
   {
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

6. Melihat sisa antrean poli dan hanya bisa dilakukan setelah pasien checkin, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/sisaantrean 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "kodebooking": "XXXXXXXXXXXXXX"
   }

   Hasilnya : 
   {
      "response": {
          "nomorantrean": "XXXX",
          "namapoli": "XXXXXXXXXXXX",
          "namadokter": "XXXXXXXXXXX",
          "sisaantrean": XX,
          "antreanpanggil": "XXXX",
          "waktutunggu": XXXX,
          "keterangan": "XXXXX"
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

7. Melihat Jadwal Operasi RS, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/jadwaloperasirs 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "tanggalawal": "XXXX-XX-XX",
      "tanggalakhir": "XXXX-XX-XX"
   }

   Hasilnya : 
   {
      "response": {
          "list": [
              {
                  "kodebooking": "XXXXXXXXX",
                  "tanggaloperasi": "XXXX-XX-XX",
                  "jenistindakan": "XXXXXXXXXXXXXXXXX",
                  "kodepoli": "XXX",
                  "namapoli": "XXXXXXXXXXXXX",
                  "terlaksana": X,
                  "nopeserta": "XXXXXXXXXX",
                  "lastupdate": XXXXXXXX
              }
           ]
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

8. Melihat Jadwal Operasi Pasien, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/jadwaloperasipasien 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "nopeserta": "XXXXXXXXXX"
   }

   Hasilnya : 
   {
      "response": {
          "list": [
              {
                  "kodebooking": "XXXXXXXXX",
                  "tanggaloperasi": "XXXX-XX-XX",
                  "jenistindakan": "XXXXXXXXXXXXXXXXX",
                  "kodepoli": "XXX",
                  "namapoli": "XXXXXXXXXXXXX",
                  "terlaksana": X
              }
           ]
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }

9. Pasien Baru, methode POST
   gunakan URL http://ipserverws:port/webapps/api-bpjsfktl/pasienbaru 
   Header gunakan x-token:token yang diambil sebelumnya, x-username:user yang diberikan RS   Body berisi : 
   {
      "nomorkartu": "XXXXXXXXXXXXX",
      "nik": "XXXXXXXXXXX",
      "nomorkk": "XXXXXXXX",
      "nama": "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "jeniskelamin": "L/P",
      "tanggallahir": "XXXX-XX-XX",
      "nohp": "XXXXXXXXXXXX",
      "alamat": "XXXXXXXX",
      "kodeprop": "XX",
      "namaprop": "XXXXXXXXXXXXXXX",
      "kodedati2": "XXXXXXX",
      "namadati2": "XXXXXXXXXXXXXXX",
      "kodekec": "XXXX",
      "namakec": "XXXXXXXXXXXXXX",
      "kodekel": "XXXX",
      "namakel": "XXXXXXXXXXXXX",
      "rw": "XXX",
      "rt": "XXX"
   }

   Hasilnya : 
   {
      "response": {
          "norm": "XXXXXX",
      },
      "metadata": {
          "message": "Ok",
          "code": 200
      }
   }`;

        // Mengatur header agar output dirender sebagai plain text (sama seperti echo PHP)
        res.type('text/plain');
        return res.send(responseText);

    } catch (error) {
        console.error("Error pada fungsi tampil:", error);
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: {
                message: "Internal Server Error #" + idLog,
                code: 500
            }
        });
    }
};
const auth = async (req, res) => {
    const username = req.headers['x-username'];
    const password = req.headers['x-password'];
    if (!username || !password) {

        dataLog.info(idLog, 'x-username dan x-password diperlukan');
        return res.status(201).json({
            'metadata': {
                'message': 'x-username dan x-password diperlukan',
                'code': 201
            }
        });
    }
    const nip = req.headers['x-nip'];
    let user = await sequelize.query("select kd_pj,aes_decrypt(usere,'nur') as user,aes_decrypt(passworde,'windi') as pass FROM password_asuransi", {
        type: QueryTypes.SELECT
    });
    let data = {
        user: user[0].user.toString(),
        password: user[0].pass.toString()
    }
    if (data.user == username && data.password == password) {
        let token = jwt.sign({ username: username }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
        return res.status(200).json({
            'metadata': {
                'message': 'Ok',
                'code': 200
            },
            'response': {
                'token': token
            }
        });
    }
    return res.status(201).json({
        'metadata': {
            'message': 'Username atau password salah',
            'code': 201
        }
    });
}
// 💡 Helper: Cari jadwal yang valid berdasarkan kriterianya
const findValidJadwal = async (kodePoli, kodeDokter, tanggalPeriksa) => {
    // Contoh: cari jadwal yang sesuai dengan hari & jam kerja
    const hariKerja = moment(tanggalPeriksa).locale('id').format('dddd');
    console.log(kodePoli);

    // Asumsi: hari_kerja di DB disimpan sebagai nama hari (case-insensitive)
    const where = {
        kd_poli: kodePoli,
        kd_dokter: kodeDokter,
        hari_kerja: hariKerja
    };
    return await jadwal.findOne({ where });
};
const statusAntrean = async (req, res) => {
    const { kodepoli, kodedokter, tanggalperiksa, jampraktek } = req.body;
    if (!kodepoli || !kodedokter || !tanggalperiksa || !jampraktek) {
        return res.status(400).json({ metadata: { message: 'Semua field wajib diisi', code: 201 } });
    }
    if (!isValidDate(tanggalperiksa)) {
        return res.status(400).json({
            metadata: { message: 'Format tanggal tidak valid (harus YYYY-MM-DD)', code: 201 }
        });
        
    }
    try {
        // 1️⃣ Cari poli
        const poli = await maping_poli_bpjs.findOne({ where: { kd_poli_bpjs: kodepoli } });
        if (!poli) {
            return res.status(201).json({
                metadata: { message: 'Poli tidak ditemukan', code: 201 }
            });
        }

        console.log(poli);
        // 2️⃣ Cari dokter
        const dokter = await maping_dokter_dpjpvclaim.findOne({ where: { kd_dokter_bpjs: kodedokter } });
        if (!dokter) {
            return res.status(201).json({
                metadata: { message: 'Dokter tidak ditemukan', code: 201 }
            });
        }
        console.log(dokter);

        // 3️⃣ Cari jadwal (sesuai kodepoli, kodedokter, dan hari kerja)
        const jadwaldrp = await findValidJadwal(poli.kd_poli_rs, dokter.kd_dokter, tanggalperiksa);
        if (!jadwaldrp) {
            return res.status(201).json({
                metadata: { message: 'Jadwal tidak tersedia untuk hari ini', code: 201 }
            });
        }

        const [mulai, selesai] = jadwaldrp.jam_mulai && jadwaldrp.jam_selesai
            ? [moment(jadwaldrp.jam_mulai, 'HH:mm'), moment(jadwaldrp.jam_selesai, 'HH:mm')]
            : [null, null];
        const inputJam = jampraktek.split('-').map(t => moment(t, 'HH:mm'));

        if (mulai && selesai && (
            !inputJam[0].isSameOrAfter(mulai) ||
            !inputJam[1].isSameOrBefore(selesai)
        )) {
            return res.status(201).json({
                metadata: { message: 'Jam praktek tidak sesuai jadwal dokter', code: 201 }
            });
        }

        // 5️⃣ Hitung antrian hari ini
        const totalAntrean = await reg_periksa.count({
            where: {
                kd_poli: poli.kd_poli_rs,
                kd_dokter: dokter.kd_dokter,
                tgl_registrasi: tanggalperiksa,
                stts:'Belum'
            }
            
        })
        const sisaAntrean = jadwaldrp.kuota - totalAntrean;
        console.log(sisaAntrean);

        if (sisaAntrean <= 0) {
            return res.status(201).json({
                metadata: { message: 'Kuota penuh untuk hari ini', code: 201 }
            });
        }

        // 6️⃣ Format response — sesuai spesifikasi
        const antreanPanggil = `${String(totalAntrean + 1).padStart(2, '0')}`;
        const sisakuotajkn = Math.floor(jadwaldrp.kuota * 0.6); // contoh logika bisnis: 60% JKN
        const sisakuotanonjkn = jadwaldrp.kuota - sisakuotajkn;

        const response = {
            namapoli: poli.nm_poli_bpjs,
            namadokter: dokter.nm_dokter_bpjs,
            totalantrean: totalAntrean,
            sisaantrean: sisaAntrean,
            antreanpanggil: antreanPanggil,
            sisakuotajkn: sisakuotajkn,
            kuotajkn: sisakuotajkn + Math.floor(jadwaldrp.kuota * 0.4), // contoh: kuotajkn bisa dihitung ulang
            sisakuotanonjkn: sisakuotanonjkn,
            kuotanonjkn: sisakuotanonjkn + Math.floor(jadwaldrp.kuota * 0.4),
            keterangan: 'Datanglah Minimal 30 Menit Sebelum dan langsung ke LOKET 4 Untuk Cetak SEP'
        };

      return  res.status(200).json({
            response,
            metadata: { message: 'Ok', code: 200 }
        });

    } catch (error) {
        console.error('[ERROR /jadwalkan]', error);
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: { message: 'Server error', code: 500 }
        });
    }
};

const ambilAntrean = async (req, res) => {
    const decode = req.body; // Mengambil data input (sebelumnya $decode)

    // ==========================================
    // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
    // ==========================================

    // Fungsi helper untuk mereturn error secara seragam
    const sendError = (message, code = 201) => {
        return res.status(code).json({ metadata: { message, code } });
    };
    try{

    // Validasi Nomor Kartu
    if (!decode.nomorkartu) return sendError('Nomor Kartu tidak boleh kosong');
    if (decode.nomorkartu.length !== 13) return sendError('Nomor Kartu harus 13 digit');
    if (!/^[0-9]{13}$/.test(decode.nomorkartu)) return sendError('Format Nomor Kartu tidak sesuai');

    // Validasi NIK
    if (!decode.nik) return sendError('NIK tidak boleh kosong');
    if (decode.nik.length !== 16) return sendError('NIK harus 16 digit');
    if (!/^[0-9]{16}$/.test(decode.nik)) return sendError('Format NIK tidak sesuai');

    // Validasi No HP (Mencegah karakter ' atau \ masuk)
    if (!decode.nohp) return sendError('No.HP tidak boleh kosong');
        // if (decode.nohp.length >= 10) return sendError('No.HP harus 13 digit');
        if (/['\\]/.test(decode.nohp)) return sendError('Format No.HP salah');

    // Validasi Kode Poli
    if (!decode.kodepoli) return sendError('Kode Poli tidak boleh kosong');
    if (/['\\]/.test(decode.kodepoli)) return sendError('Poli tidak ditemukan');

    // Validasi Kode Dokter
    if (!decode.kodedokter) return sendError('Kode Dokter tidak boleh kosong');
    if (/['\\]/.test(decode.kodedokter)) return sendError('Dokter tidak ditemukan');

    // Validasi Tanggal Periksa
    if (!decode.tanggalperiksa) return sendError('Tanggal tidak boleh kosong');
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(decode.tanggalperiksa)) {
        return sendError('Format Tanggal tidak sesuai, format yang benar adalah yyyy-mm-dd');
    }

    const hariIni = new Date().toISOString().split('T')[0];
    if (hariIni > decode.tanggalperiksa) return sendError('Tanggal Periksa tidak berlaku mundur');

    // Validasi Jam Praktek
    if (!decode.jampraktek) return sendError('Jam Praktek tidak boleh kosong');
    if (/['\\]/.test(decode.jampraktek)) return sendError('Jam Praktek tidak ditemukan');

    // Validasi Jenis Kunjungan
    if (!decode.jeniskunjungan) return sendError('Jenis Kunjungan tidak boleh kosong');
    if (/['\\]/.test(decode.jeniskunjungan) || !/^[1-4]$/.test(decode.jeniskunjungan)) {
        return sendError('Jenis Kunjungan tidak ditemukan');
    }

    // Validasi Nomor Referensi
    if (!decode.nomorreferensi) return sendError('Nomor Referensi tidak boleh kosong');
    if (/['\\]/.test(decode.nomorreferensi)) return sendError('Nomor Referensi tidak sesuai format');
    // ==========================================
        // 2. BLOK VALIDASI DATABASE & LOGIKA BISNIS
        // ==========================================

        // Cek apakah nomor referensi sudah terdaftar (Status Belum / Checkin)
        const cekReferensi = await referensi_mobilejkn_bpjs.count({
            where: {
                nomorreferensi: decode.nomorreferensi,
                status: { [Op.in]: ['Belum', 'Checkin'] }
            }
        });
        if (cekReferensi > 0) return sendError('Anda sudah terdaftar dalam antrian menggunakan nomor referensi yang sama');

        // Mapping Poli dan Dokter
        const mapPoli = await maping_poli_bpjs.findOne({ where: { kd_poli_bpjs: decode.kodepoli } });
        if (!mapPoli) return sendError('Poli tidak ditemukan');
        const kdpoli = mapPoli.kd_poli_rs;

        const mapDokter = await maping_dokter_dpjpvclaim.findOne({ where: { kd_dokter_bpjs: decode.kodedokter } });
        if (!mapDokter) return sendError('Dokter tidak ditemukan');
        const kddokter = mapDokter.kd_dokter;

        // Cek Jadwal
        const hari = moment(decode.tanggalperiksa).locale('id').format('dddd');
        const jammulai = decode.jampraktek.substring(0, 5) + ':00';
        const jamselesai = decode.jampraktek.substring(6, 11) + ':00';

        // Menggunakan include untuk men-join tabel terkait di Sequelize
        const dataJadwal = await jadwal.findOne({
            include: [
                { model: poliklinik, as: 'poliklinik', required: true },
                { model: dokter,as: 'dokter', required: true }
            ],
            where: {
                hari_kerja: hari,
                kd_dokter: kddokter,
                kd_poli: kdpoli,
                jam_mulai: jammulai,
                jam_selesai: jamselesai
            }
        });

        if (!dataJadwal || !dataJadwal.kuota) return sendError('Pendaftaran ke Poli ini tidak tersedia');

        // Cek Data Pasien
        const datapeserta = await pasien.findOne({ where: { no_peserta: decode.nomorkartu } });
        if (!datapeserta) return sendError('Data Anda tidak ditemukan silahkan ke loket Pendaftaran', 201);

        // Validasi Format RM
        if (/['\\]/.test(decode.norm)) return sendError('Format No.RM salah');

        // Cek apakah sudah mendaftar di tanggal, poli, dan dokter yang sama
        const sudahDaftar = await reg_periksa.count({
            where: {
                kd_poli: kdpoli,
                kd_dokter: kddokter,
                no_rkm_medis: datapeserta.no_rkm_medis,
                tgl_registrasi: decode.tanggalperiksa
            }
        });

        if (sudahDaftar > 0) return sendError('Nomor Antrean hanya dapat diambil 1 kali pada Tanggal, Dokter dan Poli yang sama');

        // Pengecekan interval waktu (pendaftaran sudah tutup/belum)
        const d1 = new Date(decode.tanggalperiksa);
        const d2 = new Date(hariIni);
        // const interval = (d1 - d2) / (1000 * 60 * 60 * 24);
        // if (interval <= 0) return sendError('Pendaftaran ke Poli ini sudah tutup');

        // Pengecekan Kuota
        const sisakuota = await reg_periksa.count({
            where: {
                kd_poli: kdpoli,
                kd_dokter: kddokter,
                tgl_registrasi: decode.tanggalperiksa
            }
        });

        if (sisakuota >= dataJadwal.kuota) return sendError('Kuota penuuuh...!');

        // ==========================================
        // 3. GENERATE DATA & TRANSACTION INSERT
        // ==========================================
        const noReg = (sisakuota + 1).toString().padStart(3, '0');
        
        // Generate no_rawat
        const maxRawat = await reg_periksa.count({ where: { tgl_registrasi: decode.tanggalperiksa } }) + 1;
        const no_rawat = `${decode.tanggalperiksa.replace(/-/g, "/")}/${String(maxRawat).padStart(6, '0')}`;

        // Generate nobooking
        const maxBooking = await referensi_mobilejkn_bpjs.count({ where: { tanggalperiksa: d1 } })+1;
        const nobooking = `${decode.tanggalperiksa.replace(/-/g, "")}${String(maxBooking).padStart(6, '0')}`;

        // Menentukan status Lama/Baru
        const cekLama = await reg_periksa.count({
            where: { no_rkm_medis: datapeserta.no_rkm_medis, kd_poli: kdpoli }
        });
        const statuspoli = cekLama > 0 ? 'Lama' : 'Baru';

        const waktutunggu = 2; // Asumsi variabel waktu tunggu (sesuaikan dengan logic sistem Anda)
        const dilayani = noReg * waktutunggu;
        const statusdaftar = datapeserta.tgl_daftar === decode.tanggalperiksa ? "1" : "0";
        const stts_daftar_string = statusdaftar === "1" ? "Baru" : "Lama";

        // Logic Umur
        let umur =new Date().getFullYear() - new Date(datapeserta.tgl_lahir).getFullYear();
      
        // let umur = 0;
        let sttsumur = "Th";
        if (umur > 0) {
            umur = umur;
            sttsumur = "Th";
        } else {
        let tglLahir = new Date(datapeserta.tgl_lahir);
        let tglSekarang = new Date();
            umur = (tglSekarang.getFullYear() - tglLahir.getFullYear()) * 12 + (tglSekarang.getMonth() - tglLahir.getMonth());
            sttsumur = "Bln";
        }

        // Mapping Jenis Kunjungan
        const jenisKunjunganMap = {
            "1": "1 (Rujukan FKTP)",
            "2": "2 (Rujukan Internal)",
            "3": "3 (Kontrol)",
            "4": "4 (Rujukan Antar RS)"
        };
        const jeniskunjunganText = jenisKunjunganMap[decode.jeniskunjungan];

        // Memulai Database Transaction
        const transactionResult = await sequelize.transaction(async (t) => {
            
            // Insert Referensi Mobile JKN
            const estimasiWaktu = new Date(`${decode.tanggalperiksa} ${dataJadwal.jam_mulai}`).getTime() + (5 * 60 * 1000);
            const kuotaSisaUpdate = dataJadwal.kuota - sisakuota - 1;

            await referensi_mobilejkn_bpjs.create({
                nobooking,
                no_rawat,
                nomorkartu: decode.nomorkartu,
                nik: decode.nik,
                nohp: decode.nohp,
                kodepoli: decode.kodepoli,
                statusdaftar,
                pasienbaru:'0',
                norm: datapeserta.no_rkm_medis,
                tanggalperiksa: decode.tanggalperiksa,
                kodedokter: decode.kodedokter,
                jampraktek: decode.jampraktek,
                jeniskunjungan: jeniskunjunganText,
                nomorreferensi: decode.nomorreferensi,
                nomorantrean: `${kdpoli}-${noReg}`,
                angkaantrean: noReg,
                estimasidilayani: estimasiWaktu,
                sisakuotajkn: kuotaSisaUpdate,
                kuotajkn: dataJadwal.kuota,
                sisakuotanonjkn: kuotaSisaUpdate,
                kuotanonjkn: dataJadwal.kuota,
                status: 'Belum',
                validasi: sequelize.literal("'0000-00-00 00:00:00'"), // Atau null jika kolom mengizinkan
                statuskirim: 'Belum'
            }, { transaction: t });

            // Ambil registrasilama dari poliklinik
            const dataPoli = await poliklinik.findOne({ where: { kd_poli: kdpoli } });

            // Insert Reg Periksa
            await reg_periksa.create({
                no_reg: noReg,
                no_rawat,
                tgl_registrasi: decode.tanggalperiksa,
                jam_reg: decode.jampraktek.split('-')[0],
                kd_dokter: kddokter,
                no_rkm_medis: datapeserta.no_rkm_medis,
                kd_poli: kdpoli,
                p_jawab: datapeserta.namakeluarga,
                almt_pj: datapeserta.alamatpj,
                hubunganpj: datapeserta.keluarga,
                biaya_reg: 0,
                stts: 'Belum',
                stts_daftar: stts_daftar_string,
                status_lanjut: 'Ralan',
                kd_pj: 'BPJ', // Asumsi statis dari konstanta CARABAYAR
                umurdaftar: umur,
                sttsumur,
                status_bayar: 'Belum Bayar',
                status_poli: statuspoli
            }, { transaction: t });

            return { estimasiWaktu, kuotaSisaUpdate, nobooking, noReg, kdpoli, dataJadwal, datapeserta };
        });

        // ==========================================
        // 4. PENGIRIMAN RESPONSE SUKSES
        // ==========================================

        return res.status(200).json({
            response: {
                nomorantrean: `${transactionResult.kdpoli}-${transactionResult.noReg}`,
                angkaantrean: parseInt(transactionResult.noReg),
                kodebooking: transactionResult.nobooking,
                pasienbaru: 0,
                norm: transactionResult.datapeserta.no_rkm_medis,
                namapoli: mapPoli.nm_poli_bpjs,
                namadokter: mapDokter.nm_dokter_bpjs,
                estimasidilayani: transactionResult.estimasiWaktu,
                sisakuotajkn: transactionResult.kuotaSisaUpdate,
                kuotajkn: parseInt(transactionResult.dataJadwal.kuota),
                sisakuotanonjkn: transactionResult.kuotaSisaUpdate,
                kuotanonjkn: parseInt(transactionResult.dataJadwal.kuota),
                keterangan: 'Peserta harap 30 menit lebih awal || Jangan lupa ke Loket 4 untuk check in.'
            },
            metadata: {
                message: 'Ok',
                code: 200
            }
        });

    } catch (error) {
        console.error(error);
        let idLog = genLogId();
        dataLog.error(idLog, error);
        dataLog.debug(idLog, req.body.nobooking);
        // Block Error Catch setara dengan bagian update status="Gagal" di PHP
        if (req.body.nobooking) { // Hanya ilustrasi, di Node.js kita butuh passing nobooking scope
             await referensi_mobilejkn_bpjs.update(
                 { status: 'Gagal', validasi: new Date() },
                 { where: { nobooking: req.body.nobooking } } // Pastikan nobooking bisa diakses
             ).catch(e => console.log('Gagal update status gagal', e));
        }

        return res.status(201).json({
            metadata: {
                message: "Maaf terjadi kesalahan, hubungi Admnistrator | ID Error #: " + idLog,
                code: 201
            }
        });
    }
};

const checkinAntrean = async (req, res) => {
    try {
        const decode = req.body;

        // Fungsi helper untuk standarisasi format error/response
        const sendResponse = (message, code = 201) => {
            return res.status(code).json({ metadata: { message, code } });
        };

        // ==========================================
        // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
        // ==========================================

        if (!decode.kodebooking) return sendResponse('Kode Booking tidak boleh kosong');
        if (/['\\]/.test(decode.kodebooking)) return sendResponse('Format Kode Booking salah');

        if (!decode.waktu) return sendResponse('Waktu tidak boleh kosong');

        // Konversi timestamp (waktu) dari ms ke Date object lokal
        const waktuMs = parseInt(decode.waktu, 10);
        const checkinDate = new Date(waktuMs);

        // Ekstraksi format YYYY-MM-DD menggunakan Local Time
        const year = checkinDate.getFullYear();
        const month = String(checkinDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkinDate.getDate()).padStart(2, '0');
        const tanggal = `${year}-${month}-${day}`;

        // Validasi Format Tanggal
        if (!/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(tanggal)) {
            return sendResponse('Format Tanggal Checkin tidak sesuai, format yang benar adalah yyyy-mm-dd');
        }

        // Cek jika waktu checkin lebih kecil dari hari ini (Mundur)
        const hariIniObj = new Date();
        const today = `${hariIniObj.getFullYear()}-${String(hariIniObj.getMonth() + 1).padStart(2, '0')}-${String(hariIniObj.getDate()).padStart(2, '0')}`;

        if (today > tanggal) return sendResponse('Waktu Checkin tidak berlaku mundur');

        // ==========================================
        // 2. BLOK VALIDASI DATABASE
        // ==========================================

        const booking = await referensi_mobilejkn_bpjs.findOne({
            attributes: ['nobooking', 'tanggalperiksa', 'status', 'validasi', 'jampraktek'],
            where: { nobooking: decode.kodebooking }
        });

        if (!booking || !booking.status) {
            return sendResponse('Data Booking tidak ditemukan');
        }

        if (booking.status === 'Batal') {
            return sendResponse(`Booking Anda Sudah Dibatalkan pada tanggal ${booking.validasi}`);
        }

        if (booking.status === 'Checkin') {
            return sendResponse(`Anda Sudah Checkin pada tanggal ${booking.validasi}`);
        }

        // ==========================================
        // 3. LOGIKA INTERVAL CHECKIN & UPDATE
        // ==========================================

        if (booking.status === 'Belum') {
            // Replikasi logika TIMESTAMPDIFF(MINUTE, 'jadwal', 'checkin')
            const jamPraktekAwal = booking.jampraktek.split('-')[1]; // Ambil format HH:mm
            const scheduleTimeStr = `${booking.tanggalperiksa}T${jamPraktekAwal}:00`;
            const scheduleDate = new Date(scheduleTimeStr);

            // Hitung selisih dalam menit
            const diffMinutes = (checkinDate - scheduleDate) / (1000 * 60);

            // Jika hasil >= 0, artinya pasien check-in melebihi atau sama dengan jam praktek awal (Expired)
            if (diffMinutes >= 0) {
                return sendResponse('Chekin Anda sudah expired. Silahkan konfirmasi ke loket pendaftaran');
            }

            // Jika masih dalam rentang waktu yang diperbolehkan, eksekusi update
            const [updatedRows] = await referensi_mobilejkn_bpjs.update(
                {
                    status: 'Checkin',
                    validasi: checkinDate
                },
                {
                    where: { nobooking: decode.kodebooking }
                }
            );

            if (updatedRows > 0) {
                // Return Sukses 200
                return res.status(200).json({
                    metadata: { message: 'Ok', code: 200 }
                });
            } else {
                return sendResponse('Maaf terjadi kesalahan, hubungi Admnistrator..', 401);
            }
        }

    } catch (error) {
        console.error("Checkin Error:", error);
        // Error tidak terduga pada server
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: {
                message: "Maaf terjadi kesalahan, hubungi Admnistrator | ID Log: " + idLog,
                code: 201
            }
        });
    }
};

const batalAntrean = async (req, res) => {
    try {
        const decode = req.body;

        // Fungsi helper untuk standarisasi format response
        const sendResponse = (message, code = 201) => {
            return res.status(code).json({ metadata: { message, code } });
        };

        // ==========================================
        // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
        // ==========================================

        if (!decode.kodebooking) return sendResponse('Kode Booking tidak boleh kosong');
        if (/['\\]/.test(decode.kodebooking)) return sendResponse('Format Kode Booking salah');

        if (!decode.keterangan) return sendResponse('Keterangan tidak boleh kosong');
        if (/['\\]/.test(decode.keterangan)) return sendResponse('Format Keterangan salah');

        // ==========================================
        // 2. BLOK PENGECEKAN DATA BOOKING
        // ==========================================

        const booking = await referensi_mobilejkn_bpjs.findOne({
            attributes: ['nobooking', 'no_rawat', 'tanggalperiksa', 'status', 'validasi', 'nomorreferensi', 'norm'],
            where: { nobooking: decode.kodebooking }
        });

        if (!booking || !booking.status) {
            return sendResponse('Data Booking tidak ditemukan');
        }

        if (booking.status === 'Batal') {
            return sendResponse(`Booking Anda Sudah Dibatalkan pada tanggal ${booking.validasi}`);
        }

        // Pengecekan tanggal mundur
        const hariIniObj = new Date();
        const today = `${hariIniObj.getFullYear()}-${String(hariIniObj.getMonth() + 1).padStart(2, '0')}-${String(hariIniObj.getDate()).padStart(2, '0')}`;

        if (today > booking.tanggalperiksa) {
            return sendResponse('Pembatalan Antrean tidak berlaku mundur');
        }

        if (booking.status === 'Checkin') {
            return sendResponse(`Anda Sudah Checkin Pada Tanggal ${booking.validasi}, Pendaftaran Tidak Bisa Dibatalkan`);
        }

        // ==========================================
        // 3. BLOK EKSEKUSI PEMBATALAN (DB TRANSACTION)
        // ==========================================

        if (booking.status === 'Belum') {
            // Memulai proses transaksi database
            const isSuccess = await sequelize.transaction(async (t) => {

                // a. Update status referensi mobile JKN menjadi Batal
                await referensi_mobilejkn_bpjs.update(
                    {
                        status: 'Batal',
                        validasi: new Date()
                    },
                    {
                        where: { nobooking: decode.kodebooking },
                        transaction: t
                    }
                );

                // b. Hapus data pendaftaran pasien (reg_periksa)
                const deletedRows = await reg_periksa.update(
                    { stts : 'Batal'},{
                    where: { no_rawat: booking.no_rawat },
                    transaction: t
                });
                console.log(deletedRows);
                // return res.status(200).json({
                //     metadata: {
                //         message: 'Ok',
                //         code: deletedRows
                //     }
                // });

                // Jika data reg_periksa berhasil dihapus (setara dengan if($batal) di PHP)
                if (deletedRows > 0) {
                    // c. Insert ke tabel log pembatalan
                    // Pastikan penamaan kolom di model referensi_mobilejkn_bpjs_batal sesuai dengan tabel Anda
                    await referensi_mobilejkn_bpjs_batal.create({
                        no_rkm_medis: booking.norm,
                        no_rawat: booking.no_rawat,
                        nomorreferensi: booking.nomorreferensi,
                        tanggalbatal: new Date(),
                        keterangan: decode.keterangan,
                        statuskirim: 'Belum',
                        nobooking: booking.nobooking
                    }, { transaction: t });

                    return true; // Transaksi sukses
                }

                // Jika tidak ada data yang terhapus, lemparkan error agar transaksi di-rollback
                throw new Error("Gagal menghapus data reg_periksa");
            });

            // Jika transaksi selesai dan me-return true
            if (isSuccess) {
                return res.status(200).json({
                    metadata: {
                        message: 'Ok',
                        code: 200
                    }
                });
            }
        }

    } catch (error) {
        console.error("Batal Antrean Error:", error);
        // Menangkap error dari DB Transaction atau error sistem lainnya
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: {
                message: "Maaf Terjadi Kesalahan, Hubungi Admnistrator |#" + idLog,
                code: 201
            }
        });
    }
};

const sisaAntrean = async (req, res) => {
    try {
        const decode = req.body;

        // Fungsi helper untuk standarisasi format response
        const sendResponse = (message, code = 201) => {
            return res.status(code).json({ metadata: { message, code } });
        };

        // ==========================================
        // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
        // ==========================================

        if (!decode.kodebooking) return sendResponse('Kode Booking tidak boleh kosong');
        if (/['\\]/.test(decode.kodebooking)) return sendResponse('Format Kode Booking salah');

        // ==========================================
        // 2. PENGECEKAN DATA BOOKING
        // ==========================================

        const booking = await referensi_mobilejkn_bpjs.findOne({
            attributes: ['nobooking', 'no_rawat', 'tanggalperiksa', 'status', 'validasi', 'nomorreferensi', 'kodedokter', 'kodepoli', 'jampraktek'],
            where: { nobooking: decode.kodebooking }
        });

        if (!booking || !booking.status) {
            return sendResponse('Data Booking tidak ditemukan');
        }

        if (booking.status === 'Batal') return sendResponse('Data booking sudah dibatalkan');
        if (booking.status === 'Belum') return sendResponse('Anda belum melakukan checkin, Silahkan checkin terlebih dahulu');
        if (booking.status !== 'Checkin') return sendResponse('Antrean Tidak Ditemukan !');

        // ==========================================
        // 3. MAPPING DOKTER & POLI
        // ==========================================

        const mapDokter = await maping_dokter_dpjpvclaim.findOne({ where: { kd_dokter_bpjs: booking.kodedokter } });
        const mapPoli = await maping_poli_bpjs.findOne({ where: { kd_poli_bpjs: booking.kodepoli } });
        const regPasien = await reg_periksa.findOne({ attributes: ['no_reg'], where: { no_rawat: booking.no_rawat } });

        // Jika salah satu data relasi di atas tidak ada
        if (!mapDokter || !mapPoli || !regPasien) {
            return sendResponse('Antrean Tidak Ditemukan !');
        }

        const kodedokterRS = mapDokter.kd_dokter;
        const kodepoliRS = mapPoli.kd_poli_rs;
        const noreg = regPasien.no_reg;

        // Ekstrak 3 digit terakhir dari noreg untuk perbandingan urutan (mengikuti logika PHP asli)
        const noregInt = parseInt(noreg.slice(-3), 10);

        // ==========================================
        // 4. MENGAMBIL DETAIL INFO & PERHITUNGAN SISA
        // ==========================================

        const poliInfo = await poliklinik.findOne({ where: { kd_poli: kodepoliRS } });
        const dokterInfo = await dokter.findOne({ where: { kd_dokter: kodedokterRS } });

        if (!poliInfo || !dokterInfo || !poliInfo.nm_poli) {
            return sendResponse('Antrean Tidak Ditemukan !');
        }

        // Menghitung Sisa Antrean (Pasien dengan status 'Belum' dan nomor urut sebelum pasien ini)
        const sisa_antrean = await reg_periksa.count({
            where: {
                kd_dokter: kodedokterRS,
                kd_poli: kodepoliRS,
                tgl_registrasi: booking.tanggalperiksa,
                stts: 'Belum',
                [Op.and]: sequelize.where(sequelize.literal('CONVERT(RIGHT(no_reg,3), signed)'), '<', noregInt)
            }
        });

        // Mencari Antrean yang Sedang Dipanggil (Orang terdekat sebelum/pada nomor pasien ini)
        const antreanPanggilData = await reg_periksa.findOne({
            attributes: ['no_reg'],
            where: {
                kd_dokter: kodedokterRS,
                kd_poli: kodepoliRS,
                tgl_registrasi: booking.tanggalperiksa,
                stts: 'Belum',
                [Op.and]: sequelize.where(sequelize.literal('CONVERT(RIGHT(no_reg,3), signed)'), '<=', noregInt)
            },
            order: [
                [sequelize.literal('CONVERT(RIGHT(no_reg,3), signed)'), 'ASC']
            ]
        });

        // Format data final
        const sisaFinal = sisa_antrean >= 0 ? sisa_antrean : 0;
        const antreanpanggil = antreanPanggilData ? `${kodepoliRS}-${antreanPanggilData.no_reg}` : `${kodepoliRS}-${noreg}`;
        const waktutunggu = 5; // Asumsi waktu periksa per pasien dalam menit (sesuaikan dengan logic sistem RS Anda)

        // ==========================================
        // 5. RESPONSE BERHASIL
        // ==========================================

        return res.status(200).json({
            response: {
                nomorantrean: `${kodepoliRS}-${noreg}`,
                namapoli: poliInfo.nm_poli,
                namadokter: dokterInfo.nm_dokter,
                sisaantrean: sisaFinal,
                antreanpanggil: antreanpanggil,
                waktutunggu: (sisaFinal * waktutunggu) * 1000, // Hasil konversi menit ke milidetik
                keterangan: "Datanglah Minimal 30 Menit, jika no antrian anda terlewat, silakan konfirmasi ke bagian Pendaftaran atau Perawat Poli, Terima Kasih .."
            },
            metadata: {
                message: 'Ok',
                code: 200
            }
        });

    } catch (error) {
        let idLog = genLogId();
        dataLog.error(idLog, error);
        console.error("Sisa Antrean Error:", error);
        return res.status(201).json({
            metadata: {
                message: "Antrean Tidak Ditemukan ! / Terjadi Kesalahan |#" + idLog,
                code: 201
            }
        });
    }
};

const jadwalOperasiRS = async (req, res) => {
    try {
        const decode = req.body;

        // Helper untuk standarisasi format response error
        const sendResponse = (message, code = 201) => {
            return res.status(code).json({ metadata: { message, code } });
        };

        // ==========================================
        // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
        // ==========================================

        const regexTanggal = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;

        // Mendapatkan tanggal hari ini dengan format YYYY-MM-DD
        const hariIniObj = new Date();
        const today = `${hariIniObj.getFullYear()}-${String(hariIniObj.getMonth() + 1).padStart(2, '0')}-${String(hariIniObj.getDate()).padStart(2, '0')}`;

        // Validasi Tanggal Awal
        if (!decode.tanggalawal) return sendResponse('Tanggal Awal tidak boleh kosong');
        if (!regexTanggal.test(decode.tanggalawal)) return sendResponse('Format Tanggal Awal tidak sesuai, format yang benar adalah yyyy-mm-dd');
        if (today > decode.tanggalawal) return sendResponse('Tanggal Awal tidak berlaku mundur');

        // Validasi Tanggal Akhir
        if (!decode.tanggalakhir) return sendResponse('Tanggal Akhir tidak boleh kosong');
        if (!regexTanggal.test(decode.tanggalakhir)) return sendResponse('Format Tanggal Akhir tidak sesuai, format yang benar adalah yyyy-mm-dd');
        if (today > decode.tanggalakhir) return sendResponse('Tanggal Akhir tidak berlaku mundur');

        // Validasi Logika Rentang Waktu
        if (decode.tanggalawal > decode.tanggalakhir) {
            return sendResponse('Format tanggal awal harus lebih kecil dari tanggal akhir');
        }

        // ==========================================
        // 2. Kueri Database dengan Sequelize (Include = JOIN)
        // ==========================================

        const jadwalOperasi = await booking_operasi.findAll({
            attributes: ['no_rawat', 'tanggal', 'status', 'jam_mulai'],
            where: {
                tanggal: {
                    [Op.between]: [decode.tanggalawal, decode.tanggalakhir]
                }
            },
            include: [
                {
                    model: reg_periksa,
                    required: true,
                    attributes: ['no_rkm_medis', 'kd_poli'],
                    include: [
                        {
                            model: pasien,
                            as: 'pasien',
                            required: true,
                            attributes: ['no_peserta']
                        },
                        {
                            model: maping_poli_bpjs,
                            as: 'maping_poli_bpjs',
                            required: true,
                            attributes: ['kd_poli_bpjs', 'nm_poli_bpjs'],
                            // Menyesuaikan ON maping_poli_bpjs.kd_poli_rs = reg_periksa.kd_poli
                            // Pastikan relasi ini diset menggunakan targetKey/sourceKey yang tepat di model
                        }
                    ]
                },
                {
                    model: paket_operasi,
                    required: true,
                    attributes: ['nm_perawatan']
                }
            ],
            order: [
                ['tanggal', 'ASC'],
                ['jam_mulai', 'ASC']
            ]
        });

        // ==========================================
        // 3. FORMATTING DATA & RESPONSE
        // ==========================================

        if (!jadwalOperasi || jadwalOperasi.length === 0) {
            return sendResponse('Maaf tidak ada Jadwal Operasi pada tanggal tersebut');
        }

        const currentTimeMs = Date.now(); // Setara dengan strtotime(date('Y-m-d H:i:s')) * 1000

        const data_array = jadwalOperasi.map(item => {
            // Mapping status: Jika 'Menunggu' = 0, selain itu = 1
            const statusTerlaksana = item.status === 'Menunggu' ? 0 : 1;

            return {
                kodebooking: item.no_rawat,
                tanggaloperasi: item.tanggal,
                jenistindakan: item.paket_operasi?.nm_perawatan || '-',
                kodepoli: item.reg_periksa?.maping_poli_bpj?.kd_poli_bpjs || '-',
                namapoli: item.reg_periksa?.maping_poli_bpj?.nm_poli_bpjs || '-',
                terlaksana: statusTerlaksana,
                nopeserta: item.reg_periksa?.pasien?.no_peserta || '-',
                lastupdate: currentTimeMs
            };
        });

        return res.status(200).json({
            response: {
                list: data_array
            },
            metadata: {
                message: 'Ok',
                code: 200
            }
        });

    } catch (error) {
        console.error("Jadwal Operasi RS Error:", error);
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: {
                message: "Terjadi kesalahan internal server.| #" + idLog,
                code: 500
            }
        });
    }
};

const jadwalOperasiPasien = async (req, res) => {
    try {
        const decode = req.body;

        // Helper untuk mempermudah response
        const sendResponse = (message, code = 201) => {
            return res.status(code).json({ metadata: { message, code } });
        };

        // ==========================================
        // 1. BLOK VALIDASI INPUT (EARLY RETURNS)
        // ==========================================

        if (!decode.nopeserta) return sendResponse('Nomor Peserta tidak boleh kosong');
        if (decode.nopeserta.length !== 13) return sendResponse('Nomor Peserta harus 13 digit');
        if (!/^[0-9]{13}$/.test(decode.nopeserta)) return sendResponse('Format Nomor Peserta tidak sesuai');

        // ==========================================
        // 2. QUERY DATABASE MENGGUNAKAN SEQUELIZE
        // ==========================================

        // Menggantikan logika INNER JOIN yang panjang dari PHP
        const queryOperasiPasien = await booking_operasi.findAll({
            attributes: ['no_rawat', 'tanggal', 'status', 'jam_mulai'],
            include: [
                {
                    model: reg_periksa,
                    as: 'reg_periksa',
                    required: true,
                    include: [
                        {
                            model: pasien,
                            as: 'pasien',
                            required: true,
                            where: { no_peserta: decode.nopeserta },
                            attributes: ['no_peserta'] // Hanya ambil yang diperlukan
                        },
                        {
                            model: maping_poli_bpjs,
                            as: 'maping_poli_bpjs',
                            required: true,
                            attributes: ['kd_poli_bpjs', 'nm_poli_bpjs']
                        }
                    ]
                },
                {
                    model: paket_operasi,
                    required: true,
                    attributes: ['nm_perawatan']
                }
            ],
            order: [
                ['tanggal', 'ASC'],
                ['jam_mulai', 'ASC']
            ]
        });

        // Jika data pasien tidak ditemukan
        if (!queryOperasiPasien || queryOperasiPasien.length === 0) {
            return sendResponse('Maaf anda tidak memiliki jadwal operasi');
        }

        // ==========================================
        // 3. MAPPING DATA HASIL QUERY KE BENTUK ARRAY
        // ==========================================

        const data_array = queryOperasiPasien.map(item => {
            // Evaluasi status operasi (0 = Menunggu, 1 = Selain itu)
            const statusTerlaksana = item.status === 'Menunggu' ? 0 : 1;

            return {
                kodebooking: item.no_rawat,
                tanggaloperasi: item.tanggal,
                jenistindakan: item.paket_operasi?.nm_perawatan || '-',
                kodepoli: item.reg_periksa?.maping_poli_bpj?.kd_poli_bpjs || '-',
                namapoli: item.reg_periksa?.maping_poli_bpj?.nm_poli_bpjs || '-',
                terlaksana: statusTerlaksana,
                nopeserta: item.reg_periksa?.pasien?.no_peserta || '-'
                // Catatan: Pada endpoint ini, sesuai kode PHP asli, 'lastupdate' tidak disertakan.
            };
        });

        // ==========================================
        // 4. MENGIRIM RESPONSE BERHASIL
        // ==========================================

        return res.status(200).json({
            response: {
                list: data_array
            },
            metadata: {
                message: 'Ok',
                code: 200
            }
        });

    } catch (error) {
        console.error("Error Jadwal Operasi Pasien: ", error);
        let idLog = genLogId();
        dataLog.error(idLog, error);
        return res.status(201).json({
            metadata: {
                message: "Terjadi kesalahan internal server | #" + idLog,
                code: 500
            }
        });
    }
};
const pasienBaru = async (req, res) => {
    // Implementasi pasien baru
    let idLog = genLogId();
    dataLog.info(idLog, error);
    return res.status(201).json({
        metadata: {
            message: "Maaf, fitur Pasien Baru belum tersedia. | #" + idLog,
            code: 500
        }
    });
};

module.exports = {
    statusAntrean,
    ambilAntrean,
    checkinAntrean,
    batalAntrean,
    sisaAntrean,
    jadwalOperasiRS,
    jadwalOperasiPasien,
    pasienBaru,
    initalize,
    auth
};