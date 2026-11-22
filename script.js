// ============================================
// FITFLOW - COMPLETE JAVASCRIPT
// GEMINI AI + SUPABASE
// ============================================


// ============================================
// 1. SUPABASE CONNECTION
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
// 2. APPLICATION STATE
// ============================================

// Gemini generates workouts dynamically.
// No hardcoded workout library.
let workouts = [];

let currentUser = null;
let currentEmail = "";
let user = null;

let historyCache = [];

let filter = "all";
let recommendationOffset = 0;

let generatingWorkouts = false;
let activeWorkout = null;

let exerciseIndex = 0;
let secondsLeft = 0;
let completedSeconds = 0;

let interval = null;
let running = false;

let toastTimeout = null;
let authBusy = false;
let authGeneration = 0;


// ============================================
// 3. PAGE NAVIGATION
// ============================================

function showPage(page) {

  const publicPages = [
    "welcome",
    "login",
    "setup"
  ];

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

  if (page === "home") {
    updateDashboard();
  }

  if (page === "workouts") {
    renderWorkouts();
  }

  if (page === "progress") {
    renderProgress();
  }

  if (page === "profile") {
    renderProfile();
  }
}


// ============================================
// 4. NOTIFICATIONS
// ============================================

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
// 5. SUPABASE SIGNUP
// ============================================

async function signUp() {

  if (authBusy) return;

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  const message = $("authMessage");

  if (!email || password.length < 6) {

    message.textContent =
      "Enter a valid email and a password of at least 6 characters.";

    return;
  }

  authBusy = true;
  message.textContent = "Creating your account...";

  try {

    const { data, error } =
      await supabaseClient.auth.signUp({
        email,
        password
      });

    if (error) throw error;

    if (data.session && data.user) {

      await handleAuthenticatedUser(data.user);

      toast("Account created successfully!");

    } else {

      message.textContent =
        "Check your email to confirm your account, then log in.";

    }

  } catch (error) {

    console.error("Signup error:", error);

    message.textContent = error.message;

  } finally {

    authBusy = false;

  }
}


// ============================================
// 6. SUPABASE LOGIN
// ============================================

async function signIn(event) {

  event.preventDefault();

  if (authBusy) return;

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  const message = $("authMessage");

  authBusy = true;
  message.textContent = "Signing in...";

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    await handleAuthenticatedUser(data.user);

    message.textContent = "";

    toast("Welcome back to FITFLOW!");

  } catch (error) {

    console.error("Login error:", error);

    message.textContent = error.message;

  } finally {

    authBusy = false;

  }
}


// ============================================
// 7. LOGOUT
// ============================================

async function signOut() {

  try {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) throw error;

    authGeneration++;

    clearTimer();

    currentUser = null;
    currentEmail = "";
    user = null;

    workouts = [];
    historyCache = [];

    activeWorkout = null;
    recommendationOffset = 0;

    $("loginForm").reset();

    showPage("welcome");

    toast("You have been logged out.");

  } catch (error) {

    console.error("Logout error:", error);

    toast(error.message);

  }
}


// ============================================
// 8. LOAD AUTHENTICATED USER
// ============================================

