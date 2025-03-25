// document.addEventListener('DOMContentLoaded', () => {


//   const reportPeriodSelect = document.getElementById('report-period');
//   const reportTypeSelect = document.getElementById('report-type');
//   const generateReportButton = document.getElementById('generate-report');
//   const exportPdfButton = document.getElementById('export-pdf');
//   const reportChart = document.getElementById('reportChart');

//   // Summary stat elements
//   const summaryElements = {
//       totalExpenses: document.getElementById('total-expenses'),
//       avgDaily: document.getElementById('avg-daily'),
//       highestCategory: document.getElementById('highest-category'),
//       expenseCount: document.getElementById('expense-count'),
//       trend: document.getElementById('trend')
//   };

//   const criticalElements = [
//       reportPeriodSelect, 
//       reportTypeSelect, 
//       generateReportButton, 
//       exportPdfButton, 
//       reportChart,
//       ...Object.values(summaryElements)
//   ];

//   const missingElements = criticalElements.filter(el => !el);
//   if (missingElements.length > 0) {
//       console.error('❌ Missing critical elements:', missingElements);
//       showErrorMessage('Some page elements are missing. Please reload the page.');
//       return;
//   }

//   // ✅ Assign event listeners properly
//   generateReportButton.addEventListener('click', generateReport);
//   exportPdfButton.addEventListener('click', exportReportToPdf);

//   // fetchExpenseSummary();
//   generateReport();
//   fetchCategoryReport();

//   console.log("✅ Checking stored user:", localStorage.getItem('user'));

//   const user = JSON.parse(localStorage.getItem('user'));
//   const userId = user && user.id ? user.id : null;

//   if (!userId) {
//     console.warn("⚠️ User ID is missing or invalid. Redirecting to login...");
//     alert("User ID not found. Redirecting to login.");
//     setTimeout(() => {
//       window.location.href = '../index.html';
//     }, 5000);
//     return;
//   }

//   console.log("✅ User ID found:", userId);

//   function exportReportToPdf() {
//     if (typeof window.jspdf === 'undefined') {
//       console.error("jsPDF is not loaded. Please check your script inclusion.");
//       alert("Export to PDF is not available. Make sure jsPDF is included.");
//       return;
//     }

//     const { jsPDF } = window.jspdf;
//     const pdf = new jsPDF();

//     pdf.text("Expense Report", 10, 10);
//     pdf.text(`Total Expenses: ₹${summaryElements.totalExpenses.textContent}`, 10, 20);
//     pdf.text(`Transactions: ${summaryElements.expenseCount.textContent}`, 10, 30);
//     pdf.text(`Highest Category: ${summaryElements.highestCategory.textContent}`, 10, 40);
//     pdf.text(`Avg Daily: ₹${summaryElements.avgDaily.textContent}`, 10, 50);

//     // Capture Chart as Image
//     const canvas = document.getElementById('reportChart');
//     if (canvas) {
//       const chartImg = canvas.toDataURL("image/png");
//       pdf.addImage(chartImg, 'PNG', 10, 60, 180, 100);
//     }

//     pdf.save("Expense_Report.pdf");
//   }

//   // ✅ Fix: Assign event listeners properly
//   generateReportButton.addEventListener('click', generateReport);
//   exportPdfButton.addEventListener('click', exportReportToPdf);

//   async function generateReport() {
//     try {
//         const user = JSON.parse(localStorage.getItem('user'));
//         const userId = user ? user.id : null;

//         if (!userId) {
//             console.warn("⚠️ User ID not found. Redirecting to login...");
//             setTimeout(() => window.location.href = '../index.html', 2000);
//             return;
//         }

//         const period = document.getElementById('report-period').value;
//         const reportType = document.getElementById('report-type').value;

//         const params = new URLSearchParams({
//             userId: userId,
//             period: period,
//             type: reportType
//         });

//         console.log('📡 Fetching report with params:', params.toString());

//         const response = await fetch(`/api/reports/summary?${params.toString()}`, {
//             method: 'GET',
//             headers: { 'Content-Type': 'application/json' },
//             credentials: 'include' 
//         });

//         console.log('📡 Response status:', response.status);

//         if (response.status === 401) { 
//             console.error("❌ Unauthorized. Redirecting to login.");
//             alert("Session expired. Please log in again.");
//             setTimeout(() => window.location.href = '../index.html', 2000);
//             return;
//         }

//         // ✅ Log raw response before parsing
//         const rawText = await response.text();
//         console.log("📡 Raw response text:", rawText);

//         let data;
//         try {
//             data = JSON.parse(rawText);
//         } catch (jsonError) {
//             console.error("❌ JSON Parsing Error:", jsonError);
//             showErrorMessage("Invalid server response. Please try again later.");
//             return;
//         }

