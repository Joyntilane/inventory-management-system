const token = localStorage.getItem('token');
if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/';
}

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

async function fetchProducts() {
    try {
        console.log('Fetching products with token:', token);
        const response = await fetch('/api/user/all-products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        productsList.innerHTML = `<p class="error">Error loading products: ${error.message}. Please try again later.</p>`;
    }
}

async function submitFeedback(productId, rating, comment) {
    try {
        const response = await fetch('/api/user/feedback', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, rating, comment })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit feedback');
        await fetchProducts();
        await fetchFeedbackHistory();
    } catch (error) {
        console.error('Error submitting feedback:', error.message);
        alert(`Error: ${error.message}`);
    }
}

async function fetchFeedbackHistory() {
    try {
        const response = await fetch('/api/user/feedback/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to fetch feedback history');
        const feedback = await response.json();
        const feedbackHistory = document.getElementById('feedbackHistory');
        feedbackHistory.innerHTML = `
            <table>
                <thead>
                    <tr><th>Product</th><th>Rating</th><th>Comment</th><th>Timestamp</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${feedback.map(f => `
                        <tr>
                            <td>${f.product_name}</td>
                            <td>${f.rating}</td>
                            <td>${f.comment || 'N/A'}</td>
                            <td>${new Date(f.timestamp).toLocaleString()}</td>
                            <td>
                                <button class="animate-btn secondary-btn" onclick="editFeedback(${f.id}, ${f.rating}, '${f.comment}')">Edit</button>
                                <button class="animate-btn danger-btn" onclick="deleteFeedback(${f.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error fetching feedback history:', error.message);
        document.getElementById('feedbackHistory').innerHTML = `<p class="error">Error loading feedback history: ${error.message}</p>`;
    }
}

async function editFeedback(feedbackId, currentRating, currentComment) {
    const rating = prompt('Enter new rating (1-5):', currentRating);
    const comment = prompt('Enter new comment (optional):', currentComment);
    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
        try {
            const response = await fetch(`/api/user/feedback/${feedbackId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating: parseInt(rating, 10), comment })
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to update feedback');
            await fetchFeedbackHistory();
            await fetchProducts();
        } catch (error) {
            console.error('Error editing feedback:', error.message);
            alert(`Error: ${error.message}`);
        }
    } else {
        alert('Invalid rating. Please enter a number between 1 and 5.');
    }
}

async function deleteFeedback(feedbackId) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        try {
            const response = await fetch(`/api/user/feedback/${feedbackId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete feedback');
            await fetchFeedbackHistory();
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting feedback:', error.message);
            alert(`Error: ${error.message}`);
        }
    }
}

function displayProducts(products) {
    productsList.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.photo_path ? `<img src="${product.photo_path}" alt="${product.name}" class="product-image">` : '<div class="no-image">No Image</div>'}
            <h3>${product.name}</h3>
            <p class="price">${formatPrice(product.price, product.country)}</p>
            <p class="description">${product.short_description || 'No description available'}</p>
            <p class="rating">Average Rating: ${product.average_rating.toFixed(1)} (${product.feedback_count} reviews)</p>
            <div class="feedback-form">
                <select id="rating-${product.id}" required>
                    <option value="" disabled selected>Rate (1-5)</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
                <input type="text" id="comment-${product.id}" placeholder="Add a comment (optional)">
                <button class="animate-btn secondary-btn" onclick="submitFeedback(${product.id}, document.getElementById('rating-${product.id}').value, document.getElementById('comment-${product.id}').value)">Submit Feedback</button>
            </div>
        </div>
    `).join('');
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

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchFeedbackHistory();
});