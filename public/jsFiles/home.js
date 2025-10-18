  
document.addEventListener("DOMContentLoaded", () => {
  // Load header and footer
  fetch("components/header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header").innerHTML = data;
      updateNavigation();
    });

  fetch("components/footer.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("footer").innerHTML = data;
    });
  document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true'; // or check a cookie/session
    if (isLoggedIn) {
      document.getElementById('dashboardNav').style.display = 'block';
    }
  });
      
 fetch("/api/auth/current-user")
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        document.getElementById('dashboard-link').style.display = 'inline-block';
      }
    });
  // Initialize variables
  let providers = [];
  let testimonials = [];
  let services = [
    {
      icon: "fas fa-network-wired",
      title: "Network Design & Planning",
      description:
        "Comprehensive network assessments and customized architecture for efficient, scalable, and secure systems.",
      link: "NetworkingS.html#design-planning",
    },
    {
      icon: "fas fa-wifi",
      title: "Wireless Networking Solutions",
      description:
        "High-speed Wi-Fi networks optimized for coverage, reliability, and security.",
      link: "NetworkingS.html#wireless-solutions",
    },

    {
      icon: "fas fa-bolt",
      title: "Power System Maintenance",
      description:
        "Maintaining backup power systems like UPS and generators to ensure uninterrupted power supply.",
      link: "MaintenanceS.html#power-maintenance",
    },
    {
      icon: "fas fa-search",
      title: "Troubleshooting and Repairs",
      description:
        "Fast and efficient diagnostics of electrical system faults, including wiring, circuit breakers, and components.",
      link: "MaintenanceS.html#troubleshooting",
    },
    {
      icon: "fas fa-lightbulb",
      title: "Lighting and Electrical Load Optimization",
      description:
        "Energy-efficient lighting solutions and optimization of electrical loads to reduce power consumption.",
      link: "MaintenanceS.html#lighting-and-electrical-load-optimization",
    },
    {
      icon: "fas fa-shield-alt",
      title: "Safety Inspections and Compliance",
      description:
        "Thorough safety inspections and compliance audits to ensure electrical systems meet industry standards.",
      link: "MaintenanceS.html#safety-inspections-and-compliance",
    },
    {
      icon: "fas fa-charging-station",
      title: "Circuit and Panel Upgrades",
      description:
        "Upgrading electrical circuits and panels to meet increased power demands and enhance safety.",
      link: "MaintenanceS.html#circuit-and-panel-upgrades",
    },
    {
      icon: "fas fa-tools",
      title: "Routine Inspections and Preventive Maintenance",
      description:
        "Scheduled inspections and maintenance to prevent equipment failures and ensure system reliability.",
      link: "MaintenanceS.html#routine-inspections-and-preventive-maintenance",
    },

    {
      icon: "fas fa-user-lock",
      title: "Firewall Configuration",
      description:
        "Customized firewall configurations to protect networks from unauthorized access and cyber threats.",
      link: "NetworkingS.html#firewall-configuration",
    },
    {
      icon: "fas fa-lock",
      title: "VPN Setup",
      description:
        "Secure VPN setup for remote access and data protection over public networks.",
      link: "NetworkingS.html#vpn-setup",
    },
    {
      icon: "fas fa-phone-alt",
      title: "Telecommunications Setup",
      description:
        "Installation and configuration of telecommunications systems for voice and data communication.",
      link: "NetworkingS.html#telecommunications-setup",
    },
    {
      icon: "fas fa-plug",
      title: "Data Cabling",
      description:
        "Structured cabling solutions for efficient data transmission and network connectivity.",
      link: "NetworkingS.html#data-cabling",
    },
    {
      icon: "fas fa-cogs",
      title: "Network Installation",
      description:
        "Expert installation of routers, switches, cabling, and wireless access points with structured cabling solutions.",
      link: "NetworkingS.html#system-installation",
    },
  ];

  // Initialize the page
  initializePage();

  async function initializePage() {
    await loadProviders();
    await loadTestimonials();
    renderServices();
    renderFeaturedProviders();
    renderTestimonials();
    initializeSearch();
  }

  // Function to handle the search
  function performSearch() {
    const query = document.getElementById("search").value.toLowerCase().trim();
    const resultsContainer = document.getElementById("search-results");

    // Clear previous results
    resultsContainer.innerHTML = "";

    // Filter services based on the search query
    const filteredServices = services.filter((service) =>
      service.title.toLowerCase().includes(query)
    );

    if (filteredServices.length === 0) {
      // If no matches found
      const noResult = document.createElement("li");
      noResult.classList.add("list-group-item", "text-danger");
      noResult.textContent = "No services found.";
      resultsContainer.appendChild(noResult);
    } else {
      // Display matching results
      filteredServices.forEach((service) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item");

        // Create clickable link for each result
        const link = document.createElement("a");
        link.href = service.link;
        link.textContent = service.title;
        link.classList.add("text-decoration-none");

        listItem.appendChild(link);
        resultsContainer.appendChild(listItem);
      });
    }
  }

  // Event Listener for Search Button
  document
    .getElementById("search-btn")
    .addEventListener("click", performSearch);

  // Optional: Add "Enter" key support for search
  document.getElementById("search").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      performSearch();
    }
  });

  // Load providers from localStorage
  async function loadProviders() {
    try {
      const response = await fetch('/api/admin/providers');
      if (response.ok) {
        providers = await response.json();
        // providers = providers.map((provider) => {
        //   if (provider.image) {
        //     provider.image = `data:image/jpeg;base64,${provider.image}`;
        //   }
        //   return provider;
        // });
  
        // displayProviders(providers);
        providers.sort((a, b) => b.rating - a.rating);
      return  providers.sort((a, b) => b.rating - a.rating);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch providers.');
    }
   // providers = JSON.parse(localStorage.getItem("providers")) || [];
    // Sort by rating
  }

  // Load testimonials
  async function loadTestimonials() {
    testimonials = JSON.parse(localStorage.getItem("testimonials")) || [
      {
        name: "Mohammed Ahmed",
        image: "images/testimonials/Mohammed Ahmed.webp",
        text: "The wireless networking solutions are top-notch. Seamless setup and excellent support!",
        rating: 5,
      },
      {
        name: "Desta Chewaka",
        image: "images/testimonials/Desta Chewaka.jpg",
        text: "Great platform for finding reliable service providers. Saved me lots of time!",
        rating: 5,
      },
      {
        name: "Mahder Abera",
        image: "images/testimonials/Mahder Abera.webp",
        text: "The booking process was smooth and the service provider was excellent.",
        rating: 4,
      },
    ];
  }

  // Render services section
  function renderServices() {
    const servicesGrid = document.querySelector(".services-grid");
    servicesGrid.innerHTML = services
      .slice(0, 4) // Get the first 4 items from the array

      .map(
        (service) => `
            <div class="service-card animate-fade-in">
                <div class="service-icon">
                    <i class="fas ${service.icon}"></i>
                </div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
            </div>
        `
      )
      .join("");
  }

  // Render featured providers
  function renderFeaturedProviders() {
    const providersSlider = document.querySelector(".providers-slider");
    const featuredProviders = providers.slice(0, 4); // Get top 4 providers

    providersSlider.innerHTML = `
            <div class="row">
                ${featuredProviders
                  .map(
                    (provider) => `
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="provider-card animate-fade-in">
                            <div class="provider-image">
                                <img src="${
                                  provider.image ||
                                  "images/default-provider.jpg"
                                }" 
                                     alt="${provider.name}">
                                <span class="rating-badge">
                                    <i class="fas fa-star"></i> ${provider.rating.toFixed(
                                      1
                                    )}
                                </span>
                            </div>
                            <div class="provider-info">
                                <h4>${provider.name}</h4>
                                <p>${provider.profession}</p>
                                <a href="GeneralSign-up.html?id=${provider.id}" 
                                   class="btn btn-outline-primary btn-sm">View Profile</a>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  // Render testimonials
  function renderTestimonials() {
    const testimonialsGrid = document.querySelector(".testimonials-grid");
    testimonialsGrid.innerHTML = testimonials
      .map(
        (testimonial) => `
            <div class="testimonial-card animate-fade-in">
                <div class="testimonial-content">
                    <div class="testimonial-rating">
                        ${generateStars(testimonial.rating)}
                    </div>
                    <p class="testimonial-text">${testimonial.text}</p>
                    <div class="testimonial-author">
                        <img class="testimonialimg" src="${
                          testimonial.image
                        }" alt="${testimonial.name}">
                        <h4>${testimonial.name}</h4>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Generate star rating
  function generateStars(rating) {
    return Array(5)
      .fill("")
      .map(
        (_, index) => `
            <i class="fas fa-star ${index < rating ? "active" : ""}"></i>
        `
      )
      .join("");
  }

  // Add scroll animations
  function addScrollAnimations() {
    const elements = document.querySelectorAll(".animate-fade-in");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((element) => observer.observe(element));
  }

  // Initialize scroll animations
  addScrollAnimations();
});
