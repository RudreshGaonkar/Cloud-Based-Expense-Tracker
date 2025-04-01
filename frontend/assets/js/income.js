// document.addEventListener("DOMContentLoaded", function () {
//     fetchIncomeRecords();
//     loadUserInfo();

//     const incomeForm = document.getElementById("incomeForm");

//     if (incomeForm) {
//         incomeForm.addEventListener("submit", async (e) => {
//             e.preventDefault();

//             const amount = document.getElementById("incomeAmount").value;
//             const date = document.getElementById("incomeDate").value;
//             const description = document.getElementById("incomeDescription").value;

//             if (!amount || !date) {
//                 alert("Amount and Date are required.");
//                 return;
//             }

//             try {
//                 const response = await fetch("/api/income/add", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ amount, date, description }),
//                 });

//                 const result = await response.json();

//                 if (!response.ok) {
//                     throw new Error(result.message || "Failed to add income.");
//                 }

//                 alert(result.message || "Income added successfully");
//                 incomeForm.reset();
//                 fetchIncomeRecords(1); // Refresh with first page
//             } catch (error) {
//                 console.error("Error adding income:", error);
//                 alert(error.message);
//             }
//         });
//     }

//     // Initialize pagination controls
//     document.getElementById("prevPage").addEventListener("click", () => {
//         const currentPage = parseInt(document.getElementById("currentPage").textContent);
//         if (currentPage > 1) {
//             fetchIncomeRecords(currentPage - 1);
//         }
//     });

//     document.getElementById("nextPage").addEventListener("click", () => {
//         const currentPage = parseInt(document.getElementById("currentPage").textContent);
//         const totalPages = parseInt(document.getElementById("totalPages").textContent);
//         if (currentPage < totalPages) {
//             fetchIncomeRecords(currentPage + 1);
//         }
//     });
// });

// async function fetchIncomeRecords(page = 1) {
//     try {
//         const response = await fetch(`/api/income/records?page=${page}&limit=7`);
//         if (!response.ok) throw new Error("Failed to fetch income records.");

//         const data = await response.json();
//         const incomeTableBody = document.getElementById("incomeTableBody");
//         incomeTableBody.innerHTML = ""; // Clear existing table data

//         if (data.records && data.records.length > 0) {
//             data.records.forEach((income) => {
//                 const row = document.createElement("tr");
//                 row.innerHTML = `
//                     <td>₹${income.amount}</td>
//                     <td>${new Date(income.date).toLocaleDateString()}</td>
//                     <td>${income.description || "N/A"}</td>
//                 `;
//                 incomeTableBody.appendChild(row);
//             });

//             // Update pagination info
//             document.getElementById("currentPage").textContent = data.currentPage;
//             document.getElementById("totalPages").textContent = data.totalPages;
//             document.getElementById("paginationControls").style.display = data.totalPages > 1 ? "flex" : "none";
//         } else {
//             incomeTableBody.innerHTML = `<tr><td colspan="3" class="text-center">No income records found.</td></tr>`;
//             document.getElementById("paginationControls").style.display = "none";
//         }
//     } catch (error) {
//         console.error("Error fetching income records:", error);
//         incomeTableBody.innerHTML = `<tr><td colspan="3" class="text-center">Error loading records.</td></tr>`;
//     }
// }

// async function loadUserInfo() {
//     try {
//       const response = await fetch('/api/users/profile', { credentials: 'include' });
//       let userData;
  
//       if (response.ok) {
//         const data = await response.json();
//         userData = data.user;
        
  
//         const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
//         const updatedUser = { ...currentUser, ...userData };
//         localStorage.setItem('user', JSON.stringify(updatedUser));
//       } else {
//         const storedUser = localStorage.getItem('user');
//         if (!storedUser) {
//           throw new Error("User not found in local storage");
//         }
//         userData = JSON.parse(storedUser);
//       }
  
  
//       const userNameElement = document.getElementById('user-name');
//       if (userNameElement) {
//         userNameElement.textContent = userData.name;
//       }
  
  
//       const nameInput = document.getElementById('profile-name-input');
//       if (nameInput) {
//         nameInput.value = userData.name;
//       }
      
//       const emailDisplay = document.getElementById('profile-email-display');
//       if (emailDisplay) {
//         emailDisplay.value = userData.email || '';
//       }
  
