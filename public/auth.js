function showToast(message, isSuccess = true) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.background = isSuccess ? '#4caf50' : '#f44336';
  toast.style.color = '#fff';
  toast.style.padding = '10px';
  toast.style.marginTop = '5px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}



const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const credentials = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();

      if (res.ok && data.user_id) {
        // ✅ Store user_id and role in localStorage
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('role', data.role);

        showToast("✅ Login successful!");

        // ✅ Redirect based on role
        if (data.role === 'admin') {
          window.location.href = 'admin_dashboard.html';
        } else {
          window.location.href = 'customer_dashboard.html';
        }
      } else {
        showToast("❌ Login Failed!", false);
      }
    } catch (err) {
      showToast("❌ Server Error", false);
    }
  });
}
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = {
    first_name: document.getElementById('first_name').value,
    last_name: document.getElementById('last_name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    role: document.getElementById('role').value
  };

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  const data = await res.json();
  if (res.ok) {
    showToast("✅ Registration successful!");
    setTimeout(() => window.location.href = 'login.html', 1000);
  } else {
    showToast("❌ Registration failed!", false);
  }
});
