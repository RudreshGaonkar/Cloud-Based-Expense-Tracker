document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    loadUserInfo();
    fetchExpenses(1); 

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

// Function to confirm before deleting an expense
function confirmDeleteExpense(expenseId) {
    if (confirm("Are you sure you want to delete this expense?")) {
        deleteExpense(expenseId);
    }
}

// Function to delete an expense
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

// Function to fetch categories 
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

// Function to update expenses table
function updateExpenseTable(expenses) {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        displayNoExpenses();
        return;
    }
//<i class="fas fa-edit"></i>
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

// Function to display "No Expenses Found" message
function displayNoExpenses() {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) return; 

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">No expenses found.</td>
        </tr>
    `;
}

// Function to update pagination controls
function updatePagination(currentPage, totalPages) {
    const paginationControls = document.querySelector('.pagination-controls');
    if (!paginationControls) return; 

    paginationControls.innerHTML = '';

    if (totalPages <= 1) return; 

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'btn-icon';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => fetchExpenses(currentPage - 1));
    paginationControls.appendChild(prevButton);

    // Page numbers
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

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, amount, categoryId, date, notes })
        });

        if (response.ok) {
            alert("Expense added successfully!");
            fetchExpenses(1); // Reload first page
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
      

      document.getElementById('edit-expense-date').value = dateText;
      

      document.getElementById('edit-expense-notes').value = '';
      

      document.getElementById('editExpenseModal').style.display = 'block';
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
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        document.getElementById('user-name').textContent = data.user.name;
        document.getElementById('user-avatar').textContent = data.user.name.charAt(0).toUpperCase();
    } catch (error) {
        console.error("Error loading user info:", error);
    }
}