async function handleAuthenticatedUser(authUser) {

  if (!authUser) return;

  const generation = ++authGeneration;

  currentUser = authUser;
  currentEmail = authUser.email || "";

  const saved =
    authUser.user_metadata?.fitflow || {};

  user = {

    name: saved.name || "",

    goal: saved.goal || "",

    favorite: saved.favorite || "",

    level: saved.level || "",

    minutes: saved.minutes || "10",

    limitations: saved.limitations || "",

    setupComplete: saved.setupComplete || false

  };

  workouts = [];
  historyCache = [];
  recommendationOffset = 0;

  await loadWorkouts();

  if (generation !== authGeneration) return;

  if (user.setupComplete) {

    $("availableTime").value = String(user.minutes);

    showPage("home");

    // Generate AI workouts after login.
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
// 9. SAVE USER PROFILE
// ============================================

async function saveProfile() {

  if (!currentUser || !user) return false;

  try {

    const { data, error } =
      await supabaseClient.auth.updateUser({

        data: {

          fitflow: {

            name: user.name,
            goal: user.goal,
            favorite: user.favorite,
            level: user.level,
            minutes: user.minutes,
            limitations: user.limitations,
            setupComplete: true

          }

        }

      });

    if (error) throw error;

    currentUser = data.user;
    user.setupComplete = true;

    return true;

  } catch (error) {

    console.error("Profile save error:", error);

    toast("Could not save your profile.");

    return false;

  }
}


// ============================================
// 10. LOAD PROFILE INTO SETUP FORM
// ============================================

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
// 11. GEMINI AI WORKOUT GENERATION
// ============================================

// Calls the Supabase Edge Function.
//
// The Edge Function securely calls Gemini.
//
// Do not put your Gemini API key in this file.

async function generateAIWorkouts(
  selectedMinutes = null,
  selectedType = "Any"
) {

  if (!user || !currentUser || generatingWorkouts) {
    return false;
  }

  generatingWorkouts = true;

  const requestingUserId = currentUser.id;
  const requestingGeneration = authGeneration;

  const swapButton = $("swapRecommended");
  const updateButton = $("updateWorkouts");

  swapButton.disabled = true;
  updateButton.disabled = true;

  toast("Gemini is generating your workouts...");

  try {

    const minutes =
      selectedMinutes ?? Number(user.minutes || 10);

    const { data, error } =
      await supabaseClient.functions.invoke(
        "generate-workout",
        {
          body: {

            goal: user.goal,

            favorite: user.favorite,

            level: user.level,

            minutes: minutes,

            type: selectedType,

            // Do not send medical details to the API.
            hasLimitations: Boolean(
              user.limitations?.trim()
            )

          }
        }
      );

    if (
      requestingGeneration !== authGeneration ||
      currentUser?.id !== requestingUserId
    ) {
      return false;
    }

    if (error) {

      let message = error.message;

      if (error.context) {

        try {

          const details = await error.context.json();

          message = details.error || message;

        } catch (_) {

          // Keep the original error message.

        }

      }

      throw new Error(message);
    }

    if (
      !data ||
      !Array.isArray(data.workouts) ||
      data.workouts.length === 0
    ) {

      throw new Error(
        "Gemini returned no workouts."
      );

    }

    const validTypes = [
      "Strength",
      "Cardio",
      "Core",
      "Flexibility",
      "Full Body"
    ];

    const validWorkouts = data.workouts.filter(workout => {

      return (

        typeof workout.id === "string" &&

        typeof workout.title === "string" &&

        validTypes.includes(workout.type) &&

        Number(workout.minutes) > 0 &&

        Number(workout.minutes) <= 60 &&

        Array.isArray(workout.exercises) &&

        workout.exercises.length > 0 &&

        workout.exercises.every(exercise => (

          Array.isArray(exercise) &&

          exercise.length >= 3 &&

          typeof exercise[0] === "string" &&

          Number.isInteger(exercise[1]) &&

          exercise[1] > 0 &&

          typeof exercise[2] === "string"

        ))

      );

    });

    if (!validWorkouts.length) {

      throw new Error(
        "Gemini returned invalid workout data."
      );

    }

    // Use the generated workouts.
    workouts = validWorkouts;

    recommendationOffset = 0;

    // Reset category filters after a new AI request.
    if (selectedType === "Any") {

      filter = "all";

      document.querySelectorAll(".chip").forEach(chip => {
        chip.classList.toggle(
          "selected",
          chip.dataset.filter === "all"
        );
      });

    }

    // Match workout explorer duration to the AI output.
    $("availableTime").value = String(minutes);

    if (!$("home").hidden) {
      updateDashboard();
    }

    if (!$("workouts").hidden) {
      renderWorkouts();
    }

    toast("Your AI workouts are ready!");

    return true;

  } catch (error) {

    console.error("Gemini API error:", error);

    toast(
      error.message ||
      "Could not generate AI workouts."
    );

    return false;

  } finally {

    generatingWorkouts = false;

    swapButton.disabled = false;
    updateButton.disabled = false;

  }
}


// ============================================
// 12. WORKOUT RECOMMENDATIONS
// ============================================

function suitableWorkouts(maxMinutes = Infinity) {

  if (!user) return [];

  const levels = {

    Beginner: 1,
    Intermediate: 2,
    Advanced: 3

  };

  const userLevel = levels[user.level] || 1;

  const matches = workouts.filter(workout => {

    if (workout.minutes > maxMinutes) {
      return false;
    }

    if (
      (levels[workout.level] || 1) > userLevel
    ) {
      return false;
    }

    return true;

  });

  return matches.sort((a, b) => {

    function score(workout) {

      let points = 0;

      if (workout.type === user.favorite) {
        points += 10;
      }

      if (
        user.goal === "Build muscle" &&
        workout.type === "Strength"
      ) {
        points += 7;
      }

      if (
        user.goal === "Improve endurance" &&
        workout.type === "Cardio"
      ) {
        points += 7;
      }

      if (
        user.goal === "Lose weight" &&
        workout.type === "Cardio"
      ) {
        points += 5;
      }

      if (
        workout.minutes === Number(user.minutes)
      ) {
        points += 5;
      }

      return points;

    }

    return score(b) - score(a);

  });
}


// ============================================
// 13. GET RECOMMENDED WORKOUT
// ============================================

function recommendedWorkout() {

  if (!workouts.length) return null;

  // The AI generated the workout options.
  // Rank those options by user preferences.
  const options = suitableWorkouts(Infinity);

  if (!options.length) return null;

  return options[
    recommendationOffset % options.length
  ];
}


// ============================================
// 14. UPDATE HOME DASHBOARD
// ============================================

function updateDashboard() {

  if (!user) return;

  $("greetingName").textContent =
    user.name || "Athlete";

  const workout = recommendedWorkout();

  if (workout) {

    $("recommendIcon").textContent =
      workout.icon || "💪";

    $("recommendType").textContent =
      workout.type.toUpperCase();

    $("recommendTitle").textContent =
      workout.title;

    $("recommendDetails").textContent =
      `${workout.minutes} minutes · No equipment`;

    $("startRecommended").disabled = false;

  } else {

    $("recommendIcon").textContent = "✨";

    $("recommendType").textContent =
      "AI RECOMMENDATION";

    $("recommendTitle").textContent =
      generatingWorkouts
        ? "Generating your workout..."
        : "No workout available yet";

    $("recommendDetails").textContent =
      generatingWorkouts
        ? "Gemini is preparing your recommendations."
        : "Click Try Another to generate workouts.";

    $("startRecommended").disabled = true;

  }

  const current = todayMinutes();

  const goal = Math.max(
    1,
    Number(user.minutes) || 10
  );

  const percent = Math.min(
    100,
    Math.round((current / goal) * 100)
  );

  $("progressPercent").textContent =
    `${percent}%`;

  $("progressRing").style.setProperty(
    "--percent",
    `${percent}%`
  );

  $("progressMinutes").textContent =
    `${current} / ${goal} min`;

  $("homeWorkouts").textContent =
    historyCache.length;

  $("homeMinutes").textContent =
    totalMinutes();

  $("homeStreak").textContent =
    streak();
}


// ============================================
// 15. WORKOUT EXPLORER
// ============================================

function renderWorkouts() {

  if (!user) return;

  const selectedTime = $("availableTime").value;

  const maxMinutes = selectedTime === "all"
    ? Infinity
    : Number(selectedTime);

  const matches = suitableWorkouts(
    maxMinutes
  ).filter(workout => {

    return filter === "all" ||
      workout.type === filter;

  });

  const list = $("workoutList");

  list.innerHTML = "";

  if (!matches.length) {

    const panel = document.createElement("div");

    panel.className = "panel";

    panel.textContent = generatingWorkouts
      ? "Gemini is generating workouts..."
      : "No matching workouts. Select a duration and click Update Workouts to generate more.";

    list.appendChild(panel);

    return;
  }

  matches.forEach(workout => {

    const card = document.createElement("article");
    card.className = "workout-card";

    const art = document.createElement("div");
    art.className = "workout-card-art";
    art.textContent = workout.icon || "💪";

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

    button.addEventListener("click", () => {
      startWorkout(workout.id);
    });

    body.append(
      type,
      title,
      details,
      button
    );

    card.append(
      art,
      body
    );

    list.appendChild(card);

  });
}


// ============================================
// 16. WORKOUT TIMER
// ============================================

function formatTime(seconds) {

  const safeSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes =
    Math.floor(safeSeconds / 60);

  const remaining =
    safeSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remaining).padStart(2, "0")
  );
}


