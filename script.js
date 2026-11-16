
// ============================================
// FITFLOW - WORKOUT LIBRARY
// ============================================

const workouts = [
  {
    id: "strength5",
    title: "Quick Strength Reset",
    type: "Strength",
    minutes: 5,
    level: "Beginner",
    lowImpact: true,
    icon: "💪",
    exercises: [
      ["Wall push-ups", 60, "Push gently against a wall."],
      ["Chair squats", 60, "Sit and stand using a stable chair."],
      ["Calf raises", 60, "Rise onto your toes slowly."],
      ["March in place", 60, "Keep a steady, comfortable pace."],
      ["Stretch", 60, "Stretch gently and breathe."]
    ]
  },
  {
    id: "cardio5",
    title: "Five-Minute Energy",
    type: "Cardio",
    minutes: 5,
    level: "Beginner",
    lowImpact: true,
    icon: "🚶",
    exercises: [
      ["March in place", 60, "Start at an easy pace."],
      ["Side steps", 60, "Step gently side to side."],
      ["Heel taps", 60, "Tap one heel forward at a time."],
      ["Arm circles", 60, "Circle your arms slowly."],
      ["Cool down", 60, "Slow down and breathe."]
    ]
  },
  {
    id: "core10",
    title: "Core Basics",
    type: "Core",
    minutes: 10,
    level: "Beginner",
    lowImpact: true,
    icon: "🧘",
    exercises: [
      ["Standing knee lifts", 120, "Alternate lifting knees."],
      ["Side bends", 120, "Bend gently from side to side."],
      ["Seated knee raises", 120, "Lift one knee at a time."],
      ["Bird dog", 120, "Extend opposite arm and leg."],
      ["Stretch", 120, "Relax your muscles."]
    ]
  },
  {
    id: "flex5",
    title: "Desk Break Stretch",
    type: "Flexibility",
    minutes: 5,
    level: "Beginner",
    lowImpact: true,
    icon: "🌿",
    exercises: [
      ["Shoulder rolls", 60, "Roll shoulders gently."],
      ["Neck mobility", 60, "Turn your head slowly."],
      ["Seated twist", 60, "Rotate your upper body gently."],
      ["Calf stretch", 60, "Stretch without forcing."],
      ["Deep breathing", 60, "Relax and breathe."]
    ]
  },
  {
    id: "full10",
    title: "Ten-Minute Full Body",
    type: "Full Body",
    minutes: 10,
    level: "Beginner",
    lowImpact: true,
    icon: "✨",
    exercises: [
      ["March", 120, "Warm up gently."],
      ["Wall push-ups", 120, "Push against a wall."],
      ["Chair squats", 120, "Sit and stand slowly."],
      ["Knee lifts", 120, "Alternate knees."],
      ["Cool down", 120, "Stretch and recover."]
    ]
  },
  {
    id: "strength15",
    title: "Strength Starter",
    type: "Strength",
    minutes: 15,
    level: "Beginner",
    lowImpact: true,
    icon: "🏋️",
    exercises: [
      ["Warm-up", 180, "March in place."],
      ["Chair squats", 180, "Move slowly."],
      ["Wall push-ups", 180, "Keep controlled movements."],
      ["Supported lunges", 180, "Use support as needed."],
      ["Cool down", 180, "Stretch gently."]
    ]
  },
  {
    id: "cardio15",
    title: "Low-Impact Cardio",
    type: "Cardio",
    minutes: 15,
    level: "Beginner",
    lowImpact: true,
    icon: "❤️",
    exercises: [
      ["March", 180, "Walk in place."],
      ["Side steps", 180, "Move side to side."],
      ["Heel taps", 180, "Tap your heels forward."],
      ["Brisk march", 180, "Pick up the pace comfortably."],
      ["Cool down", 180, "Slow your breathing."]
    ]
  },
  {
    id: "full20",
    title: "Twenty-Minute Move",
    type: "Full Body",
    minutes: 20,
    level: "Intermediate",
    lowImpact: false,
    icon: "⚡",
    exercises: [
      ["Warm-up", 240, "Prepare your body."],
      ["Squats", 240, "Move with control."],
      ["Push-ups", 240, "Use a comfortable variation."],
      ["Lunges", 240, "Alternate legs."],
      ["Cool down", 240, "Stretch gently."]
    ]
  },
  {
    id: "flex30",
    title: "Mobility Flow",
    type: "Flexibility",
    minutes: 30,
    level: "Beginner",
    lowImpact: true,
    icon: "🌸",
    exercises: [
      ["Breathing", 360, "Begin slowly."],
      ["Upper-body stretches", 360, "Move gently."],
      ["Hip mobility", 360, "Stay within a comfortable range."],
      ["Leg stretches", 360, "Avoid forcing movements."],
      ["Recovery", 360, "Relax and breathe."]
    ]
  },
  {
    id: "strength30",
    title: "Strength Circuit",
    type: "Strength",
    minutes: 30,
    level: "Intermediate",
    lowImpact: false,
    icon: "🔥",
    exercises: [
      ["Warm-up", 360, "Prepare your muscles."],
      ["Squats", 360, "Move with control."],
      ["Push-ups", 360, "Choose a manageable variation."],
      ["Lunges", 360, "Alternate legs."],
      ["Cool down", 360, "Stretch gently."]
    ]
  }
];

