document.addEventListener('DOMContentLoaded', () => {
  setupPasswordFeatures();

  setupGoogleSignIn();

  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach(toggle => {

    toggle.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);

      const icon = this.querySelector('i');

      if (input && icon) {

        if (input.type === 'password') {

          input.type = 'text';

          icon.classList.replace('fa-eye-slash', 'fa-eye');

        } else {

          input.type = 'password';

          icon.classList.replace('fa-eye', 'fa-eye-slash');

        }

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
          console.log(data.message || 'Login failed. Please check your credentials.');
        }

      } catch (error) {
        console.error('Login error:', error);
        console.log('An error occurred during login. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

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
          googleSignInButton.click();
        } else {
          console.error('Google Sign-In button not found');
          console.log('Google Sign-In is currently unavailable. Please try again later.');
        }
      });
    }
  }

  window.handleGoogleSignIn = async (response) => {
    const token = response.credential;
    console.log("Google Sign-In Response:", response);
    console.log("Extracted Token:", token); 
    try {
      const googleLoginBtn = document.getElementById('googleLoginBtn');
      if (googleLoginBtn) {
        const originalBtnText = googleLoginBtn.innerHTML;
        googleLoginBtn.disabled = true;
        googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      }

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
        console.log(data.message || 'Google login failed. Please try again.');

        if (googleLoginBtn) {
          googleLoginBtn.disabled = false;
          googleLoginBtn.innerHTML = originalBtnText;
        }
      }

    } catch (error) {

      console.error('Google login error:', error);

      console.log('An error occurred during Google login. Please try again.');

      const googleLoginBtn = document.getElementById('googleLoginBtn');

      if (googleLoginBtn) {

        googleLoginBtn.disabled = false;

        // googleLoginBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo" class="google-icon"> Sign in with Google';
      }
    }

  };



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
          console.log(data.message || 'Registration failed.');
        }

      } catch (error) {
        console.error('Registration error:', error);
        console.log('An error occurred during registration. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

      }
    });

  }

  



  function validateRegistrationForm(name, email, password, confirmPassword) {



    if (!name || name.trim().length < 2) {
      console.log('Please enter a valid name (at least 2 characters).');
      return false;
    }

    



    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(name)) {
      console.log('Name should not contain numbers or special characters.');
      return false;
    }

    



    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log('Please enter a valid email address.');
      return false;

    }

    



    const disposableDomains = ['example.com', 'test.com'];
    const emailDomain = email.split('@')[1];
    if (disposableDomains.includes(emailDomain)) {
      console.log('Please use a non-disposable email address.');
      return false;
    }

    

 

    if (password.length < 8) {
      console.log('Password must be at least 8 characters long.');
      return false;
    }

    



    if (!/[A-Z]/.test(password)) {
      console.log('Password must contain at least one uppercase letter.');
      return false;
    }

    



    if (!/[a-z]/.test(password)) {
      console.log('Password must contain at least one lowercase letter.');
      return false;
    }

    



    if (!/[0-9]/.test(password)) {
      console.log('Password must contain at least one number.');
      return false;
    }

    



  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    console.log('Password must contain at least one special character.');
     return false;
  }

    



    if (password !== confirmPassword) {
      console.log('Passwords do not match.');
      return false;
    }

    return true;
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



function setupPasswordFeatures() {
  const passwordInput = document.getElementById('reg-password');
  const strengthBar = document.getElementById('strengthBar');
  if (!passwordInput) return;
  //const strengthText = document.getElementById('password-strength-text');


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