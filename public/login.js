const toggleForm = (form) => {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const loginBtn = document.getElementById('showLogin');
    const registerBtn = document.getElementById('showRegister');

    if (form === 'login') {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
        loginBtn.setAttribute('aria-selected', 'true');
        registerBtn.setAttribute('aria-selected', 'false');
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
        loginBtn.setAttribute('aria-selected', 'false');
        registerBtn.setAttribute('aria-selected', 'true');
    }
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loading = document.getElementById('loginLoading');
    // CHANGE: Clear previous errors
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('loginMessage').textContent = '';

    loading.style.display = 'block';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (!response.ok) {
            // CHANGE: Specific inline error feedback
            if (result.error === 'Invalid credentials') {
                document.getElementById('usernameError').textContent = 'Username or password incorrect';
                document.getElementById('passwordError').textContent = 'Username or password incorrect';
            } else {
                document.getElementById('loginMessage').textContent = result.error;
            }
            throw new Error(result.error);
        }
        localStorage.setItem('token', result.token);
        localStorage.setItem('company', JSON.stringify(result.company));
        if (result.role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/user.html';
        }
    } catch (error) {
        document.getElementById('loginMessage').className = 'error';
    } finally {
        loading.style.display = 'none';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    const companyDetails = role === 'admin' ? {
        name: document.getElementById('companyName').value,
        address: document.getElementById('companyAddress').value,
        contact: document.getElementById('companyContact').value
    } : null;
    // CHANGE: Clear previous errors
    document.getElementById('regUsernameError').textContent = '';
    document.getElementById('regPasswordError').textContent = '';
    document.getElementById('companyNameError').textContent = '';
    document.getElementById('registerMessage').textContent = '';

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role, companyDetails })
        });
        const result = await response.json();
        if (!response.ok) {
            // CHANGE: Specific inline error feedback
            if (result.error.includes('Username')) {
                document.getElementById('regUsernameError').textContent = result.error;
            } else if (result.error.includes('Password')) {
                document.getElementById('regPasswordError').textContent = result.error;
            } else if (result.error.includes('Company')) {
                document.getElementById('companyNameError').textContent = result.error;
            } else {
                document.getElementById('registerMessage').textContent = result.error;
            }
            throw new Error(result.error);
        }
        document.getElementById('registerMessage').textContent = result.message;
        document.getElementById('registerMessage').className = 'success';
    } catch (error) {
        document.getElementById('registerMessage').className = 'error';
    }
});

document.getElementById('regRole').addEventListener('change', (e) => {
    document.getElementById('companyDetails').style.display = e.target.value === 'admin' ? 'block' : 'none';
    if (e.target.value === 'admin') {
        document.getElementById('companyName').setAttribute('required', 'true');
    } else {
        document.getElementById('companyName').removeAttribute('required');
    }
});

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