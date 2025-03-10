const token = localStorage.getItem('token');
if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/';
}

const toggleBtn = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const html = document.documentElement;

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

function displayError(elementId, message) {
    document.getElementById(`${elementId}Error`).textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
}

async function fetchInventory() {
    try {
        const response = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch inventory');
        const products = await response.json();
        updateProductTable(products);
    } catch (error) {
        console.error('Error fetching inventory:', error.message);
        alert(`Error: ${error.message}`);
    }
}

function updateProductTable(products) {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.price.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>${product.category}</td>
            <td>${product.country}</td>
            <td>
                <button class="animate-btn secondary-btn" onclick="updateQuantity(${product.id}, 'add')">Add</button>
                <button class="animate-btn secondary-btn" onclick="updateQuantity(${product.id}, 'remove')">Remove</button>
            </td>
        </tr>
    `).join('');
}

async function fetchFeedbackReports() {
    try {
        const response = await fetch('/api/admin/feedback', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch feedback');
        const feedback = await response.json();
        const feedbackReports = document.getElementById('feedbackReports');
        feedbackReports.innerHTML = `
            <table>
                <thead>
                    <tr><th>Product</th><th>User</th><th>Rating</th><th>Comment</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                    ${feedback.map(f => `
                        <tr>
                            <td>${f.product_name}</td>
                            <td>${f.username}</td>
                            <td>${f.rating}</td>
                            <td>${f.comment || 'N/A'}</td>
                            <td>${new Date(f.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error fetching feedback reports:', error.message);
        document.getElementById('feedbackReports').innerHTML = `<p class="error">Error loading feedback: ${error.message}</p>`;
    }
}

async function fetchReviewAnalytics() {
    try {
        const response = await fetch('/api/admin/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch analytics');
        const analytics = await response.json();
        const reviewAnalytics = document.getElementById('reviewAnalytics');
        reviewAnalytics.innerHTML = `
            <h3>Product Averages</h3>
            <table>
                <thead>
                    <tr><th>Product</th><th>Average Rating</th><th>Feedback Count</th></tr>
                </thead>
                <tbody>
                    ${analytics.productAverages.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.average_rating.toFixed(1)}</td>
                            <td>${p.feedback_count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Rating Distribution</h3>
            <table>
                <thead>
                    <tr><th>Rating</th><th>Count</th></tr>
                </thead>
                <tbody>
                    ${analytics.ratingDistribution.map(r => `
                        <tr>
                            <td>${r.rating}</td>
                            <td>${r.count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h3>Feedback Trends by Month</h3>
            <table>
                <thead>
                    <tr><th>Month</th><th>Feedback Count</th></tr>
                </thead>
                <tbody>
                    ${analytics.feedbackTrends.map(t => `
                        <tr>
                            <td>${t.month}</td>
                            <td>${t.feedback_count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error fetching review analytics:', error.message);
        document.getElementById('reviewAnalytics').innerHTML = `<p class="error">Error loading analytics: ${error.message}</p>`;
    }
}

async function updateQuantity(productId, type) {
    const quantityChange = parseInt(prompt(`Enter quantity to ${type}:`), 10);
    if (isNaN(quantityChange) || quantityChange <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    try {
        const response = await fetch(`/api/admin/update-quantity/${productId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantityChange, type })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to update quantity');
        fetchInventory();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value, 10);
    const category = document.getElementById('productCategory').value;
    const country = document.getElementById('productCountry').value;
    const shortDescription = document.getElementById('productDescription').value || '';
    const photoInput = document.getElementById('productPhoto');
    const photo = photoInput.files[0];

    clearErrors();

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('quantity', quantity);
        formData.append('category', category);
        formData.append('country', country);
        formData.append('shortDescription', shortDescription);
        if (photo) {
            formData.append('photo', photo);
        }

        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to add product');
        const product = await response.json();
        updateProductTable([product, ...document.querySelectorAll('#inventoryTable tbody tr').map(tr => ({
            id: tr.cells[5].children[0].getAttribute('onclick').match(/\d+/)[0],
            name: tr.cells[0].textContent,
            price: parseFloat(tr.cells[1].textContent),
            quantity: parseInt(tr.cells[2].textContent),
            category: tr.cells[3].textContent,
            country: tr.cells[4].textContent
        }))]);
        document.getElementById('productForm').reset();
    } catch (error) {
        displayError('productForm', error.message);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchInventory();
    fetchFeedbackReports();
    fetchReviewAnalytics();
});