//         console.log('📊 Report Data:', data);
//         updateSummaryStats(data);

//     } catch (error) {
//         console.error('❌ Detailed Error:', error);
//         showErrorMessage("Could not generate report. Please try again.");
//     }
// }




//   function showErrorMessage(message) {
//     const insightsContainer = document.getElementById('insights-container');
//     insightsContainer.innerHTML = `
//       <div class="insight-item error">
//         <div class="insight-icon"><i class="fas fa-exclamation-triangle"></i></div>
//         <div class="insight-content">
//           <h4>Error</h4>
//           <p>${message}</p>
//         </div>
//       </div>
//     `;
//     console.error('UI Error Message:', message);
//   }

//   // Initial call with error handling
//   generateReport().catch(error => {
//     console.error('Initial report generation failed:', error);
//     showErrorMessage('Could not load initial report. Please try again later.');
//   });
// });

// let chartInstance = null; // Store Chart instance

// function updateChart(reportData, reportType) {
//     const ctx = document.getElementById('reportChart').getContext('2d');

//     // Destroy previous chart instance (if exists)
//     if (chartInstance) {
//         chartInstance.destroy();
//     }

//     let labels = [];
//     let values = [];

//     if (reportType === 'category') {
//         labels = reportData.categories.map(entry => entry.category);
//         values = reportData.categories.map(entry => entry.total);
//     } else if (reportType === 'monthly') {
//         labels = reportData.monthly.map(entry => entry.month);
//         values = reportData.monthly.map(entry => entry.total);
//     }

//     chartInstance = new Chart(ctx, {
//         type: reportType === 'category' ? 'doughnut' : 'line',
//         data: {
//             labels: labels,
//             datasets: [{
//                 data: values,
//                 backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
//                 borderColor: reportType === 'monthly' ? '#36A2EB' : null,
//                 fill: reportType === 'monthly',
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false
//         }
//     });
// }

// function updateExpensesTable(expenses) {
//   const tableBody = document.getElementById('expensesTableBody');
//   tableBody.innerHTML = ''; // Clear existing rows

//   if (!expenses || expenses.length === 0) {
//       tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No expenses found.</td></tr>`;
//       return;
//   }

//   expenses.forEach(expense => {
//       const row = document.createElement('tr');
//       row.innerHTML = `
//           <td>${expense.category}</td>
//           <td class="amount">₹${expense.amount.toFixed(2)}</td>
//           <td>${expense.percentage}%</td>
//           <td>${expense.trend}</td>
//       `;
//       tableBody.appendChild(row);
//   });
// }

// function updateInsights(insights) {
//   const insightsContainer = document.getElementById('insights-container');
//   insightsContainer.innerHTML = '';

//   if (!insights || insights.length === 0) {
//       insightsContainer.innerHTML = `
//         <div class="insight-item no-data">
//           <div class="insight-icon"><i class="fas fa-info-circle"></i></div>
//           <div class="insight-content">
//             <h4>No Insights Available</h4>
//             <p>Track more expenses to generate insights.</p>
//           </div>
//         </div>
//       `;
//       return;
//   }

//   insights.forEach(insight => {
//       const item = document.createElement('div');
//       item.classList.add('insight-item');
//       item.innerHTML = `
//         <div class="insight-icon"><i class="fas fa-lightbulb"></i></div>
//         <div class="insight-content">
//           <h4>${insight.title}</h4>
//           <p>${insight.description}</p>
//         </div>
//       `;
//       insightsContainer.appendChild(item);
//   });
// }

// async function fetchExpenseSummary() {
//   try {
//       const user = JSON.parse(localStorage.getItem('user'));
//       const userId = user ? user.id : null;

//       if (!userId) {
//           console.error("❌ User ID not found. Redirecting to login...");
//           setTimeout(() => window.location.href = '../index.html', 2000);
//           return;
//       }

//       console.log(`📡 Ensuring session for userId: ${user}`);

//       // ✅ Step 1: Recreate the session before fetching data
//       await fetch('/api/users/session', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           credentials: 'include'
//       });

//       console.log(`📡 Fetching expense summary for userId: ${userId}`);

//       // ✅ Step 2: Fetch the expense summary
//       const response = await fetch(`/api/reports/summary?userId=${userId}`, {
//           method: 'GET',
//           headers: { 'Content-Type': 'application/json' },
//           credentials: 'include' // Ensures cookies are sent
//       });

//       console.log("📡 Response status:", response.status);

      
//       // ✅ Detect if response is actually JSON
//       const contentType = response.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//           console.error("🚨 API returned HTML instead of JSON. Possibly redirected to login.");
//           console.log("📡 Raw response text:", await response.text());
//           showErrorMessage("Unexpected server response. Please log in again.");
//           setTimeout(() => window.location.href = '../index.html', 2000);
//           return;
//       }

