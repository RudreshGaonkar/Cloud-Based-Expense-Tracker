document.addEventListener('DOMContentLoaded', () => {
  setupPasswordFeatures();
  setupGoogleSignIn();

  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-target");
      const passwordInput = document.querySelector(`[id="${targetId}"]`);

      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggle.innerHTML = '<i class="fas fa-eye"></i>'; 
      } else {
        passwordInput.type = "password";
        toggle.innerHTML = '<i class="fas fa-eye-slash"></i>'; 
      }
    });
  });
  
  // ---------- Login Form Handling ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById("login");

      // Show loading state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="loader"></div> Signing in...';
      
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
          showToast(data.message || 'Login failed. Please check your credentials.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }

      } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // ---------- Google Sign-In Setup ----------
  function setupGoogleSignIn() {
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', () => {
        const googleSignInButton = document.querySelector('.g_id_signin');
        if (googleSignInButton) {
          googleLoginBtn.disabled = true;
          googleLoginBtn.innerHTML = '<div class="loader"></div> Signing in...';
          googleSignInButton.click();
        } else {
          console.error('Google Sign-In button not found');
          showToast('Google Sign-In is currently unavailable. Please try again later.', 'error');
        }
      });
    }
  }

  window.handleGoogleSignIn = async (response) => {
    const token = response.credential;
    console.log("Google Sign-In Response:", response);
    console.log("Extracted Token:", token); 
    
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    let originalBtnText = '';
    
    if (googleLoginBtn) {
      originalBtnText = 'Sign in with Google';
      googleLoginBtn.disabled = true;
      googleLoginBtn.innerHTML = '<div class="loader"></div> Signing in...';
    }

    try {
      const res = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log("API Response Data:", data);
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email
        }));
        console.log("✅ Google user stored in localStorage:", localStorage.getItem('user'));
        window.location.href = 'pages/dashboard.html';
      } else {
        showToast(data.message || 'Google login failed. Please try again.', 'error');
        if (googleLoginBtn) {
          googleLoginBtn.disabled = false;
          googleLoginBtn.innerHTML = originalBtnText;
        }
      }

    } catch (error) {
      console.error('Google login error:', error);
      showToast('An error occurred during Google login. Please try again.', 'error');
      
      if (googleLoginBtn) {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = originalBtnText;
      }
    }
  };

  // ---------- Registration Modal -----------
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

  // ---------- Registration Form  -----------
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
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="loader"></div> Creating account...';

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
          showToast(data.message || 'Registration failed.', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }

      } catch (error) {
        console.error('Registration error:', error);
        showToast('An error occurred during registration. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  function validateRegistrationForm(name, email, password, confirmPassword) {
    if (!name || name.trim().length < 2) {
      showToast('Please enter a valid name (at least 2 characters).', 'error');
      return false;
    }

    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(name)) {
      showToast('Name should not contain numbers or special characters.', 'error');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }

    const disposableDomains = ['example.com', 'test.com'];
    const emailDomain = email.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
      showToast('Please use a non-disposable email address.', 'error');
      return false;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      showToast('Password must contain at least one uppercase letter.', 'error');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      showToast('Password must contain at least one lowercase letter.', 'error');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      showToast('Password must contain at least one number.', 'error');
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      showToast('Password must contain at least one special character.', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return false;
    }

    return true;
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    

    toastContainer.appendChild(toast);
    

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    

    const dismissTimeout = setTimeout(() => {
      dismissToast(toast);
    }, 5000);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(dismissTimeout);
      dismissToast(toast);
    });
  }
  
  function dismissToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
});

function logoutUser() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.innerHTML = '<div class="loader"></div> Logging out...';
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
    showToast('Logout failed. Please try again.', 'error');
    if (logoutBtn) {
      logoutBtn.disabled = false;
      logoutBtn.innerHTML = 'Logout';
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

function setupPasswordFeatures() {
  const passwordInput = document.getElementById('reg-password');
  const strengthBar = document.getElementById('strengthBar');
  if (!passwordInput) return;

  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);
    strengthBar.value = strength;
  });
}

function calculatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]+/)) strength++;
  if (password.match(/[A-Z]+/)) strength++;
  if (password.match(/[0-9]+/)) strength++;
  if (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/)) strength++;
  return Math.min(strength, 5); 
}