document.addEventListener("DOMContentLoaded", () => {
  // Load navbar content
  fetch("adminNavbar.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("adminNavbar").innerHTML = html;
      initializeNavbar();
    });

  function initializeNavbar() {
    const loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

    // Update admin name
    const adminNameElement = document.getElementById("adminName");
    if (adminNameElement && loggedInUser) {
      adminNameElement.textContent = loggedInUser.username;
    }

  
// logging out
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" }); // Logout endpoint
    if (response.ok) {
      // Redirect to the login page or homepage
      window.location.href = "index.html";
    } else {
      const error = await response.json();
      alert(`Logout failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Error logging out:", error);
    alert("An error occurred while logging out. Please try again.");
  }
});


    // Handle add admin form submission
    const addAdminForm = document.getElementById("addAdminForm");
    if (addAdminForm) {
      addAdminForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const newAdmin = {
          id: Date.now(),
          username: document.getElementById("adminUsername").value.trim(),
          password: document.getElementById("adminPassword").value.trim(),
          email: document.getElementById("adminEmail").value.trim(),
          role: "admin",
        };

        // Add to users array
        const users = JSON.parse(localStorage.getItem("users")) || [];
        users.push(newAdmin);
        localStorage.setItem("users", JSON.stringify(users));

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("addAdminModal")
        );
        modal.hide();
        addAdminForm.reset();

        alert("New admin added successfully!");
      });
    }

    // Highlight current page in navbar
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
      }
    });
  }
});
