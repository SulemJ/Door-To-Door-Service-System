document.addEventListener("DOMContentLoaded", async () => {
  const categoriesRes = await fetch("/api/admin/categories");
  const categories = await categoriesRes.json();

  const servicesRes = await fetch("/api/admin/services");
  let services = await servicesRes.json();

  const dropdown = document.getElementById("category-dropdown");
  const servicesGrid = document.getElementById("services-grid");
  const searchInput = document.getElementById("search");

  // Pagination variables
  const itemsPerPage = 6;
  let currentPage = 1;

  // Populate dropdown
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.name;
    option.textContent = cat.name;
    dropdown.appendChild(option);
  });

  const displayServices = (filteredServices) => {
    servicesGrid.innerHTML = "";

    // Group by category
    const categoryMap = {};
    filteredServices.forEach(service => {
      if (!categoryMap[service.category]) {
        categoryMap[service.category] = new Set();
      }
      categoryMap[service.category].add(service.subcategory);
    });

    const allCategories = Object.entries(categoryMap);
    const totalPages = Math.ceil(allCategories.length / itemsPerPage);

    // Handle pagination slicing
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCategories = allCategories.slice(startIndex, startIndex + itemsPerPage);

    for (const [categoryName, subcategoriesSet] of paginatedCategories) {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-4 mb-4 d-flex align-items-stretch";

      const subcategoriesList = Array.from(subcategoriesSet)
        .map(sub => `<li class="list-group-item border-0 ps-0">${sub}</li>`)
        .join("");

      col.innerHTML = `
        <div class="card shadow-sm w-100 h-100 border-0 service-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center mb-3">
              <div class="rounded-circle bg-opacity-10 d-flex align-items-center justify-content-center me-3" style="width:48px;height:48px;">
                <i class="fas fa-tools fa-lg"></i>
              </div>
              <h3 class="card-title align-items-center mb-0">${categoryName}</h3>
            </div>
            <ul class="list-group list-group-flush flex-grow-1">
              ${subcategoriesList}
            </ul>
          </div>
        </div>
      `;
      servicesGrid.appendChild(col);
    }

    // Update pagination UI
    document.getElementById("page-number").textContent = currentPage;
    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages || totalPages === 0;
  };

  // Initial load
  displayServices(services);

  // Pagination buttons
  document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      displayServices(services);
    }
  });

  document.getElementById("next-page").addEventListener("click", () => {
    currentPage++;
    displayServices(services);
  });

  // Category dropdown filter
  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    const filtered = selected === "all"
      ? services
      : services.filter(s => s.category === selected);
    currentPage = 1; // Reset to page 1
    displayServices(filtered);
  });

  // Search filter
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(query)
      );
      currentPage = 1; // Reset to page 1
      displayServices(filtered);
    });
  }
});


