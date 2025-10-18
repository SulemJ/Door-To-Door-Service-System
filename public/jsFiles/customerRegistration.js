document.addEventListener("DOMContentLoaded", () => { 
  const form = document.getElementById("customerRegistrationForm");
  const submitButton = form.querySelector('button[type="submit"]');
  const username = document.getElementById("username");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const requirements = document.querySelectorAll(".requirement");
  const confirmPassword = document
  .getElementById("confirmPassword");
  

  const requirementChecks = {
    length: (password) => password.length >= 8,
    uppercase: (password) => /[A-Z]/.test(password),
    lowercase: (password) => /[a-z]/.test(password),
    number: (password) => /[0-9]/.test(password),
  };

  password.addEventListener("input", () => {
    const passwordValue = password.value;

    requirements.forEach((requirement) => {
      const checkType = requirement.getAttribute("data-requirement");
      const isValid = requirementChecks[checkType](passwordValue);

      const circleIcon = requirement.querySelector("i");

      if (isValid) {
        requirement.classList.add("valid");
        circleIcon.classList.add("fa-check-circle");
        circleIcon.classList.remove("fa-circle");
      } else {
        requirement.classList.remove("valid");
        circleIcon.classList.add("fa-circle");
        circleIcon.classList.remove("fa-check-circle");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: username.value.trim(),
      email: email.value.trim(),
      password: password.value.trim(),
      confirmPassword :confirmPassword.value.trim(),
    };

    if (password.value.trim() !== confirmPassword.value.trim()) {
      alert("Passwords do not match!");
      throw new Error("Passwords do not match!");
    }
    try {
        // Validate passwords match
      const response = await fetch('/api/admin/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        alert("Registration completed successfully! You can now sign in.");
        form.reset();
        window.location.href = "/ne";
        // window.location.href = "sign-in.html";
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add user.');
    }
  });
});











