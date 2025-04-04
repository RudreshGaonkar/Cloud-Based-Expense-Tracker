document.addEventListener('DOMContentLoaded', async () => {
    await initializeDashboard();
});

async function initializeDashboard() {
    try {
        await loadUserInfo();
        await fetchExpenseSummary();
        await fetchCategoryReport();
        await fetchExpenseTrends();
        await fetchIncomeForReports();
        await fetchFilteredExpenses();
        await updateIncomeExpenseChart(); 
        await updateExpenseFilters();
        setupImprovedFilterToggle('expense');
        setupImprovedFilterToggle('income');
        
        console.log("Checking stored user:", localStorage.getItem('user'));
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || null;

        if (!userId) {
            console.warn("User ID is missing or invalid. Redirecting to login...");
            alert("User ID not found. Redirecting to login...");
            setTimeout(() => { window.location.href = '../index.html'; }, 2000);
            return;
        }

        console.log("User ID found:", userId);

        document.getElementById('apply-expense-filter')?.addEventListener('click', fetchFilteredExpenses);
        document.getElementById('clear-expense-filter')?.addEventListener('click', clearExpenseFilter);
        document.getElementById('filter-income-month')?.addEventListener('change', fetchFilteredIncome);
        document.getElementById('apply-income-filter')?.addEventListener('click', fetchFilteredIncome);
        document.getElementById('clear-income-filter')?.addEventListener('click', clearIncomeFilter);
        

        document.getElementById('trend-period')?.addEventListener('change', fetchExpenseTrends);
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

function setupImprovedFilterToggle(type) {
    // Get the containers for both filter types
    const dateRangeContainer = document.querySelector(`#filter-${type}-start-date`).closest('.date-range');
    const monthInputContainer = document.querySelector(`#filter-${type}-month`).closest('.month');
    
    // Hide date range by default
    dateRangeContainer.style.display = 'none';
    monthInputContainer.style.display = 'block';
    
    // Create toggle container with switch
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'filter-toggle';
    toggleContainer.innerHTML = `
        <label class="toggle-switch">
            <input type="checkbox" id="${type}-date-range-toggle">
            <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Use Date Range</span>
    `;
    
    // Insert toggle before the date range container
    const filterContainer = document.querySelector(`#filter-${type}-month`).closest('.filter-container');
    filterContainer.insertBefore(toggleContainer, dateRangeContainer);
    
    // Set up toggle event handler
    const toggle = document.getElementById(`${type}-date-range-toggle`);
    toggle.addEventListener('change', function() {
        if (this.checked) {
            // When checked, show date range and hide month
            dateRangeContainer.style.display = 'flex';
            monthInputContainer.style.display = 'none';
        } else {
            // When unchecked, show month and hide date range
            dateRangeContainer.style.display = 'none';
            monthInputContainer.style.display = 'block';
        }
        
        // Clear all inputs when switching between filter types
        document.getElementById(`filter-${type}-month`).value = '';
        document.getElementById(`filter-${type}-start-date`).value = '';
        document.getElementById(`filter-${type}-end-date`).value = '';
    });
    
    // Set up clear filter button behavior
    document.getElementById(`clear-${type}-filter`).addEventListener('click', function() {
        // Reset toggle to default (month)
        toggle.checked = false;
        
        // Reset visibility
        dateRangeContainer.style.display = 'none';
        monthInputContainer.style.display = 'block';
        
        // Clear all input values
        document.getElementById(`filter-${type}-month`).value = '';
        document.getElementById(`filter-${type}-start-date`).value = '';
        document.getElementById(`filter-${type}-end-date`).value = '';
    });
}

let summaryChartInstance = null;
let trendChartInstance = null;
let incomeChartInstance = null;
const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
});

