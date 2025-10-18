document.addEventListener("DOMContentLoaded", () => {
  const signinForm = document.getElementById("form-signin");

  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("signin-password").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!password || !email) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email }),
      });

      const result = await response.json();

      if (result.redirect) {
        // Redirect if backend tells us tokens are insufficient
        window.location.href = "/pa";
        return;
      }

      if (result.success) {
        const role = result.user.role;
        sessionStorage.setItem("loggedInUser", JSON.stringify({ role, email }));

        if (role === "admin") {
          window.location.href = "adminDashboard.html";
        } else if (role === "serviceProvider") {
          window.location.href = "providerDashboard.html";
        } else if (role === "user") {
          window.location.href = "bookings.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert("An error occurred during sign in. Please try again.");
    }
  });
});

