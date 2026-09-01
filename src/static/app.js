document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginButton = document.getElementById("login-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const cancelLoginButton = document.getElementById("cancel-login");
  const teacherStatus = document.getElementById("teacher-status");

  function isTeacherLoggedIn() {
    return Boolean(localStorage.getItem("teacherToken"));
  }

  function getTeacherToken() {
    return localStorage.getItem("teacherToken");
  }

  function updateTeacherUI() {
    const loggedIn = isTeacherLoggedIn();
    const buttonText = loggedIn ? "Teacher: Logged In" : "Teacher Login";
    loginButton.textContent = buttonText;
    signupForm.classList.toggle("hidden", !loggedIn);
    teacherStatus.textContent = loggedIn
      ? "Teacher session active. You can manage student registrations."
      : "Please log in as a teacher to update registrations.";
    teacherStatus.classList.toggle("teacher-status-active", loggedIn);
  }

  function showLoginModal() {
    loginModal.classList.remove("hidden");
  }

  function hideLoginModal() {
    loginModal.classList.add("hidden");
    loginForm.reset();
  }

  loginButton.addEventListener("click", () => {
    if (isTeacherLoggedIn()) {
      localStorage.removeItem("teacherToken");
      updateTeacherUI();
      messageDiv.textContent = "Teacher session ended.";
      messageDiv.className = "info";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
      return;
    }

    showLoginModal();
  });

  cancelLoginButton.addEventListener("click", hideLoginModal);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        messageDiv.textContent = result.detail || "Invalid username or password.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        return;
      }

      localStorage.setItem("teacherToken", result.token);
      hideLoginModal();
      updateTeacherUI();
      messageDiv.textContent = `Welcome, ${result.username}.`;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
    } catch (error) {
      messageDiv.textContent = "Failed to log in. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Login failed:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        const participantRows = details.participants
          .map((email) => {
            const deleteButton = isTeacherLoggedIn()
              ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
              : "";
            return `<li><span class="participant-email">${email}</span>${deleteButton}</li>`;
          })
          .join("");

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${participantRows}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getTeacherToken()}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getTeacherToken()}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  updateTeacherUI();
  fetchActivities();
});