async function updateExpenseFilters() {
    const filterContainer = document.querySelector('.card:has(#expenses-table) .filter-container');
    if (!filterContainer) return;
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7);
    filterContainer.innerHTML = `
        <div class="month">
        <label for="filter-expense-month">Select Month (YYYY-MM):</label>
            <input type="text" id="filter-expense-month" placeholder="e.g. ${yearMonth}">
        </div>
        <div class="date-range">
            <label>Date Range:</label>
            <input type="date" id="filter-expense-start-date" placeholder="Start Date">
            <input type="date" id="filter-expense-end-date" placeholder="End Date">
        </div>

        <button id="apply-expense-filter" class="btn btn-primary">Apply Filter</button>
        <button id="clear-expense-filter" class="btn btn-secondary"><i class="fas fa-times"></i> Clear Filter</button>
    `;
    document.getElementById('apply-expense-filter')?.addEventListener('click', fetchFilteredExpenses);
    document.getElementById('clear-expense-filter')?.addEventListener('click', clearExpenseFilter);
}
async function fetchFilteredExpenses() {
    try {
        const userId = getUserId();
        if (!userId) return;

        let month = document.getElementById('filter-expense-month').value;
        let startDate = document.getElementById('filter-expense-start-date').value;
        let endDate = document.getElementById('filter-expense-end-date').value;
        const params = new URLSearchParams({ userId });
        if (startDate && endDate) {
            params.append("startDate", startDate);
            params.append("endDate", endDate);
        } else if (month) {
            params.append("month", month);
        }
        console.log("📡 Fetching filtered expenses with params:", params.toString());
        const response = await fetch(`/api/reports/filtered?${params.toString()}`);
        const data = await response.json();
        console.log("📊 Filtered Expenses API Response:", data);
        updateFinancialTable(data);
    } catch (error) {
        console.error("❌ Error fetching filtered expenses:", error);
    }
}

function clearExpenseFilter() {
    document.getElementById('filter-expense-month').value = "";
    document.getElementById('filter-expense-start-date').value = "";
    document.getElementById('filter-expense-end-date').value = "";
    console.log("Expense filters cleared. Reloading all expense data...");
    fetchFilteredExpenses();
}

async function fetchExpenseSummary() {
    try {
        const userId = getUserId();
        if (!userId) return;

        const response = await fetch(`/api/reports/summary?userId=${userId}`);
        const data = await response.json();

        console.log("📊 Expense Summary Data:", data);
        updateSummaryStats(data);
        return data; 
    } catch (error) {
        console.error("Error fetching expense summary:", error);
        return null;
    }
}

function updateSummaryStats(data) {
    document.getElementById('total-expenses').textContent = inrFormatter.format(data.totalExpenses || 0);
    document.getElementById('avg-daily').textContent = inrFormatter.format(data.avgMonthly || 0);
    document.getElementById('expense-count').textContent = data.transactionCount || 0;
    document.getElementById('highest-category').textContent = data.topCategory || '-';
}

async function fetchCategoryReport() {
    try {
        const userId = getUserId();
        if (!userId) return;

        const response = await fetch(`/api/reports/categories?userId=${userId}`);
        const data = await response.json();

        console.log("📊 Category Report Data:", data);
        updateCategoryChart(data);
    } catch (error) {
        console.error("Error fetching category report:", error);
    }
}

