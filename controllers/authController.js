const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const fail = (res, msg, code = 201) =>
  res.status(code).json({ metadata: { message: msg, code } });

exports.createToken = async (req, res) => {
  const { 'x-username': user, 'x-password': pass } = req.headers;
  try {
    if (user !== process.env.API_USERNAME || pass !== process.env.API_PASSWORD)
      return fail(res, 'Username atau Password salah..!!');

    const token = uuidv4().replace(/-/g, '');
    const expired = new Date(Date.now() + 3600 * 1000); // 1 jam

    await sequelize.query(
      `REPLACE INTO token_api (username, token, expired) VALUES (:user, :token, :expired)`,
      { replacements: { user, token, expired }, type: QueryTypes.INSERT }
    );

    return res.status(200).json({
      response: { token },
      metadata: { message: 'Ok', code: 200 }
    });
  } catch (e) {
    return fail(res, 'Maaf terjadi kesalahan, hubungi Administrator..', 401);
  }
};
