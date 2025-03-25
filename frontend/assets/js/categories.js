document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
});

// Function to fetch categories from backend
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
