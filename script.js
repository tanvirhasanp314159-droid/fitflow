
"use strict";

// ============================================
// FITFLOW SUPABASE CONNECTION
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

// Use the live website URL for email redirects.
const SITE_URL =
  window.location.origin + window.location.pathname;

const RECOVERY_URL = new URL(SITE_URL);
RECOVERY_URL.searchParams.set("mode", "reset");

// ============================================
// APPLICATION STATE
// ============================================

let user = null;
let currentUser = null;
let currentEmail = "";

let historyCache = [];
let workouts = [];

let generatingWorkouts = false;
let generationNumber = 0;

let recommendationOffset = 0;
let filter = "all";

let activeWorkout = null;
let exerciseIndex = 0;
let secondsLeft = 0;
let completedSeconds = 0;

let timer = null;
let running = false;

let authBusy = false;
let toastTimer = null;

let recoveryMode =
  new URLSearchParams(window.location.search)
    .get("mode") === "reset" ||
  new URLSearchParams(
    window.location.hash.slice(1)
  ).get("type") === "recovery";

// ============================================
// NAVIGATION
// ============================================

function showPage(page) {
  const publicPages = [
    "welcome", "login", "setup", "reset"
  ];

  $("app").hidden = publicPages.includes(page);

  document.querySelectorAll(".page").forEach(element => {
    const visible = element.id === page;
    element.hidden = !visible;
    element.classList.toggle("active", visible);
  });

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  $("navigation").classList.toggle(
    "hidden",
    !user?.setupComplete
  );

  if (page === "home") updateDashboard();
  if (page === "workouts") renderWorkouts();
  if (page === "progress") renderProgress();
  if (page === "profile") renderProfile();

  window.scrollTo(0, 0);
}

// ============================================
// NOTIFICATIONS
// ============================================

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 3500);
}

// ============================================
// CREATE ACCOUNT
// ============================================

async function signUp() {
  if (authBusy) return;

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  if (!email || password.length < 6) {
    $("authMessage").textContent =
      "Enter an email and a password of at least 6 characters.";
    return;
  }

  authBusy = true;
  $("authMessage").textContent = "Creating your account...";

  try {
    const { data, error } =
      await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: SITE_URL
        }
      });

    if (error) throw error;

    if (data.session?.user) {
      await handleAuthenticatedUser(data.session.user);
    } else {
      $("authMessage").textContent =
        "Check your email to confirm your account. " +
        "The link should bring you back to FITFLOW.";
    }
  } catch (error) {
    $("authMessage").textContent = error.message;
  } finally {
    authBusy = false;
  }
}

// ============================================
// LOG IN
// ============================================

async function signIn(event) {
  event.preventDefault();

  if (authBusy) return;
  authBusy = true;

  $("authMessage").textContent = "Signing in...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: $("email").value.trim().toLowerCase(),
        password: $("password").value
      });

    if (error) throw error;

    await handleAuthenticatedUser(data.user);

    $("authMessage").textContent = "";
    toast("Welcome back to FITFLOW!");
  } catch (error) {
    $("authMessage").textContent = error.message;
  } finally {
    authBusy = false;
  }
}

// ============================================
// FORGOT PASSWORD
// ============================================

async function requestPasswordReset() {
  const email = $("email").value.trim().toLowerCase();

  if (!email) {
    $("authMessage").textContent =
      "Enter your email above first.";
    $("email").focus();
    return;
  }

  $("forgotPassword").disabled = true;
  $("authMessage").textContent =
    "Sending password reset instructions...";

  try {
    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: RECOVERY_URL.toString()
        }
      );

    if (error) throw error;

    $("authMessage").textContent =
      "If this account exists, a reset link " +
      "has been sent. Check your inbox and spam.";
  } catch (error) {
    $("authMessage").textContent = error.message;
  } finally {
    $("forgotPassword").disabled = false;
  }
}

// ============================================
// CHANGE PASSWORD
// ============================================