// ============================================
// SUPABASE CONNECTION
// ============================================

const SUPABASE_URL =
  "https://vreefjwltnbdkhlcngpy.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_MVNHnLLLPKa0yVaL_RQ9WQ_kH6Ph1K-";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

// ============================================
// APPLICATION STATE
// ============================================

let currentUser = null;
let currentEmail = "";
let user = null;
let historyCache = [];

let filter = "all";
let recommendationOffset = 0;

let activeWorkout = null;
let exerciseIndex = 0;
let secondsLeft = 0;
let completedSeconds = 0;
let interval = null;
let running = false;

let toastTimeout = null;

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(page) {
  const publicPages = ["welcome", "login", "setup"];
  const isPublic = publicPages.includes(page);

  $("app").hidden = isPublic;

  document.querySelectorAll(".page").forEach(section => {
    const active = section.id === page;

    section.hidden = !active;
    section.classList.toggle("active", active);
  });

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

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

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  }, 3500);
}

// ============================================
// AUTHENTICATION
// ============================================

async function signUp() {
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  if (!email || password.length < 6) {
    $("authMessage").textContent =
      "Enter a valid email and a password of at least 6 characters.";
    return;
  }

  $("authMessage").textContent = "Creating your account...";

  try {
    const { data, error } =
      await supabaseClient.auth.signUp({ email, password });

    if (error) throw error;

    if (data.session && data.user) {
      await handleAuthenticatedUser(data.user);
      toast("Account created successfully!");
    } else {
      $("authMessage").textContent =
        "Check your email to confirm your account, then log in.";
    }
  } catch (error) {
    $("authMessage").textContent = error.message;
  }
}

async function signIn(event) {
  event.preventDefault();

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  $("authMessage").textContent = "Signing in...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    await handleAuthenticatedUser(data.user);

    $("authMessage").textContent = "";
    toast("Welcome back to FITFLOW!");
  } catch (error) {
    $("authMessage").textContent = error.message;
  }
}

async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) throw error;

    clearTimer();

    currentUser = null;
    currentEmail = "";
    user = null;
    historyCache = [];
    activeWorkout = null;

    $("loginForm").reset();

    showPage("welcome");
    toast("You've been logged out.");
  } catch (error) {
    toast(error.message);
  }
}

async function handleAuthenticatedUser(authUser) {
  if (!authUser) return;

  currentUser = authUser;
  currentEmail = authUser.email || "";

  const saved = authUser.user_metadata?.fitflow || {};

  user = {
    name: saved.name || "",
    goal: saved.goal || "",
    favorite: saved.favorite || "",
    level: saved.level || "",
    minutes: saved.minutes || "10",
    limitations: saved.limitations || "",
    setupComplete: saved.setupComplete || false
  };

  await loadWorkouts();

  if (user.setupComplete) {
    $("availableTime").value = user.minutes;
    showPage("home");
  } else {
    populateSetup();
    showPage("setup");
  }
}

