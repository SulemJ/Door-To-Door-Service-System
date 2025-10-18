document.addEventListener("DOMContentLoaded", () => {
  const serviceList = document.getElementById("service-list");

  // Service data for maintenance services
  const services = [
    {
      title: "Routine Inspections and Preventive Maintenance",
      description:
        "Regular checks of electrical systems to identify potential issues and prevent costly repairs.",
      icon: "fas fa-tools",
    },
    {
      title: "Troubleshooting and Repairs",
      description:
        "Fast and efficient diagnostics of electrical system faults, including wiring, circuit breakers, and components.",
      icon: "fas fa-search",
    },
    {
      title: "Circuit and Panel Upgrades",
      description:
        "Upgrading electrical panels and circuits to meet modern demands and ensure safety compliance.",
      icon: "fas fa-plug",
    },
    {
      title: "Safety Inspections and Compliance",
      description:
        "Inspection to meet local and national electrical codes, and installing protection devices for safety.",
      icon: "fas fa-shield-alt",
    },
    {
      title: "Lighting and Electrical Load Optimization",
      description:
        "Efficient lighting solutions and load balancing to ensure proper energy distribution and avoid overloads.",
      icon: "fas fa-lightbulb",
    },
    {
      title: "Power System Maintenance",
      description:
        "Maintaining backup power systems like UPS and generators to ensure uninterrupted power supply.",
      icon: "fas fa-bolt",
    },
  ];

  // Function to render the services dynamically
  services.forEach((service) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4";

    col.innerHTML = `
          <div class="card shadow-sm h-100">
              <div class="card-body d-flex align-items-start">
                  <div class="feature-icon me-3">
                      <i class="${service.icon}"></i>
                  </div>
                  <div>
                      <h5>${service.title}</h5>
                      <p>${service.description}</p>
                  </div>
              </div>
          </div>
      `;
    serviceList.appendChild(col);
  });

  //Testimonials section
  const testimonialsContainer = document.getElementById(
    "testimonials-container"
  );

  // Testimonials Data
  const testimonials = [
    {
      name: "Alice Johnson",
      review:
        "The wireless networking solutions are top-notch. Seamless setup and excellent support!",
    },
    {
      name: "Mark Spencer",
      review:
        "Their VoIP system setup significantly improved our communication infrastructure.",
    },
    {
      name: "Sandra White",
      review:
        "Efficient and reliable service. Highly recommend their structured cabling solutions.",
    },
  ];

  // Dynamically Render Testimonials
  testimonials.forEach((testimonial, index) => {
    const carouselItem = document.createElement("div");
    carouselItem.className = `carousel-item ${index === 0 ? "active" : ""}`; // Make the first item active

    carouselItem.innerHTML = `
          <div class="d-flex justify-content-center">
              <div class="card shadow-sm" style="max-width: 600px;">
                  <div class="card-body text-center">
                      <blockquote class="blockquote mb-3">
                          <p>${testimonial.review}</p>
                      </blockquote>
                      <footer class="blockquote-footer">${testimonial.name}</footer>
                  </div>
              </div>
          </div>
      `;
    testimonialsContainer.appendChild(carouselItem);
  });
});
