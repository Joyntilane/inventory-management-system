function validateId(id) {
    if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid ID');
}

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length < 2) throw new Error('Name must be at least 2 characters');
}

function validatePrice(price) {
    if (typeof price !== 'number' || price <= 0) throw new Error('Price must be a positive number');
}

function validateQuantity(quantity) {
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative integer');
}

function validateCategory(category) {
    if (typeof category !== 'string' || category.trim().length < 2) throw new Error('Category must be at least 2 characters');
}

function validateCountry(country) {
    const validCountries = ['RSA', 'US', 'GB', 'EU', 'JP', 'CA'];
    if (!validCountries.includes(country)) throw new Error('Invalid country');
}

function validateQuantityChange(quantityChange) {
    if (!Number.isInteger(quantityChange) || quantityChange <= 0) throw new Error('Quantity change must be a positive integer');
}

function formatPrice(price, country) {
    const currencyMap = {
        'RSA': { code: 'ZAR', symbol: 'R' },
        'US': { code: 'USD', symbol: '$' },
        'GB': { code: 'GBP', symbol: '£' },
        'EU': { code: 'EUR', symbol: '€' },
        'JP': { code: 'JPY', symbol: '¥' },
        'CA': { code: 'CAD', symbol: 'C$' }
    };
    const { symbol } = currencyMap[country.toUpperCase()] || { symbol: 'R' };
    return `${symbol}${price.toFixed(2)}`;
}

module.exports = {
    validateId,
    validateName,
    validatePrice,
    validateQuantity,
    validateCategory,
    validateCountry,
    validateQuantityChange,
    formatPrice
};