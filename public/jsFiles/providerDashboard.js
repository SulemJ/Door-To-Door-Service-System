document.addEventListener("DOMContentLoaded", () => {
  // Initialize Charts
    // Check for sessionStorage or token (based on your implementation)
//  const response =  fetch("/api/auth/current-user"); // or localStorage.getItem("token")

//   if (!response.ok) {
//     // Not signed in, redirect
//     window.location.href = "/ne";
//   }
  let bookingTrendsChart;
  let serviceDistributionChart;
  let providerId;
  // Get logged-in provider details from session
  async function getCurrentUser() {
    try {
      const response = await fetch("/api/auth/current-user", {
        credentials: "include",
      });

      if (response.ok) {
        // console.log(response.json());
        return await response.json();
      } else {
        throw new Error("User not logged in");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  document.addEventListener("scroll", () => {
    const sections = document.querySelectorAll(".dashboard-section");
    const navLinks = document.querySelectorAll(".sidebar-nav .nav-item");
  
    let currentSectionId = "";
  
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 50) {
        currentSectionId = section.getAttribute("id");
      }
    });
  
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${currentSectionId}`);
    });
  });
  // document.querySelectorAll('.sidebar-nav a').forEach(link => {
  //   link.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     const targetId = link.getAttribute('href').substring(1);
  //     const targetSection = document.getElementById(targetId);
  //     targetSection.scrollIntoView({ behavior: 'smooth' });
  //   });
  // });
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // else: let normal navigation happen for real URLs like /allJobs
  });
});

  // Initialize the dashboard after getting user details
  async function init() {
    const user = await getCurrentUser();
    if (!user) {
      window.location.hostname = "/ne";
      return;
    }
    providerId = user.id;
    initializeDashboard();
  }

  // Start initialization
  init();

  function initializeDashboard() {
    loadProviderData();
    initializeOverviewSection();
    initializeBookingsSection();
    initializeScheduleSection();
    // initializeReviewsSection();
    initializeProfileSection();
    setupEventListeners();
  }

  // Load provider data from PostgreSQL
  async function loadProviderData() {
    // console.log('Loading provider data for ID:', providerId);
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch provider data');
      }

      const provider = await response.json();

      if (provider) {
        // Update all provider-related elements
        const elements = {
          "providerName": provider.name || "",
          "providerProfession": provider.profession || "",
          "profileFullName": provider.name || "",
          "profileProfessionInput": provider.profession || "",
          "profileName": provider.name || "",
          "profileProfession": provider.profession || "",
        };

        for (const [id, value] of Object.entries(elements)) {
          const element = document.getElementById(id);
          if (element) {
            if (element.tagName === "INPUT") {
              element.value = value;
            } else {
              element.textContent = value;
            }
          }
        }

        // Handle avatar separately
        const avatarElement = document.getElementById("providerAvatar");
        if (avatarElement) {
          avatarElement.src = provider.image || "uploads/default.jpg";
        }
      }
      return provider;
    } catch (error) {
      console.error('Error loading provider data:', error);
      // Show error message to user
      alert('Failed to load provider data. Please refresh the page.');
    }
  }
let numBooking;
  // Load bookings from PostgreSQL with proper error handling
  async function loadBookings() {
    try {
      const response = await fetch(`/api/admin/provider-bookings/${providerId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const providerBookings = await response.json();
      const tableBody = document.getElementById("bookingsTableBody");
      
      if (!tableBody) {
        console.error('Bookings table body not found');
        return;
      }

      tableBody.innerHTML = "";
      // numBooking = providerBookings.length;
      // console.log(providerBookings);
      providerBookings.forEach((booking) => {
        const row = document.createElement("tr");
        const bookingDate = new Date(booking.date);
        const formattedDate = isNaN(bookingDate) ? 'Invalid Date' : bookingDate.toLocaleString();
        
        row.innerHTML = `
          <td>${booking.user_name || 'N/A'}</td>
          <td>${booking.service_type || 'N/A'}</td>
          <td>${formattedDate}</td>
          <td>${booking.description || 'N/A'}</td>
          <td><span class="badge bg-${getStatusColor(booking.status)}">${booking.status || 'N/A'}</span></td>
          <td>
            ${booking.status === 'pending' ? `
              <button class="btn btn-sm btn-success confirm-booking" data-booking-id="${booking.id}">
                <i class="fas fa-check"></i>
              </button>
            ` : ''}
            ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
              <button class="btn btn-sm btn-danger cancel-booking" data-booking-id="${booking.id}">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Add event listeners to the newly created buttons
      document.querySelectorAll('.confirm-booking').forEach(button => {
        button.addEventListener('click', () => {
          const bookingId = button.getAttribute('data-booking-id');
          updateBookingStatus(bookingId, 'confirmed');
        });
      });

      document.querySelectorAll('.cancel-booking').forEach(button => {
        button.addEventListener('click', () => {
          const bookingId = button.getAttribute('data-booking-id');
          updateBookingStatus(bookingId, 'cancelled');
        });
      });
      return providerBookings;
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Failed to load bookings. Please refresh the page.');
    }
  }

  // Save profile changes with proper validation and error handling
  async function saveProfile() {
    const fullName = document.getElementById("profileFullName")?.value.trim();
    const profession = document.getElementById("profileProfessionInput")?.value.trim();

    if (!fullName || !profession) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          profession: profession
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update UI
      await loadProviderData(); // Reload all provider data
      alert("Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      alert("Failed to update profile. Please try again.");
    }
  }

  // Update booking status in PostgreSQL
  async function updateBookingStatus(bookingId, status) {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      await loadBookings(); // Refresh bookings list
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert("Failed to update booking status. Please try again.");
    }

  }

  //  overview initialization
  function initializeOverviewSection() {
 

    // Load statistics
    updateDashboardStats();


  }



 async function updateDashboardStats(period = "today") {
    // Simulate fetching statistics based on period
    const availabilityToggle = document.getElementById("availabilityToggle");
    const availabilityStatus = document.getElementById("availabilityStatus");
    
    const bookings = await loadBookings();
    let clients = Object.keys(bookings.reduce((r,{user_id}) => (r[user_id]='', r) , {}))
    let n = clients.length;
    const provider = await loadProviderData();
    let l= bookings.length;
    document.getElementById("totalBookings").textContent =l ;
    document.getElementById("profileTotalBookings").textContent =l ;
    
    const isAvailable = provider.availability === "available";
    availabilityToggle.checked = isAvailable;
    availabilityStatus.textContent = provider.availability;
    let r = provider.rating;
    console.log(provider);
    console.log(r);

    document.getElementById("totalClients").textContent = n;
  }




  //  bookings initialization
  function initializeBookingsSection() {
    loadBookings();
    // Add event listeners for booking filters if any
    const statusFilter = document.getElementById("bookingStatusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", loadBookings);
    }
  }

  // Helper function for status colors
  function getStatusColor(status) {
    const colors = {
      pending: "warning",
      confirmed: "success",
      cancelled: "danger",
      completed: "info",
    };
    return colors[status.toLowerCase()] || "secondary";
  }

  // Calendar initialization function 
  function initializeScheduleSection() {
    console.log("Initializing schedule section...");
  
    const calendarEl = document.getElementById("providerCalendar");
    if (!calendarEl) {
      console.error("Calendar element not found!");
      return;
    }
  
  
    async function fetchEvents() {
      try {
        const response = await fetch(`/api/admin/events/${providerId}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        return await response.json();
      } catch (error) {
        console.error("Error fetching events:", error);
        return [];
      }
    }
  
    async function saveEvent(eventData) {
      try {
        const response = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });
        if (!response.ok) throw new Error("Failed to save event");
        return await response.json();
      } catch (error) {
        console.error("Error saving event:", error);
      }
    }
  
    async function deleteEvent(eventId) {
      try {
        const response = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete event");
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
    fetchEvents().then((existingEvents) => {
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "timeGridWeek",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        },
        slotMinTime: "08:00:00",
        slotMaxTime: "20:00:00",
        allDaySlot: false,
        slotDuration: "01:00:00",
        editable: true,
        selectable: true,
        events: existingEvents,
        height: "auto",
        expandRows: true,
        stickyHeaderDates: true,
        dayMaxEvents: true,
        select: async function (info) {
          const status = prompt(
            "Enter availability status (Available/Unavailable):",
            "Available"
          );
          if (status) {
            const event = {
              title: status,
              start: info.startStr,
              end: info.endStr,
              providerId: providerId,
              status: status.toLowerCase(),
              backgroundColor:
                status.toLowerCase() === "available" ? "#28a745" : "#dc3545",
              borderColor:
                status.toLowerCase() === "available" ? "#28a745" : "#dc3545",
            };
  
            const savedEvent = await saveEvent(event);
            calendar.addEvent(savedEvent);
          }
          calendar.unselect();
        },
        eventClick: async function (info) {
          if (confirm("Do you want to delete this time slot?")) {
            await deleteEvent(info.event.id);
            info.event.remove();
          }
        },
      });
  
      calendar.render();
      console.log("Calendar rendered successfully");
    });
  }
  
  
  
  
  
  // Helper functions
  function generateStars(rating) {
    return Array(5)
      .fill(0)
      .map(
        (_, i) =>
          `<i class="fas fa-star ${
            i < rating ? "text-warning" : "text-muted"
          }"></i>`
      )
      .join("");
  }
  //profile initialization
  function initializeProfileSection() {
    document
      .getElementById("saveProfileBtn")
      .addEventListener("click", saveProfile);


    loadProfileData();
  }

  async function loadProfileData() {
    const provider = await loadProviderData();

    // if (loggedInUser) {
      document.getElementById("profileFullName").value =
        provider.name || "";
        document.getElementById("profileProfessionInput").value =
        provider.profession || ""; 
        document.getElementById("profileAvatar").src =
        provider.image || "uploads/default.jpg";
      document.getElementById("profileName").textContent =
        provider.name || "";
      document.getElementById("profileProfession").textContent =
        provider.profession || "";
 
  }


  function setupEventListeners() {
    // Setup navigation event listeners
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        showSection(section);
      });
    });

    // Setup other event listeners as needed
    if (document.getElementById("availabilityToggle")) {
      document
        .getElementById("availabilityToggle")
        .addEventListener("change", (e) => {
          updateAvailability(e.target.checked);
        });
    }
  }

  function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".dashboard-section").forEach((section) => {
      section.style.display = "none";
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
      selectedSection.style.display = "block";
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
    });
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) {
      activeNav.classList.add("active");
    }
  }

  function updateAvailability(isAvailable) {
    const providers = JSON.parse(localStorage.getItem("providers")) || [];
    const providerIndex = providers.findIndex((p) => p.id === providerId);

    if (providerIndex !== -1) {
      providers[providerIndex].availability = isAvailable
        ? "available"
        : "unavailable";
      localStorage.setItem("providers", JSON.stringify(providers));

      // Update UI
      if (document.getElementById("availabilityStatus")) {
        document.getElementById("availabilityStatus").textContent = isAvailable
          ? "available"
          : "unavailable";
      }
    }
  }


  // Make updateBookingStatus globally accessible
  window.updateBookingStatus = async function(bookingId, status) {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      await loadBookings(); // Refresh bookings list
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert("Failed to update booking status. Please try again.");
    }
  }

  // Make saveProfile globally accessible and update event listener
  window.saveProfile = async function() {
    const fullName = document.getElementById("profileFullName")?.value.trim();
    const profession = document.getElementById("profileProfessionInput")?.value.trim();

    if (!fullName || !profession) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          profession: profession
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await loadProviderData(); // Reload all provider data
      alert("Profile updated successfully!");
    } catch (error) {
      console.error('Error saving profile:', error);
      alert("Failed to update profile. Please try again.");
    }
  }

  // Add event listener for save profile button
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", saveProfile);
  }

  // Add event listener for availability toggle
  const availabilityToggle = document.getElementById("availabilityToggle");
  if (availabilityToggle) {
    availabilityToggle.addEventListener("change", async (e) => {
      const status = e.target.checked ? "available" : "unavailable";
      try {
        const response = await fetch(`/api/admin/providers/${providerId}/status`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ availability: status })
        });

        if (!response.ok) {
          throw new Error('Failed to update availability');
        }

        document.getElementById("availabilityStatus").textContent = status;
      } catch (error) {
        console.error('Error updating availability:', error);
        alert("Failed to update availability status.");
        e.target.checked = !e.target.checked; // Revert the toggle
      }
    });
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
  
});