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

        document.getElementById('filter-date')?.addEventListener('change', fetchFilteredExpenses);
        document.getElementById('filter-month')?.addEventListener('change', fetchFilteredExpenses);
        document.getElementById('filter-year')?.addEventListener('change', fetchFilteredExpenses);
        document.getElementById('apply-filters')?.addEventListener('click', fetchFilteredExpenses);
        document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
        

        document.getElementById('trend-period')?.addEventListener('change', fetchExpenseTrends);
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}


let summaryChartInstance = null;
let trendChartInstance = null;
let incomeChartInstance = null;

const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
});

function clearFilters() {
    document.getElementById('filter-date').value = "";
    document.getElementById('filter-month').value = "";
    document.getElementById('filter-year').value = "";

    console.log("Filters cleared. Reloading all expenses...");
    fetchFilteredExpenses();
}

// Fetch Expense Summary
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

        // Get selected period from dropdown or use month as default
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

    // Get title based on selected period
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

// async function updateIncomeExpenseChart() {
//     try {
//         const summaryData = await fetchExpenseSummary();
//         if (!summaryData) {
//             console.warn("⚠️ No summary data available.");
//             return;
//         }

//         const totalIncome = summaryData.totalIncome || 0;
//         const totalExpenses = summaryData.totalExpenses || 0;
//         const remainingIncome = summaryData.remainingIncome !== undefined ? summaryData.remainingIncome : (totalIncome - totalExpenses);

//         if (totalIncome === 0) {
//             console.warn("⚠️ No income data available.");
//         }

//         const userId = getUserId();
//         if (!userId) return;
        

//         const response = await fetch(`/api/reports/categories?userId=${userId}`);
//         const categoryData = await response.json();

//         const ctx = document.getElementById('incomeChart')?.getContext('2d');
//         if (!ctx) {
//             console.warn("⚠️ Income chart canvas not found!");
//             return;
//         }

//         // Destroy existing chart instance if exists
//         if (incomeChartInstance) {
//             incomeChartInstance.destroy();
//         }

//         // Prepare chart data
//         const expenseCategories = categoryData.map(item => item.category);
//         const expenseAmounts = categoryData.map(item => item.totalAmount);
        
//         const labels = [...expenseCategories];
//         const data = [...expenseAmounts];
        
//         if (remainingIncome > 0) {
//             labels.push('Remaining Income');
//             data.push(remainingIncome);
//         }

//         const backgroundColors = expenseCategories.map((_, index) => {
//             return `hsl(${index * 40}, 70%, 50%)`;
//         });

//         if (remainingIncome > 0) {
//             backgroundColors.push('rgba(75, 192, 120, 0.7)');
//         }

//         console.log("📊 Creating Income vs Expenses Pie Chart", {
//             totalIncome,
//             totalExpenses,
//             remainingIncome,
//             categories: labels,
//             values: data
//         });


