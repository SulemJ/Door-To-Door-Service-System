

const providerList = document.getElementById('provider-list');

let allProviders = [];
let currentPage = 1;
const providersPerPage = 6;

// Fetch and display providers
async function fetchProviders() {
  try {
    const response = await fetch('/api/admin/allProviders');
    const booking = await fetch('/api/admin/allBookings');
    if (response.ok) {
      allProviders = await response.json();
      displayProviders(getPaginatedProviders());
      renderPagination();
      document.getElementById("totalProviders").textContent = allProviders.length;
      document.getElementById("activeProviders").textContent = allProviders.filter(
        (p) => p.availability.trim() == "available"
      ).length;
      document.getElementById("inactiveProviders").textContent = allProviders.filter(
        (p) => p.availability.trim() == "unavailable"
      ).length;

      // Search functionality
      document.getElementById("searchProvider").addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProviders = allProviders.filter(
          (provider) =>
            provider.name.toLowerCase().includes(searchTerm) ||
            provider.profession.toLowerCase().includes(searchTerm) ||
            provider.email.toLowerCase().includes(searchTerm)
        );
        displayProviders(filteredProviders.slice(0, providersPerPage));
        renderPagination(filteredProviders);
      });
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
    if (booking.ok) {
      const bookings = await booking.json();
      document.getElementById("totalBookings").textContent = bookings.length;
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to fetch providers.');
  }
}

// Get providers for current page
function getPaginatedProviders(filtered = null) {
  const providers = filtered || allProviders;
  const start = (currentPage - 1) * providersPerPage;
  return providers.slice(start, start + providersPerPage);
}

// Render providers list
function displayProviders(providers) {
  const providersList = document.getElementById("providersList");
  providersList.innerHTML = "";

  if (providers.length === 0) {
    providersList.innerHTML = `<div class="col-12 text-center text-muted">No providers found.</div>`;
    return;
  }

  providers.forEach((provider) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4 mb-4";
    card.innerHTML = `
      <div class="card provider-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title">${provider.name}</h5>
            <span class="badge ${
              `${provider.availability}` == "unavailable"
                ? "bg-danger"
                : "bg-success"
            }">
              ${provider.availability}
            </span>
          </div>
          <p class="card-text">
            <strong>Profession:</strong> ${provider.profession}<br>
            <strong>Email:</strong> ${provider.email}<br>
            <strong>Phone:</strong> ${provider.contact_phone}
          </p>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary view-schedule-btn" data-id="${
              provider.id
            }"  onclick="getSchedule(${provider.id})">
              <i class="fas btn-sm fa-calendar"></i> View Schedule
            </button>
            <button class="btn btn-sm btn-${
              provider.availability == "unavailable"
                ? "warning"
                : "success"
            } toggle-status" data-id="${provider.id}" onclick="updateProviderStatus(${provider.id}, '${provider.availability}')">
              <i class="fas btn-sm fa-toggle-on"></i> Toggle Status
            </button>
            <button class="btn btn-sm btn-danger delete-provider" onclick="deleteProvider(${provider.id})" data-id="${
              provider.id
            }">
              <i class="fas btn-sm fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
    providersList.appendChild(card);
  });
}

// Render pagination controls
function renderPagination(filtered = null) {
  let providers = filtered || allProviders;
  const totalPages = Math.ceil(providers.length / providersPerPage);

  // Remove old pagination if exists
  let oldPagination = document.getElementById('providers-pagination');
  if (oldPagination) oldPagination.remove();

  if (totalPages <= 1) return;

  const pagination = document.createElement('nav');
  pagination.id = 'providers-pagination';
  pagination.setAttribute('aria-label', 'Providers pagination');
  pagination.innerHTML = `
    <ul class="pagination justify-content-center mt-3">
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo; Prev</a>
      </li>
      ${Array.from({ length: totalPages }, (_, i) => `
        <li class="page-item ${currentPage === i + 1 ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
        </li>
      `).join('')}
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next &raquo;</a>
      </li>
    </ul>
  `;

  // Insert after providers list
  document.getElementById('providersList').parentNode.appendChild(pagination);

  // Add event listeners
  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = parseInt(this.getAttribute('data-page'));
      if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        displayProviders(getPaginatedProviders(filtered));
        renderPagination(filtered);
      }
    });
  });
}



async function updateProviderStatus(id, avail) {
  function getStatus() {
     let  status;
  
  if(avail == "available"){
    status = 'unavailable'
  }else{
    status = 'available'}
 return status
  }
 
  try {
    const status = await getStatus();
    const response = await fetch(`/api/admin/providers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: status }),
    });

    if (response.ok) {
      alert('Provider status updated.');
      fetchProviders();
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to update provider status.');
  }
}

// Delete provider
async function deleteProvider(id) {
  try {
    const response = await fetch(`/api/admin/providers/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Provider deleted successfully.');
      fetchProviders();
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  } catch (err) {
    console.error(err);
    alert('Failed to delete provider.');
  }
}


function getSchedule(providerId) {

  window.location.href = `allProviderProfile.html?id=${providerId}`;
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

// Initial load
fetchProviders();
