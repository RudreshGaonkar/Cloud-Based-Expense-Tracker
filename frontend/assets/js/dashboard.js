document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  loadDashboardSummary();
  loadRecentExpenses();
  loadExpenseOverviewChart();
  loadCategoryChart();

  document.getElementById('chart-period').addEventListener('change', loadExpenseOverviewChart);
});


// Load user name
function loadUserInfo() {
  fetch('/api/auth/profile', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      document.getElementById('user-name').textContent = data.name;
      document.getElementById('user-avatar').textContent = data.name.split(' ')[0][0];
    });
}

// // Dashboard summary
// function loadDashboardSummary() {
//   fetch('/api/dashboard/summary', { credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       document.getElementById('total-expenses').textContent = `₹${data.totalExpenses}`;
//       document.getElementById('monthly-expenses').textContent = `₹${data.monthlyExpenses}`;
//       document.getElementById('category-count').textContent = data.categoryCount;
//       document.getElementById('recent-expense').textContent = `₹${data.recentExpense || 0}`;
//     });
// }

// // Recent expenses table
// function loadRecentExpenses() {
//   fetch('/api/dashboard/recent', { credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       const tbody = document.getElementById('recent-expenses-table');
//       tbody.innerHTML = '';
//       if (data.length === 0) {
//         tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent expenses.</td></tr>';
//       } else {
//         data.forEach(exp => {
//           const tr = document.createElement('tr');
//           tr.innerHTML = `
//             <td>${exp.title}</td>
//             <td>${exp.category}</td>
//             <td>₹${exp.amount}</td>
//             <td>${new Date(exp.date).toLocaleDateString()}</td>
//             <td><a href="expenses.html">Edit</a></td>
//           `;
//           tbody.appendChild(tr);
//         });
//       }
//     });
// }

// // Expense overview chart
// function loadExpenseOverviewChart() {
//   const period = document.getElementById('chart-period').value;
//   fetch(`/api/dashboard/overview?period=${period}`, { credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       const ctx = document.getElementById('expenseChart').getContext('2d');
//       if (window.expenseChartInstance) window.expenseChartInstance.destroy();
//       window.expenseChartInstance = new Chart(ctx, {
//         type: 'line',
//         data: {
//           labels: data.labels,
//           datasets: [{
//             label: 'Expenses',
//             data: data.amounts,
//             borderColor: '#5E72E4',
//             fill: false
//           }]
//         }
//       });
//     });
// }

// // Category distribution chart
// function loadCategoryChart() {
//   fetch('/api/dashboard/category-distribution', { credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       const ctx = document.getElementById('categoryChart').getContext('2d');
//       if (window.categoryChartInstance) window.categoryChartInstance.destroy();
//       window.categoryChartInstance = new Chart(ctx, {
//         type: 'doughnut',
//         data: {
//           labels: data.labels,
//           datasets: [{
//             label: 'Category Distribution',
//             data: data.amounts,
//             backgroundColor: data.colors
//           }]
//         }
//       });
//     });
// }

async function loadDashboardSummary() {
  try {
    const response = await fetch('/api/dashboard/summary', { credentials: 'include' });

    console.log("📡 Response Status:", response.status);
    const contentType = response.headers.get("content-type");
    console.log("📡 Content-Type:", contentType);

    if (!contentType || !contentType.includes("application/json")) {
      const rawText = await response.text();
      console.error("🚨 Unexpected Response (Not JSON):", rawText);
      throw new Error("Invalid response format. Expected JSON.");
    }

    const data = await response.json();
    console.log("📊 Dashboard Summary Data:", data);

    document.getElementById('total-expenses').textContent = `₹${data.totalExpenses || 0}`;
    document.getElementById('monthly-expenses').textContent = `₹${data.monthlyExpenses || 0}`;
    document.getElementById('category-count').textContent = data.categoryCount || 0;
    document.getElementById('recent-expense').textContent = `₹${data.recentExpense || 0}`;
  } catch (error) {
    console.error("❌ Error loading dashboard summary:", error);
    alert("Failed to load dashboard. Please log in again.");
    window.location.href = "../index.html";
  }
}



// async function loadDashboardSummary() {
//   try {
//       const response = await fetch('/api/dashboard/summary', { credentials: 'include' });
//       if (!response.ok) throw new Error("Failed to fetch dashboard summary");

//       const data = await response.json();
//       console.log("📊 Dashboard Summary Data:", data);

//       document.getElementById('total-expenses').textContent = `₹${data.totalExpenses || 0}`;
//       document.getElementById('monthly-expenses').textContent = `₹${data.monthlyExpenses || 0}`;
//       document.getElementById('category-count').textContent = data.categoryCount || 0;
//       document.getElementById('recent-expense').textContent = `₹${data.recentExpense || 0}`;
//   } catch (error) {
//       console.error("❌ Error loading dashboard summary:", error);
//       alert("Failed to load dashboard summary.");
//   }
// }
async function loadRecentExpenses() {
  try {
    const response = await fetch('/api/dashboard/recent', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    console.log("📡 Response Status:", response.status);
    console.log("📡 Content-Type:", response.headers.get("content-type"));

    // ✅ Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const rawText = await response.text();
      console.error("🚨 Unexpected Response (Not JSON):", rawText);
      throw new Error("Invalid server response. Please log in again.");
    }

    const data = await response.json();
    console.log("📊 Recent Expenses Data:", data);
  } catch (error) {
    console.error("❌ Error loading recent expenses:", error);
  }
}

async function loadExpenseOverviewChart() {
  const period = document.getElementById('chart-period').value;

  try {
      const response = await fetch(`/api/dashboard/overview?period=${period}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch expense overview");

      const data = await response.json();
      console.log("📈 Expense Overview Data:", data);

      const ctx = document.getElementById('expenseChart').getContext('2d');
      if (window.expenseChartInstance) window.expenseChartInstance.destroy();

      window.expenseChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
              labels: data.labels,
              datasets: [{
                  label: 'Expenses',
                  data: data.amounts,
                  borderColor: '#5E72E4',
                  backgroundColor: 'rgba(94, 114, 228, 0.2)',
                  fill: true
              }]
          },
          options: { responsive: true, maintainAspectRatio: false }
      });

  } catch (error) {
      console.error("❌ Error loading expense overview chart:", error);
  }
}
async function loadCategoryChart() {
  try {
      const response = await fetch('/api/dashboard/category-distribution', { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch category distribution");

      const data = await response.json();
      console.log("📊 Category Distribution Data:", data);

      const ctx = document.getElementById('categoryChart').getContext('2d');
      if (window.categoryChartInstance) window.categoryChartInstance.destroy();

      window.categoryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: data.labels,
              datasets: [{
                  label: 'Category Distribution',
                  data: data.amounts,
                  backgroundColor: data.colors
              }]
          },
          options: { responsive: true, maintainAspectRatio: false }
      });

  } catch (error) {
      console.error("❌ Error loading category chart:", error);
  }
}
