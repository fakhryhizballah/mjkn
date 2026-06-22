const crypto = require('crypto');
const axios = require('axios');
class dataLog {
    static APP_NAME = "MJKN";
    // Ganti URL ini dengan endpoint API tujuan Anda
    static LOG_API_URL = "https://api.spairum.my.id/api/gobi/v1/logs"
    // Method untuk log debug
    static async debug(logid, errorMsg) {
        return await this._sendLog("debug", logid, errorMsg);
    }

    // Method untuk log info
    static async info(logid, errorMsg) {
        return await this._sendLog("info", logid, errorMsg);
    }

    // Method untuk log error
    static async error(logid, errorMsg) {
        return await this._sendLog("error", logid, errorMsg);
    }

    // Private method yang bertugas merakit JSON dan mengirim ke Axios
    static async _sendLog(level, logid, errorMsg) {
        // Jika logid tidak diberikan, buat otomatis 10 digit
        const finalLogId = logid || generateLogId();

        const logEntry = {
            app: this.APP_NAME,
            logid: finalLogId,
            level: level,
            error: errorMsg instanceof Error ? errorMsg.message : errorMsg,
            full: errorMsg
        };

        try {
            // Mengirim data JSON langsung menggunakan Axios
            const response = await axios.post(this.LOG_API_URL, logEntry, {
                headers: {
                    'Content-Type': 'application/json'
                },
                // Atur timeout agar tidak menunggu selamanya jika server log mati
                timeout: 5000
            });

            // Opsional: Tetap cetak di console lokal untuk keperluan debug
            console.log(`[LOG TERKIRIM] ID: ${finalLogId}`);

            return response.data;
        } catch (err) {
            // Menangkap error JIKA server log sedang bermasalah / down
            // Aplikasi utama akan tetap berjalan dengan aman
            console.error(`[LOG GAGAL TERKIRIM] ID: ${finalLogId} - Pesan:`, err.message);
        }
    }
}

function genLogId(length = 10) {
    // Generate bytes acak, ubah ke base64, hapus karakter non-alfanumerik (+, /, =), lalu potong 10 digit
    return crypto.randomBytes(15)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, length);
}

// Export modul agar bisa digunakan di file lain (Node.js/CommonJS)
module.exports = {dataLog, genLogId};