async function updatePassword(event) {
  event.preventDefault();

  const password = $("newPassword").value;

  if (password.length < 8) {
    $("resetMessage").textContent =
      "Use at least 8 characters.";
    return;
  }

  if (password !== $("confirmPassword").value) {
    $("resetMessage").textContent =
      "Passwords do not match.";
    return;
  }

  const button = $("resetPasswordForm")
    .querySelector('[type="submit"]');

  button.disabled = true;
  $("resetMessage").textContent =
    "Updating your password...";

  try {
    const { data, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    if (!data.session) {
      throw Error(
        "Reset link expired. Request a new reset email."
      );
    }

    const { error } =
      await supabaseClient.auth.updateUser({
        password
      });

    if (error) throw error;

    generationNumber++;

    await supabaseClient.auth.signOut();

    recoveryMode = false;

    currentUser = null;
    currentEmail = "";
    user = null;
    historyCache = [];
    workouts = [];

    window.history.replaceState(
      {},
      "",
      SITE_URL
    );

    $("resetPasswordForm").reset();
    $("loginForm").reset();

    showPage("login");

    $("authMessage").textContent =
      "Password changed! Sign in with your new password.";

    toast("Password updated.");
  } catch (error) {
    $("resetMessage").textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

// ============================================
// LOG OUT
// ============================================

async function signOut() {
  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) throw error;

    generationNumber++;
    clearTimer();

    currentUser = null;
    currentEmail = "";
    user = null;
    historyCache = [];
    workouts = [];
    activeWorkout = null;

    $("loginForm").reset();

    showPage("welcome");
    toast("Logged out.");
  } catch (error) {
    toast(error.message);
  }
}

// ============================================
// LOAD USER
// ============================================

async function handleAuthenticatedUser(authUser) {
  if (recoveryMode || !authUser) {
    if (recoveryMode) showPage("reset");
    return;
  }

  const requestNumber = ++generationNumber;

  currentUser = authUser;
  currentEmail = authUser.email || "";

  const saved =
    authUser.user_metadata?.fitflow || {};

  user = {
    name: saved.name || "",
    goal: saved.goal || "",
    favorite: saved.favorite || "",
    level: saved.level || "",
    minutes: String(saved.minutes || "10"),
    limitations: saved.limitations || "",
    setupComplete: Boolean(saved.setupComplete)
  };

  workouts = [];
  historyCache = [];
  recommendationOffset = 0;

  await loadWorkouts();

  if (requestNumber !== generationNumber) return;

  if (user.setupComplete) {
    $("availableTime").value = user.minutes;
    showPage("home");

    await generateAIWorkouts(
      Number(user.minutes),
      "Any"
    );
  } else {
    populateSetup();
    showPage("setup");
  }
}

// ============================================
// PROFILE SETUP
// ============================================

function populateSetup() {
  if (!user) return;

  $("userName").value = user.name;
  $("goal").value = user.goal;
  $("fitnessLevel").value = user.level;
  $("favorite").value = user.favorite;
  $("minutes").value = user.minutes;
  $("limitations").value = user.limitations;
}

async function saveProfile() {
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
}

// ============================================
// GEMINI AI WORKOUT GENERATION
// ============================================

async function generateAIWorkouts(
  selectedMinutes = null,
  selectedType = "Any"
) {
  if (
    !user ||
    !currentUser ||
    generatingWorkouts ||
    recoveryMode
  ) return false;

  generatingWorkouts = true;

  const requestNumber = generationNumber;
  const requestedUserId = currentUser.id;

  $("updateWorkouts").disabled = true;
  $("swapRecommended").disabled = true;
  $("startRecommended").disabled = true;

  toast("Gemini is generating your workouts...");

  try {
    const minutes =
      selectedMinutes || Number(user.minutes) || 10;

    const { data, error } =
      await supabaseClient.functions.invoke(
        "generate-workout",
        {
          body: {
            goal: user.goal,
            favorite: user.favorite,
            level: user.level,
            minutes,
            type: selectedType,
            hasLimitations:
              Boolean(user.limitations.trim())
          }
        }
      );

    if (error) {
      let message = error.message;

      if (error.context?.json) {
        try {
          const details =
            await error.context.json();

          message = details.error || message;
        } catch (_) {}
      }

      throw new Error(message);
    }

    if (
      !Array.isArray(data?.workouts) ||
      !data.workouts.length
    ) {
      throw new Error(
        "Gemini did not return workout plans."
      );
    }

    const safe = data.workouts.map((w, i) => ({
      id: String(w.id || `ai-${Date.now()}-${i}`),
      title: String(w.title || "Workout"),
      type: String(w.type || "Full Body"),
      minutes: Number(w.minutes) || minutes,
      level: String(
        w.level || user.level || "Beginner"
      ),
      icon: typeof w.icon === "string"
        ? w.icon
        : "💪",

      exercises: Array.isArray(w.exercises)
        ? w.exercises.filter(ex =>
            Array.isArray(ex) &&
            ex.length >= 3 &&
            typeof ex[0] === "string" &&
            Number.isFinite(Number(ex[1])) &&
            Number(ex[1]) > 0 &&
            typeof ex[2] === "string"
          ).map(ex => [
            ex[0],
            Math.round(Number(ex[1])),
            ex[2]
          ])
        : []
    })).filter(w => w.exercises.length > 0);

    if (!safe.length) {
      throw new Error(
        "Gemini returned no valid exercises."
      );
    }

    if (
      requestNumber !== generationNumber ||
      currentUser?.id !== requestedUserId
    ) return false;

    workouts = safe;
    recommendationOffset = 0;

    $("availableTime").value = String(minutes);

    if (!$("home").hidden) updateDashboard();
    if (!$("workouts").hidden) renderWorkouts();

    toast("Your AI workouts are ready!");
    return true;

  } catch (error) {
    console.error("generate-workout error:", error);

    if (requestNumber === generationNumber) {
      toast(
        "Could not generate workouts: " +
        error.message
      );
    }

    return false;
  } finally {
    generatingWorkouts = false;

    $("updateWorkouts").disabled = false;
    $("swapRecommended").disabled = false;

    $("startRecommended").disabled =
      workouts.length === 0;
  }
}

// ============================================
// RECOMMEND WORKOUT
// ============================================

function recommendedWorkout() {
  if (!workouts.length) return null;

  const ranked = [...workouts].sort((a, b) => {
    const score = w =>
      (w.type === user.favorite ? 10 : 0) +
      (w.minutes === Number(user.minutes) ? 5 : 0);

    return score(b) - score(a);
  });

  return ranked[
    recommendationOffset % ranked.length
  ];
}

// ============================================
// HOME DASHBOARD
// ============================================

function updateDashboard() {
  if (!user) return;

  $("greetingName").textContent =
    user.name || "Athlete";

  const w = recommendedWorkout();

  $("recommendIcon").textContent =
    w?.icon || "✨";

  $("recommendType").textContent =
    w?.type || "GEMINI AI";

  $("recommendTitle").textContent =
    w?.title ||
    (generatingWorkouts
      ? "Generating..."
      : "Generate your first workout");

  $("recommendDetails").textContent =
    w
      ? `${w.minutes} min · ${w.level}`
      : "Use Try Another to generate AI workouts.";

  $("startRecommended").disabled =
    !w || generatingWorkouts;

  const goal = Math.max(
    1,
    Number(user.minutes) || 10
  );

  const today = todayMinutes();

  const percentage = Math.min(
    100,
    Math.round((today / goal) * 100)
  );

  $("progressRing").style.setProperty(
    "--percent",
    `${percentage}%`
  );

  $("progressPercent").textContent =
    percentage + "%";

  $("progressMinutes").textContent =
    `${today} / ${goal} min`;

  $("homeWorkouts").textContent =
    historyCache.length;

  $("homeMinutes").textContent =
    totalMinutes();

  $("homeStreak").textContent =
    streak();

  renderWorkoutPreview();
}

// ============================================
// WORKOUT CARDS
// ============================================

function createWorkoutCard(workout) {
  const card = document.createElement("article");
  card.className = "workout-card";

  const art = document.createElement("div");
  art.className = "workout-card-art";
  art.textContent = workout.icon;

  const body = document.createElement("div");
  body.className = "workout-card-body";

  const type = document.createElement("p");
  type.className = "eyebrow";
  type.textContent = workout.type;

  const title = document.createElement("h3");
  title.textContent = workout.title;

  const details = document.createElement("p");
  details.textContent =
    `${workout.minutes} minutes · ${workout.level}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary";
  button.textContent = "Start Workout";

  button.addEventListener("click", () => {
    startWorkout(workout.id);
  });

  body.append(type, title, details, button);
  card.append(art, body);

  return card;
}

function renderWorkoutPreview() {
  const element = $("homeWorkoutPreview");
  element.replaceChildren();

  workouts.slice(0, 3).forEach(w => {
    element.append(createWorkoutCard(w));
  });
}

function renderWorkouts() {
  const duration = $("availableTime").value;

  const maxMinutes = duration === "all"
    ? Infinity
    : Number(duration);

  const matching = workouts.filter(w =>
    w.minutes <= maxMinutes &&
    (filter === "all" || w.type === filter)
  );

  const element = $("workoutList");
  element.replaceChildren();

  if (!matching.length) {
    const p = document.createElement("p");
    p.textContent =
      "No matches yet. Choose a duration " +
      "and generate AI workouts.";

    element.append(p);
    return;
  }

  matching.forEach(w => {
    element.append(createWorkoutCard(w));
  });
}

// ============================================
// HUMAN-LIKE EXERCISE ANIMATION
// ============================================

function updateExerciseAnimation(name) {
  window.fitflowAnimator?.setExercise(name);
  window.fitflowAnimator?.pause(!running);

  $("animationLabel").textContent =
    "Stylized demonstration: " + name;
}

function setAnimationPaused(paused) {
  window.fitflowAnimator?.pause(paused);
}

// ============================================
// TIMER
// ============================================

function formatTime(seconds) {
  const s = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes =
    String(Math.floor(s / 60)).padStart(2, "0");

  const remaining =
    String(s % 60).padStart(2, "0");

  return minutes + ":" + remaining;
}

function clearTimer() {
  if (timer) clearInterval(timer);

  timer = null;
  running = false;

  setAnimationPaused(true);
}

// ============================================
// RENDER ACTIVE EXERCISE
// ============================================

function renderExercise() {
  if (!activeWorkout) return;

  const ex =
    activeWorkout.exercises[exerciseIndex];

  if (!ex) return;

  $("sessionTitle").textContent =
    activeWorkout.title;

  $("sessionStep").textContent =
    `Exercise ${exerciseIndex + 1} of ` +
    activeWorkout.exercises.length;

  $("exerciseName").textContent = ex[0];
  $("exerciseInfo").textContent = ex[2];

  $("timerDisplay").textContent =
    formatTime(secondsLeft);

  $("pauseWorkout").textContent =
    running ? "Pause" : "Resume";

  updateExerciseAnimation(ex[0]);
}

// ============================================
// START WORKOUT
// ============================================

function startWorkout(id) {
  const chosen = workouts.find(w => w.id === id);

  if (!chosen) {
    toast("Workout not found.");
    return;
  }

  clearTimer();

  activeWorkout = chosen;
  exerciseIndex = 0;
  secondsLeft = chosen.exercises[0][1];
  completedSeconds = 0;

  showPage("session");
  renderExercise();
  resumeWorkout();
}

// ============================================
// RESUME / PAUSE
// ============================================

function resumeWorkout() {
  if (!activeWorkout || running) return;

  running = true;
  $("pauseWorkout").textContent = "Pause";

  setAnimationPaused(false);

  timer = setInterval(() => {
    secondsLeft -= 1;
    completedSeconds += 1;

    $("timerDisplay").textContent =
      formatTime(secondsLeft);

    if (secondsLeft <= 0) {
      nextExercise();
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

// ============================================
// NEXT EXERCISE
// ============================================

function nextExercise() {
  if (!activeWorkout) return;

  clearTimer();
  exerciseIndex++;

  if (
    exerciseIndex >= activeWorkout.exercises.length
  ) {
    finishWorkout();
    return;
  }

  secondsLeft =
    activeWorkout.exercises[exerciseIndex][1];

  renderExercise();
  resumeWorkout();
}

// ============================================
// FINISH WORKOUT
// ============================================

async function finishWorkout() {
  if (!activeWorkout) return;

  clearTimer();

  const title = activeWorkout.title;
  const earned = Math.floor(
    completedSeconds / 60
  );

  activeWorkout = null;

  if (earned > 0) {
    try {
      await saveWorkout(title, earned);
      toast("Workout saved!");
    } catch (error) {
      toast(
        "Workout not saved: " +
        error.message
      );
    }
  } else {
    toast("Workout ended before one full minute.");
  }

  showPage("progress");
}

// ============================================
// SUPABASE WORKOUT HISTORY
// ============================================

async function loadWorkouts() {
  if (!currentUser) return;

  const id = currentUser.id;

  try {
    const { data, error } = await supabaseClient
      .from("workouts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    if (currentUser?.id !== id) return;

    historyCache = (data || []).map(entry => ({
      id: entry.id,
      title: entry.workout_name,
      minutes: Number(entry.duration) || 0,
      date: dateKey(new Date(entry.created_at))
    }));
  } catch (error) {
    console.error("Load history:", error);
    toast("Could not load workout history.");
  }
}

async function saveWorkout(title, duration) {
  if (!currentUser) {
    throw Error("Sign in to save workouts.");
  }

  const { error } = await supabaseClient
    .from("workouts")
    .insert({
      user_id: currentUser.id,
      workout_name: title,
      duration
    });

  if (error) throw error;

  await loadWorkouts();
}

// ============================================
// PROGRESS CALCULATIONS
// ============================================

function dateKey(d = new Date()) {
  const year = d.getFullYear();

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayMinutes() {
  return historyCache
    .filter(w => w.date === dateKey())
    .reduce((n, w) => n + w.minutes, 0);
}

function totalMinutes() {
  return historyCache.reduce(
    (n, w) => n + w.minutes,
    0
  );
}

function streak() {
  const days = new Set(
    historyCache
      .filter(w => w.minutes > 0)
      .map(w => w.date)
  );

  const current = new Date();

  if (!days.has(dateKey(current))) {
    current.setDate(current.getDate() - 1);
  }

  let count = 0;

  while (days.has(dateKey(current))) {
    count++;
    current.setDate(current.getDate() - 1);
  }

  return count;
}

// ============================================
// PROGRESS PAGE
// ============================================

function renderProgress() {
  $("totalWorkouts").textContent =
    historyCache.length;

  $("totalMinutes").textContent =
    totalMinutes() + " min";

  $("totalStreak").textContent =
    streak() + " days";

  const element = $("historyList");
  element.replaceChildren();

  if (!historyCache.length) {
    element.textContent =
      "Your first workout is waiting for you!";
    return;
  }

  historyCache.forEach(entry => {
    const row = document.createElement("div");
    row.className = "history-item";

    const info = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = entry.title;

    const date = document.createElement("div");
    date.className = "muted";
    date.textContent = entry.date;

    const duration = document.createElement("strong");
    duration.textContent = entry.minutes + " min";

    info.append(title, date);
    row.append(info, duration);
    element.append(row);
  });
}

// ============================================
// PROFILE PAGE
// ============================================

function renderProfile() {
  if (!user) return;

  $("profileName").textContent =
    user.name || "Athlete";

  $("profileEmail").textContent =
    currentEmail;

  $("profileSummary").textContent =
    `Goal: ${user.goal}\n` +
    `Favorite: ${user.favorite}\n` +
    `Fitness level: ${user.level}\n` +
    `Available time: ${user.minutes} minutes\n` +
    `Things to avoid: ${user.limitations || "None provided"}`;
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    $("getStarted").addEventListener(
      "click",
      () => showPage("login")
    );

    $("backWelcome").addEventListener(
      "click",
      () => showPage("welcome")
    );

    $("loginForm").addEventListener(
      "submit",
      signIn
    );

    $("signupButton").addEventListener(
      "click",
      signUp
    );

    $("forgotPassword").addEventListener(
      "click",
      requestPasswordReset
    );

    $("resetPasswordForm").addEventListener(
      "submit",
      updatePassword
    );

    // Detect password recovery from Supabase.
    supabaseClient.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        showPage("reset");
      }
    });

    // Save fitness profile.
    $("setupForm").addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        if (!user) return;

        const previous = { ...user };

        Object.assign(user, {
          name: $("userName").value.trim(),
          goal: $("goal").value,
          level: $("fitnessLevel").value,
          favorite: $("favorite").value,
          minutes: $("minutes").value,
          limitations:
            $("limitations").value.trim(),
          setupComplete: true
        });

        try {
          await saveProfile();

          $("availableTime").value =
            user.minutes;

          showPage("home");

          await generateAIWorkouts(
            Number(user.minutes),
            "Any"
          );
        } catch (error) {
          user = previous;

          console.error("Profile:", error);

          toast(
            "Profile could not be saved: " +
            error.message
          );
        }
      }
    );

    // Navigation.
    document.querySelectorAll(
      "nav button"
    ).forEach(button => {
      button.addEventListener("click", () => {
        if (activeWorkout) {
          clearTimer();
          activeWorkout = null;
        }

        showPage(button.dataset.page);
      });
    });

    // Workout navigation.
    $("findWorkout").addEventListener(
      "click",
      () => {
        $("availableTime").value =
          user.minutes;

        showPage("workouts");
      }
    );

    $("startRecommended").addEventListener(
      "click",
      () => {
        const w = recommendedWorkout();

        if (w) startWorkout(w.id);
      }
    );

    // Generate another Gemini workout.
    $("swapRecommended").addEventListener(
      "click",
      async () => {
        await generateAIWorkouts(
          Number(user.minutes),
          "Any"
        );
      }
    );

    // Generate workouts using filters.
    $("updateWorkouts").addEventListener(
      "click",
      async () => {
        const time = $("availableTime").value;

        await generateAIWorkouts(
          time === "all"
            ? Number(user.minutes)
            : Number(time),

          filter === "all"
            ? "Any"
            : filter
        );
      }
    );

    $("availableTime").addEventListener(
      "change",
      renderWorkouts
    );

    document.querySelectorAll(
      ".chip"
    ).forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(
          ".chip"
        ).forEach(c => {
          c.classList.remove("selected");
        });

        button.classList.add("selected");
        filter = button.dataset.filter;

        renderWorkouts();
      });
    });

    // Exercise timer.
    $("pauseWorkout").addEventListener(
      "click",
      pauseWorkout
    );

    $("nextExercise").addEventListener(
      "click",
      nextExercise
    );

    $("finishWorkout").addEventListener(
      "click",
      finishWorkout
    );

    $("exitWorkout").addEventListener(
      "click",
      () => {
        clearTimer();
        activeWorkout = null;
        showPage("workouts");
      }
    );

    // Profile.
    $("editProfile").addEventListener(
      "click",
      () => {
        populateSetup();
        showPage("setup");
      }
    );

    $("logout").addEventListener(
      "click",
      signOut
    );

    // Restore session.
    try {
      const { data, error } =
        await supabaseClient.auth.getSession();

      if (error) throw error;

      if (recoveryMode) {
        if (data.session) {
          showPage("reset");
        } else {
          showPage("login");

          $("authMessage").textContent =
            "That reset link is invalid or expired. " +
            "Request another email.";

          recoveryMode = false;
        }
      } else if (data.session?.user) {
        await handleAuthenticatedUser(
          data.session.user
        );
      } else {
        showPage("welcome");
      }
    } catch (error) {
      console.error(
        "Session restore:",
        error
      );

      if (recoveryMode) {
        showPage("reset");

        $("resetMessage").textContent =
          "Unable to verify your reset link.";
      } else {
        showPage("welcome");
      }
    }
  }
);
