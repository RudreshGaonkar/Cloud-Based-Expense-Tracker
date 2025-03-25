document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const updateBtn = document.getElementById('updateProfile');
  
    // Fetch profile info
    fetch('/api/auth/profile', {
      credentials: 'include' // important for sending cookies
    })
      .then(response => response.json())
      .then(data => {
        nameInput.value = data.name;
        emailInput.value = data.email;
      })
      .catch(error => console.error('Error fetching profile:', error));
  
    // Update profile info
    updateBtn.addEventListener('click', () => {
      const updatedData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim()
      };
  
      fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData)
      })
        .then(response => response.json())
        .then(result => {
          alert(result.message);
        })
        .catch(error => console.error('Error updating profile:', error));
    });
  });
  