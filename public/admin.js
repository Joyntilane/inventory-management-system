const ITEMS_PER_PAGE = 5;
let inventoryPage = 1;
let transactionsPage = 1;
let inventoryData = [];
let transactionsData = [];

const token = localStorage.getItem('token');
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

const ws = new WebSocket(`ws://${window.location.host}`);

ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    if (type === 'inventoryUpdate') {
        inventoryData = data;
        updateInventoryTable();
    } else if (type === 'transactionUpdate') {
        transactionsData = data;
        updateTransactionTable();
    }
};
ws.onclose = () => console.log('WebSocket disconnected');

// Add Product
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        id: document.getElementById('id').value,
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        quantity: parseInt(document.getElementById('quantity').value),
        category: document.getElementById('category').value,
        country: document.getElementById('country').value
    };

    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers,
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        document.getElementById('addMessage').textContent = response.ok ? result.message : result.error;
        document.getElementById('addMessage').className = response.ok ? 'success' : 'error';
    } catch (error) {
        document.getElementById('addMessage').textContent = error.message;
        document.getElementById('addMessage').className = 'error';
    }
});

// Edit Product
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('editName').value,
        price: parseFloat(document.getElementById('editPrice').value),
        quantity: parseInt(document.getElementById('editQuantity').value),
        category: document.getElementById('editCategory').value,
        country: document.getElementById('editCountry').value
    };

    try {
        const id = document.getElementById('editId').value;
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        document.getElementById('editMessage').textContent = response.ok ? result.message : result.error;
        document.getElementById('editMessage').className = response.ok ? 'success' : 'error';
    } catch (error) {
        document.getElementById('editMessage').textContent = error.message;
        document.getElementById('editMessage').className = 'error';
    }
});

// Update Quantity
document.getElementById('updateQuantityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('updateId').value;
    const quantityChange = parseInt(document.getElementById('quantityChange').value);

    try {
        const response = await fetch(`/api/admin/products/${id}/quantity`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ quantityChange })
        });
        const result = await response.json();
        document.getElementById('updateMessage').textContent = response.ok ? result.message : result.error;
        document.getElementById('updateMessage').className = response.ok ? 'success' : 'error';
    } catch (error) {
        document.getElementById('updateMessage').textContent = error.message;
        document.getElementById('updateMessage').className = 'error';
    }
});

// Remove Product
document.getElementById('removeProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('removeId').value;

    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers
        });
        const result = await response.json();
        document.getElementById('removeMessage').textContent = response.ok ? result.message : result.error;
        document.getElementById('removeMessage').className = response.ok ? 'success' : 'error';
    } catch (error) {
        document.getElementById('removeMessage').textContent = error.message;
        document.getElementById('removeMessage').className = 'error';
    }
});

// Search Products
async function searchProducts() {
    const query = document.getElementById('searchQuery').value;
    try {
        const response = await fetch(`/api/admin/products/search?query=${encodeURIComponent(query)}`, {headers});
        const results = await response.json();
        const tbody = document.getElementById('searchResults').querySelector('tbody');
        tbody.innerHTML = '';
        results.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${formatPrice(p.price, p.country)}</td>
                <td>${p.quantity}</td>
                <td>${p.category}</td>
                <td>${p.country}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        document.getElementById('searchResults').querySelector('tbody').innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
    }
}

// Update Inventory Table
async function updateInventoryTable() {
    try {
        const totalResponse = await fetch('/api/admin/total-value', {headers});
        const { total } = await totalResponse.json();
        document.getElementById('totalValue').textContent = total.toFixed(2);

        const tbody = document.getElementById('inventoryTable').querySelector('tbody');
        tbody.innerHTML = '';
        const start = (inventoryPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedData = inventoryData.slice(start, end);

        paginatedData.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${formatPrice(p.price, p.country)}</td>
                <td>${p.quantity}</td>
                <td>${p.category}</td>
                <td>${p.country}</td>
                <td>${formatPrice(p.price * p.quantity, p.country)}</td>
                <td><button class="edit-btn" onclick="fillEditForm('${p.id}', '${p.name}', ${p.price}, ${p.quantity}, '${p.category}', '${p.country}')">Edit</button></td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('inventoryPage').textContent = inventoryPage;
    } catch (error) {
        document.getElementById('inventoryTable').querySelector('tbody').innerHTML = `<tr><td colspan="8">Error: ${error.message}</td></tr>`;
    }
}

// Fill Edit Form
function fillEditForm(id, name, price, quantity, category, country) {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editPrice').value = price;
    document.getElementById('editQuantity').value = quantity;
    document.getElementById('editCategory').value = category;
    document.getElementById('editCountry').value = country; // Sets the selected option
}

// Update Transaction Table
async function updateTransactionTable() {
    try {
        const response = await fetch('/api/admin/transactions', { headers });
        transactionsData = await response.json();
        const tbody = document.getElementById('transactionTable').querySelector('tbody');
        tbody.innerHTML = '';
        const start = (transactionsPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedData = transactionsData.slice(start, end);

        paginatedData.forEach(t => {
            const row = document.createElement('tr');
            const product = inventoryData.find(p => p.id === t.product_id);
            const value = product ? formatPrice(t.value, product.country) : t.value;
            row.innerHTML = `
                <td>${new Date(t.timestamp).toLocaleString()}</td>
                <td>${t.type}</td>
                <td>${t.product_id}</td>
                <td>${t.quantity}</td>
                <td>${value}</td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('transactionsPage').textContent = transactionsPage;
    } catch (error) {
        document.getElementById('transactionTable').querySelector('tbody').innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

// Pagination Controls
function prevPage(type) {
    if (type === 'inventory' && inventoryPage > 1) {
        inventoryPage--;
        updateInventoryTable();
    } else if (type === 'transactions' && transactionsPage > 1) {
        transactionsPage--;
        updateTransactionTable();
    }
}

function nextPage(type) {
    if (type === 'inventory' && inventoryPage * ITEMS_PER_PAGE < inventoryData.length) {
        inventoryPage++;
        updateInventoryTable();
    } else if (type === 'transactions' && transactionsPage * ITEMS_PER_PAGE < transactionsData.length) {
        transactionsPage++;
        updateTransactionTable();
    }
}

// Export to CSV
async function exportToCSV() {
    try {
        const response = await fetch('/api/admin/export', {headers});
        const csv = await response.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert(`Error exporting CSV: ${error.message}`);
    }
}

// Currency Formatting
const currencyMap = {
    'RSA': { code: 'RSA', symbol: 'R' },
    'US': { code: 'USD', symbol: '$' },
    'GB': { code: 'GBP', symbol: '£' },
    'EU': { code: 'EUR', symbol: '€' },
    'JP': { code: 'JPY', symbol: '¥' },
    'CA': { code: 'CAD', symbol: 'C$' }
};

function formatPrice(price, country) {
    const { symbol } = currencyMap[country.toUpperCase()] || { symbol: 'R' };
    return `${symbol}${price.toFixed(2)}`;
}

// Initial load
async function initialLoad() {
    if (!token) window.location.href = '/';
    updateInventoryTable();
    updateTransactionTable();
}

initialLoad();