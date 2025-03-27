document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  loadUserInfo();
});

async function loadUserInfo() {
  try {
      const response = await fetch('/api/users/profile', { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch user profile");

      const data = await response.json();
      document.getElementById('user-name').textContent = data.user.name;
      document.getElementById('user-avatar').textContent = data.user.name.charAt(0).toUpperCase();
  } catch (error) {
      console.error("Error loading user info:", error);
  }
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