//       const data = await response.json();
//       console.log('📊 Expense Summary Data:', data);
//       updateSummaryStats(data);
//   } catch (error) {
//       console.error("❌ Error fetching expense summary:", error);
//       showErrorMessage("Could not fetch expense summary. Please try again.");
//   }
// }

// function showErrorMessage(message) {
//   console.error('❌ UI Error Message:', message);

//   const insightsContainer = document.getElementById('insights-container');
//   if (!insightsContainer) {
//       alert(message); // Fallback if no UI element exists
//       return;
//   }

//   insightsContainer.innerHTML = `
//     <div class="insight-item error">
//       <div class="insight-icon"><i class="fas fa-exclamation-triangle"></i></div>
//       <div class="insight-content">
//         <h4>Error</h4>
//         <p>${message}</p>
//       </div>
//     </div>
//   `;
// }

// function updateSummaryStats(data) {
//   document.getElementById('total-expenses').textContent = `₹${data.totalExpenses}`;
//   document.getElementById('expense-count').textContent = data.transactionCount;
//   document.getElementById('highest-category').textContent = data.topCategory || 'N/A';
//   document.getElementById('avg-daily').textContent = `₹${data.avgDaily}`;
// }

// async function fetchCategoryReport() {
//   try {
//     const user = JSON.parse(localStorage.getItem('user'));
//     const userId = user ? user.id : null;
//     if (!userId) return;

//     const response = await fetch(`/api/reports/categories?userId=${userId}`, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include'
//     });

//     const data = await response.json();
//     // Update the chart using data from getCategoryReport
//     updateChart(data, 'category');
//   } catch (error) {
//     console.error("Error fetching category report:", error);
//     // Optionally, update the UI to indicate failure for the chart
//   }
// }

// async function fetchTopExpenses() {
//   try {
//     const user = JSON.parse(localStorage.getItem('user'));
//     const userId = user ? user.id : null;
//     if (!userId) return;

//     const response = await fetch(`/api/reports/top-expenses?userId=${userId}`, {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include'
//     });

//     const data = await response.json();
//     updateExpensesTable(data);
//   } catch (error) {
//     console.error("Error fetching top expenses:", error);
//     // Optionally, update the UI to indicate failure for the table
//   }
// }
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Checking stored user:", localStorage.getItem('user'));
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user && user.id ? user.id : null;
  if (!userId) {
      console.warn("⚠️ User ID is missing or invalid. Redirecting to login...");
      alert("User ID not found. Redirecting to login.");
      setTimeout(() => { window.location.href = '../index.html'; }, 5000);
      return;
  }
  console.log("✅ User ID found:", userId);

  // Element references
  const reportPeriodSelect = document.getElementById('report-period');
  const reportTypeSelect = document.getElementById('report-type');
  const generateReportButton = document.getElementById('generate-report');
  const exportPdfButton = document.getElementById('export-pdf');
  const reportChart = document.getElementById('reportChart');

  // Summary stat elements
  const summaryElements = {
      totalExpenses: document.getElementById('total-expenses'),
      avgDaily: document.getElementById('avg-daily'),
      expenseCount: document.getElementById('expense-count')
  };

  // Check critical elements
  const criticalElements = [
      reportPeriodSelect, reportTypeSelect, generateReportButton, exportPdfButton, reportChart,
      ...Object.values(summaryElements)
  ];
  const missingElements = criticalElements.filter(el => !el);
  if (missingElements.length > 0) {
      console.error('❌ Missing critical elements:', missingElements);
      showErrorMessage('Some page elements are missing. Please reload the page.');
      return;
  }

  // Attach event listeners
  generateReportButton.addEventListener('click', generateReport);
  exportPdfButton.addEventListener('click', exportReportToPdf);

  // Initial calls to load data
  generateReport();
  fetchCategoryReport();
  fetchMonthlyTrends();
});

let summaryChartInstance = null;  // For category (doughnut) chart
let trendChartInstance = null;    // For monthly trends (line chart)

// Currency formatter for INR
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2
});

// --- Update Summary Stats ---
function updateSummaryStats(data) {
  // Use the formatter to display currency amounts properly
  document.getElementById('total-expenses').textContent = inrFormatter.format(data.totalExpenses);
  document.getElementById('expense-count').textContent = data.transactionCount;
  document.getElementById('avg-daily').textContent = inrFormatter.format(data.avgDaily);
}

