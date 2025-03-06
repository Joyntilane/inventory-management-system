// Check authentication
const token = localStorage.getItem('token');
if (!token) window.location.href = '/';

const toggleBtn = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const html = document.documentElement;
const productsList = document.getElementById('productsList');

const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
toggleBtn.textContent = savedTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';

toggleBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toggleBtn.textContent = newTheme === 'light' ? 'Toggle Dark Mode' : 'Toggle Light Mode';
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
    window.location.href = '/';
});

// Fetch and display products
async function fetchProducts() {
    try {
        const response = await fetch('/api/user/all-products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        productsList.innerHTML = '<p class="error">Error loading products. Please try again later.</p>';
    }
}

function displayProducts(products) {
    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p class="price">${formatPrice(product.price, product.country)}</p>
            <p class="description">${product.shortDescription}</p>
        </div>
    `).join('');
}

// Format price function (from admin.js)
function formatPrice(price, country) {
    const currencyMap = {
        'RSA': { code: 'RSA', symbol: 'R' },
        'US': { code: 'USD', symbol: '$' },
        'GB': { code: 'GBP', symbol: '£' },
        'EU': { code: 'EUR', symbol: '€' },
        'JP': { code: 'JPY', symbol: '¥' },
        'CA': { code: 'CAD', symbol: 'C$' }
    };
    const { symbol } = currencyMap[country.toUpperCase()] || { symbol: '$' };
    return `${symbol}${price.toFixed(2)}`;
}

// Initial load
fetchProducts();