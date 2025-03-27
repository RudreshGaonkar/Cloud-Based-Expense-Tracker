document.addEventListener('DOMContentLoaded', () => {
  // ---------- Login Form Handling ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      
      try {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({ email, password }),
        });
        
        const data = await res.json();
        
        if (res.ok) {

          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email
          }));
          console.log("✅ User stored in localStorage:", localStorage.getItem('user'));
          window.location.href = 'pages/dashboard.html';
        } else {
          showError(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // ---------- Registration Modal Handling ----------

  const registerBtn = document.getElementById('registerBtn');
  const registerModal = document.getElementById('registerModal');
  const closeModalBtn = document.querySelector('#registerModal .close-modal');


  if (registerBtn && registerModal) {
    registerBtn.addEventListener('click', () => {
      registerModal.style.display = 'block';
      setTimeout(() => {
        registerModal.classList.add('show');
      }, 10);
    });
  }


  if (closeModalBtn && registerModal) {
    closeModalBtn.addEventListener('click', () => {
      closeModal();
    });
  }


  window.addEventListener('click', (event) => {
    if (event.target === registerModal) {
      closeModal();
    }
  });
  

  function closeModal() {
    registerModal.classList.remove('show');
    setTimeout(() => {
      registerModal.style.display = 'none';

      if (registerForm) registerForm.reset();
    }, 300);
  }

  // ---------- Registration Form Handling ----------
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      

      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;


      if (!validateRegistrationForm(name, email, password, confirmPassword)) {
        return;
      }
      

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', 
          body: JSON.stringify({ name, email, password }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email
          }));
          window.location.href = 'pages/dashboard.html';
        } else {
          showError(data.message || 'Registration failed.');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration. Please try again.');
      } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
  

  function validateRegistrationForm(name, email, password, confirmPassword) {

    if (!name || name.trim().length < 2) {
      showError('Please enter a valid name (at least 2 characters).');
      return false;
    }
    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return false;
    }
    

    if (password.length < 8) {
      showError('Password must be at least 8 characters long.');
      return false;
    }
    

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return false;
    }
    
    return true;
  }
  

  function showError(message) {
    alert(message);
  }
});


function logoutUser() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
  }
  
  fetch('/api/users/logout', {
    method: 'POST',
    credentials: 'include' 
  })
  .then(response => response.json())
  .then(data => {
    localStorage.removeItem('user');
    window.location.href = '../../index.html'; 
  })
  .catch(error => {
    console.error('Error during logout:', error);
    alert('Logout failed. Please try again.');
    if (logoutBtn) {
      logoutBtn.disabled = false;
    }
  });
}

function checkAuth() {
  const user = localStorage.getItem('user');
  if (!user && !window.location.pathname.includes('index.html')) {
    window.location.href = '../../index.html';
  }
}


window.logoutUser = logoutUser;
window.checkAuth = checkAuth;


if (!window.location.pathname.includes('../../index.html')) {
  checkAuth();
}