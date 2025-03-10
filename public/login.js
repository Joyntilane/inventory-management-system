const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const roleSelect = document.getElementById('role');
const companyDetails = document.getElementById('companyDetails');
const toggleBtn = document.getElementById('themeToggle');
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

loginBtn.addEventListener('click', () => {
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

registerBtn.addEventListener('click', () => {
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
});

roleSelect.addEventListener('change', () => {
    companyDetails.style.display = roleSelect.value === 'admin' ? 'block' : 'none';
});

function displayError(elementId, message) {
    document.getElementById(`${elementId}Error`).textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.error').forEach(error => error.textContent = '');
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    clearErrors();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Login failed');
        const { token, role, company } = await response.json();
        localStorage.setItem('token', token);
        localStorage.setItem('company', JSON.stringify(company));
        window.location.href = role === 'admin' ? '/admin.html' : '/user.html';
    } catch (error) {
        displayError('loginPassword', error.message);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('role').value;
    const companyDetailsData = role === 'admin' ? {
        name: document.getElementById('companyName').value,
        address: document.getElementById('companyAddress').value,
        contact: document.getElementById('companyContact').value
    } : null;

    clearErrors();

    try {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, companyDetails: companyDetailsData })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Registration failed');
        alert('Registration successful! Please log in.');
        loginBtn.click();
    } catch (error) {
        displayError('registerPassword', error.message);
    }
});