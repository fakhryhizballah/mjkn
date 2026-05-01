const moment = require('moment');
const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = moment(dateStr, 'YYYY-MM-DD', true);
    return date.isValid();
};

module.exports = {
    isValidDate,
};