// ============================================
// 17. CLEAR TIMER
// ============================================

function clearTimer() {

  clearInterval(interval);

  interval = null;

  running = false;
}


// ============================================
// 18. DISPLAY CURRENT EXERCISE
// ============================================

function renderExercise() {

  if (!activeWorkout) return;

  const exercise =
    activeWorkout.exercises[exerciseIndex];

  if (!exercise) return;

  $("sessionTitle").textContent =
    activeWorkout.title;

  $("sessionStep").textContent =
    `Exercise ${exerciseIndex + 1} of ` +
    activeWorkout.exercises.length;

  $("exerciseIcon").textContent =
    activeWorkout.icon || "💪";

  $("exerciseName").textContent =
    exercise[0];

  $("exerciseInfo").textContent =
    exercise[2];

  $("timerDisplay").textContent =
    formatTime(secondsLeft);

  $("pauseWorkout").textContent =
    running ? "Pause" : "Resume";
}


// ============================================
// 19. START WORKOUT
// ============================================

function startWorkout(id) {

  const workout = workouts.find(
    item => item.id === id
  );

  if (!workout) {

    toast("Workout could not be found.");

    return;
  }

  clearTimer();

  activeWorkout = workout;

  exerciseIndex = 0;

  secondsLeft =
    workout.exercises[0][1];

  completedSeconds = 0;

  showPage("session");

  renderExercise();

  resumeWorkout();
}


