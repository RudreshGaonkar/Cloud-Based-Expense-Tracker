document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadDashboardSummary();
    loadExpenseOverviewChart('monthly');
    loadCategoryChart();
    loadRecentExpenses();
    fetchIncomeExpenseSummary();
  
    document.getElementById('chart-period').addEventListener('change', (e) => {
      loadExpenseOverviewChart(e.target.value);
    });
    
    document.getElementById('income-expense-period').addEventListener('change', (e) => {
      fetchIncomeExpenseSummary(e.target.value);
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
        el.textContent = userName.charAt(0).toUpperCase();
      }
    });
  }
  

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
  

  async function loadExpenseOverviewChart(period = 'monthly') {
    try {
        const response = await fetch(`/api/dashboard/trends?period=${period}`, { 
            credentials: 'include' 
        });
        console.log(period);
  
        if (!response.ok) throw new Error("Server Error: Could not fetch expense trends.");
        const data = await response.json();
  
        console.log("Expense Overview Data:", data);
  
        const ctx = document.getElementById('expenseChart').getContext('2d');
        if (window.expenseChartInstance) window.expenseChartInstance.destroy();
  
        let labels, chartData;
        
        switch(period) {
            case 'daily':
                labels = data.map(entry => entry.day);
                chartData = data.map(entry => entry.total);
                break;
            case 'weekly':
                labels = data.map(entry => {
                    const currentYear = new Date().getFullYear();
                    const date = new Date(currentYear, 0, 1 + (entry.week_number - 1) * 7);
                    const monthName = date.toLocaleString('default', { month: 'short' });
                    return `${monthName} Week ${entry.week_number % 5 === 0 ? entry.week_number : ''}`;
                });
                chartData = data.map(entry => entry.total);
                break;
            case 'monthly':

                labels = data.map(entry => {
                    const [year, month] = entry.month.split('-');

                    if (year == new Date().getFullYear()) {
                        const date = new Date(year, month - 1);
                        return date.toLocaleString('default', { month: 'long' });
                    }
                    return '';
                }).filter(label => label !== ''); 
                chartData = data.map((entry, index) => {
                    const [year] = entry.month.split('-');

                    if (year == new Date().getFullYear()) {
                        return entry.total;
                    }
                    return null;
                }).filter(value => value !== null); 
                break;
            case 'yearly':
                labels = data.map(entry => entry.year);
                chartData = data.map(entry => entry.total);
                break;
            default:
                labels = data.map(entry => entry.month);
                chartData = data.map(entry => entry.total);
        }
  
        window.expenseChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${period.charAt(0).toUpperCase() + period.slice(1)} Expenses`,
                    data: chartData,
                    borderColor: '#5E72E4',
                    backgroundColor: 'rgba(94, 114, 228, 0.2)',
                    fill: true
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return '₹' + tooltipItem.yLabel;
                        },
                        title: function(tooltipItems, data) {
                            if (period === 'weekly') {
                                const index = tooltipItems[0].index;
                                const weekNumber = data.originalData[index].week_number;
                                const currentYear = new Date().getFullYear();
                                const date = new Date(currentYear, 0, 1 + (weekNumber - 1) * 7);
                                const monthName = date.toLocaleString('default', { month: 'long' });
                                return `${monthName} Week ${weekNumber}`;
                            }
                            return tooltipItems[0].label;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error loading expense overview chart:", error);
    }
  }
  
  async function loadCategoryChart() {
    try {
        const response = await fetch('/api/dashboard/categories', { credentials: 'include' });
  
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
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const total = dataset.data.reduce((previousValue, currentValue) => previousValue + currentValue);
                            const currentValue = dataset.data[tooltipItem.index];
                            const percentage = Math.floor(((currentValue/total) * 100) + 0.5);
                            return `₹${currentValue} (${percentage}%)`;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error loading category chart:", error);
    }
  }
  
  async function loadRecentExpenses() {
    try {
        const response = await fetch('/api/dashboard/recent', { credentials: 'include' });
  
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
            `;
            tableBody.appendChild(row);
        });
  
    } catch (error) {
        console.error("Error loading recent expenses:", error);
    }
  }
  
  async function fetchIncomeExpenseSummary(period = 'month') {
    try {
        const response = await fetch(`/api/dashboard/income-expense?period=${period}`, {
            credentials: 'include'
        });
      
        if (!response.ok) throw new Error("Failed to fetch income expense summary");
        const data = await response.json();
      

        document.getElementById('total-income').innerText = `₹${data.totalIncome || 0}`;
        

        const summaryTotalIncome = document.getElementById('summary-total-income');
        if (summaryTotalIncome) {
            summaryTotalIncome.innerText = `₹${data.totalIncome || 0}`;
        }
        
        document.getElementById('total-expense').innerText = `₹${data.totalExpenses || 0}`;
        
 
        const netSavings = data.totalIncome - data.totalExpenses;
        document.getElementById('net-savings').innerText = `₹${netSavings || 0}`;
        

        const progressBar = document.getElementById('income-expense-ratio');
        let ratio = 0; 
        
        if (data.totalIncome > 0 || data.totalExpenses > 0) {
            const total = data.totalIncome + data.totalExpenses;
            ratio = Math.round((data.totalIncome / total) * 100);
        }
        
        progressBar.style.width = `${ratio}%`;
        
        if (ratio > 60) {
            progressBar.style.backgroundColor = '#1cc88a'; // Green for good savings
        } else if (ratio >= 40 && ratio <= 60) {
            progressBar.style.backgroundColor = '#f6c23e'; // Yellow for balanced
        } else {
            progressBar.style.backgroundColor = '#e74a3b'; // Red for more expenses than income
        }
    } catch (error) {
        console.error('Error fetching income/expense summary:', error);
    }
}