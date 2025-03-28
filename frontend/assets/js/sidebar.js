console.log("Checking stored user:", localStorage.getItem('user'));

const user = JSON.parse(localStorage.getItem('user'));
const userId = user && user.id ? user.id : null;

if (!userId) {
  console.warn("⚠️ User ID is missing or invalid. Redirecting to login...");
  alert("User ID not found. Redirecting to login.");
  setTimeout(() => {
    window.location.href = '../index.html';
  }, 5000);
//   return;
}

document.addEventListener("DOMContentLoaded", function () {
  fetch("../pages/components/sidebar.html")
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
      })
      .then(html => {
          document.getElementById("sidebar").innerHTML = html;
      })
      .catch(error => console.error("Sidebar load error:", error));
});

function logoutUser() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
  }
  
  fetch('/api/users/logout', {
    method: 'POST',
    credentials: 'include' 
  })
  .then(response => response.json())
  .then(data => {
    localStorage.removeItem('user');
    window.location.href = '../../index.html'; 
  })
  .catch(error => {
    console.error('Error during logout:', error);
    alert('Logout failed. Please try again.');
    if (logoutBtn) {
      logoutBtn.disabled = false;
    }
  });
}