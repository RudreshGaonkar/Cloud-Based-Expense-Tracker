document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  setupPasswordFeatures();
  

  document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await changePassword();
  });
});

function loadUserProfile() {
  loadUserInfo();
}

async function loadUserInfo() {
  try {
    const response = await fetch('/api/users/profile', { credentials: 'include' });
    if (!response.ok) throw new Error("Failed to fetch user profile");

    const data = await response.json();
    const userNameElements = document.querySelectorAll('#user-name, #profile-name');
    userNameElements.forEach(el => {
      el.textContent = data.user.name;
    });


    const avatarElements = document.querySelectorAll('#user-avatar, #large-user-avatar');
    avatarElements.forEach(el => {
      el.textContent = data.user.name.charAt(0).toUpperCase();
    });
  } catch (error) {
    console.error("❌ Error loading user info:", error);

    document.getElementById('user-name').textContent = 'Error Loading Profile';
  }
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match!");
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Parse the response manually
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    alert("Password updated successfully!");
    document.getElementById('change-password-form').reset();
  } catch (error) {
    console.error("❌ Error changing password:", error);
    alert(error.message || 'An unexpected error occurred');
  }
}

//2$20P9qb1lBTZFAA
function setupPasswordFeatures() {
  const passwordInput = document.getElementById('new-password');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('password-strength-text');


  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);
    
    strengthBar.value = strength;
    strengthBar.setAttribute('value', strength);

    switch(strength) {
      case 1:
        strengthText.textContent = "Weak password";
        strengthText.style.color = "var(--danger-color)";
        break;
      case 2:
        strengthText.textContent = "Moderate password";
        strengthText.style.color = "#ffc107";
        break;
      case 3:
        strengthText.textContent = "Strong password";
        strengthText.style.color = "#2196F3";
        break;
      case 4:
        strengthText.textContent = "Very strong password";
        strengthText.style.color = "#4CAF50";
        break;
      default:
        strengthText.textContent = "";
    }
  });


  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = toggle.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      }
    });
  });
}


function calculatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]+/)) strength++;
  if (password.match(/[A-Z]+/)) strength++;
  if (password.match(/[0-9]+/)) strength++;
  if (password.match(/[$@#&!]+/)) strength++;
  return Math.min(strength, 4);
}