// ============================================
// 20. RESUME WORKOUT
// ============================================

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

      $("timerDisplay").textContent =
        formatTime(secondsLeft);

    }

  }, 1000);
}


// ============================================
// 21. PAUSE WORKOUT
// ============================================

function pauseWorkout() {

  if (!activeWorkout) return;

  if (running) {

    clearTimer();

    $("pauseWorkout").textContent =
      "Resume";

  } else {

    resumeWorkout();

  }
}


// ============================================
// 22. NEXT EXERCISE
// ============================================

function nextExercise() {

  if (!activeWorkout) return;

  clearTimer();

  exerciseIndex++;

  if (
    exerciseIndex >=
    activeWorkout.exercises.length
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
// 23. FINISH WORKOUT
// ============================================

async function finishWorkout() {

  if (!activeWorkout) return;

  clearTimer();

  const completedTitle =
    activeWorkout.title;

  const earnedMinutes = Math.floor(
    completedSeconds / 60
  );

  activeWorkout = null;

  if (earnedMinutes > 0) {

    toast("Saving your workout...");

    const saved = await saveWorkout(
      completedTitle,
      earnedMinutes
    );

    if (saved) {

      toast(
        "Great work! Your workout was saved."
      );

    }

  } else {

    toast(
      "Workout ended before a full minute was completed."
    );

  }

  showPage("progress");
}


// ============================================
// 24. SAVE WORKOUT TO SUPABASE
// ============================================

async function saveWorkout(name, minutes) {

  if (!currentUser) {

    toast("Please log in first.");

    return false;
  }

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

    console.error("Workout save error:", error);

    toast(
      "Could not save workout: " +
      error.message
    );

    return false;

  }
}


// ============================================
// 25. LOAD WORKOUT HISTORY
// ============================================

async function loadWorkouts() {

  if (!currentUser) return;

  const requestedUserId = currentUser.id;

  try {

    const { data, error } = await supabaseClient
      .from("workouts")
      .select("*")
      .eq("user_id", requestedUserId)
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    if (currentUser?.id !== requestedUserId) {
      return;
    }

    historyCache = (data || []).map(entry => ({

      id: entry.id,

      date: dateKey(
        new Date(entry.created_at)
      ),

      title: entry.workout_name,

      minutes: Number(entry.duration) || 0

    }));

  } catch (error) {

    console.error(
      "Workout history error:",
      error
    );

    if (currentUser?.id === requestedUserId) {
      historyCache = [];

      toast(
        "Could not load workout history."
      );
    }

  }
}


// ============================================
// 26. DATE HELPER
// ============================================

function dateKey(date = new Date()) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ============================================
// 27. TOTAL WORKOUT MINUTES
// ============================================

function totalMinutes() {

  return historyCache.reduce(
    (total, entry) =>
      total + entry.minutes,
    0
  );
}


// ============================================
// 28. TODAY'S WORKOUT MINUTES
// ============================================

function todayMinutes() {

  return historyCache
    .filter(entry =>
      entry.date === dateKey()
    )
    .reduce(
      (total, entry) =>
        total + entry.minutes,
      0
    );
}


// ============================================
// 29. WORKOUT STREAK
// ============================================

function streak() {

  const dates = new Set(

    historyCache
      .filter(entry => entry.minutes > 0)
      .map(entry => entry.date)

  );

  let day = new Date();

  if (!dates.has(dateKey(day))) {

    day.setDate(
      day.getDate() - 1
    );

  }

  let count = 0;

  while (dates.has(dateKey(day))) {

    count++;

    day.setDate(
      day.getDate() - 1
    );

  }

  return count;
}


// ============================================
// 30. RENDER PROGRESS PAGE
// ============================================

function renderProgress() {

  $("totalWorkouts").textContent =
    historyCache.length;

  $("totalMinutes").textContent =
    totalMinutes();

  $("totalStreak").textContent =
    streak();

  const list = $("historyList");

  list.innerHTML = "";

  if (!historyCache.length) {

    const message =
      document.createElement("p");

    message.className = "muted";

    message.textContent =
      "Your first workout is waiting for you!";

    list.appendChild(message);

    return;
  }

  historyCache.forEach(entry => {

    const row =
      document.createElement("div");

    row.className = "history-item";

    const information =
      document.createElement("div");

    const title =
      document.createElement("strong");

    title.textContent = entry.title;

    const date =
      document.createElement("div");

    date.className = "muted";

    date.textContent = entry.date;

    const duration =
      document.createElement("strong");

    duration.textContent =
      `${entry.minutes} min`;

    information.append(
      title,
      date
    );

    row.append(
      information,
      duration
    );

    list.appendChild(row);

  });
}


// ============================================
// 31. RENDER PROFILE PAGE
// ============================================

function renderProfile() {

  if (!user) return;

  $("profileName").textContent =
    user.name || "Athlete";

  $("profileEmail").textContent =
    currentEmail;

  $("profileSummary").textContent =

    `Goal: ${user.goal}\n` +

    `Favorite workout: ${user.favorite}\n` +

    `Fitness level: ${user.level}\n` +

    `Available time: ${user.minutes} minutes\n` +

    `Limitations: ${
      user.limitations || "None provided"
    }`;

  $("profileSummary").style.whiteSpace =
    "pre-line";
}


// ============================================
// 32. EVENT LISTENERS
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    // ========================================
    // WELCOME SCREEN
    // ========================================

    $("getStarted").addEventListener(
      "click",
      () => {

        showPage("login");

      }
    );

    $("backWelcome").addEventListener(
      "click",
      () => {

        showPage("welcome");

      }
    );


    // ========================================
    // LOGIN AND SIGNUP
    // ========================================

    $("loginForm").addEventListener(
      "submit",
      signIn
    );

    $("signupButton").addEventListener(
      "click",
      signUp
    );


    // ========================================
    // SAVE PROFILE
    // ========================================

    $("setupForm").addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        if (!user) return;

        user.name =
          $("userName").value.trim();

        user.goal =
          $("goal").value;

        user.level =
          $("fitnessLevel").value;

        user.favorite =
          $("favorite").value;

        user.minutes =
          $("minutes").value;

        user.limitations =
          $("limitations").value.trim();

        const saved =
          await saveProfile();

        if (!saved) return;

        recommendationOffset = 0;

        $("availableTime").value =
          user.minutes;

        workouts = [];

        showPage("home");

        // Generate Gemini workouts.
        await generateAIWorkouts(
          Number(user.minutes),
          "Any"
        );

      }
    );


    // ========================================
    // NAVIGATION
    // ========================================

    document.querySelectorAll(
      "nav button"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (activeWorkout) {

            clearTimer();

            activeWorkout = null;

          }

          showPage(
            button.dataset.page
          );

        }
      );

    });


    // ========================================
    // FIND WORKOUT
    // ========================================

    $("findWorkout").addEventListener(
      "click",
      () => {

        $("availableTime").value =
          String(user.minutes);

        showPage("workouts");

      }
    );


    // ========================================
    // START RECOMMENDED WORKOUT
    // ========================================

    $("startRecommended").addEventListener(
      "click",
      () => {

        const workout =
          recommendedWorkout();

        if (workout) {

          startWorkout(workout.id);

        }

      }
    );


    // ========================================
    // TRY ANOTHER - GEMINI AI
    // ========================================

    $("swapRecommended").addEventListener(
      "click",
      async () => {

        await generateAIWorkouts(
          Number(user.minutes),
          "Any"
        );

      }
    );


    // ========================================
    // UPDATE WORKOUTS - GEMINI AI
    // ========================================

    $("updateWorkouts").addEventListener(
      "click",
      async () => {

        const selected =
          $("availableTime").value;

        const minutes =
          selected === "all"
            ? Number(user.minutes)
            : Number(selected);

        await generateAIWorkouts(
          minutes,
          filter === "all"
            ? "Any"
            : filter
        );

      }
    );


    // ========================================
    // WORKOUT DURATION FILTER
    // ========================================

    $("availableTime").addEventListener(
      "change",
      renderWorkouts
    );


    // ========================================
    // WORKOUT CATEGORY FILTERS
    // ========================================

    document.querySelectorAll(
      ".chip"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document.querySelectorAll(
            ".chip"
          ).forEach(chip => {

            chip.classList.remove(
              "selected"
            );

          });

          button.classList.add(
            "selected"
          );

          filter =
            button.dataset.filter;

          renderWorkouts();

        }
      );

    });


    // ========================================
    // WORKOUT TIMER CONTROLS
    // ========================================

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


    // ========================================
    // EXIT WORKOUT
    // ========================================

    $("exitWorkout").addEventListener(
      "click",
      () => {

        clearTimer();

        activeWorkout = null;

        showPage("workouts");

      }
    );


    // ========================================
    // EDIT PROFILE
    // ========================================

    $("editProfile").addEventListener(
      "click",
      () => {

        populateSetup();

        showPage("setup");

      }
    );


    // ========================================
    // LOGOUT
    // ========================================

    $("logout").addEventListener(
      "click",
      signOut
    );


    // ========================================
    // RESTORE EXISTING LOGIN
    // ========================================

    try {

      const { data, error } =
        await supabaseClient.auth.getSession();

      if (error) throw error;

      if (data.session?.user) {

        await handleAuthenticatedUser(
          data.session.user
        );

      } else {

        showPage("welcome");

      }

    } catch (error) {

      console.error(
        "Session restoration error:",
        error
      );

      showPage("welcome");

      toast(
        "Unable to restore your login session."
      );

    }

  }
);
