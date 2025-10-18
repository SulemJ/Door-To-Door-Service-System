class UserBookingsManager {
  constructor() {
    this.bookingsContainer = document.getElementById("bookingsList");
    this.currentUser = null; // Will hold the user data after fetching
  }

  async initialize() {
    try {
      this.currentUser = await this.getCurrentUser();
      if (!this.currentUser) {
        this.redirectToLogin("Please log in to view your bookings");
        return;
      }
      await this.loadBookings();
    } catch (error) {
      console.error("Error initializing the UserBookingsManager:", error);
      this.redirectToLogin("Unable to verify user. Please log in again.");
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch("/api/auth/current-user", {
        credentials: "include",
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error("User not logged in");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  redirectToLogin(message) {
    alert(message);
    window.location.href = "sign-in.html";
  }

  async loadBookings() {
    try {
      const response = await fetch(`/api/admin/bookings/${this.currentUser.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load bookings");
      }

      const bookings = await response.json();

      if (bookings.length === 0) {
        this.bookingsContainer.innerHTML = `
          <div class="no-bookings text-center">
              <p>You haven't made any bookings yet.</p>
              <a href="AllserviceProviders.html" class="btn btn-primary">Find Service Providers</a>
          </div>
        `;
        return;
      }

      this.bookingsContainer.innerHTML = bookings
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((booking) => this.createBookingCard(booking))
        .join("");

      document.querySelectorAll(".cancel-booking-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const bookingId = e.currentTarget.dataset.bookingId;
          this.cancelBooking(bookingId);
        });
      });
    } catch (error) {
      console.error("Error loading bookings:", error);
      alert("Failed to load bookings.");
    }
  }

  createBookingCard(booking) {
    return `
      <div class="booking-card ${booking.status}" id="booking-${booking.id}">
          <div class="booking-header">
              <h3>Profession: ${booking.service_type}</h3>
              <span class="status-badge ${booking.status}">${booking.status}</span>
          </div>
          <div class="booking-details">
              <p><strong>Service Provider Name:</strong> ${booking.provider_name}</p>
              <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${booking.time}</p>
              <p><strong>Description:</strong> ${booking.description}</p>
          </div>
          ${
            booking.status === "pending"
              ? `
              <div class="booking-actions">
                  <button class="btn btn-danger cancel-booking-btn" data-booking-id="${booking.id}">
                      Cancel Booking
                  </button>
              </div>
          `
              : ""
          }
      </div>
    `;
  }

  async cancelBooking(bookingId) {
    if (!bookingId) return;
  
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "DELETE",
          credentials: "include",
        });
  
        if (response.ok) {
          document.getElementById(`booking-${bookingId}`).remove();
          alert("Booking cancelled successfully");
          this.loadBookings();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        alert("Failed to cancel booking.");
      }
    }
  }
  
}

if (document.getElementById("bookingsList")) {
  document.addEventListener("DOMContentLoaded", () => {
    const userBookingsManager = new UserBookingsManager();
    userBookingsManager.initialize();
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