// --- Render Category Chart (Doughnut) ---
function updateCategoryChart(data) {
  const ctx = document.getElementById('reportChart').getContext('2d');
  if (summaryChartInstance) {
      summaryChartInstance.destroy();
  }
  // Assume data is an array of objects with fields: category and totalAmount
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

// --- Render Monthly Trends Chart (Line) ---
function updateTrendChart(trendData) {
  // Make sure there's a canvas with id "trendChart" in your HTML.
  const trendCanvas = document.getElementById('trendChart');
  if (!trendCanvas) {
      console.warn("Trend chart canvas not found.");
      return;
  }
  const ctx = trendCanvas.getContext('2d');
  if (trendChartInstance) {
      trendChartInstance.destroy();
  }
  // Assume trendData is an array of objects with "date" and "total"
  const dates = trendData.map(item => item.date);
  const totals = trendData.map(item => item.total);
  trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
          labels: dates,
          datasets: [{
              label: 'Spending Trend',
              data: totals,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: '#36A2EB',
              fill: true,
              tension: 0.3
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
}

// --- Update Trend Table (Data Table) ---
function updateTrendTable(trendData) {
  const tableBody = document.getElementById('expenses-table').querySelector('tbody');
  tableBody.innerHTML = ''; // Clear existing rows
  if (!trendData || trendData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="2" class="text-center">No spending data found.</td></tr>`;
      return;
  }
  trendData.forEach(item => {
      const row = document.createElement('tr');
      // Format date (assumes ISO format)
      const formattedDate = new Date(item.date).toLocaleDateString('en-IN');
      row.innerHTML = `
          <td>${formattedDate}</td>
          <td>${inrFormatter.format(item.total)}</td>
      `;
      tableBody.appendChild(row);
  });
}

// --- Export Report to PDF using jsPDF ---
function exportReportToPdf() {
  if (typeof window.jspdf === 'undefined') {
      console.error("jsPDF is not loaded. Please check your script inclusion.");
      alert("Export to PDF is not available. Make sure jsPDF is included.");
      return;
  }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Expense Report", 10, 10);
  pdf.text(`Total Expenses: ${document.getElementById('total-expenses').textContent}`, 10, 20);
  pdf.text(`Transactions: ${document.getElementById('expense-count').textContent}`, 10, 30);
  pdf.text(`Average Spending: ${document.getElementById('avg-daily').textContent}`, 10, 40);
  // Capture the trend chart as an image if available
  const canvas = document.getElementById('reportChart');
  if (canvas) {
      const chartImg = canvas.toDataURL("image/png");
      pdf.addImage(chartImg, 'PNG', 10, 50, 180, 100);
  }
  pdf.save("Expense_Report.pdf");
}

// --- Fetch Expense Summary ---
async function generateReport() {
  try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user ? user.id : null;
      if (!userId) {
          console.warn("⚠️ User ID not found. Redirecting to login...");
          setTimeout(() => window.location.href = '../index.html', 2000);
          return;
      }
      const period = document.getElementById('report-period').value;
      const reportType = document.getElementById('report-type').value;
      // Build query parameters for summary endpoint
      const params = new URLSearchParams({
          userId: userId,
          period: period,
          type: reportType
      });
      console.log('📡 Fetching report summary with params:', params.toString());
      const response = await fetch(`/api/reports/summary?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
      });
      console.log('📡 Response status:', response.status);
      if (response.status === 401) { 
          console.error("❌ Unauthorized. Redirecting to login.");
          alert("Session expired. Please log in again.");
          setTimeout(() => window.location.href = '../index.html', 2000);
          return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          console.error("🚨 API returned HTML instead of JSON. Possibly redirected to login.");
          console.log("📡 Raw response text:", await response.text());
          showErrorMessage("Unexpected server response. Please log in again.");
          setTimeout(() => window.location.href = '../index.html', 2000);
          return;
      }
      const data = await response.json();
      console.log('📊 Expense Summary Data:', data);
      updateSummaryStats(data);
  } catch (error) {
      console.error('❌ Detailed Error:', error);
      showErrorMessage("Could not generate report. Please try again.");
  }
}

// --- Fetch Category Breakdown for Chart ---
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

// --- Fetch Monthly Trends for Chart and Table ---
async function fetchMonthlyTrends() {
  try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user ? user.id : null;
      if (!userId) return;
      const response = await fetch(`/api/reports/monthly?userId=${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
      });
      const data = await response.json();
      console.log("📊 Monthly Trends Data:", data);
      updateTrendChart(data);
      updateTrendTable(data);
  } catch (error) {
      console.error("Error fetching monthly trends:", error);
  }
}

// --- Simple Error Message Display ---
function showErrorMessage(message) {
  console.error('❌ UI Error Message:', message);
  const insightsContainer = document.getElementById('insights-container');
  if (!insightsContainer) {
      alert(message);
      return;
  }
  insightsContainer.innerHTML = `
    <div class="insight-item error">
      <div class="insight-icon"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="insight-content">
        <h4>Error</h4>
        <p>${message}</p>
      </div>
    </div>
  `;
}
