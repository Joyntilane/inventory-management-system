// Country to currency mapping (simplified, ISO 3166-1 alpha-2 codes)
const currencyMap = {
    'RSA': { code: 'RSA', symbol: 'R' },
    'US': { code: 'USD', symbol: '$' },
    'GB': { code: 'GBP', symbol: '£' },
    'EU': { code: 'EUR', symbol: '€' },
    'JP': { code: 'JPY', symbol: '¥' },
    'CA': { code: 'CAD', symbol: 'C$' },
};

function validateId(id) {
    if (typeof id !== 'string' || !id.match(/^[A-Za-z0-9]+$/)) {
        throw new Error('ID must be a non-empty alphanumeric string');
    }
    return id;
}

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 50) {
        throw new Error('Name must be a non-empty string (max 50 characters)');
    }
    return name.trim();
}

function validatePrice(price) {
    const num = Number(price);
    if (isNaN(num) || num < 0 || num > 1000000) {
        throw new Error('Price must be a number between 0 and 1,000,000');
    }
    return Number(num.toFixed(2));
}

function validateQuantity(quantity) {
    const num = Number(quantity);
    if (isNaN(num) || !Number.isInteger(num) || num < 0 || num > 1000000) {
        throw new Error('Quantity must be an integer between 0 and 1,000,000');
    }
    return num;
}

function validateCategory(category) {
    if (typeof category !== 'string' || category.trim().length === 0 || category.length > 30) {
        throw new Error('Category must be a non-empty string (max 30 characters)');
    }
    return category.trim().toLowerCase();
}

function validateCountry(country) {
    if (typeof country !== 'string' || !currencyMap[country.toUpperCase()]) {
        throw new Error('Invalid or unsupported country code');
    }
    return country.toUpperCase();
}

function validateQuantityChange(quantityChange) {
    const num = Number(quantityChange);
    if (isNaN(num) || !Number.isInteger(num) || Math.abs(num) > 1000000) {
        throw new Error('Quantity change must be an integer between -1,000,000 and 1,000,000');
    }
    return num;
}

function padString(str, length) {
    return str.padEnd(length);
}

function getCurrency(country) {
    return currencyMap[country.toUpperCase()] || { code: 'USD', symbol: '$' }; // Default to USD
}

function formatPrice(price, country) {
    const { symbol } = getCurrency(country);
    return `${symbol}${price.toFixed(2)}`;
}

module.exports = {
    padString,
    validateId,
    validateName,
    validatePrice,
    validateQuantity,
    validateCategory,
    validateCountry,
    validateQuantityChange,
    getCurrency,
    formatPrice
};