function updateCategoryChart(data) {
    const ctx = document.getElementById('reportChart')?.getContext('2d');
    if (!ctx) return;
    if (summaryChartInstance) {
        summaryChartInstance.destroy();
    }
    summaryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.category),
            datasets: [{
                data: data.map(item => item.totalAmount),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
// Fetch Expense Trends
async function fetchExpenseTrends() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const period = document.getElementById('trend-period')?.value || "month";
        
        console.log(`📊 Fetching expense trends for period: ${period}`);
        
        const response = await fetch(`/api/reports/trends?userId=${userId}&period=${period}`);
        const data = await response.json();

        console.log("📈 Expense Trends Data:", data);
        updateTrendChart(data, period);
    } catch (error) {
        console.error("❌ Error fetching expense trends:", error);
    }
}
function updateTrendChart(data, period) {
    if (!Array.isArray(data) || data.length === 0) {
        console.warn("⚠️ No trend data available.");
        return;
    }

    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }
    const formattedLabels = data.map(item => {
        const period = item.period;

        if (period.includes('-W')) {

            const [year, week] = period.split('-W');
            return `Week ${week}, ${year}`;
        } else if (period.length === 7) {
            const date = new Date(period + "-01");
            return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        } else if (period.length === 4) {
            return period;
        } else {
            const date = new Date(period);
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    });
    let chartTitle = 'Monthly Spending Trend';
    switch (period) {
        case 'day':
            chartTitle = 'Daily Spending Trend';
            break;
        case 'week':
            chartTitle = 'Weekly Spending Trend';
            break;
        case 'year':
            chartTitle = 'Yearly Spending Trend';
            break;
    }
    const expenseData = data.map(item => 
        item.totalExpense !== undefined ? item.totalExpense : item.total
    );
    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [{
                label: 'Expenses',
                data: expenseData,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: period.charAt(0).toUpperCase() + period.slice(1)
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Expenses: ${inrFormatter.format(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}
// Fetch Total Income for Reports
async function fetchIncomeForReports() {
    try {
        const response = await fetch('/api/income/total');
        const data = await response.json();

        console.log("💰 Income API Response:", data);
        const incomeElement = document.getElementById("totalIncomeReport");
        if (incomeElement) {
            incomeElement.textContent = inrFormatter.format(data?.totalIncome || 0);
        }
        return data?.totalIncome || 0;
    } catch (error) {
        console.error("❌ Error fetching income for reports:", error);
        const incomeElement = document.getElementById("totalIncomeReport");
        if (incomeElement) {
            incomeElement.textContent = "₹0.00";
        }
        return 0;
    }
}

async function updateIncomeExpenseChart() {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; 
        const currentYear = now.getFullYear();
        const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        
        console.log(`📅 Fetching income vs expense for current month: ${currentMonthStr}`);
        
        const userId = getUserId();
        if (!userId) return;
        
        const expenseParams = new URLSearchParams({ 
            userId: userId,
            month: currentMonthStr  
        });
        const expenseResponse = await fetch(`/api/reports/filtered?${expenseParams.toString()}`);
        const expenseData = await expenseResponse.json();
        const totalMonthlyExpenses = expenseData.reduce((sum, expense) => {
            return sum + expense.amount;
        }, 0);
        const categoryParams = new URLSearchParams({
            userId: userId,
            month: currentMonthStr
        });
        const categoryResponse = await fetch(`/api/reports/categories?${categoryParams.toString()}`);
        const categoryData = await categoryResponse.json();
        const incomeResponse = await fetch(`/api/reports/monthly-income?month=${currentMonthStr}&userId=${userId}`);
        if (!incomeResponse.ok) {
            console.error(`Error fetching income data: ${incomeResponse.status} ${incomeResponse.statusText}`);
            throw new Error(`Failed to fetch income data: ${incomeResponse.status}`);
        }
        const incomeData = await incomeResponse.json();
        console.log("Income data received:", incomeData);
        const totalMonthlyIncome = incomeData?.totalIncome || 0;
        const remainingIncome = totalMonthlyIncome - totalMonthlyExpenses;
        const ctx = document.getElementById('incomeChart')?.getContext('2d');
        if (!ctx) {
            console.warn("⚠️ Income chart canvas not found!");
            return;
        }
        if (incomeChartInstance) {
            incomeChartInstance.destroy();
        }
        const labels = categoryData.map(item => item.category);
        const data = categoryData.map(item => item.totalAmount);
        if (remainingIncome > 0) {
            labels.push('Remaining Income');
            data.push(remainingIncome);
        }
        const backgroundColors = categoryData.map((_, index) => {
            return `hsl(${index * 40}, 70%, 50%)`;
        });
        if (remainingIncome > 0) {
            backgroundColors.push('rgba(75, 192, 120, 0.7)');
        }
        const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });
        console.log(`📊 Creating Income vs Expenses Chart for ${monthName} ${currentYear}`, {
            totalMonthlyIncome,
            totalMonthlyExpenses,
            remainingIncome,
            categories: labels,
            values: data
        });
        incomeChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${monthName} ${currentYear} Income Usage (Total Income: ${inrFormatter.format(totalMonthlyIncome)})`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = totalMonthlyIncome > 0 ? 
                                    ((value / totalMonthlyIncome) * 100).toFixed(1) : 0;
                                return `${context.label}: ${inrFormatter.format(value)} (${percentage}%)`;
                            }
                        }
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        const monthlyIncomeElement = document.getElementById('monthly-income');
        if (monthlyIncomeElement) {
            monthlyIncomeElement.textContent = inrFormatter.format(totalMonthlyIncome);
        }
        const monthlyExpensesElement = document.getElementById('monthly-expenses');
        if (monthlyExpensesElement) {
            monthlyExpensesElement.textContent = inrFormatter.format(totalMonthlyExpenses);
        }
        const balanceElement = document.getElementById('monthly-balance');
        if (balanceElement) {
            balanceElement.textContent = inrFormatter.format(remainingIncome);
        }
        
    } catch (error) {
        console.error("❌ Error updating monthly income vs expense chart:", error);
        console.log("Stack trace:", error.stack);
        
        const monthlyIncomeElement = document.getElementById('monthly-income');
        if (monthlyIncomeElement) {
            monthlyIncomeElement.textContent = inrFormatter.format(0);
        }
        
        const monthlyExpensesElement = document.getElementById('monthly-expenses');
        if (monthlyExpensesElement) {
            monthlyExpensesElement.textContent = inrFormatter.format(0);
        }
        const balanceElement = document.getElementById('monthly-balance');
        if (balanceElement) {
            balanceElement.textContent = inrFormatter.format(0);
        }
    }
}

function updateFinancialTable(data) {
    const tableBody = document.getElementById('expenses-table')?.querySelector('tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center">No data available.</td></tr>`;
        return;
    }
    const totalExpenses = data.reduce((sum, expense) => sum + expense.amount, 0);
    data.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(expense.date).toLocaleDateString('en-IN')}</td>
            <td>${expense.title}</td>
            <td>${inrFormatter.format(expense.amount)}</td>
        `;
        tableBody.appendChild(row);
    });
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="2" class="text-right"><strong>Total Expenses:</strong></td>
        <td><strong>${inrFormatter.format(totalExpenses)}</strong></td>
    `;
    tableBody.appendChild(totalRow);
}

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

