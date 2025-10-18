  const workExperienceList = document.getElementById("workExperienceList");
  const addExperienceBtn = document.getElementById("addExperience");
 
  // Add work experience field
  function addExperienceField(value = "") {
    const div = document.createElement("div");
    div.className = "work-experience-item d-flex";
    div.innerHTML = `
      <input type="text" class="form-control" value="${value}" placeholder="Enter work experience">
      <button type="button" class="btn btn-danger remove-experience">×</button>
    `;
    workExperienceList.appendChild(div);

    div.querySelector(".remove-experience").addEventListener("click", () => {
      div.remove();
    });
  }

  addExperienceField();

  addExperienceBtn.addEventListener("click", () => {
    addExperienceField();
  });

      const workExperience = Array.from(
        workExperienceList.querySelectorAll("input")
      )
const nameInput = document.getElementById('name');
const professionInput = document.getElementById('profession');
const ratingInput = document.getElementById('rating');
const availabilityInput = document.getElementById('availability');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const personalInfoInput = document.getElementById('personal-Info');
const workExperienceInput = document.getElementById('workExperienceList');


const imageInput = document.getElementById('image');
const adminForm = document.getElementById('addProviderForm');

adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log('Form submission prevented');

  const formData = new FormData(); // Create FormData instance
  formData.append('image', imageInput.files[0]); // Append the image file
  formData.append('name', nameInput.value);
  formData.append('profession', professionInput.value);
  formData.append('rating', parseInt(ratingInput.value));
  formData.append('availability', 'unavailable');
  // formData.append('availability', availabilityInput.value);
  formData.append('email', emailInput.value);
  formData.append('phone', phoneInput.value);
  formData.append('address', addressInput.value);
  formData.append('personalInfo', personalInfoInput.value);
  formData.append('workExperience', JSON.stringify(workExperience)); // JSON as string
  formData.append('registrationCode', generateRegistrationCode());
  formData.append('registered', false);

  try {
    const response = await fetch('/api/admin/addProvider', {
      method: 'POST',
      body:  formData, // Send FormData (no Content-Type header needed)
    });

    if (response.ok) {
      const result = await response.json();
      alert(`Provider added successfully. Registration code: ${result.registrationCode}`);
      adminForm.reset();
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to add provider.');
  }
});
function generateRegistrationCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
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
