document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchExpenses(1); // Load first page by default

    // Attach event listener for delete buttons dynamically
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
            fetchExpenses(currentPage); // ✅ Reload the current page instead of resetting to Page 1
        } else {
            alert("Failed to delete expense.");
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
    }
}

// Function to fetch categories and populate the dropdown
async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error("Failed to fetch categories");

        const categories = await response.json();
        const categorySelect = document.getElementById('expense-category');

        if (!categorySelect) return; // ✅ Prevents errors if element is missing

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

// Function to fetch expenses with pagination
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

        currentPage = data.currentPage; // ✅ Update current page after fetching
    } catch (error) {
        console.error("❌ Error fetching expenses:", error);
        displayNoExpenses();
    }
}

// Function to update expenses table
function updateExpenseTable(expenses) {
    const tableBody = document.getElementById('expensesTableBody');
    if (!tableBody) return; // ✅ Prevents errors if table is missing

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
                    <i class="fas fa-edit"></i>
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
    if (!tableBody) return; // ✅ Prevents errors if table is missing

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">No expenses found.</td>
        </tr>
    `;
}

// Function to update pagination controls
function updatePagination(currentPage, totalPages) {
    const paginationControls = document.querySelector('.pagination-controls');
    if (!paginationControls) return; // ✅ Prevents errors if element is missing

    paginationControls.innerHTML = '';

    if (totalPages <= 1) return; // No pagination needed

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

    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'btn-icon';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => fetchExpenses(currentPage + 1));
    paginationControls.appendChild(nextButton);
}

// Function to add a new expense
// document.getElementById('expenseForm')?.addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const userId = localStorage.getItem('user');
//     const title = document.getElementById('expense-title').value;
//     const amount = document.getElementById('expense-amount').value;
//     const categoryId = document.getElementById('expense-category').value;
//     const date = document.getElementById('expense-date').value;
//     const notes = document.getElementById('expense-notes').value;

//     if (!userId || !title || !amount || !categoryId || !date) {
//         alert('⚠️ Please fill in all required fields.');
//         return;
//     }

//     try {
//         const response = await fetch('/api/expenses', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ userId, title, amount, categoryId, date, notes })
//         });

//         if (response.ok) {
//             alert("✅ Expense added successfully!");
//             fetchExpenses(1); // ✅ Reload first page
//             document.getElementById('expenseForm').reset();
//             document.getElementById('expenseFormCard').style.display = 'none';
//         } else {
//             alert("❌ Failed to add expense.");
//         }
//     } catch (error) {
//         console.error("❌ Error adding expense:", error);
//     }
// });
document.getElementById('expenseForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Retrieve the user object stored as JSON and extract the id
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser ? storedUser.id : null;

    // Trim inputs to avoid whitespace issues
    const title = document.getElementById('expense-title').value.trim();
    const amount = document.getElementById('expense-amount').value.trim();
    const categoryId = document.getElementById('expense-category').value.trim();
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value.trim();

    if (!userId || !title || !amount || !categoryId || !date) {
        alert('⚠️ Please fill in all required fields.');
        return;
    }

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, title, amount, categoryId, date, notes })
        });

        if (response.ok) {
            alert("✅ Expense added successfully!");
            fetchExpenses(1); // Reload first page
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseFormCard').style.display = 'none';
        } else {
            alert("❌ Failed to add expense.");
        }
    } catch (error) {
        console.error("❌ Error adding expense:", error);
    }
});


// Attach event listener for edit buttons in the expenses table
document.getElementById('expensesTableBody').addEventListener('click', (event) => {
    const editBtn = event.target.closest('.edit-expense');
    if (editBtn) {
      const expenseId = editBtn.getAttribute('data-id');
      // Get the corresponding row to extract current values
      const row = editBtn.closest('tr');
      const title = row.cells[0].textContent.trim();
      // Remove INR symbol if present, and parse as number
      const amount = parseFloat(row.cells[1].textContent.replace('₹', '').trim());
      const categoryText = row.cells[2].textContent.trim();
      const dateText = row.cells[3].textContent.trim();
      
      // Pre-fill the edit form fields
      document.getElementById('edit-expense-id').value = expenseId;
      document.getElementById('edit-expense-title').value = title;
      document.getElementById('edit-expense-amount').value = amount;
      
      // For category, if your select options have values as category IDs,
      // you may need to convert categoryText to its corresponding ID.
      // For now, we assume the select options display the category name.
      document.getElementById('edit-expense-category').value = categoryText;
      
      // For date, you might need to reformat the displayed date into 'YYYY-MM-DD'
      // Here, we assume the row's date is already in a format that works, or you can reformat it.
      document.getElementById('edit-expense-date').value = dateText;
      
      // Optionally, clear or prefill notes (if available). For now, we'll leave it blank.
      document.getElementById('edit-expense-notes').value = '';
      
      // Show the edit modal
      document.getElementById('editExpenseModal').style.display = 'block';
    }
  });
  
  // Attach event listeners for closing the modal
  document.getElementById('editCloseModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
  
  function closeEditModal() {
    document.getElementById('editExpenseModal').style.display = 'none';
  }
  
  // Handle the submission of the edit form
  document.getElementById('editExpenseForm').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const expenseId = document.getElementById('edit-expense-id').value;
    const title = document.getElementById('edit-expense-title').value.trim();
    const amount = document.getElementById('edit-expense-amount').value;
    const categoryId = document.getElementById('edit-expense-category').value;
    const date = document.getElementById('edit-expense-date').value;
    const notes = document.getElementById('edit-expense-notes').value.trim();
  
    if (!expenseId || !title || !amount || !categoryId || !date) {
      alert('⚠️ Please fill in all required fields.');
      return;
    }
  
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT', // or PATCH, depending on your API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, categoryId, date, notes })
      });
  
      if (response.ok) {
        alert("✅ Expense updated successfully!");
        // Optionally, refresh the expenses list
        // For example, call fetchExpenses(currentPage) if you have that function.
        closeEditModal();
        // Refresh your table here
        fetchExpenses(currentPage); 
      } else {
        alert("❌ Failed to update expense.");
      }
    } catch (error) {
      console.error("❌ Error updating expense:", error);
    }
  });
  