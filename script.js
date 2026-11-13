
// ============================================
// FITFLOW - SUPABASE AUTHENTICATION & DATABASE
// Keep your existing workouts array above this.
// ============================================

// 1. SUPABASE CONNECTION
const SUPABASE_URL = "https://vreefjwltnbdkhlcngpy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MVNHnLLLPKa0yVaL_RQ9WQ_kH6Ph1K-";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

// 2. USER STATE
let currentUser = null;
let currentEmail = null;
let user = null;
let historyCache = [];

let filter = "all";
let recommendationOffset = 0;

let activeWorkout = null;
let exerciseIndex = 0;
let secondsLeft = 0;
let interval = null;
let running = false;
let completedSeconds = 0;

// ============================================
// 3. AUTHENTICATION
// ============================================

async function signUp() {
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const message = $("authMessage");

  if (!email || !password) {
    message.textContent = "Enter your email and password.";
    return;
  }

  if (password.length < 6) {
    message.textContent = "Password must be at least 6 characters.";
    return;
  }

  message.textContent = "Creating your account...";

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  if (data.session && data.user) {
    await handleAuthenticatedUser(data.user);
    toast("Account created successfully!");
  } else {
    message.textContent =
      "Account created! Check your email to confirm your account, then sign in.";
  }
}

async function signIn(event) {
  event.preventDefault();

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const message = $("authMessage");

  if (!email || !password) {
    message.textContent = "Enter your email and password.";
    return;
  }

  message.textContent = "Signing in...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  await handleAuthenticatedUser(data.user);

  message.textContent = "";
  toast("Welcome back to FITFLOW!");
}

async function signOut() {
  clearTimer();
  activeWorkout = null;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    toast(error.message);
    return;
  }

  currentUser = null;
  currentEmail = null;
  user = null;
  historyCache = [];

  $("loginForm").reset();

  showPage("welcome");
  toast("You have been logged out.");
}

async function handleAuthenticatedUser(authUser) {
  currentUser = authUser;
  currentEmail = authUser.email;

  // Load saved profile preferences from Supabase
  const savedProfile = authUser.user_metadata?.fitflow || {};

  user = {
    name: savedProfile.name || "",
    goal: savedProfile.goal || "strength",
    favorite: savedProfile.favorite || "any",
    level: savedProfile.level || "beginner",
    minutes: savedProfile.minutes || "10",
    limitations: savedProfile.limitations || "none",
    setupComplete: savedProfile.setupComplete || false,
    history: []
  };

  await loadWorkouts();

  if (user.setupComplete) {
    $("availableTime").value = String(user.minutes);
    showPage("home");
  } else {
    populateSetup();
    showPage("setup");
  }
}

// ============================================
// 4. SAVE PROFILE TO SUPABASE
// ============================================

async function saveProfile() {
  if (!currentUser || !user) return false;

  const { data, error } = await supabaseClient.auth.updateUser({
    data: {
      fitflow: {
        name: user.name,
        goal: user.goal,
        favorite: user.favorite,
        level: user.level,
        minutes: user.minutes,
        limitations: user.limitations,
        setupComplete: user.setupComplete
      }
    }
  });

  if (error) {
    console.error("Profile save error:", error);
    toast("Could not save your profile.");
    return false;
  }

  currentUser = data.user;
  return true;
}

// ============================================
// 5. SAVE AND LOAD WORKOUTS FROM SUPABASE
// ============================================

async function loadWorkouts() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("workouts")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Workout loading error:", error);
    toast("Could not load workout history.");
    historyCache = [];
    return;
  }

  historyCache = data.map(entry => ({
    id: entry.id,
    date: dateKey(new Date(entry.created_at)),
    title: entry.workout_name,
    minutes: entry.duration
  }));
}

async function saveWorkout(workoutName, duration) {
  if (!currentUser) {
    toast("Please sign in first.");
    return false;
  }

  const { error } = await supabaseClient
    .from("workouts")
    .insert({
      user_id: currentUser.id,
      workout_name: workoutName,
      duration: duration
    });

  if (error) {
    console.error("Workout save error:", error);
    toast("Workout could not be saved: " + error.message);
    return false;
  }

  await loadWorkouts();
  return true;
}

// ============================================
// 6. GENERAL FUNCTIONS
// ============================================

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("navigation").classList.toggle(
    "hidden",
    !user || !user.setupComplete
  );

  window.scrollTo(0, 0);

  if (page === "home") updateDashboard();
  if (page === "workouts") renderWorkouts();
  if (page === "progress") renderProgress();
  if (page === "profile") renderProfile();
}

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHistory() {
  return historyCache;
}

function todayMinutes() {
  return getHistory()
    .filter(entry => entry.date === dateKey())
    .reduce((sum, entry) => sum + entry.minutes, 0);
}

function totalMinutes() {
  return getHistory().reduce((sum, entry) => sum + entry.minutes, 0);
}

