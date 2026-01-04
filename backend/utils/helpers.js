const crypto = require('crypto');

// Generate transaction ID
function generateTransactionId(prefix = 'TXN') {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}${timestamp}${randomBytes}`;
}

// Format currency
function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
}

module.exports = {
    generateTransactionId,
    formatCurrency,
    formatDateTime
};