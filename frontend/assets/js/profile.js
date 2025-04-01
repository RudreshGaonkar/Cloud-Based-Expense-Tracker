document.addEventListener('DOMContentLoaded', () => {
  let passwordStates = {};
  loadUserProfile();
  setupPasswordFeatures();
  setupAvatarUpload();

  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach(toggle => {
    const targetId = toggle.getAttribute('data-target');
    passwordStates[targetId] = false; 
    
    toggle.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = this.querySelector('i');
      

      passwordStates[targetId] = !passwordStates[targetId];
      const isVisible = passwordStates[targetId];
      
      console.log(`Toggle clicked, making password ${isVisible ? 'visible' : 'hidden'}`);
      
      if (input && icon) {
        if (isVisible) {
          input.setAttribute('type', 'text');
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        } else {

          input.setAttribute('type', 'password');
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      }
    });
  });
  

  document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await changePassword();
  });

  document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfileChanges();
  });
});

function loadUserProfile() {
  loadUserInfo();
}

async function loadUserInfo() {
  try {
    const response = await fetch('/api/users/profile', { credentials: 'include' });
    let userData;

    if (response.ok) {
      const data = await response.json();
      userData = data.user;
      

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error("User not found in local storage");
      }
      userData = JSON.parse(storedUser);
    }


    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = userData.name;
    }


    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) {
      nameInput.value = userData.name;
    }
    
    const emailDisplay = document.getElementById('profile-email-display');
    if (emailDisplay) {
      emailDisplay.value = userData.email || '';
    }

    loadUserAvatar();

  } catch (error) {
    console.error("❌ Error loading user info:", error);
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = 'Error Loading Profile';
    }
  }
}

function loadUserAvatar() {
  const avatarElements = document.querySelectorAll('#user-avatar, #large-user-avatar');
  const storedAvatar = localStorage.getItem('userAvatar');
  const nameInput = document.getElementById('profile-name-input');
  const userName = nameInput ? nameInput.value : 'User';
  
  avatarElements.forEach(el => {
    if (storedAvatar) {
      if (el.querySelector('img')) {
        el.querySelector('img').src = storedAvatar;
      } else {
        const img = document.createElement('img');
        img.src = storedAvatar;
        img.alt = 'Profile Avatar';
        img.className = 'avatar-img';
        el.innerHTML = '';
        el.appendChild(img);
      }
    } else {
      // el.textContent = userName.charAt(0).toUpperCase();
    }
  });
}


function setupAvatarUpload() {
  const avatarInput = document.getElementById('avatar-input');
  
  if (!avatarInput) return;
  
  avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5000000) { 
      alert('File is too large. Please select an image under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {

      localStorage.setItem('userAvatar', e.target.result);
      
      loadUserAvatar();
    };
    reader.readAsDataURL(file);
  });
}


async function saveProfileChanges() {
  const nameInput = document.getElementById('profile-name-input');
  
  if (!nameInput) {
    alert('Form elements not found');
    return;
  }
  
  const name = nameInput.value.trim();

  if (!name) {
    alert('Name cannot be empty');
    return;
  }

  try {
    const response = await fetch('/api/users/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile on server');
    }


    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.name = name;
    localStorage.setItem('user', JSON.stringify(currentUser));


    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = name;
    }

    alert('Profile updated successfully!');
  } catch (error) {
    console.error("❌ Error saving profile changes:", error);
    alert(error.message || 'Failed to save profile changes');
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

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to change password');
    }

    alert("Password updated successfully!");
    document.getElementById('change-password-form').reset();
  } catch (error) {
    console.error("❌ Error changing password:", error);
    alert(error.message || 'An unexpected error occurred');
  }
}

function setupPasswordFeatures() {
  const passwordInput = document.getElementById('new-password');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('password-strength-text');

  if (passwordInput && strengthBar && strengthText) {
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
  }

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