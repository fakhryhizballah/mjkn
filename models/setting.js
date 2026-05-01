'use strict';
const {
    Model
} = require('sequelize');
/**
 * @typedef {import('sequelize')} Sequelize
 * @typedef {import('sequelize').DataTypes} DataTypes
 */

/**
 * Model untuk tabel settings.
 * Model ini bersifat Singleton karena menyimpan konfigurasi global sistem.
 * @param {Sequelize} sequelize - Instance Sequelize.
 * @param {DataTypes} DataTypes - Objek DataTypes dari Sequelize.
 * @returns {Model} Model Sequelize.
 */
module.exports = (sequelize, DataTypes) => {
    class setting extends Model {
        /**
         * Tidak diperlukan metode asosiasi (associate) karena ini adalah data konfigurasi global.
         */
        static associate() {
            // Tidak ada asosiasi relasional karena tabel ini menyimpan konfigurasi sistem.
        }
    }

    setting.init({
        // Primary Key: nama_instansi dijadikan Primary Key karena dijamin unik.
        nama_instansi: {
            type: DataTypes.STRING(60),
            primaryKey: true,
            allowNull: false,
        },
        // Data Instansi
        alamat_instansi: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        kabupaten: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        propinsi: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        kontak: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        // Status Aktif
        aktifkan: {
            type: DataTypes.ENUM('Yes', 'No') // Menggunakan ENUM untuk validasi tipe data
        },
        // Kode-kode Identifikasi
        kode_ppk: {
            type: DataTypes.STRING
        },
        kode_pkn: {
            type: DataTypes.STRING
        },
        kode_sppk: {
            type: DataTypes.STRING
        },
        kode_pknk: {
            type: DataTypes.STRING
        },

        // File/Media (Ini adalah asumsi dari field yang tidak dijelaskan tapi diperlukan untuk melengkapi struktur)
        gambar_logo: {
            type: DataTypes.STRING // Simpan path atau nama file
        },
        gambar_banner: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        modelName: 'setting',
        tableName: 'setting',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });

    return setting  
    }