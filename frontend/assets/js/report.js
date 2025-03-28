document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    fetchFilteredExpenses(); 
    fetchExpenseSummary();
    fetchCategoryReport();
    fetchExpenseTrends();
    fetchFilteredExpenses();
    
    console.log("Checking stored user:", localStorage.getItem('user'));
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user && user.id ? user.id : null;
    
    if (!userId) {
        console.warn("User ID is missing or invalid. Redirecting to login...");
        alert("User ID not found. Redirecting to login...");
        setTimeout(() => { window.location.href = '../index.html'; }, 2000);
        return;
    }
    
    console.log("User ID found:", userId);

    document.getElementById('filter-date').addEventListener('change', fetchFilteredExpenses);
    document.getElementById('filter-month').addEventListener('change', fetchFilteredExpenses);
    document.getElementById('filter-year').addEventListener('change', fetchFilteredExpenses);
    document.getElementById('apply-filters').addEventListener('click', fetchFilteredExpenses); 
    document.getElementById('clear-filters').addEventListener('click', clearFilters); 
    
    document.getElementById('export-pdf').addEventListener('click', exportReportToPdf);
    
});

let summaryChartInstance = null; 
let trendChartInstance = null;


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

async function fetchExpenseSummary() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
        if (!userId) return;

        const response = await fetch(`/api/reports/summary?userId=${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        console.log("📊 Expense Summary Data:", data);

        updateSummaryStats(data);
    } catch (error) {
        console.error("Error fetching expense summary:", error);
    }
}


function updateSummaryStats(data) {
    document.getElementById('total-expenses').textContent = inrFormatter.format(data.totalExpenses || 0);
    document.getElementById('avg-daily').textContent = inrFormatter.format(data.avgDaily || 0);
    document.getElementById('expense-count').textContent = data.transactionCount || 0;
    document.getElementById('highest-category').textContent = data.topCategory || '-';
}


async function fetchCategoryReport() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
        if (!userId) return;

        const response = await fetch(`/api/reports/categories?userId=${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        console.log("📊 Category Report Data:", data);
        updateCategoryChart(data);
    } catch (error) {
        console.error("Error fetching category report:", error);
    }
}


function updateCategoryChart(data) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    if (summaryChartInstance) {
        summaryChartInstance.destroy();
    }

    const categories = data.map(item => item.category);
    const totals = data.map(item => item.totalAmount);

    summaryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: totals,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


async function fetchExpenseTrends() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
        if (!userId) {
            console.warn("⚠️ User ID missing. Redirecting to login...");
            window.location.href = '../index.html';
            return;
        }

        const periodSelect = document.getElementById('trend-period');
        const period = periodSelect ? periodSelect.value : "month"; 


        const response = await fetch(`/api/reports/trends?userId=${userId}&period=${period}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format from trends API");
        }

        console.log("📈 Expense Trends Data:", data);
        updateTrendChart(data);
    } catch (error) {
        console.error("❌ Error fetching expense trends:", error);
    }
}



function updateTrendChart(data) {
    if (!Array.isArray(data) || data.length === 0) {
        console.warn("⚠️ No trend data available.");
        return;
    }

    const ctx = document.getElementById('trendChart').getContext('2d');

    if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
    }

    const labels = data.map(item => item.period);
    const totals = data.map(item => item.total);

    window.trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending Trend',
                data: totals,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateFinancialTable(data) {
    const tableBody = document.getElementById('expenses-table').querySelector('tbody');
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
            <td>₹${expense.amount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}


async function fetchFilteredExpenses() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
        if (!userId) return;

        let date = document.getElementById('filter-date').value;
        let month = document.getElementById('filter-month').value;
        let year = document.getElementById('filter-year').value;

        if (month && isNaN(month)) {
            month = convertMonthToNumber(month.toLowerCase()); 
            if (!month) {
                alert("Invalid month name. Please enter a valid month (e.g., 'March' or '03').");
                return;
            }
            month = `${year}-${month}`;
        }

        const params = new URLSearchParams({ userId });
        if (date) params.append("date", date);
        if (month) params.append("month", month);
        if (year) params.append("year", year);

        console.log("📡 Fetching filtered expenses with params:", params.toString());

        const response = await fetch(`/api/reports/filtered?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const rawText = await response.text();
            console.error("🚨 Unexpected Response (Not JSON):", rawText);
            throw new Error("Invalid server response. Expected JSON.");
        }

        const data = await response.json();
        console.log("📊 Filtered Expenses API Response:", data);

        if (!Array.isArray(data)) {
            throw new Error("Invalid data format from filtered expenses API");
        }

        updateFinancialTable(data);
    } catch (error) {
        console.error("❌ Error fetching filtered expenses:", error);
    }
}

function exportReportToPdf() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text("Expense Report", 10, 10);
    pdf.save("Expense_Report.pdf");
}

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


function convertMonthToNumber(monthName) {
    const months = {
        january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
        july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
    };
    return months[monthName] || null;
}