class BookingsManager {
  constructor() {
    this.bookings = [];
    this.filteredBookings = [];
    this.statusFilter = "all";
    this.dateFilter = "";

    // Initialize elements
    this.tableBody = document.getElementById("bookingsTableBody");
    this.statusFilterEl = document.getElementById("bookingStatusFilter");
    this.dateFilterEl = document.getElementById("bookingDateFilter");

    // Bind event listeners
    this.statusFilterEl.addEventListener("change", () => this.filterBookings());
    this.dateFilterEl.addEventListener("change", () => this.filterBookings());
  }

  async initialize() {
    await this.loadBookings();
    this.filterBookings();
    this.render();
  }

  async loadBookings() {
    const providerId = JSON.parse(sessionStorage.getItem("loggedInUser")).id;
    this.bookings =
      JSON.parse(localStorage.getItem(`bookings_${providerId}`)) || [];

    // Load client details for each booking
    const users = JSON.parse(localStorage.getItem("users")) || [];
    this.bookings = this.bookings.map((booking) => ({
      ...booking,
      client: users.find((user) => user.id === booking.userId) || {
        name: "Unknown Client",
      },
    }));
  }

  filterBookings() {
    this.statusFilter = this.statusFilterEl.value;
    this.dateFilter = this.dateFilterEl.value;

    this.filteredBookings = this.bookings.filter((booking) => {
      const matchesStatus =
        this.statusFilter === "all" || booking.status === this.statusFilter;
      const matchesDate = !this.dateFilter || booking.date === this.dateFilter;
      return matchesStatus && matchesDate;
    });

    this.render();
  }

  render() {
    this.tableBody.innerHTML = this.filteredBookings
      .map(
        (booking) => `
            <tr>
                <td>
                    <div class="booking-client">
                        <img src="${
                          booking.client.image || "images/default-avatar.jpg"
                        }" 
                             alt="${booking.client.name}" 
                             class="client-avatar">
                        <div>
                            <div class="fw-bold">${booking.client.name}</div>
                            <small class="text-muted">${
                              booking.client.email
                            }</small>
                        </div>
                    </div>
                </td>
                <td>${booking.serviceType}</td>
                <td>
                    <div>${this.formatDate(booking.date)}</div>
                    <small class="text-muted">${booking.time}</small>
                </td>
                <td>${booking.location}</td>
                <td>
                    <span class="booking-status-badge status-${booking.status.toLowerCase()}">
                        ${booking.status}
                    </span>
                </td>
                <td>
                    ${this.getActionButtons(booking)}
                </td>
            </tr>
        `
      )
      .join("");

    // Add event listeners for action buttons
    this.addActionListeners();
  }

  getActionButtons(booking) {
    switch (booking.status) {
      case "Pending":
        return `
                    <button class="btn btn-sm btn-success me-2" 
                            onclick="bookingsManager.confirmBooking(${booking.id})">
                        Confirm
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="bookingsManager.rejectBooking(${booking.id})">
                        Reject
                    </button>
                `;
      case "Confirmed":
        return `
                    <button class="btn btn-sm btn-primary me-2" 
                            onclick="bookingsManager.completeBooking(${booking.id})">
                        Complete
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="bookingsManager.cancelBooking(${booking.id})">
                        Cancel
                    </button>
                `;
      case "Completed":
        return `
                    <button class="btn btn-sm btn-secondary" disabled>
                        Completed
                    </button>
                `;
      default:
        return `
                    <button class="btn btn-sm btn-secondary" disabled>
                        ${booking.status}
                    </button>
                `;
    }
  }

  async updateBookingStatus(bookingId, newStatus) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    booking.status = newStatus;
    booking.updatedAt = new Date().toISOString();

    // Update in localStorage
    const providerId = JSON.parse(sessionStorage.getItem("loggedInUser")).id;
    localStorage.setItem(
      `bookings_${providerId}`,
      JSON.stringify(this.bookings)
    );

    // Update client's booking status
    const userBookings =
      JSON.parse(localStorage.getItem(`userBookings_${booking.userId}`)) || [];
    const userBookingIndex = userBookings.findIndex((b) => b.id === bookingId);
    if (userBookingIndex !== -1) {
      userBookings[userBookingIndex].status = newStatus;
      localStorage.setItem(
        `userBookings_${booking.userId}`,
        JSON.stringify(userBookings)
      );
    }

    // Refresh the view
    this.filterBookings();
  }

  confirmBooking(bookingId) {
    this.updateBookingStatus(bookingId, "Confirmed");
  }

  rejectBooking(bookingId) {
    this.updateBookingStatus(bookingId, "Rejected");
  }

  completeBooking(bookingId) {
    this.updateBookingStatus(bookingId, "Completed");
  }

  cancelBooking(bookingId) {
    this.updateBookingStatus(bookingId, "Cancelled");
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  addActionListeners() {
    // Add any additional event listeners for the booking actions
  }
}

// Initialize bookings manager
const bookingsManager = new BookingsManager();
document.addEventListener("DOMContentLoaded", () =>
  bookingsManager.initialize()
);