function getUserId() {
    return JSON.parse(localStorage.getItem('user'))?.id || null;
}
async function fetchFilteredIncome() {
    try {
        const userId = getUserId();
        if (!userId) return;

        let month = document.getElementById('filter-income-month').value;
        let startDate = document.getElementById('filter-income-start-date').value;
        let endDate = document.getElementById('filter-income-end-date').value;
        const params = new URLSearchParams({ userId });
        
        if (startDate && endDate) {
            params.append("startDate", startDate);
            params.append("endDate", endDate);
        } else if (month) {
            params.append("month", month);
        }

        console.log("📡 Fetching filtered income with params:", params.toString());
        const response = await fetch(`/api/reports/filtered-income?${params.toString()}`);
        const data = await response.json();
        console.log("💰 Filtered Income API Response:", data);
        updateIncomeTable(data);
    } catch (error) {
        console.error("❌ Error fetching filtered income:", error);
    }
}

function clearIncomeFilter() {
    document.getElementById('filter-income-month').value = "";
    document.getElementById('filter-income-start-date').value = "";
    document.getElementById('filter-income-end-date').value = "";
    console.log("Income filters cleared. Reloading all income data...");
    fetchFilteredIncome();
}

function updateIncomeTable(data) {
    const tableBody = document.getElementById('income-table')?.querySelector('tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="text-center">No income data available for this month.</td></tr>`;
        return;
    }
    const totalIncome = data.reduce((sum, income) => sum + income.amount, 0);
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="2" class="text-right"><strong>Total Income:</strong></td>
        <td><strong>${inrFormatter.format(totalIncome)}</strong></td>
    `;
    data.forEach(income => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(income.date).toLocaleDateString('en-IN')}</td>
            <td>${income.description || "NA"}</td>
            <td>${inrFormatter.format(income.amount)}</td>
        `;
        tableBody.appendChild(row);
    });
    tableBody.appendChild(totalRow);
}