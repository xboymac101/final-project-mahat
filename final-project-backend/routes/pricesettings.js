const db = require('../dbSingleton').getConnection();

function getPriceSetting(key, callback) {
  db.query('SELECT value FROM price_settings WHERE `key`=?', [key], (err, rows) => {
    if (err || rows.length === 0) return callback(null);
    callback(rows[0].value);
  });
}

function getNumberSetting(key, fallback, callback) {
  getPriceSetting(key, (val) => {
    if (val === null || val === undefined) return callback(fallback);
    const n = parseFloat(val);
    if (Number.isFinite(n)) return callback(n);
    callback(fallback);
  });
}

function getBoolSetting(key, fallback, callback) {
  getPriceSetting(key, (val) => {
    if (val === null || val === undefined) return callback(!!fallback);
    const v = String(val).toLowerCase();
    callback(v === '1' || v === 'true');
  });
}

module.exports = { getPriceSetting, getNumberSetting, getBoolSetting };