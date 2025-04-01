document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();

    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const updatePasswordBtn = document.getElementById('updatePassword');
  
    updatePasswordBtn.addEventListener('click', () => {
      if (newPassword.value !== confirmPassword.value) {
        alert('New passwords do not match!');
        return;
      }
  
      const data = {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      };
  
      fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(result => {
          alert(result.message);
          currentPassword.value = '';
          newPassword.value = '';
          confirmPassword.value = '';
        })
        .catch(error => console.error('Error updating password:', error));
    });
  });

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