//         incomeChartInstance = new Chart(ctx, {
//             type: 'pie',
//             data: {
//                 labels: labels,
//                 datasets: [{
//                     data: data,
//                     backgroundColor: backgroundColors,
//                     borderWidth: 1
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     title: {
//                         display: true,
//                         text: `Income Usage Breakdown (Total Income: ${inrFormatter.format(totalIncome)})`
//                     },
//                     tooltip: {
//                         callbacks: {
//                             label: function(context) {
//                                 const value = context.raw;
//                                 const percentage = totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : 0;
//                                 return `${context.label}: ${inrFormatter.format(value)} (${percentage}%)`;
//                             }
//                         }
//                     },
//                     legend: {
//                         position: 'right'
//                     }
//                 }
//             }
//         });

//     } catch (error) {
//         console.error("❌ Error updating income vs expense chart:", error);
//         alert("Failed to load income vs expenses chart. Please try again.");
//     }
// }
async function updateIncomeExpenseChart() {
    try {
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();
        const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        
        console.log(`📅 Fetching income vs expense for current month: ${currentMonthStr}`);
        
        const userId = getUserId();
        if (!userId) return;
        
        // Fetch current month expense data
        const expenseParams = new URLSearchParams({ 
            userId: userId,
            month: currentMonthStr 
        });
        
        const expenseResponse = await fetch(`/api/reports/filtered?${expenseParams.toString()}`);
        const expenseData = await expenseResponse.json();
        
        // Calculate total expenses for current month
        const totalMonthlyExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Fetch category breakdown for current month
        const categoryParams = new URLSearchParams({
            userId: userId,
            month: currentMonthStr
        });
        
        const categoryResponse = await fetch(`/api/reports/categories?${categoryParams.toString()}`);
        const categoryData = await categoryResponse.json();
        
        // Fetch current month income data - THIS IS WHERE THE ERROR OCCURS
        // Changed from /api/income/monthly-income to /api/reports/monthly-income to match your actual routes
        const incomeResponse = await fetch(`/api/reports/monthly-income?month=${currentMonthStr}&userId=${userId}`);
        
        // Add error handling for the response
        if (!incomeResponse.ok) {
            console.error(`Error fetching income data: ${incomeResponse.status} ${incomeResponse.statusText}`);
            throw new Error(`Failed to fetch income data: ${incomeResponse.status}`);
        }
        
        const incomeData = await incomeResponse.json();
        console.log("Income data received:", incomeData);
        const totalMonthlyIncome = incomeData?.totalIncome || 0;
        
        const remainingIncome = totalMonthlyIncome - totalMonthlyExpenses;
        
        // Get the canvas context
        const ctx = document.getElementById('incomeChart')?.getContext('2d');
        if (!ctx) {
            console.warn("⚠️ Income chart canvas not found!");
            return;
        }
        
        // Destroy existing chart instance if it exists
        if (incomeChartInstance) {
            incomeChartInstance.destroy();
        }
        
        // Prepare data for chart
        const labels = categoryData.map(item => item.category);
        const data = categoryData.map(item => item.totalAmount);
        
        if (remainingIncome > 0) {
            labels.push('Remaining Income');
            data.push(remainingIncome);
        }
        
        // Generate colors for categories
        const backgroundColors = categoryData.map((_, index) => {
            return `hsl(${index * 40}, 70%, 50%)`;
        });
        
        if (remainingIncome > 0) {
            backgroundColors.push('rgba(75, 192, 120, 0.7)');
        }
        
        // Format month name for display
        const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' });
        
        console.log(`📊 Creating Income vs Expenses Chart for ${monthName} ${currentYear}`, {
            totalMonthlyIncome,
            totalMonthlyExpenses,
            remainingIncome,
            categories: labels,
            values: data
        });
        
        // Create new chart
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
        
        // Update summary text elements if they exist
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
        // Don't show alert to avoid annoying users
        console.log("Stack trace:", error.stack);
        
        // Update UI to show error state instead of alert
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


// Fetch Filtered Expenses
async function fetchFilteredExpenses() {
    try {
        const userId = getUserId();
        if (!userId) return;

        let date = document.getElementById('filter-date').value;
        let month = document.getElementById('filter-month').value;
        let year = document.getElementById('filter-year').value;

        const params = new URLSearchParams({ userId });
        if (date) params.append("date", date);
        if (month) params.append("month", month);
        if (year) params.append("year", year);

        console.log("📡 Fetching filtered expenses with params:", params.toString());

        const response = await fetch(`/api/reports/filtered?${params.toString()}`);
        const data = await response.json();

        console.log("📊 Filtered Expenses API Response:", data);
        updateFinancialTable(data);
    } catch (error) {
        console.error("❌ Error fetching filtered expenses:", error);
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

    data.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(expense.date).toLocaleDateString('en-IN')}</td>
            <td>${expense.title}</td>
            <td>${inrFormatter.format(expense.amount)}</td>
        `;
        tableBody.appendChild(row);
    });
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