document.addEventListener("DOMContentLoaded", () => {
  const serviceList = document.getElementById("service-list");

  // Service data for maintenance services
  const services = [
    {
      title: "Network Design and Planning",
      description:
        "Comprehensive assessment and custom network architecture tailored for efficiency and scalability",
      icon: "fas fa-network-wired",
    },
    {
      title: "Network Installation",
      description:
        "Expert installation of routers, switches, cabling, and wireless access points with structured cabling solutions.",
      icon: "fas fa-cogs",
    },
    {
      title: "Wireless Networking Solutions",
      description:
        "High-speed Wi-Fi networks optimized for coverage, reliability, and security.",
      icon: "fas fa-wifi",
    },
    {
      title: "Telecommunications Setup",
      description:
        "Installation and configuration of VoIP systems and seamless integration with IT infrastructure.",
      icon: "fas fa-phone",
    },
    {
      title: "Data Cabling",
      description:
        "Professional installation and organization of data cables to ensure high-speed connectivity and optimal network performance.",
      icon: "fas fa-network-wired",
    },
    {
      title: "Firewall Configuration",
      description:
        "Robust firewall setup and configuration to protect your network from unauthorized access, threats, and vulnerabilities.",
      icon: "fas fa-shield-alt",
    },
    {
      title: "VPN Setup",
      description:
        "Secure and reliable Virtual Private Network (VPN) setup to ensure privacy and secure remote access to your organization's network.",
      icon: "fas fa-lock",
    },
  ];

  // Function to render the services dynamically
  services.forEach((service) => {
    const col = document.createElement("div");
    col.className = "col-md-6 ";

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

  const testimonialsContainer = document.getElementById(
    "testimonials-container"
  );

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

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
      }
    });
  }, observerOptions);

  document
    .querySelectorAll(".service-card, .list-group-item, .testimonial-card")
    .forEach((el) => {
      observer.observe(el);
    });
});