function streak() {
  const dates = new Set(
    getHistory()
      .filter(entry => entry.minutes > 0)
      .map(entry => entry.date)
  );

  let cursor = new Date();
  let count = 0;

  if (!dates.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dates.has(dateKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// ============================================
// 7. WORKOUT RECOMMENDATIONS
// ============================================

function suitableWorkouts(maxMinutes) {
  const options = workouts.filter(workout => {
    if (workout.minutes > maxMinutes) return false;

    if (user.limitations !== "none" && !workout.lowImpact) {
      return false;
    }

    if (
      user.level === "beginner" &&
      workout.level === "intermediate"
    ) {
      return false;
    }

    if (user.limitations === "other") {
      return workout.type === "mobility" && workout.lowImpact;
    }

    return true;
  });

  const preferred = user.favorite !== "any"
    ? user.favorite
    : user.goal;

  return options.sort((a, b) => {
    const score = workout => {
      let points = 0;
      if (workout.type === preferred) points += 10;
      if (workout.type === user.goal) points += 7;
      if (workout.minutes === maxMinutes) points += 5;
      return points;
    };

    return score(b) - score(a);
  });
}

function recommendedWorkout() {
  const minutes = Number(user.minutes || 10);
  const matches = suitableWorkouts(minutes);

  if (!matches.length) return null;

  return matches[recommendationOffset % matches.length];
}

function updateDashboard() {
  if (!user) return;

  $("greetingName").textContent = user.name || "Friend";

  const workout = recommendedWorkout();

  if (workout) {
    $("recommendIcon").textContent = workout.icon;
    $("recommendType").textContent = workout.type.toUpperCase();
    $("recommendTitle").textContent = workout.title;
    $("recommendDetails").textContent =
      `${workout.minutes} min · No equipment`;
    $("startRecommended").disabled = false;
  } else {
    $("recommendIcon").textContent = "❀";
    $("recommendType").textContent = "YOUR WELLBEING";
    $("recommendTitle").textContent = "No matching workout";
    $("recommendDetails").textContent =
      "Adjust your settings or consult a professional.";
    $("startRecommended").disabled = true;
  }

  const current = todayMinutes();
  const goal = Number(user.minutes || 10);
  const percent = Math.min(
    100,
    Math.round((current / goal) * 100)
  );

  $("progressPercent").textContent = `${percent}%`;
  $("progressRing").style.setProperty("--percent", `${percent}%`);
  $("progressMinutes").textContent = `${current} / ${goal} min`;

  $("homeWorkouts").textContent = getHistory().length;
  $("homeMinutes").textContent = totalMinutes();
  $("homeStreak").textContent = `${streak()} days`;
}

// ============================================
// 8. WORKOUT EXPLORER
// ============================================

function renderWorkouts() {
  if (!user) return;

  const minutes = Number($("availableTime").value);

  const matches = suitableWorkouts(minutes).filter(workout =>
    filter === "all" || workout.type === filter
  );

  if (!matches.length) {
    $("workoutList").innerHTML = `
      <div class="panel">
        <h3>No matching workouts</h3>
        <p>Try more available time or a different category.</p>
      </div>
    `;
    return;
  }

  $("workoutList").innerHTML = matches.map(workout => `
    <article class="workout-card">
      <div class="workout-card-art">${workout.icon}</div>
      <div class="workout-card-body">
        <p class="eyebrow">${workout.type.toUpperCase()}</p>
        <h3>${safeText(workout.title)}</h3>
        <p class="muted">
          ${workout.minutes} minutes · No equipment
        </p>
        <button class="primary" data-workout="${workout.id}">
          Start workout →
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-workout]").forEach(button => {
    button.addEventListener("click", () => {
      startWorkout(button.dataset.workout);
    });
  });
}

// ============================================
// 9. WORKOUT TIMER
// ============================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function clearTimer() {
  clearInterval(interval);
  interval = null;
  running = false;
}

function renderExercise() {
  if (!activeWorkout) return;

  const exercise = activeWorkout.exercises[exerciseIndex];

  $("sessionTitle").textContent = activeWorkout.title;
  $("sessionStep").textContent =
    `Exercise ${exerciseIndex + 1} of ${activeWorkout.exercises.length}`;

  $("exerciseIcon").textContent = activeWorkout.icon;
  $("exerciseName").textContent = exercise[0];
  $("exerciseInfo").textContent = exercise[2];
  $("timerDisplay").textContent = formatTime(secondsLeft);
  $("pauseWorkout").textContent = running ? "Pause" : "Resume";
}

function startWorkout(id) {
  const workout = workouts.find(item => item.id === id);
  if (!workout) return;

  clearTimer();

  activeWorkout = workout;
  exerciseIndex = 0;
  secondsLeft = workout.exercises[0][1];
  completedSeconds = 0;

  showPage("session");
  renderExercise();
  resumeWorkout();
}

function resumeWorkout() {
  if (!activeWorkout || running) return;

  running = true;
  $("pauseWorkout").textContent = "Pause";

  interval = setInterval(() => {
    secondsLeft--;
    completedSeconds++;

    if (secondsLeft <= 0) {
      nextExercise();
    } else {
      $("timerDisplay").textContent = formatTime(secondsLeft);
    }
  }, 1000);
}

function pauseWorkout() {
  if (!activeWorkout) return;

  if (running) {
    clearTimer();
    $("pauseWorkout").textContent = "Resume";
  } else {
    resumeWorkout();
  }
}

function nextExercise() {
  if (!activeWorkout) return;

  clearTimer();
  exerciseIndex++;

  if (exerciseIndex >= activeWorkout.exercises.length) {
    finishWorkout();
    return;
  }

  secondsLeft = activeWorkout.exercises[exerciseIndex][1];
  renderExercise();
  resumeWorkout();
}

// ============================================
// 10. FINISH WORKOUT AND SAVE TO SUPABASE
// ============================================

async function finishWorkout() {
  if (!activeWorkout) return;

  clearTimer();

  const earnedMinutes = Math.floor(completedSeconds / 60);
  const completedTitle = activeWorkout.title;

  activeWorkout = null;

  if (earnedMinutes > 0) {
    toast("Saving your workout...");

    const saved = await saveWorkout(
      completedTitle,
      earnedMinutes
    );

    if (saved) {
      toast("Great job! Your workout was saved!");
    }
  }

  showPage("progress");
}

// ============================================
// 11. PROGRESS AND WORKOUT HISTORY
// ============================================

function renderProgress() {
  $("totalWorkouts").textContent = getHistory().length;
  $("totalMinutes").textContent = `${totalMinutes()} min`;
  $("totalStreak").textContent = `${streak()} days`;

  const entries = [...getHistory()];

  if (!entries.length) {
    $("historyList").innerHTML =
      `<p class="muted">Your first workout is waiting for you.</p>`;
    return;
  }

  $("historyList").innerHTML = entries.map(entry => `
    <div class="history-item">
      <div>
        <strong>${safeText(entry.title)}</strong>
        <div class="muted">${safeText(entry.date)}</div>
      </div>
      <strong>${entry.minutes} min</strong>
    </div>
  `).join("");
}

// ============================================
// 12. PROFILE
// ============================================

function renderProfile() {
  if (!user) return;

  $("profileName").textContent = user.name;
  $("profileEmail").textContent = currentEmail;

  $("profileSummary").textContent =
    `Goal: ${user.goal} · Favorite: ${user.favorite} · ` +
    `Available time: ${user.minutes} minutes · ` +
    `Fitness level: ${user.level} · ` +
    `Limitations: ${user.limitations}`;
}

function populateSetup() {
  if (!user) return;

  $("userName").value = user.name || "";
  $("goal").value = user.goal || "strength";
  $("fitnessLevel").value = user.level || "beginner";
  $("favorite").value = user.favorite || "any";
  $("minutes").value = user.minutes || "10";
  $("limitations").value = user.limitations || "none";
}

// ============================================
// 13. EVENT LISTENERS
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

  // Restore existing Supabase login session
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    showPage("welcome");
  } else if (data.session) {
    await handleAuthenticatedUser(data.session.user);
  } else {
    showPage("welcome");
  }

  // Welcome
  $("getStarted").addEventListener("click", () => {
    showPage("login");
  });

  // Login with email and password
  $("loginForm").addEventListener("submit", signIn);

  // Create account
  $("signupButton").addEventListener("click", signUp);

  // Save onboarding preferences
  $("setupForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!user) return;

    user.name = $("userName").value.trim();
    user.goal = $("goal").value;
    user.level = $("fitnessLevel").value;
    user.favorite = $("favorite").value;
    user.minutes = $("minutes").value;
    user.limitations = $("limitations").value;
    user.setupComplete = true;

    recommendationOffset = 0;
    $("availableTime").value = user.minutes;

    const saved = await saveProfile();

    if (!saved) return;

    showPage("home");
    toast("Your personalized plan is ready!");
  });

  // Navigation
  document.querySelectorAll("nav button").forEach(button => {
    button.addEventListener("click", () => {
      if (activeWorkout) {
        clearTimer();
        activeWorkout = null;
      }

      showPage(button.dataset.page);
    });
  });

  // Dashboard
  $("findWorkout").addEventListener("click", () => {
    $("availableTime").value = user.minutes;
    showPage("workouts");
  });

  $("startRecommended").addEventListener("click", () => {
    const workout = recommendedWorkout();
    if (workout) startWorkout(workout.id);
  });

  $("swapRecommended").addEventListener("click", () => {
    recommendationOffset++;
    updateDashboard();
    toast("Here's another workout option!");
  });

  // Workout explorer
  $("updateWorkouts").addEventListener("click", renderWorkouts);

  document.querySelectorAll(".chip").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(chip => {
        chip.classList.remove("selected");
      });

      button.classList.add("selected");
      filter = button.dataset.filter;
      renderWorkouts();
    });
  });

  // Workout timer controls
  $("pauseWorkout").addEventListener("click", pauseWorkout);
  $("nextExercise").addEventListener("click", nextExercise);
  $("finishWorkout").addEventListener("click", finishWorkout);

  $("exitWorkout").addEventListener("click", () => {
    clearTimer();
    activeWorkout = null;
    showPage("workouts");
  });

  // Profile editing
  $("editProfile").addEventListener("click", () => {
    populateSetup();
    showPage("setup");
  });

  // Logout
  $("logout").addEventListener("click", signOut);

});