// ============================================
// SAVE PROFILE
// ============================================

async function saveProfile() {
  if (!currentUser || !user) return false;

  try {
    const { data, error } =
      await supabaseClient.auth.updateUser({
        data: {
          fitflow: {
            ...user,
            setupComplete: true
          }
        }
      });

    if (error) throw error;

    currentUser = data.user;
    user.setupComplete = true;

    return true;
  } catch (error) {
    toast("Could not save profile: " + error.message);
    return false;
  }
}

function populateSetup() {
  if (!user) return;

  $("userName").value = user.name || "";
  $("goal").value = user.goal || "";
  $("fitnessLevel").value = user.level || "";
  $("favorite").value = user.favorite || "";
  $("minutes").value = user.minutes || "10";
  $("limitations").value = user.limitations || "";
}

// ============================================
// WORKOUT HISTORY
// ============================================

async function loadWorkouts() {
  if (!currentUser) return;

  try {
    const { data, error } = await supabaseClient
      .from("workouts")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    historyCache = (data || []).map(entry => ({
      id: entry.id,
      date: dateKey(new Date(entry.created_at)),
      title: entry.workout_name,
      minutes: Number(entry.duration) || 0
    }));
  } catch (error) {
    console.error("History loading failed:", error);
    historyCache = [];
    toast("Could not load workout history.");
  }
}

async function saveWorkout(name, minutes) {
  if (!currentUser) return false;

  try {
    const { error } = await supabaseClient
      .from("workouts")
      .insert({
        user_id: currentUser.id,
        workout_name: name,
        duration: minutes
      });

    if (error) throw error;

    await loadWorkouts();
    return true;
  } catch (error) {
    toast("Could not save workout: " + error.message);
    return false;
  }
}

// ============================================
// PROGRESS CALCULATIONS
// ============================================

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function totalMinutes() {
  return historyCache.reduce(
    (total, entry) => total + entry.minutes, 0
  );
}

function todayMinutes() {
  return historyCache
    .filter(entry => entry.date === dateKey())
    .reduce((total, entry) => total + entry.minutes, 0);
}

function streak() {
  const dates = new Set(
    historyCache
      .filter(entry => entry.minutes > 0)
      .map(entry => entry.date)
  );

  let day = new Date();

  if (!dates.has(dateKey(day))) {
    day.setDate(day.getDate() - 1);
  }

  let count = 0;

  while (dates.has(dateKey(day))) {
    count++;
    day.setDate(day.getDate() - 1);
  }

  return count;
}

// ============================================
// WORKOUT RECOMMENDATIONS
// ============================================

function suitableWorkouts(maxMinutes = Infinity) {
  if (!user) return [];

  const levels = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3
  };

  const allowedLevel = levels[user.level] || 1;

  // Free-text limitations cannot be safely interpreted
  // as medical clearance. Prefer low-impact options.
  const needsCaution = Boolean(user.limitations.trim());

  const matches = workouts.filter(workout => {
    if (workout.minutes > maxMinutes) return false;

    if ((levels[workout.level] || 1) > allowedLevel) {
      return false;
    }

    if (needsCaution && !workout.lowImpact) {
      return false;
    }

    return true;
  });

  return matches.sort((a, b) => {
    function score(workout) {
      let points = 0;

      if (workout.type === user.favorite) points += 10;

      if (
        user.goal === "Build muscle" &&
        workout.type === "Strength"
      ) points += 7;

      if (
        user.goal === "Improve endurance" &&
        workout.type === "Cardio"
      ) points += 7;

      if (
        user.goal === "Lose weight" &&
        workout.type === "Cardio"
      ) points += 5;

      if (
        workout.minutes === Number(user.minutes)
      ) points += 5;

      return points;
    }

    return score(b) - score(a);
  });
}

