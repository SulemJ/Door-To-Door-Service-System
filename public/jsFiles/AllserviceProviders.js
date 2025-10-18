document.addEventListener("DOMContentLoaded", () => {
    // Load header and footer
    fetch("components/header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header").innerHTML = data;
      updateNavigation();
    });
  console.log("AllserviceProviders.js loaded");

let selectedProfession = 'All';
const searchInput = document.querySelector(".search-box");
const professionFilter = document.getElementById("profession-filter");

  // const searchInput = document.querySelector(".search-box input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const providerList = document.getElementById("provider-list");
  let providers = []; // Store all providers
  let currentFilter = "All"; // Track current filter


  // async function loadProviders() {
  //   try {
  //     const response = await fetch('/api/admin/providers');
  //     if (response.ok) {
  //       const providers = await response.json();

  //       displayProviders(providers);
  //     } else {
  //       const error = await response.json();
  //       alert(`Error: ${error.message}`);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert('Failed to fetch providers.');
  //   }
  // }


async function loadProviders() {
  try {
    const response = await fetch('/api/admin/providers');
    if (response.ok) {
      providers = await response.json();

      renderProfessionFilters(); // 👈 Generate filters
      applyFilters();            // 👈 Display based on filters
      renderPagination();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to fetch providers.');
  }
}


function renderProfessionFilters() {
  const professions = ['All', ...new Set(providers.map(p => p.profession))];
  professionFilter.innerHTML = '';

  professions.forEach(prof => {
    const btn = document.createElement('button');
    btn.className = `list-group-item list-group-item-action ${prof === selectedProfession ? 'active' : ''}`;
    btn.textContent = prof;
    btn.onclick = () => {
      selectedProfession = prof;
      document.querySelectorAll("#profession-filter button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    };
    professionFilter.appendChild(btn);
  });
}
function applyFilters() {
  const searchText = searchInput.value.trim().toLowerCase();

  const filtered = providers.filter(p => {
    const matchesName = p.name.toLowerCase().includes(searchText);
    const matchesProfession = selectedProfession === 'All' || p.profession === selectedProfession;
    return matchesName && matchesProfession;
  });

  displayProviders(filtered);
}
searchInput.addEventListener('input', debounce(applyFilters, 300));

  // Display providers based on search and filter
  function displayProviders(filteredProviders) {
    providerList.innerHTML = ""; // Clear current list

    if (filteredProviders.length === 0) {
      providerList.innerHTML = `
        <div class="col-12 text-center">
          <div class="no-results">
            <i class="fas fa-search mb-3"></i>
            <h3>No providers found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        </div>`;
      return;
    }

    filteredProviders.forEach((provider) => {
      const card = createProviderCard(provider);
      providerList.appendChild(card);
    });
  }
// Add these variables at the top
// let providers = [];
let currentPage = 1;
const perPage = 6;

// Update loadProviders to set global providers and call renderPage
async function loadProviders() {
  try {
    const response = await fetch('/api/admin/providersProf');
    if (response.ok) {
      providers = await response.json();
      renderPage();
      renderPagination();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to fetch providers.');
  }
}

// Render current page of providers
function renderPage() {
  const start = (currentPage - 1) * perPage;
  displayProviders(providers.slice(start, start + perPage));
}

// Render pagination controls
function renderPagination() {
  const totalPages = Math.ceil(providers.length / perPage);
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn btn btn-sm ${i === currentPage ? 'btn-dark' : 'btn-outline-dark'}" data-page="${i}">${i}</button> `;
  }
  let pagDiv = document.getElementById('providers-pagination');
  if (!pagDiv) {
    pagDiv = document.createElement('div');
    pagDiv.id = 'providers-pagination';
    pagDiv.className = 'text-center my-3';
    providerList.parentNode.appendChild(pagDiv);
  }
  pagDiv.innerHTML = html;
  pagDiv.querySelectorAll('.page-btn').forEach(btn => {
    btn.onclick = () => {
      currentPage = parseInt(btn.getAttribute('data-page'));
      renderPage();
      renderPagination();
    };
  });
}



 async function createProviderCard(provider) {

     const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    const availabilityClass =
      provider.availability === "available" ? "text-success" : "text-danger";

col.innerHTML = `
  <div class="provider-card">
    <img src="${provider.image || 'uploads/default.jpg'}"
         alt="${provider.name}" 
         class="provider-image">
    <div class="provider-info">
      <h3 class="provider-name">${provider.name}</h3>
      <p class="mb-1">
        <strong>Profession:</strong>
        <span style="color: #111;">${(provider.professions || []).join(', ')}</span>
      </p>
      <button class="view-profile-btn" 
              data-provider-id="${provider.id}">
        View Profile
      </button>
    </div>
  </div>
`;
return col;
  }

  

  // Updated View Profile Logic
  function viewProfile(providerId) {
   window.location.href =  `/view-provider/${providerId}`;

  }

  // Attach event to dynamically generated buttons
  document
    .getElementById("provider-list")
    .addEventListener("click", (event) => {
      if (event.target.classList.contains("view-profile-btn")) {
        const providerId = event.target.getAttribute("data-provider-id");
        viewProfile(providerId);
      }
    });

  // Update "View Profile" button in createProviderCard
  function createProviderCard(provider) {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";


    col.innerHTML = `
    <div class="provider-card">
      <img src="${provider.image || 'uploads/default.jpg'}"
           alt="${provider.name}" 
           class="provider-image">
      <div class="provider-info">
        <h3 class="provider-name">${provider.name}</h3>
        <p class="provider-profession">   ${(provider.professions || []).join(', ')}</p>
        <button class="view-profile-btn" 
                data-provider-id="${provider.id}">
          View Profile
        </button>
      </div>
    </div>
  `;
    return col;
  }


  // Add debounce to search for better performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initial load
  loadProviders();

  const handleSignInSuccess = () => {
    const redirectPath = sessionStorage.getItem("redirectAfterSignIn");
    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterSignIn");
      router.push(redirectPath);
    } else {
      router.push("/dashboard"); // Default redirect
    }
  };

  });
