'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class referensi_mobilejkn_bpjs extends Model {

        static associate(models) {

            this.belongsTo(models.dokter, {
                as: 'dokter',
                foreignKey: 'kodedokter',
                sourceKey: 'kodedokter', // Asumsi: Kunci sumber di tabel dokter adalah kodedokter
                allowDirectional: true,
            });
        }
    }

    referensi_mobilejkn_bpjs.init({
        // Primary Key (Jika nobooking adalah primary key)
        nobooking: {
            type: DataTypes.STRING(15),
            primaryKey: true,
        },

        // Informasi Booking/Rawat
        no_rawat: {
            type: DataTypes.STRING(17),
            allowNull: true,
        },
        nomorkartu: {
            type: DataTypes.STRING(25),
            allowNull: true,
        },
        nik: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        nohp: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        kodepoli: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },

        // Status Pasien
        pasienbaru: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
        },

        // Data Referensi
        norm: {
            type: DataTypes.STRING(15),
            allowNull: true,
            unique: true, // Jika ini adalah nomor rekam medis yang unik
        },
        tanggalperiksa: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        kodedokter: {
            type: DataTypes.STRING(20),
            allowNull: true,
            // Menjadi foreign key ke model dokter
        },
        jampraktek: {
            type: DataTypes.STRING(12),
            allowNull: true,
        },
        jeniskunjungan: {
            // Nilai enum perlu disesuaikan dengan format string di database
            type: DataTypes.ENUM('1 (Rujukan FKTP)', '2 (Rujukan Internal)', '3 (Kontrol)', '4 (Rujukan Antar RS)'),
            allowNull: true,
        },
        nomorreferensi: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        nomorantrean: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        angkaantrean: {
            type: DataTypes.STRING(5),
            allowNull: false,
        },
        estimasidilayani: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },

        // Data Kuota dan Status
        sisakuotajkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        kuotajkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sisakuotanonjkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        kuotanonjkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Belum', 'Checkin', 'Batal', 'Gagal'),
            allowNull: false,
        },
        validasi: {
            type: DataTypes.DATE,
            allowNull: false
        },
        statuskirim: {
            type: DataTypes.ENUM('Belum', 'Sudah'),
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'referensi_mobilejkn_bpjs',
        tableName: 'referensi_mobilejkn_bpjs',
        timestamps: false, // Karena di skema tidak ada kolom created_at/updated_at
        createdAt: false,
        updatedAt: false,
    });

    return referensi_mobilejkn_bpjs;
};