// frontend/assets/js/auth.js
// This file contains basic authentication functions for login and registration,
// including showing and hiding the registration modal.

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Login Form Handling ----------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Disable form during submission
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
          // Save minimal user data in localStorage
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
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }

  // ---------- Registration Modal Handling ----------
  // Get the register button and modal elements
  const registerBtn = document.getElementById('registerBtn');
  const registerModal = document.getElementById('registerModal');
  const closeModalBtn = document.querySelector('#registerModal .close-modal');

  // When the "Create New Account" button is clicked, show the modal
  if (registerBtn && registerModal) {
    registerBtn.addEventListener('click', () => {
      registerModal.style.display = 'block';
      setTimeout(() => {
        registerModal.classList.add('show');
      }, 10);
    });
  }

  // Close the modal when the X (close button) is clicked
  if (closeModalBtn && registerModal) {
    closeModalBtn.addEventListener('click', () => {
      closeModal();
    });
  }

  // Close the modal if the user clicks outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === registerModal) {
      closeModal();
    }
  });
  
  // Function to close the modal
  function closeModal() {
    registerModal.classList.remove('show');
    setTimeout(() => {
      registerModal.style.display = 'none';
      // Reset form when closing
      if (registerForm) registerForm.reset();
    }, 300);
  }

  // ---------- Registration Form Handling ----------
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      // Validate form inputs
      if (!validateRegistrationForm(name, email, password, confirmPassword)) {
        return;
      }
      
      // Disable form during submission
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({ name, email, password }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          // Save minimal user data and redirect to dashboard
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
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
  
  // Form validation function
  function validateRegistrationForm(name, email, password, confirmPassword) {
    // Name validation
    if (!name || name.trim().length < 2) {
      showError('Please enter a valid name (at least 2 characters).');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return false;
    }
    
    // Password validation
    if (password.length < 8) {
      showError('Password must be at least 8 characters long.');
      return false;
    }
    
    // Password confirmation check
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return false;
    }
    
    return true;
  }
  
  // Display error message function
  function showError(message) {
    // You can implement this based on your UI design
    // For example, show in a dedicated error div or use alert for simplicity
    alert(message);
  }
});

// Expose logoutUser globally for sidebar logout functionality
function logoutUser() {
  // Disable logout button if present
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
  }
  
  fetch('/api/users/logout', {
    method: 'POST',
    credentials: 'include' // Important for cookies
  })
  .then(response => response.json())
  .then(data => {
    localStorage.removeItem('user');
    window.location.href = '../../index.html'; // Fixed path to login page
  })
  .catch(error => {
    console.error('Error during logout:', error);
    alert('Logout failed. Please try again.');
    // Re-enable logout button
    if (logoutBtn) {
      logoutBtn.disabled = false;
    }
  });
}

// Check if user is authenticated on protected pages
function checkAuth() {
  const user = localStorage.getItem('user');
  if (!user && !window.location.pathname.includes('index.html')) {
    window.location.href = '../../index.html';
  }
}

// Export functions for global use
window.logoutUser = logoutUser;
window.checkAuth = checkAuth;

// Check authentication status when script loads on protected pages
if (!window.location.pathname.includes('../../index.html')) {
  checkAuth();
}