document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
    const thankYouCard = document.getElementById('thankYouCard');
    const thankYouDialog = document.getElementById('thankYouDialog');
    const closeThankYouDialog = document.getElementById('closeThankYouDialog');

    thankYouCard.addEventListener('click', function() {
      thankYouDialog.style.display = 'block';
      setTimeout(() => {
        thankYouDialog.classList.add('show');
      }, 10);
    });

    closeThankYouDialog.addEventListener('click', function() {
      thankYouDialog.classList.remove('show');
      setTimeout(() => {
        thankYouDialog.style.display = 'none';
      }, 300);
    });

    window.addEventListener('click', function(event) {
      if (event.target === thankYouDialog) {
        thankYouDialog.classList.remove('show');
        setTimeout(() => {
          thankYouDialog.style.display = 'none';
        }, 300);
      }
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