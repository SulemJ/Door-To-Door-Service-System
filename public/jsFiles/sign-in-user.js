document.addEventListener("DOMContentLoaded", () => {
  const signinForm = document.getElementById("form-signin");

  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Collect form data
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("signin-password").value.trim();
    const email = document.getElementById("email").value.trim();
    const role = document.getElementById("role").value;

    // Validate fields
    if (!username || !password || !role || !email) {
      alert("Please fill in all required fields.");
      return;
    }

    // Retrieve users from localStorage
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const matchedUser = users.find(
      (user) =>
        user.username === username &&
        user.password === password &&
        user.role === role &&
        user.email === email
    );

    if (matchedUser) {
      // Save user data in sessionStorage
      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          id: matchedUser.id,
          username: matchedUser.username,
          role: matchedUser.role,
          email: matchedUser.email,
        })
      );

      // Handle redirects based on role
      if (matchedUser.role === "user") {
        window.location.href = "bookings.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert("Invalid login credentials or user not found.");
    }
  });

  // Password visibility toggle
  function addToggleIcon(passwordField) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = "100%";

    passwordField.parentNode.insertBefore(wrapper, passwordField);
    wrapper.appendChild(passwordField);

    passwordField.style.paddingRight = "2.5rem";

    const toggleIcon = document.createElement("i");
    toggleIcon.className = "fas fa-eye";
    toggleIcon.style.position = "absolute";
    toggleIcon.style.top = "50%";
    toggleIcon.style.right = "10px";
    toggleIcon.style.transform = "translateY(-50%)";
    toggleIcon.style.cursor = "pointer";

    toggleIcon.addEventListener("click", () => {
      const isPasswordVisible = passwordField.type === "text";
      passwordField.type = isPasswordVisible ? "password" : "text";
      toggleIcon.className = isPasswordVisible
        ? "fas fa-eye"
        : "fas fa-eye-slash";
    });

    wrapper.appendChild(toggleIcon);
  }

  const passwordField = document.getElementById("signin-password");
  addToggleIcon(passwordField);
});
