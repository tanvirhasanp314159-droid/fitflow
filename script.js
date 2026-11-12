
import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase connection
const supabase = createClient(
  'https://vreefjwltnbdkhlcngpy.supabase.co',
  'sb_publishable_MVNHnLLLPKa0yVaL_RQ9WQ_kH6Ph1K-'
);


// Sign up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  return data;
}


// Login
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}


// Logout
async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}


// Save workout
async function saveWorkout(name, duration) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Please log in first.');

  const { error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      workout_name: name,
      duration: duration
    });

  if (error) throw error;
}


// Load workouts
async function loadWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Please log in first.');

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;

  return data;
}
"use strict";

// FITFLOW - Frontend demo
// Data is stored locally in the user's browser.
// No backend, real email authentication, or live AI API.

const $ = id => document.getElementById(id);

const workouts = [
  {
    id: "strength5",
    title: "Quick Strength Boost",
    type: "strength",
    minutes: 5,
    level: "beginner",
    icon: "✳",
    lowImpact: true,
    exercises: [
      ["Wall Push-Ups", 60, "Keep your body straight."],
      ["Chair Squats", 60, "Use a stable chair."],
      ["Standing Calf Raises", 60, "Raise your heels slowly."],
      ["Wall Push-Ups", 60, "Control each repetition."],
      ["Gentle March", 60, "Finish at a comfortable pace."]
    ]
  },
  {
    id: "strength10",
    title: "Full Body Reset",
    type: "strength",
    minutes: 10,
    level: "beginner",
    icon: "✳",
    lowImpact: true,
    exercises: [
      ["Chair Squats", 120, "Sit back slowly into a stable chair."],
      ["Wall Push-Ups", 120, "Keep your core engaged."],
      ["Standing Calf Raises", 120, "Raise and lower your heels."],
      ["Standing Side Steps", 120, "Move at your own pace."],
      ["Easy March", 120, "Stay relaxed and breathe."]
    ]
  },
  {
    id: "cardio5",
    title: "Five Minute Energy",
    type: "cardio",
    minutes: 5,
    level: "beginner",
    icon: "↗",
    lowImpact: true,
    exercises: [
      ["March in Place", 60, "Start gently."],
      ["Side Steps", 60, "Step left and right."],
      ["Heel Taps", 60, "Tap forward alternately."],
      ["Easy March", 60, "Stay comfortable."],
      ["Slow Walk", 60, "Cool down gently."]
    ]
  },
  {
    id: "cardio10",
    title: "Park Side Cardio",
    type: "cardio",
    minutes: 10,
    level: "beginner",
    icon: "↗",
    lowImpact: true,
    exercises: [
      ["Brisk Walk", 180, "Walk at a comfortable pace."],
      ["Side Steps", 120, "Maintain steady breathing."],
      ["March in Place", 180, "Lift knees comfortably."],
      ["Easy Walk", 120, "Cool down."]
    ]
  },
  {
    id: "mobility5",
    title: "Mobility Moment",
    type: "mobility",
    minutes: 5,
    level: "beginner",
    icon: "❀",
    lowImpact: true,
    exercises: [
      ["Shoulder Rolls", 60, "Roll slowly without forcing."],
      ["Gentle Neck Turns", 60, "Stay within a comfortable range."],
      ["Wrist Circles", 60, "Move gently."],
      ["Ankle Circles", 60, "Use support if needed."],
      ["Deep Breathing", 60, "Relax your shoulders."]
    ]
  },
  {
    id: "mobility10",
    title: "Everyday Mobility",
    type: "mobility",
    minutes: 10,
    level: "beginner",
    icon: "❀",
    lowImpact: true,
    exercises: [
      ["Shoulder Rolls", 120, "Use comfortable movements."],
      ["Standing Side Bends", 120, "Do not force the stretch."],
      ["Gentle Hip Circles", 120, "Use support if needed."],
      ["Ankle Mobility", 120, "Move slowly."],
      ["Breathing Reset", 120, "Breathe steadily."]
    ]
  },
  {
    id: "core5",
    title: "Standing Core",
    type: "core",
    minutes: 5,
    level: "beginner",
    icon: "◇",
    lowImpact: true,
    exercises: [
      ["Standing Core Brace", 60, "Breathe normally."],
      ["Gentle Knee Lifts", 60, "Lift within comfort."],
      ["Standing Side Steps", 60, "Engage your core gently."],
      ["Core Brace", 60, "Do not hold your breath."],
      ["Easy March", 60, "Finish comfortably."]
    ]
  },
  {
    id: "strength15",
    title: "Strength Circuit",
    type: "strength",
    minutes: 15,
    level: "intermediate",
    icon: "✳",
    lowImpact: false,
    exercises: [
      ["Squats", 180, "Use controlled movements."],
      ["Push-Ups", 180, "Modify as needed."],
      ["Reverse Lunges", 180, "Keep a comfortable range."],
      ["Plank", 180, "Stop if form breaks down."],
      ["Easy March", 180, "Recover steadily."]
    ]
  },
  {
    id: "cardio15",
    title: "Active Afternoon",
    type: "cardio",
    minutes: 15,
    level: "intermediate",
    icon: "↗",
    lowImpact: false,
    exercises: [
      ["Brisk Walk", 180, "Start at a steady pace."],
      ["Jog in Place", 180, "Move comfortably."],
      ["Side Shuffles", 180, "Keep movements controlled."],
      ["Fast March", 180, "Maintain breathing."],
      ["Easy Walk", 180, "Cool down."]
    ]
  },
  {
    id: "mobility15",
    title: "Gentle Recovery",
    type: "mobility",
    minutes: 15,
    level: "beginner",
    icon: "❀",
    lowImpact: true,
    exercises: [
      ["Shoulder Mobility", 180, "Move slowly."],
      ["Supported Hip Mobility", 180, "Use stable support."],
      ["Ankle Mobility", 180, "Avoid forcing the joint."],
      ["Gentle Standing Stretch", 180, "Stay comfortable."],
      ["Breathing Reset", 180, "Relax and recover."]
    ]
  }
];

