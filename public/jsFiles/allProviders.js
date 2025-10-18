// providerProfile.js
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const providerId = urlParams.get("id");
    let providers;
    async function loadProviders() {
      try {
        const response = await fetch('/api/admin/allProviders');
        if (response.ok) {
           providers = await response.json();
           
           
          displayProviders(providers);
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to fetch providers.');
      }
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



  
    function   displayProviders(providers){
     
      const provider = providers.find((p) => p.id == providerId);
  
      if (!provider) {
        alert("Provider not found!");
        window.location.href = "AllserviceProviders.html";
        return;
      }
      
      // Populate profile details
      document.getElementById("providerName").textContent = provider.name;
      document.getElementById("providerProfession").textContent =
      provider.profession;
      document.getElementById("providerExperience").textContent =
      provider.workExperience;
      document.getElementById("providerInformation").textContent =
      provider.personalInfo;
      document.getElementById("providerContact").textContent =
      provider.email;
      document.getElementById("providerPhone").textContent = provider.contact_phone;
     
     
      
        const calendarEl = document.getElementById("providerCalendar");
        if (!calendarEl) {
          console.error("Calendar element not found!");
          return;
        }
      
      
        async function fetchEvents() {
          try {
            const response = await fetch(`/api/admin/events/${providerId}`);
            if (!response.ok) throw new Error("Failed to fetch events");
            // console.log(response.json());
            return await response.json();
          } catch (error) {
            console.error("Error fetching events:", error);
            return [];
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
           
          });
      
          calendar.render();
          console.log("Calendar rendered successfully");
        });
  
  
  
  
  
  
  
  
    }
    loadProviders();
  });