//       loadUserAvatar();
  
//     } catch (error) {
//       console.error("❌ Error loading user info:", error);
//       const userNameElement = document.getElementById('user-name');
//       if (userNameElement) {
//         userNameElement.textContent = 'Error Loading Profile';
//       }
//     }
//   }
  
//   function loadUserAvatar() {
//     const avatarElements = document.querySelectorAll('#user-avatar, #large-user-avatar');
//     const storedAvatar = localStorage.getItem('userAvatar');
//     const nameInput = document.getElementById('profile-name-input');
//     const userName = nameInput ? nameInput.value : 'User';
    
//     avatarElements.forEach(el => {
//       if (storedAvatar) {
//         if (el.querySelector('img')) {
//           el.querySelector('img').src = storedAvatar;
//         } else {
//           const img = document.createElement('img');
//           img.src = storedAvatar;
//           img.alt = 'Profile Avatar';
//           img.className = 'avatar-img';
//           el.innerHTML = '';
//           el.appendChild(img);
//         }
//       } else {
//         el.textContent = userName.charAt(0).toUpperCase();
//       }
//     });
//   }

document.addEventListener("DOMContentLoaded", function () {
  fetchIncomeRecords();
  loadUserInfo();

  const incomeForm = document.getElementById("incomeForm");
  const incomeDateInput = document.getElementById("incomeDate");


  function setMaxDateToToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    incomeDateInput.setAttribute("max", formattedDate);
  }

  setMaxDateToToday();

  incomeForm.addEventListener("reset", setMaxDateToToday);

  if (incomeForm) {
      incomeForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const amount = document.getElementById("incomeAmount").value;
          const date = document.getElementById("incomeDate").value;
          const description = document.getElementById("incomeDescription").value;

          if (!amount || !date) {
              alert("Amount and Date are required.");
              return;
          }

          const inputDate = new Date(date);
          const today = new Date();
        
          const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
          if (inputDateOnly > todayOnly) {
              alert('Future dates are not allowed for expenses.');
              return;
          }

          try {
              const response = await fetch("/api/income/add", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, date, description }),
              });

              const result = await response.json();

              if (!response.ok) {
                  throw new Error(result.message || "Failed to add income.");
              }

              alert(result.message || "Income added successfully");
              incomeForm.reset();
              fetchIncomeRecords(1); 
          } catch (error) {
              console.error("Error adding income:", error);
              alert(error.message);
          }
      });
  }

  document.getElementById("prevPage").addEventListener("click", () => {
      const currentPage = parseInt(document.getElementById("currentPage").textContent);
      if (currentPage > 1) {
          fetchIncomeRecords(currentPage - 1);
      }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
      const currentPage = parseInt(document.getElementById("currentPage").textContent);
      const totalPages = parseInt(document.getElementById("totalPages").textContent);
      if (currentPage < totalPages) {
          fetchIncomeRecords(currentPage + 1);
      }
  });
});

async function fetchIncomeRecords(page = 1) {
  try {
      const response = await fetch(`/api/income/records?page=${page}&limit=7`);
      if (!response.ok) throw new Error("Failed to fetch income records.");

      const data = await response.json();
      const incomeTableBody = document.getElementById("incomeTableBody");
      incomeTableBody.innerHTML = ""; // Clear existing table data

      if (data.records && data.records.length > 0) {
          data.records.forEach((income) => {
              const row = document.createElement("tr");
              row.innerHTML = `
                  <td>₹${income.amount}</td>
                  <td>${new Date(income.date).toLocaleDateString()}</td>
                  <td>${income.description || "N/A"}</td>
              `;
              incomeTableBody.appendChild(row);
          });

          // Update pagination info
          document.getElementById("currentPage").textContent = data.currentPage;
          document.getElementById("totalPages").textContent = data.totalPages;
          document.getElementById("paginationControls").style.display = data.totalPages > 1 ? "flex" : "none";
      } else {
          incomeTableBody.innerHTML = `<tr><td colspan="3" class="text-center">No income records found.</td></tr>`;
          document.getElementById("paginationControls").style.display = "none";
      }
  } catch (error) {
      console.error("Error fetching income records:", error);
      incomeTableBody.innerHTML = `<tr><td colspan="3" class="text-center">Error loading records.</td></tr>`;
  }
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