document.addEventListener('DOMContentLoaded', () => {
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const updatePasswordBtn = document.getElementById('updatePassword');
  
    updatePasswordBtn.addEventListener('click', () => {
      if (newPassword.value !== confirmPassword.value) {
        alert('New passwords do not match!');
        return;
      }
  
      const data = {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      };
  
      fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(result => {
          alert(result.message);
          // Clear input fields
          currentPassword.value = '';
          newPassword.value = '';
          confirmPassword.value = '';
        })
        .catch(error => console.error('Error updating password:', error));
    });
  });
  