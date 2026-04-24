const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const fail = (res, msg, code = 201) =>
  res.status(code).json({ metadata: { message: msg, code } });

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const today = () => new Date().toISOString().slice(0, 10);

const hariIndo = (tgl) => {
  const days = ['MINGGU','SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU'];
  return days[new Date(tgl).getDay()];
};

const getOne = async (sql, replacements = {}) => {
  const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  if (!rows.length) return null;
  return Object.values(rows[0])[0];
};

const getRow = async (sql, replacements = {}) => {
  const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  return rows[0] || null;
};

const getAll = async (sql, replacements = {}) => {
  return sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
};

const execute = async (sql, replacements = {}) => {
  return sequelize.query(sql, { replacements, type: QueryTypes.UPDATE });
};

const insert = async (sql, replacements = {}) => {
  return sequelize.query(sql, { replacements, type: QueryTypes.INSERT });
};

module.exports = { fail, DATE_RE, today, hariIndo, getOne, getRow, getAll, execute, insert };
