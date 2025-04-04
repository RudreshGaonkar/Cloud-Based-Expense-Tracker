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
          
          // Set active link after sidebar is loaded
          setActiveLink();
      })
      .catch(error => console.error("Sidebar load error:", error));
});

function setActiveLink() {
  const currentURL = window.location.href;
  const urlParts = currentURL.split('/');
  const currentFile = urlParts[urlParts.length - 1] || 'dashboard.html';
  
  console.log('Current file detected:', currentFile);
  const menuLinks = document.querySelectorAll('.sidebar-menu ul li a');
  console.log('Found menu links:', menuLinks.length);
  menuLinks.forEach(function(link) {
    link.classList.remove('active');
    const linkHref = link.getAttribute('href');
    console.log('Checking link:', linkHref);
    if (currentFile.includes(linkHref) || 
        (currentFile === '' && linkHref === 'dashboard.html') ||
        (currentFile === 'index.html' && linkHref === 'dashboard.html')) {
      console.log('MATCH FOUND! Setting active:', linkHref);
      link.classList.add('active');
    }
  });
  const hasActive = document.querySelector('.sidebar-menu ul li a.active');
  if (!hasActive && (currentFile === '' || currentFile === 'index.html')) {
    const dashboardLink = document.querySelector('.sidebar-menu ul li a[href="dashboard.html"]');
    if (dashboardLink) {
      console.log('Fallback: Setting dashboard as active');
      dashboardLink.classList.add('active');
    }
  }
  console.log('Elements with active class after processing:', document.querySelectorAll('.sidebar-menu ul li a.active').length);
}

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