const express = require('express');
const morgan = require('morgan');
const apiRoutes = require('./routes');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
// app.use(express.urlencoded({ extended: true }));



app.use('/bpj', apiRoutes);

app.get('/', (req, res) => {
  // Tampilkan panduan seperti fungsi tampil() di PHP
  res.send(`
    Selamat Datang di Web Service Antrean BPJS Mobile JKN FKTL
    ... (isi panduan)
  `);
});

// Sync database
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('running on port', PORT);
});