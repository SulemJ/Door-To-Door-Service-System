document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  const registrationCode = document
    .getElementById("registrationCode")
    ;
  const username = document.getElementById("username");
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
  // if(password){
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
  // }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // const data = {
    //   name: username.value.trim(),
    //   password: password.value,
    //   registrationCode : registrationCode.value.trim(),
    //   confirmPassword :confirmPassword.value,
    // };
    // // Validate passwords match
    // if (password.value.trim() !== confirmPassword.value.trim()) {
    //   alert("Passwords do not match!");
    //   throw new Error("Passwords do not match!");
    // }

    // try {


      
    //   // Send registration data to the server
    //   const response = await fetch("/api/admin/register", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    //   });

    //   if (!response.ok) {
    //     const error = await response.json();
    //     throw new Error(error.message);
    //   }

    //   alert("Registration completed successfully! You can now sign in.");
    //   window.location.href = "sign-in.html";
    // } catch (error) {
    //   alert(error.message);
    // }
    try {
      const registrationCode = document
        .getElementById("registrationCode")
        .value.trim();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();

      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match!");
      }

      // submitButton.disabled = true;
      // submitButton.innerHTML =
      //   '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

      // Send registration data to the server
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationCode, username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      alert("Registration completed successfully! You can now sign in.");
      // window.location.href = "sign-in.html";
      window.location.href = "/ne";
    } catch (error) {
      alert(error.message);
    }
  });
});


