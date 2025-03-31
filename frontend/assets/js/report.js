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
        await updateIncomeExpenseChart(); // Add this new function call
        
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
        return data; // Return data for other functions to use
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

// Fetch Category-wise Expense Report
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
// async function fetchExpenseTrends() {
//     try {
//         const userId = getUserId();
//         if (!userId) return;

//         const period = document.getElementById('trend-period')?.value || "month";
//         const response = await fetch(`/api/reports/trends?userId=${userId}&period=${period}`);
//         const data = await response.json();

//         console.log("📈 Expense Trends Data:", data);
//         updateTrendChart(data);
//     } catch (error) {
//         console.error("❌ Error fetching expense trends:", error);
//     }
// }

// function updateTrendChart(data) {
//     if (!Array.isArray(data) || data.length === 0) {
//         console.warn("⚠️ No trend data available.");
//         return;
//     }

//     const ctx = document.getElementById('trendChart')?.getContext('2d');
//     if (!ctx) return;

//     if (trendChartInstance) {
//         trendChartInstance.destroy();
//     }

//     trendChartInstance = new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: data.map(item => item.period),
//             datasets: [{
//                 label: 'Spending Trend',
//                 data: data.map(item => item.total),
//                 borderColor: '#36A2EB',
//                 backgroundColor: 'rgba(54, 162, 235, 0.2)',
//                 fill: true,
//                 tension: 0.3
//             }]
//         },
//         options: { 
//             responsive: true, 
//             maintainAspectRatio: false,
//             scales: {
//                 y: { beginAtZero: true }
//             } 
//         }
//     });
// }

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

    // Format the labels based on period type
    const formattedLabels = data.map(item => {
        const period = item.period;
        // Different formatting based on period type
        if (period.includes('-W')) {
            // Format week as "Week X, YYYY"
            const [year, week] = period.split('-W');
            return `Week ${week}, ${year}`;
        } else if (period.length === 7) {
            // Format month as "Jan 2023"
            const date = new Date(period + "-01");
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (period.length === 4) {
            // Year only needs no formatting
            return period;
        } else {
            // For daily, format as "Jan 1, 2023"
            const date = new Date(period);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

    // Extract expense data, handling both data formats (for backward compatibility)
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

// Create Income vs Expense Chart
// Create Income vs Expense Chart
async function updateIncomeExpenseChart() {
    try {
        const totalIncome = await fetchIncomeForReports();
        const summaryData = await fetchExpenseSummary();
        const totalExpenses = summaryData?.totalExpenses || 0;
        const remainingIncome = totalIncome - totalExpenses;

        // Fetch category data to show expense breakdown
        const userId = getUserId();
        if (!userId) return;
        const response = await fetch(`/api/reports/categories?userId=${userId}`);
        const categoryData = await response.json();

        const ctx = document.getElementById('incomeChart')?.getContext('2d');
        if (!ctx) {
            console.warn("⚠️ Income chart canvas not found!");
            return;
        }

        if (incomeChartInstance) {
            incomeChartInstance.destroy();
        }

        // Prepare data for pie chart
        // Create an array of expense categories and their amounts
        const expenseCategories = categoryData.map(item => item.category);
        const expenseAmounts = categoryData.map(item => item.totalAmount);
        
        // Add remaining income as a separate category
        const labels = [...expenseCategories];
        const data = [...expenseAmounts];
        
        // Only add remaining income if it's positive
        if (remainingIncome > 0) {
            labels.push('Remaining Income');
            data.push(remainingIncome);
        }

        // Generate dynamic colors - blue shades for expenses, green for remaining income
        const backgroundColors = expenseCategories.map((_, index) => {
            // Create different shades of blue for expenses
            const blueShade = Math.max(100, 230 - (index * 30));
            return `rgba(${blueShade - 50}, ${blueShade - 100}, 255, 0.7)`;
        });
        
        // Add green color for remaining income
        if (remainingIncome > 0) {
            backgroundColors.push('rgba(75, 192, 120, 0.7)');
        }

        console.log("📊 Creating Income vs Expenses Pie Chart", {
            totalIncome,
            totalExpenses,
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
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Income Usage Breakdown (Total Income This Month: ${inrFormatter.format(totalIncome)})`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = ((value / totalIncome) * 100).toFixed(1);
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
    } catch (error) {
        console.error("❌ Error updating income vs expense chart:", error);
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
        el.textContent = userName.charAt(0).toUpperCase();
      }
    });
  }

function getUserId() {
    return JSON.parse(localStorage.getItem('user'))?.id || null;
}