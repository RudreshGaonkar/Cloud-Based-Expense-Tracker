document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  loadUserInfo();
  fetchExpenses(1); 
  

  setMaxDateToToday();

  document.getElementById('expensesTableBody').addEventListener('click', async (event) => {
      if (event.target.closest('.delete-expense')) {
          const expenseId = event.target.closest('.delete-expense').getAttribute('data-id');
          confirmDeleteExpense(expenseId);
      }
  });

  document.getElementById("toggleFormBtn").addEventListener("click", () => {
      document.getElementById("expenseFormCard").style.display = "block";
  });

  document.getElementById("closeFormBtn").addEventListener("click", () => {
      document.getElementById("expenseFormCard").style.display = "none";
  });
});


function setMaxDateToToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;


  const expenseDateInput = document.getElementById('expense-date');
  if (expenseDateInput) {
    expenseDateInput.setAttribute('max', formattedDate);
  }

  const editExpenseDateInput = document.getElementById('edit-expense-date');
  if (editExpenseDateInput) {
    editExpenseDateInput.setAttribute('max', formattedDate);
  }
}


function confirmDeleteExpense(expenseId) {
  if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(expenseId);
  }
}

async function deleteExpense(expenseId) {
  try {
      const response = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });

      if (response.ok) {
          alert("Expense deleted successfully!");
          fetchExpenses(currentPage); 
      } else {
          alert("Failed to delete expense.");
      }
  } catch (error) {
      console.error("Error deleting expense:", error);
  }
}


async function fetchCategories() {
  try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error("Failed to fetch categories");

      const categories = await response.json();
      const categorySelect = document.getElementById('expense-category');

      if (!categorySelect) return; 

      categorySelect.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categorySelect.appendChild(option);
      });
  } catch (error) {
      console.error("Error fetching categories:", error);
  }
}

let currentPage = 1;

async function fetchExpenses(page = 1) {
  try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user ? user.id : null;
      if (!userId) {
          console.warn("⚠️ User ID not found in localStorage.");
          displayNoExpenses();
          return;
      }

      const response = await fetch(`/api/expenses/${userId}?page=${page}&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch expenses");

      const data = await response.json();
      updateExpenseTable(data.expenses);
      updatePagination(data.currentPage, data.totalPages);

      currentPage = data.currentPage; 
  } catch (error) {
      console.error("❌ Error fetching expenses:", error);
      displayNoExpenses();
  }
}

function updateExpenseTable(expenses) {
  const tableBody = document.getElementById('expensesTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!expenses || expenses.length === 0) {
      displayNoExpenses();
      return;
  }

  expenses.forEach(expense => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${expense.title}</td>
          <td class="amount">₹${expense.amount}</td>
          <td>${expense.category}</td>
          <td>${new Date(expense.date).toLocaleDateString()}</td>
          <td class="actions">
              <button class="btn-icon edit-expense" data-id="${expense.id}">
                  
              </button>
              <button class="btn-icon delete-expense" data-id="${expense.id}">
                  <i class="fas fa-trash"></i>
              </button>
          </td>
      `;
      tableBody.appendChild(row);
  });
}

function displayNoExpenses() {
  const tableBody = document.getElementById('expensesTableBody');
  if (!tableBody) return; 

  tableBody.innerHTML = `
      <tr>
          <td colspan="5" class="text-center">No expenses found.</td>
      </tr>
  `;
}

function updatePagination(currentPage, totalPages) {
  const paginationControls = document.querySelector('.pagination-controls');
  if (!paginationControls) return; 

  paginationControls.innerHTML = '';

  if (totalPages <= 1) return; 

  const prevButton = document.createElement('button');
  prevButton.className = 'btn-icon';
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => fetchExpenses(currentPage - 1));
  paginationControls.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.className = 'btn-page';
      pageButton.textContent = i;
      if (i === currentPage) pageButton.classList.add('active');
      pageButton.addEventListener('click', () => fetchExpenses(i));
      paginationControls.appendChild(pageButton);
  }

  const nextButton = document.createElement('button');
  nextButton.className = 'btn-icon';
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => fetchExpenses(currentPage + 1));
  paginationControls.appendChild(nextButton);
}

document.getElementById('expenseForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser ? storedUser.id : null;

  const title = document.getElementById('expense-title').value.trim();
  const amount = document.getElementById('expense-amount').value.trim();
  const categoryId = document.getElementById('expense-category').value.trim();
  const date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value.trim();

  if (!userId || !title || !amount || !categoryId || !date) {
      alert('Please fill in all required fields.');
      return;
  }
  const inputDate = new Date(date);
  const today = new Date();

  // Normalize both dates to YYYY-MM-DD (removing time part)
  const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (inputDateOnly > todayOnly) {
      alert('Future dates are not allowed for expenses.');
      return;
  }

  // if (new Date(date) > new Date()) {
  //     alert('Future dates are not allowed for expenses.');
  //     return;
  // }

  try {
      const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, title, amount, categoryId, date, notes })
      });

      if (response.ok) {
          alert("Expense added successfully!");
          fetchExpenses(1); 
          document.getElementById('expenseForm').reset();
          document.getElementById('expenseFormCard').style.display = 'none';
      } else {
          alert("Failed to add expense.");
      }
  } catch (error) {
      console.error("Error adding expense:", error);
  }
});

document.getElementById('expensesTableBody').addEventListener('click', (event) => {
  const editBtn = event.target.closest('.edit-expense');
  if (editBtn) {
    const expenseId = editBtn.getAttribute('data-id');

    const row = editBtn.closest('tr');
    const title = row.cells[0].textContent.trim();

    const amount = parseFloat(row.cells[1].textContent.replace('₹', '').trim());
    const categoryText = row.cells[2].textContent.trim();
    const dateText = row.cells[3].textContent.trim();

    document.getElementById('edit-expense-id').value = expenseId;
    document.getElementById('edit-expense-title').value = title;
    document.getElementById('edit-expense-amount').value = amount;
    
    document.getElementById('edit-expense-category').value = categoryText;

    setMaxDateToToday();
    

    const dateParts = dateText.split('/');
    if (dateParts.length === 3) {
      const formattedDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
      document.getElementById('edit-expense-date').value = formattedDate;
    }
    
    document.getElementById('edit-expense-notes').value = '';
    
    document.getElementById('editExpenseModal').style.display = 'block';
    

    setMaxDateToToday();
  }
});

document.getElementById('editCloseModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

function closeEditModal() {
  document.getElementById('editExpenseModal').style.display = 'none';
}

document.getElementById('editExpenseForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const expenseId = document.getElementById('edit-expense-id').value;
  const title = document.getElementById('edit-expense-title').value.trim();
  const amount = document.getElementById('edit-expense-amount').value;
  const categoryId = document.getElementById('edit-expense-category').value;
  const date = document.getElementById('edit-expense-date').value;
  const notes = document.getElementById('edit-expense-notes').value.trim();

  if (!expenseId || !title || !amount || !categoryId || !date) {
    alert('Please fill in all required fields.');
    return;
  }
  
  if (new Date(date) > new Date()) {
      alert('Future dates are not allowed for expenses.');
      return;
  }

  try {
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, categoryId, date, notes })
    });

    if (response.ok) {
      alert("Expense updated successfully!");
      closeEditModal();
      fetchExpenses(currentPage); 
    } else {
      alert("Failed to update expense.");
    }
  } catch (error) {
    console.error("Error updating expense:", error);
  }
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