const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const fail = (res, msg = 'Unauthorized', code = 201) =>
  res.status(code).json({ metadata: { message: msg, code } });

// GET: validasi x-username + x-password
const authBasic = (req, res, next) => {
  const { 'x-username': user, 'x-password': pass } = req.headers;
  if (!user || !pass) return fail(res, 'Username dan Password wajib diisi..!!');
  req.authUser = user;
  req.authPass = pass;
  next();
};

// POST: validasi x-username + x-token
const authToken = async (req, res, next) => {
  const { 'x-username': user, 'x-token': token } = req.headers;
  if (!user || !token) return fail(res, 'Username dan Token wajib diisi..!!');
  if (user !== process.env.API_USERNAME) return fail(res, 'Username salah..!!');

  const [row] = await sequelize.query(
    `SELECT token FROM token_api WHERE username = :user AND token = :token AND expired > NOW() LIMIT 1`,
    { replacements: { user, token }, type: QueryTypes.SELECT }
  );
  if (!row) return fail(res, 'Token salah/expired..!!');
  next();
};

module.exports = { authBasic, authToken };