const storageKey = "fitflow-profiles-v1";
const sessionKey = "fitflow-current-email";

let profiles = {};
let currentEmail = localStorage.getItem(sessionKey);
let user = null;
let filter = "all";
let recommendationOffset = 0;

let activeWorkout = null;
let exerciseIndex = 0;
let secondsLeft = 0;
let interval = null;
let running = false;
let completedSeconds = 0;

function loadProfiles() {
  try {
    profiles = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    profiles = {};
  }
}

function save() {
  if (!user || !currentEmail) return;
  profiles[currentEmail] = user;
  localStorage.setItem(storageKey, JSON.stringify(profiles));
}

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
  return user?.history || [];
}

function todayMinutes() {
  return getHistory()
    .filter(entry => entry.date === dateKey())
    .reduce((sum, entry) => sum + entry.minutes, 0);
}

function totalMinutes() {
  return getHistory().reduce(
    (sum, entry) => sum + entry.minutes, 0
  );
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

// Recommendation filtering:
// This is a rules-based demo, not a live AI model.
// A production service should use medically reviewed content.

function suitableWorkouts(maxMinutes) {
  const options = workouts.filter(workout => {
    if (workout.minutes > maxMinutes) return false;

    if (user.limitations !== "none") {
      if (!workout.lowImpact) return false;
    }

    if (
      user.level === "beginner" &&
      workout.level === "intermediate"
    ) {
      return false;
    }

    if (user.limitations === "other") {
      return workout.type === "mobility" &&
        workout.lowImpact;
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

  return matches[
    recommendationOffset % matches.length
  ];
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
  $("progressRing").style.setProperty(
    "--percent",
    `${percent}%`
  );
  $("progressMinutes").textContent =
    `${current} / ${goal} min`;

  $("homeWorkouts").textContent = getHistory().length;
  $("homeMinutes").textContent = totalMinutes();
  $("homeStreak").textContent = `${streak()} days`;
}

function renderWorkouts() {
  if (!user) return;

  const minutes = Number($("availableTime").value);

  const matches = suitableWorkouts(minutes)
    .filter(workout =>
      filter === "all" || workout.type === filter
    );

  if (!matches.length) {
    $("workoutList").innerHTML = `
      <div class="panel">
        <h3>No matching workouts</h3>
        <p>Try more available time or a different category.
        Your reported limitations are still applied.</p>
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

// Workout timer

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

function finishWorkout() {
  if (!activeWorkout) return;

  clearTimer();

  const earnedMinutes = Math.floor(completedSeconds / 60);
  const completedTitle = activeWorkout.title;

  if (earnedMinutes > 0) {
    user.history.push({
      date: dateKey(),
      title: completedTitle,
      minutes: earnedMinutes
    });

    save();
  }

  activeWorkout = null;
  showPage("progress");

  toast(
    earnedMinutes > 0
      ? `Great job! ${earnedMinutes} active minute(s) recorded.`
      : "Workout ended. No full active minutes recorded."
  );
}

function renderProgress() {
  $("totalWorkouts").textContent = getHistory().length;
  $("totalMinutes").textContent = `${totalMinutes()} min`;
  $("totalStreak").textContent = `${streak()} days`;

  const entries = [...getHistory()].reverse();

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

// Event listeners

document.addEventListener("DOMContentLoaded", () => {
  loadProfiles();

  user = profiles[currentEmail] || null;

  if (user?.setupComplete) {
    $("availableTime").value = String(user.minutes || 10);
    showPage("home");
  } else {
    showPage("welcome");
  }

  $("getStarted").addEventListener("click", () => {
    showPage("login");
  });

  $("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    currentEmail = $("email").value.trim().toLowerCase();

    if (!currentEmail) return;

    localStorage.setItem(sessionKey, currentEmail);

    if (!profiles[currentEmail]) {
      profiles[currentEmail] = {
        name: "",
        goal: "strength",
        favorite: "any",
        level: "beginner",
        minutes: "10",
        limitations: "none",
        setupComplete: false,
        history: []
      };
    }

    user = profiles[currentEmail];
    if (!Array.isArray(user.history)) user.history = [];

    if (user.setupComplete) {
      $("availableTime").value = String(user.minutes);
      showPage("home");
    } else {
      populateSetup();
      showPage("setup");
    }
  });

  $("setupForm").addEventListener("submit", event => {
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

    save();
    showPage("home");
    toast("Your personalized plan is ready!");
  });

  document.querySelectorAll("nav button").forEach(button => {
    button.addEventListener("click", () => {
      if (activeWorkout) {
        clearTimer();
        activeWorkout = null;
      }

      showPage(button.dataset.page);
    });
  });

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
    toast("Here's another workout option!");
  });

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

  $("pauseWorkout").addEventListener("click", pauseWorkout);
  $("nextExercise").addEventListener("click", nextExercise);
  $("finishWorkout").addEventListener("click", finishWorkout);

  $("exitWorkout").addEventListener("click", () => {
    clearTimer();
    activeWorkout = null;
    showPage("workouts");
  });

  $("editProfile").addEventListener("click", () => {
    populateSetup();
    showPage("setup");
  });

  $("logout").addEventListener("click", () => {
    clearTimer();
    activeWorkout = null;
    currentEmail = null;
    user = null;

    localStorage.removeItem(sessionKey);
    $("loginForm").reset();

    showPage("welcome");
  });
});