function recommendedWorkout() {
  const options = suitableWorkouts(Number(user.minutes));

  if (!options.length) return null;

  return options[recommendationOffset % options.length];
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
  if (!user) return;

  $("greetingName").textContent = user.name || "Athlete";

  const workout = recommendedWorkout();

  if (workout) {
    $("recommendIcon").textContent = workout.icon;
    $("recommendType").textContent = workout.type.toUpperCase();
    $("recommendTitle").textContent = workout.title;
    $("recommendDetails").textContent =
      `${workout.minutes} minutes · No equipment`;
    $("startRecommended").disabled = false;
  } else {
    $("recommendIcon").textContent = "🌿";
    $("recommendType").textContent = "WELLNESS";
    $("recommendTitle").textContent = "No matching workout";
    $("recommendDetails").textContent =
      "Try updating your available time or preferences.";
    $("startRecommended").disabled = true;
  }

  const current = todayMinutes();
  const goal = Math.max(1, Number(user.minutes) || 10);

  const percent = Math.min(
    100,
    Math.round((current / goal) * 100)
  );

  $("progressPercent").textContent = `${percent}%`;
  $("progressRing").style.setProperty(
    "--percent", `${percent}%`
  );

  $("progressMinutes").textContent =
    `${current} / ${goal} min`;

  $("homeWorkouts").textContent = historyCache.length;
  $("homeMinutes").textContent = totalMinutes();
  $("homeStreak").textContent = streak();
}

// ============================================
// WORKOUT EXPLORER
// ============================================

function renderWorkouts() {
  if (!user) return;

  const selectedTime = $("availableTime").value;

  const maxMinutes = selectedTime === "all"
    ? Infinity
    : Number(selectedTime);

  const matches = suitableWorkouts(maxMinutes).filter(
    workout => filter === "all" || workout.type === filter
  );

  const list = $("workoutList");
  list.innerHTML = "";

  if (!matches.length) {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.textContent =
      "No matching workouts. Try another duration or category.";
    list.appendChild(panel);
    return;
  }

  matches.forEach(workout => {
    const card = document.createElement("article");
    card.className = "workout-card";

    const art = document.createElement("div");
    art.className = "workout-card-art";
    art.textContent = workout.icon;

    const body = document.createElement("div");
    body.className = "workout-card-body";

    const type = document.createElement("p");
    type.className = "eyebrow";
    type.textContent = workout.type.toUpperCase();

    const title = document.createElement("h3");
    title.textContent = workout.title;

    const details = document.createElement("p");
    details.className = "muted";
    details.textContent =
      `${workout.minutes} minutes · ${workout.level}`;

    const button = document.createElement("button");
    button.className = "primary";
    button.textContent = "Start Workout →";
    button.addEventListener(
      "click",
      () => startWorkout(workout.id)
    );

    body.append(type, title, details, button);
    card.append(art, body);
    list.appendChild(card);
  });
}

// ============================================
// WORKOUT TIMER
// ============================================

function formatTime(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remaining = Math.max(0, seconds) % 60;

  return (
    String(minutes).padStart(2, "0") + ":" +
    String(remaining).padStart(2, "0")
  );
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
    `Exercise ${exerciseIndex + 1} of ` +
    activeWorkout.exercises.length;

  $("exerciseIcon").textContent = activeWorkout.icon;
  $("exerciseName").textContent = exercise[0];
  $("exerciseInfo").textContent = exercise[2];
  $("timerDisplay").textContent = formatTime(secondsLeft);

  $("pauseWorkout").textContent =
    running ? "Pause" : "Resume";
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

async function finishWorkout() {
  if (!activeWorkout) return;

  clearTimer();

  const name = activeWorkout.title;
  const earnedMinutes = Math.floor(completedSeconds / 60);

  activeWorkout = null;

  if (earnedMinutes > 0) {
    toast("Saving your workout...");

    const saved = await saveWorkout(name, earnedMinutes);

    if (saved) {
      toast("Great work! Your workout was saved.");
    }
  } else {
    toast("Workout ended before a full minute was completed.");
  }

  showPage("progress");
}

// ============================================
// PROGRESS PAGE
// ============================================

function renderProgress() {
  $("totalWorkouts").textContent = historyCache.length;
  $("totalMinutes").textContent = totalMinutes();
  $("totalStreak").textContent = streak();

  const list = $("historyList");
  list.innerHTML = "";

  if (!historyCache.length) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent =
      "Your first workout is waiting for you!";
    list.appendChild(message);
    return;
  }

  historyCache.forEach(entry => {
    const row = document.createElement("div");
    row.className = "history-item";

    const information = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = entry.title;

    const date = document.createElement("div");
    date.className = "muted";
    date.textContent = entry.date;

    const duration = document.createElement("strong");
    duration.textContent = `${entry.minutes} min`;

    information.append(title, date);
    row.append(information, duration);
    list.appendChild(row);
  });
}

