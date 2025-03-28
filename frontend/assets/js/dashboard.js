document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  loadDashboardSummary();
  loadExpenseOverviewChart();
  loadCategoryChart();
  loadRecentExpenses();

  // document.getElementById('chart-period').addEventListener('change', loadExpenseOverviewChart);
});

// Load user info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/users/profile', { credentials: 'include' });
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        document.getElementById('user-name').textContent = data.user.name;
        document.getElementById('user-avatar').textContent = data.user.name.charAt(0).toUpperCase();
    } catch (error) {
        console.error("❌ Error loading user info:", error);
    }
}

// Load dashboard summary
async function loadDashboardSummary() {
    try {
        const response = await fetch('/api/dashboard/summary', { credentials: 'include' });
        if (!response.ok) throw new Error("Failed to fetch dashboard summary");

        const data = await response.json();
        document.getElementById('total-expenses').textContent = `₹${data.totalExpenses || 0}`;
        document.getElementById('monthly-expenses').textContent = `₹${data.monthlyExpenses || 0}`;
        document.getElementById('category-count').textContent = data.categoryCount || 0; 
        document.getElementById('recent-expense').textContent = `₹${data.recentExpense || 0}`;
    } catch (error) {
        console.error("Error loading dashboard summary:", error);
    }
}

// Load expense trend chart
async function loadExpenseOverviewChart() {
  try {
      const response = await fetch('/api/dashboard/trends', { credentials: 'include' });

      console.log("📡 Response Status:", response.status);
      console.log("📡 Content-Type:", response.headers.get("content-type"));

      if (!response.ok) throw new Error("Server Error: Could not fetch expense trends.");
      const data = await response.json();

      console.log("Expense Overview Data:", data);

      const ctx = document.getElementById('expenseChart').getContext('2d');
      if (window.expenseChartInstance) window.expenseChartInstance.destroy();

      window.expenseChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
              labels: data.map(entry => entry.month),
              datasets: [{
                  label: 'Monthly Expenses',
                  data: data.map(entry => entry.total),
                  borderColor: '#5E72E4',
                  backgroundColor: 'rgba(94, 114, 228, 0.2)',
                  fill: true
              }]
          },
          options: { responsive: true, maintainAspectRatio: false }
      });
  } catch (error) {
      console.error("Error loading expense overview chart:", error);
  }
}


// Load category distribution chart
async function loadCategoryChart() {
  try {
      const response = await fetch('/api/dashboard/categories', { credentials: 'include' });

      console.log("Response Status:", response.status);
      console.log("Content-Type:", response.headers.get("content-type"));

      if (!response.ok) throw new Error("Server Error: Could not fetch category distribution.");
      const data = await response.json();

      console.log("Category Distribution Data:", data);

      const ctx = document.getElementById('categoryChart').getContext('2d');
      if (window.categoryChartInstance) window.categoryChartInstance.destroy();

      window.categoryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: data.map(entry => entry.category),
              datasets: [{
                  label: 'Category Distribution',
                  data: data.map(entry => entry.totalAmount),
                  backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796']
              }]
          },
          options: { responsive: true, maintainAspectRatio: false }
      });
  } catch (error) {
      console.error("Error loading category chart:", error);
  }
}


async function loadRecentExpenses() {
  try {
      const response = await fetch('/api/dashboard/recent', { credentials: 'include' });

      console.log("Response Status:", response.status);
      console.log("Content-Type:", response.headers.get("content-type"));

      if (!response.ok) throw new Error("Server Error: Could not fetch recent expenses.");
      const data = await response.json();

      console.log("Recent Expenses Data:", data);

      const tableBody = document.getElementById('recent-expenses-table');
      tableBody.innerHTML = ''; 

      if (data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No recent expenses.</td></tr>`;
          return;
      }

      data.forEach(expense => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${expense.Title}</td>
              <td>${expense.Category || 'Uncategorized'}</td>
              <td>₹${expense.Amount.toFixed(2)}</td>
              <td>${new Date(expense.Date).toLocaleDateString()}</td>
              <!-- <td>
                  <button class="btn-icon edit-expense" data-id="${expense.id}">
                      <i class="fas fa-edit"></i>
                  </button>
              </td> -->
          `;
          tableBody.appendChild(row);
      });

  } catch (error) {
      console.error("Error loading recent expenses:", error);
  }
}
