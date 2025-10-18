class BookingManager {
    constructor() {
        this.form = document.getElementById('bookingForm');

        // Get providerId from URL if it exists
        const urlParams = new URLSearchParams(window.location.search);
        this.preSelectedProviderId = urlParams.get("providerId");

        if (!this.preSelectedProviderId) {
            alert('No provider selected');
            window.location.href = 'AllserviceProviders.html';
            return;
        }
    }

    async initialize() {
        try {
            // Fetch provider details from the server
            this.provider = await this.fetchProviderDetails(this.preSelectedProviderId);

            if (!this.provider) {
                alert('Provider not found');
                window.location.href = 'AllserviceProviders.html';
                return;
            }

            // Display provider name in the form header
            const formHeader = document.querySelector('.booking-form-container h2');
            formHeader.textContent = `Book Service with ${this.provider.name}`;

            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing BookingManager:', error);
            alert('Failed to load provider details.');
        }
    }

    async fetchProviderDetails(providerId) {
        try {
            const response = await fetch(`/api/admin/providers/${providerId}`);
            if (response.ok) {
                return await response.json();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch provider details.');
            }
        } catch (err) {
            console.error('Error fetching provider details:', err);
            throw err;
        }
    }
    async getCurrentUser() {
        try {
            const response = await fetch('/api/auth/current-user', { credentials: 'include' });
    
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Not logged in');
            }
        } catch (err) {
            console.error('Error fetching current user:', err);
            return null;
        }
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleBookingSubmission(e));
    }

    async handleBookingSubmission(e) {
        e.preventDefault();
        const selectedDate = document.getElementById('bookingDate').value;
        const selectedTime = document.getElementById('bookingTime').value;

        // Validate date is not in the past
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
        if (selectedDateTime < new Date()) {
            alert('Please select a future date and time');
            return;
        }

        // Get current user from sessionStorage
        const currentUser  = await this.getCurrentUser();
        if (!currentUser) {
            alert('Please log in to book a service');
            window.location.href = 'sign-in.html';
            return;
        }
       
        

        const bookingData = {
            userId: currentUser.id,
            providerId: this.preSelectedProviderId,
            serviceType: this.provider.profession,
            providername: this.provider.name,
            date: selectedDate,
            time: selectedTime,
            description: document.getElementById('description').value,
        };
console.log(bookingData);
        try {
            // Send booking data to the server
            const response = await fetch('/api/admin/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData),
            });

            if (response.ok) {
                alert('Booking submitted successfully!');
                window.location.href = 'bookings.html';
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (err) {
            console.error('Error submitting booking:', err);
            alert('Failed to submit booking.');
        }
    }
}

// Initialize if we're on the booking page
if (document.getElementById('bookingForm')) {
    document.addEventListener('DOMContentLoaded', () => {
        const bookingManager = new BookingManager();
        bookingManager.initialize();
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