// ============================================
// PROFILE PAGE
// ============================================

function renderProfile() {
  if (!user) return;

  $("profileName").textContent = user.name;
  $("profileEmail").textContent = currentEmail;

  $("profileSummary").textContent =
    `Goal: ${user.goal}\n` +
    `Favorite workout: ${user.favorite}\n` +
    `Fitness level: ${user.level}\n` +
    `Available time: ${user.minutes} minutes\n` +
    `Limitations: ${user.limitations || "None provided"}`;

  $("profileSummary").style.whiteSpace = "pre-line";
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

  // Welcome page
  $("getStarted").addEventListener("click", () => {
    showPage("login");
  });

  $("backWelcome").addEventListener("click", () => {
    showPage("welcome");
  });

  // Login and signup
  $("loginForm").addEventListener("submit", signIn);
  $("signupButton").addEventListener("click", signUp);

  // Setup form
  $("setupForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!user) return;

    user.name = $("userName").value.trim();
    user.goal = $("goal").value;
    user.level = $("fitnessLevel").value;
    user.favorite = $("favorite").value;
    user.minutes = $("minutes").value;
    user.limitations = $("limitations").value.trim();

    const saved = await saveProfile();

    if (!saved) return;

    recommendationOffset = 0;
    $("availableTime").value = user.minutes;

    showPage("home");
    toast("Your fitness profile is ready!");
  });

  // Navigation buttons
  document.querySelectorAll("nav button").forEach(button => {
    button.addEventListener("click", () => {
      if (activeWorkout) {
        clearTimer();
        activeWorkout = null;
      }

      showPage(button.dataset.page);
    });
  });

  // Dashboard buttons
  $("findWorkout").addEventListener("click", () => {
    $("availableTime").value = user.minutes;
    showPage("workouts");
  });

  $("startRecommended").addEventListener("click", () => {
    const workout = recommendedWorkout();

    if (workout) {
      startWorkout(workout.id);
    }
  });

  $("swapRecommended").addEventListener("click", () => {
    recommendationOffset++;
    updateDashboard();
  });

  // Workout explorer
  $("updateWorkouts").addEventListener(
    "click",
    renderWorkouts
  );

  $("availableTime").addEventListener(
    "change",
    renderWorkouts
  );

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

  // Active workout
  $("pauseWorkout").addEventListener("click", pauseWorkout);
  $("nextExercise").addEventListener("click", nextExercise);
  $("finishWorkout").addEventListener("click", finishWorkout);

  $("exitWorkout").addEventListener("click", () => {
    clearTimer();
    activeWorkout = null;
    showPage("workouts");
  });

  // Profile
  $("editProfile").addEventListener("click", () => {
    populateSetup();
    showPage("setup");
  });

  $("logout").addEventListener("click", signOut);

  // Restore existing login
  try {
    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await handleAuthenticatedUser(data.session.user);
    } else {
      showPage("welcome");
    }
  } catch (error) {
    console.error("Login initialization error:", error);
    showPage("welcome");
    toast("Unable to restore your login session.");
  }
});
