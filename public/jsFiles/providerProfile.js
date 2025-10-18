
// providerProfile.js
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get("id");

  async function loadProvider() {
    try {
      // Fetch provider info
      const providerRes = await fetch(`/api/admin/providers/${providerId}`);
      if (!providerRes.ok) throw new Error("Provider not found");
      const provider = await providerRes.json();

      // Populate profile details
      document.getElementById("providerName").textContent = provider.name || "";
      document.getElementById("providerExperience").textContent = provider.work_experience || "";
      document.getElementById("providerInformation").textContent = provider.personal_info || "";
      document.getElementById("providerContact").textContent = provider.email || "";
      document.getElementById("providerPhone").textContent = provider.contact_phone || "";

      // Fetch and display professions and skills
      const [professions, skills] = await Promise.all([
        fetch(`/api/admin/provider/${providerId}/professions`).then(res => res.json()),
        fetch(`/api/admin/provider/${providerId}/skills`).then(res => res.json())
      ]);
      
document.getElementById("providerProfession").textContent =
  professions.length ? professions.map(p => p.name).join(', ') : "No professions listed";
document.getElementById("providerSkills").textContent =
  skills.length ? skills.map(s => s.name).join(', ') : "No skills listed";

// For work experience, handle array/object:
let exp = provider.work_experience;
if (Array.isArray(exp)) exp = exp.join(', ');
if (typeof exp === "object" && exp !== null) exp = JSON.stringify(exp);
document.getElementById("providerExperience").textContent = exp || "No work experience listed";
      // Calendar logic
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
              // You can add logic to save the event here if needed
            }
            calendar.unselect();
          },
        });

        calendar.render();
        console.log("Calendar rendered successfully");
      });

    } catch (err) {
      console.error(err);
      alert("Provider not found!");
      window.location.href = "AllserviceProviders.html";
    }
  }

  loadProvider();
});


