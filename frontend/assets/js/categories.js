document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  loadUserInfo();
});

// async function loadUserInfo() {
//   try {
//       const response = await fetch('/api/users/profile', { credentials: 'include' });
//       if (!response.ok) throw new Error("Failed to fetch user profile");

//       const data = await response.json();
//       document.getElementById('user-name').textContent = data.user.name;
//       document.getElementById('user-avatar').textContent = data.user.name.charAt(0).toUpperCase();
//   } catch (error) {
//       console.error("Error loading user info:", error);
//   }
// }

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
      el.textContent = userName.charAt(0).toUpperCase();
    }
  });
}

async function fetchCategories() {
  try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
          throw new Error('Failed to fetch categories');
      }

      const categories = await response.json();
      const list = document.getElementById('category-list');
      list.innerHTML = '';

      categories.forEach(category => {
          const li = document.createElement('li');
          li.textContent = category.name;
          list.appendChild(li);
      });
  } catch (error) {
      console.error('Error fetching categories:', error);
  }
}
