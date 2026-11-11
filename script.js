
/* ==========================================
   FITFLOW - MAIN JAVASCRIPT
   ========================================== */

// State and workout data

const STORAGE_KEY = "fitflow_data_v2";

const workoutsData = [
    {
        id: 1,
        title: "Full Body Strength",
        type: "strength",
        duration: 30,
        level: "Beginner",
        desc: "Build strength and improve your fitness.",
        exercises: [
            "Squats",
            "Push-ups",
            "Lunges",
            "Plank",
            "Glute Bridges",
            "Mountain Climbers"
        ]
    },
    {
        id: 2,
        title: "Morning Cardio Boost",
        type: "cardio",
        duration: 15,
        level: "Intermediate",
        desc: "Boost energy and improve your endurance.",
        exercises: [
            "Jumping Jacks",
            "High Knees",
            "Burpees",
            "Butt Kicks",
            "Skater Hops"
        ]
    },
    {
        id: 3,
        title: "Mobility & Flow",
        type: "yoga",
        duration: 20,
        level: "All Levels",
        desc: "Improve flexibility and reduce stiffness.",
        exercises: [
            "Cat-Cow",
            "Downward Dog",
            "Child's Pose",
            "Spinal Twist"
        ]
    },
    {
        id: 4,
        title: "Core & Stability",
        type: "strength",
        duration: 10,
        level: "Beginner",
        desc: "Strengthen your core and improve posture.",
        exercises: [
            "Plank Hold",
            "Bicycle Crunches",
            "Leg Raises",
            "Russian Twists"
        ]
    }
];

const defaultData = {
    name: "Tate",
    goal: "General Fitness",
    favoriteWorkout: "strength",
    streak: 0,
    calories: 0,
    steps: 0,
    activeMinutes: 0,
    completedWorkoutsCount: 0,
    totalMinutes: 0,
    completedToday: 0,
    lastWorkoutDate: null,
    activity: {}
};

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved
            ? { ...defaultData, ...JSON.parse(saved) }
            : { ...defaultData };
    } catch (error) {
        console.error("Unable to load saved data:", error);
        return { ...defaultData };
    }
}

let userStats = loadData();
let currentTab = "home";
let activeWorkout = null;
let activeExerciseIdx = 0;

let timerInterval = null;
let animationFrameId = null;
let timeLeft = 45;
let isPaused = false;
let animProgress = 0;
let currentSearch = "";
let workoutFinished = false;

const EXERCISE_SECONDS = 45;

// Date helpers

function todayKey() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function dateKeyOffset(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function syncToday() {
    userStats.completedToday =
        userStats.activity[todayKey()]?.count || 0;
}

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(userStats)
        );
    } catch (error) {
        console.error("Unable to save progress:", error);
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// NAVIGATION
// ==========================================

function switchTab(tab) {
    if (!["home", "workouts", "progress", "profile"].includes(tab)) {
        tab = "home";
    }

    stopWorkoutTimer();

    activeWorkout = null;
    currentTab = tab;
    currentSearch = "";

    document.querySelectorAll("[id^='nav-']").forEach(btn => {
        btn.classList.remove(
            "text-olive-600",
            "font-semibold"
        );
        btn.classList.add("text-[#5A4E38]");
    });

    const selected = document.getElementById(`nav-${tab}`);

    if (selected) {
        selected.classList.add(
            "text-olive-600",
            "font-semibold"
        );
    }

    renderContent();
    updateHeader();
}

function updateHeader() {
    const streak = document.getElementById("header-streak");

    if (streak) {
        streak.textContent =
            `${userStats.streak} ${userStats.streak === 1 ? "Day" : "Days"}`;
    }
}

// ==========================================
// DAILY GOALS AND RECOMMENDATIONS
// ==========================================

function dailyGoalPercent() {
    const activityProgress = Math.min(
        userStats.activeMinutes / 30,
        1
    );

    const workoutProgress = Math.min(
        userStats.completedToday,
        1
    );

    return Math.round(
        (activityProgress * 0.5 + workoutProgress * 0.5) * 100
    );
}

function recommendedWorkout() {
    const preferred = workoutsData.filter(
        workout => workout.type === userStats.favoriteWorkout
    );

    const choices = preferred.length
        ? preferred
        : workoutsData;

    const dayNumber = Math.floor(
        new Date().setHours(0, 0, 0, 0) / 86400000
    );

    return choices[dayNumber % choices.length];
}

function workoutEmoji(type) {
    const emojis = {
        strength: "💪",
        cardio: "🏃",
        yoga: "🧘"
    };

    return emojis[type] || "🏋️";
}

function workoutCard(workout) {
    const index = workoutsData.findIndex(
        item => item.id === workout.id
    );

    return `
        <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                    rounded-2xl p-4 shadow-sm
                    hover:border-[#6E7E44] transition">

            <div class="flex gap-4 items-center">

                <div class="w-16 h-16 bg-[#E8DEC9]
                            rounded-xl flex items-center
                            justify-center text-3xl">
                    ${workoutEmoji(workout.type)}
                </div>

                <div class="flex-1">

                    <p class="text-xs uppercase tracking-wide
                              text-[#6E7E44] font-semibold">
                        ${workout.type}
                    </p>

                    <h4 class="font-bold text-[#3D3323]">
                        ${workout.title}
                    </h4>

                    <p class="text-xs text-[#5A4E38] mt-1">
                        ${workout.duration} min • ${workout.level}
                    </p>
                </div>

                <button onclick="startWorkout(${index})"
                        class="bg-[#6E7E44] text-white
                               w-10 h-10 rounded-full">
                    ▶
                </button>

            </div>

            <p class="text-xs text-[#5A4E38] mt-3">
                ${workout.desc}
            </p>

        </div>
    `;
}

// ==========================================
// PAGE RENDERING
// ==========================================

function renderContent() {
    const container = document.getElementById("app-container");

    if (!container) {
        console.error("FITFLOW: #app-container was not found.");
        return;
    }

    syncToday();

    try {
        if (currentTab === "home") {
            renderHome(container);
        } else if (currentTab === "workouts") {
            renderWorkouts(container);
        } else if (currentTab === "progress") {
            renderProgress(container);
        } else if (currentTab === "profile") {
            renderProfile(container);
        }
    } catch (error) {
        console.error("FITFLOW render error:", error);

        container.innerHTML = `
            <div class="bg-white rounded-xl p-6 mt-6">
                <h2 class="font-bold text-xl">
                    Something went wrong
                </h2>

                <p class="text-sm mt-2">
                    Please refresh the page.
                </p>
            </div>
        `;
    }
}

// ==========================================
// HOME
// ==========================================

function renderHome(container) {
    const recommendation = recommendedWorkout();
    const percent = dailyGoalPercent();

    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">

            <div>
                <p class="text-sm text-[#5A4E38]">
                    Welcome back,
                </p>

                <h2 class="text-3xl font-serif font-bold
                           text-[#3D3323]">
                    ${escapeHTML(userStats.name)}.
                </h2>

                <p class="text-xs text-[#5A4E38] mt-1">
                    Every step counts. Keep moving!
                </p>
            </div>

            <!-- Daily progress -->
            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-2xl p-5 shadow-sm">

                <h3 class="font-serif font-bold text-lg mb-4">
                    Today's Progress
                </h3>

                <div class="flex items-center gap-5">

                    <div class="relative w-24 h-24 flex-shrink-0">

                        <svg viewBox="0 0 100 100"
                             class="w-full h-full -rotate-90">

                            <circle cx="50" cy="50" r="40"
                                    stroke="#E8DEC9"
                                    stroke-width="9"
                                    fill="none"/>

                            <circle cx="50" cy="50" r="40"
                                    stroke="#6E7E44"
                                    stroke-width="9"
                                    fill="none"
                                    stroke-linecap="round"
                                    stroke-dasharray="251.3"
                                    stroke-dashoffset="${251.3 * (1 - percent / 100)}"/>
                        </svg>

                        <div class="absolute inset-0
                                    flex items-center justify-center
                                    font-bold text-xl">
                            ${percent}%
                        </div>

                    </div>

                    <div class="flex-1 space-y-2 text-sm">

                        <p>🔥 <strong>${userStats.calories}</strong> kcal</p>

                        <p>👟 <strong>${userStats.steps.toLocaleString()}</strong> steps</p>

                        <p>⏱️ <strong>${userStats.activeMinutes}</strong> active min</p>

                        <p>✅ <strong>${userStats.completedToday}</strong> workouts today</p>

                    </div>

                </div>

                <p class="text-xs text-[#5A4E38] mt-4">
                    Daily target: Complete a workout and reach
                    30 active minutes.
                </p>

            </div>

            <!-- Recommendation -->
            <div class="space-y-3">

                <div class="flex justify-between items-center">

                    <h3 class="font-serif font-bold text-lg">
                        Recommended For You
                    </h3>

                    <span class="text-xs text-[#6E7E44]">
                        Personalized
                    </span>

                </div>

                ${workoutCard(recommendation)}

                <button onclick="changeRecommendation()"
                        class="w-full border border-[#D9CBA8]
                               rounded-xl py-3 text-sm
                               font-semibold text-[#5A4E38]">
                    🔄 Try Another Workout
                </button>

                <p class="text-xs text-[#5A4E38]">
                    Based on your favorite workout type:
                    ${userStats.favoriteWorkout}.
                </p>

            </div>

            <!-- Daily message -->
            <div class="bg-[#E8DEC9]/50 border border-[#D9CBA8]
                        rounded-2xl p-5 text-center">

                <p class="font-serif italic text-[#3D3323]">
                    "Stronger than yesterday."
                </p>

                <p class="text-xs text-[#5A4E38] mt-2">
                    Daily Motivation
                </p>

            </div>

        </div>
    `;
}

// Change recommended workout

function changeRecommendation() {
    const current = recommendedWorkout();

    const alternatives = workoutsData.filter(
        workout => workout.id !== current.id
    );

    if (alternatives.length === 0) return;

    const next = alternatives[
        Math.floor(Math.random() * alternatives.length)
    ];

    const index = workoutsData.findIndex(
        workout => workout.id === next.id
    );

    const container = document.getElementById("app-container");

    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">

            <button onclick="switchTab('home')"
                    class="text-sm text-[#5A4E38]">
                ← Back Home
            </button>

            <h2 class="text-2xl font-serif font-bold">
                Another Workout For You
            </h2>

            <p class="text-sm text-[#5A4E38]">
                Not feeling the previous workout?
                Try this instead!
            </p>

            ${workoutCard(next)}

            <button onclick="changeRecommendation()"
                    class="w-full bg-[#E8DEC9]
                           rounded-xl py-3 font-semibold">
                🔄 Suggest Another
            </button>

            <button onclick="switchTab('workouts')"
                    class="w-full border border-[#D9CBA8]
                           rounded-xl py-3">
                Browse All Workouts
            </button>

        </div>
    `;
}

// ==========================================
// WORKOUT LIBRARY
// ==========================================

function renderWorkouts(container) {
    container.innerHTML = `
        <div class="space-y-5 animate-fadeIn">

            <div>
                <h2 class="text-2xl font-serif font-bold">
                    Explore Workouts
                </h2>

                <p class="text-xs text-[#5A4E38] mt-1">
                    Find a workout that fits your goals.
                </p>
            </div>

            <input
                id="workout-search"
                type="search"
                placeholder="Search workouts..."
                oninput="filterWorkouts(this.value)"
                class="w-full bg-[#FAF8F5]
                       border border-[#E8DEC9]
                       rounded-xl px-4 py-3 text-sm"
            >

            <div class="flex gap-2 flex-wrap">

                <button onclick="filterWorkouts('')"
                        class="px-3 py-2 bg-[#E8DEC9] rounded-lg text-xs">
                    All
                </button>

                <button onclick="filterWorkouts('strength')"
                        class="px-3 py-2 bg-[#E8DEC9] rounded-lg text-xs">
                    💪 Strength
                </button>

                <button onclick="filterWorkouts('cardio')"
                        class="px-3 py-2 bg-[#E8DEC9] rounded-lg text-xs">
                    🏃 Cardio
                </button>

                <button onclick="filterWorkouts('yoga')"
                        class="px-3 py-2 bg-[#E8DEC9] rounded-lg text-xs">
                    🧘 Yoga
                </button>

            </div>

            <div id="workout-list" class="space-y-3"></div>

        </div>
    `;

    filterWorkouts(currentSearch);
}

function filterWorkouts(query) {
    currentSearch = query;

    const list = document.getElementById("workout-list");

    if (!list) return;

    const filtered = workoutsData.filter(workout => {
        const search = query.toLowerCase();

        return (
            workout.title.toLowerCase().includes(search) ||
            workout.type.toLowerCase().includes(search) ||
            workout.desc.toLowerCase().includes(search)
        );
    });

    list.innerHTML = filtered.length
        ? filtered.map(workoutCard).join("")
        : `
            <div class="text-center p-8 text-sm text-[#5A4E38]">
                No workouts found.
            </div>
        `;
}

// ==========================================
// WORKOUT PLAYER
// ==========================================

function startWorkout(index) {
    const selected = workoutsData[index];

    if (!selected) return;

    stopWorkoutTimer();

    activeWorkout = selected;
    activeExerciseIdx = 0;
    timeLeft = EXERCISE_SECONDS;
    isPaused = false;
    workoutFinished = false;
    animProgress = 0;

    renderWorkoutPlayer();
    startWorkoutTimer();
}

function renderWorkoutPlayer() {
    const container = document.getElementById("app-container");

    const exercise =
        activeWorkout.exercises[activeExerciseIdx];

    container.innerHTML = `
        <div class="space-y-5 animate-fadeIn">

            <div class="flex justify-between items-center">

                <button onclick="switchTab('workouts')"
                        class="bg-[#FAF8F5] border
                               border-[#E8DEC9] rounded-xl p-3">
                    ← Back
                </button>

                <h2 class="font-serif font-bold text-lg">
                    ${activeWorkout.title}
                </h2>

            </div>

            <div class="space-y-2">

                <div class="flex justify-between text-xs">
                    <span>
                        Exercise
                        ${activeExerciseIdx + 1}
                        of ${activeWorkout.exercises.length}
                    </span>

                    <span>${exercise}</span>
                </div>

                <div class="bg-[#E8DEC9] h-2 rounded-full">

                    <div class="bg-[#6E7E44] h-2 rounded-full"
                         style="width:${
                            ((activeExerciseIdx + 1) /
                            activeWorkout.exercises.length) * 100
                         }%">
                    </div>

                </div>

            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-3xl p-6 text-center space-y-5">

                <div class="bg-[#E8DEC9]/40 rounded-2xl
                            w-full h-56 flex items-center
                            justify-center">

                    <canvas id="active-canvas"
                            width="280" height="210"
                            style="max-width:100%;">
                    </canvas>

                </div>

                <div>
                    <h3 class="text-2xl font-serif font-bold">
                        ${exercise}
                    </h3>

                    <p class="text-xs text-[#5A4E38] mt-2">
                        Follow the movement and maintain proper form.
                    </p>

                    <p class="text-xs text-[#5A4E38]">
                        Animated exercise illustration
                    </p>
                </div>

                <div id="timer-display"
                     class="text-5xl font-serif font-bold
                            text-[#3D3323]">
                    0:45
                </div>

                <div class="flex gap-3">

                    <button id="pause-btn"
                            onclick="togglePause()"
                            class="flex-1 bg-[#E8DEC9]
                                   rounded-xl py-3 font-semibold">
                        Pause
                    </button>

                    <button onclick="nextExercise()"
                            class="flex-1 bg-[#6E7E44]
                                   text-white rounded-xl
                                   py-3 font-semibold">
                        Next →
                    </button>

                </div>

            </div>

        </div>
    `;
}

// ==========================================
// TIMER
// ==========================================

function startWorkoutTimer() {
    stopWorkoutTimer();

    animationFrameId = requestAnimationFrame(
        animateExercise
    );

    timerInterval = setInterval(() => {
        if (isPaused || !activeWorkout) return;

        timeLeft--;

        updateTimerDisplay();

        if (timeLeft <= 0) {
            nextExercise();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById("timer-display");

    if (!display) return;

    const mins = Math.floor(Math.max(0, timeLeft) / 60);
    const secs = Math.max(0, timeLeft) % 60;

    display.textContent =
        `${mins}:${String(secs).padStart(2, "0")}`;
}

function togglePause() {
    if (!activeWorkout) return;

    isPaused = !isPaused;

    const button = document.getElementById("pause-btn");

    if (button) {
        button.textContent = isPaused ? "Resume" : "Pause";
    }
}

function nextExercise() {
    if (!activeWorkout || workoutFinished) return;

    stopWorkoutTimer();

    activeExerciseIdx++;

    if (activeExerciseIdx >= activeWorkout.exercises.length) {
        completeWorkout();
        return;
    }

    timeLeft = EXERCISE_SECONDS;
    isPaused = false;

    renderWorkoutPlayer();
    startWorkoutTimer();
}

function stopWorkoutTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// ==========================================
// EXERCISE ANIMATIONS
// ==========================================

function animateExercise() {
    if (!activeWorkout) return;

    if (!isPaused) {
        animProgress += 0.04;
    }

    const exercise =
        activeWorkout.exercises[activeExerciseIdx];

    drawStickFigure(
        "active-canvas",
        exercise,
        animProgress
    );

    animationFrameId = requestAnimationFrame(
        animateExercise
    );
}

function drawStickFigure(canvasId, exerciseName, progress) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Ground
    ctx.strokeStyle = "#D9CBA8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(25, h - 25);
    ctx.lineTo(w - 25, h - 25);
    ctx.stroke();

    // Movement phase
    const motion = Math.sin(progress);
    const name = exerciseName.toLowerCase();

    const isSquat = name.includes("squat");
    const isJump = (
        name.includes("jump") ||
        name.includes("high knee") ||
        name.includes("butt kick") ||
        name.includes("skater")
    );

    const isPlank = (
        name.includes("plank") ||
        name.includes("push") ||
        name.includes("mountain climber")
    );

    const isYoga = (
        name.includes("dog") ||
        name.includes("pose") ||
        name.includes("cat-cow") ||
        name.includes("stretch")
    );

    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);

    ctx.strokeStyle = "#3D3323";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function line(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function head(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (isPlank) {
        const movement = name.includes("push")
            ? motion * 8
            : 0;

        head(-55, 15 + movement);

        line(-43, 18 + movement, 38, 0);

        line(-32, 15 + movement, -30, 65);

        line(38, 0, 57, 65);

        line(38, 0, 72, 65);

    } else if (isYoga) {
        const movement = motion * 5;

        head(-42, 15 + movement);

        line(-30, 20 + movement, 10, -30);

        line(10, -30, 55, 30);

        line(-30, 20 + movement, -55, 65);

        line(55, 30, 65, 65);

    } else {
        const bounce = isJump
            ? Math.abs(motion) * 24
            : 0;

        const squatDepth = isSquat
            ? Math.max(0, motion) * 25
            : 0;

        ctx.translate(0, squatDepth - bounce);

        head(0, -65);

        line(0, -52, 0, -5);

        const armSwing = motion * 20;

        line(0, -40, -25 - armSwing, -10);
        line(0, -40, 25 + armSwing, -10);

        if (isSquat) {
            line(0, -5, -30, 15);
            line(-30, 15, -35, 55 - squatDepth);

            line(0, -5, 30, 15);
            line(30, 15, 35, 55 - squatDepth);
        } else {
            const legSwing = motion * 15;

            line(0, -5, -18 - legSwing, 55);
            line(0, -5, 18 + legSwing, 55);
        }
    }

    ctx.restore();
}

// ==========================================
// COMPLETE WORKOUT
// ==========================================

function completeWorkout() {
    if (workoutFinished || !activeWorkout) return;

    workoutFinished = true;
    stopWorkoutTimer();

    const workout = activeWorkout;
    const today = todayKey();
    const yesterday = dateKeyOffset(-1);

    // Estimate only, not measured calorie expenditure
    const estimatedCalories = Math.round(
        workout.duration * 5
    );

    if (userStats.lastWorkoutDate !== today) {
        if (userStats.lastWorkoutDate === yesterday) {
            userStats.streak++;
        } else {
            userStats.streak = 1;
        }
    }

    userStats.lastWorkoutDate = today;

    userStats.completedWorkoutsCount++;
    userStats.activeMinutes += workout.duration;
    userStats.totalMinutes += workout.duration;
    userStats.calories += estimatedCalories;

    if (!userStats.activity[today]) {
        userStats.activity[today] = {
            count: 0,
            minutes: 0
        };
    }

    userStats.activity[today].count++;
    userStats.activity[today].minutes += workout.duration;

    syncToday();
    saveData();
    updateHeader();

    const container = document.getElementById("app-container");

    container.innerHTML = `
        <div class="space-y-6 py-10 text-center animate-fadeIn">

            <div class="text-6xl">🏆</div>

            <h2 class="text-3xl font-serif font-bold">
                Workout Complete!
            </h2>

            <p class="text-[#5A4E38]">
                Amazing work! You completed
                ${workout.title}.
            </p>

            <div class="grid grid-cols-2 gap-4">

                <div class="bg-[#FAF8F5] rounded-2xl p-5">
                    <p class="text-2xl font-bold">
                        ${workout.duration}
                    </p>
                    <p class="text-xs">Minutes</p>
                </div>

                <div class="bg-[#FAF8F5] rounded-2xl p-5">
                    <p class="text-2xl font-bold">
                        ~${estimatedCalories}
                    </p>
                    <p class="text-xs">Estimated kcal</p>
                </div>

            </div>

            <button onclick="switchTab('home')"
                    class="w-full bg-[#6E7E44] text-white
                           rounded-xl py-4 font-semibold">
                Return Home
            </button>

            <button onclick="switchTab('progress')"
                    class="w-full bg-[#E8DEC9]
                           rounded-xl py-4 font-semibold">
                View Progress
            </button>

        </div>
    `;

    activeWorkout = null;
}

// ==========================================
// PROGRESS PAGE
// ==========================================

function renderProgress(container) {
    const week = [];

    for (let i = 6; i >= 0; i--) {
        const date = dateKeyOffset(-i);
        const dateObj = new Date();

        dateObj.setDate(dateObj.getDate() - i);

        week.push({
            label: dateObj.toLocaleDateString("en-US", {
                weekday: "short"
            }),
            minutes: userStats.activity[date]?.minutes || 0
        });
    }

    const maxMinutes = Math.max(
        30,
        ...week.map(day => day.minutes)
    );

    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">

            <div>
                <h2 class="text-2xl font-serif font-bold">
                    Your Progress
                </h2>

                <p class="text-xs text-[#5A4E38]">
                    Track your fitness journey.
                </p>
            </div>

            <div class="grid grid-cols-2 gap-3">

                ${statCard("✅", userStats.completedWorkoutsCount, "Workouts")}

                ${statCard("⏱️", userStats.totalMinutes, "Total Minutes")}

                ${statCard("🔥", userStats.streak, "Day Streak")}

                ${statCard("⚡", userStats.calories, "Estimated kcal")}

            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-2xl p-5">

                <h3 class="font-serif font-bold mb-5">
                    Last 7 Days
                </h3>

                <div class="flex items-end justify-between
                            gap-2 h-44">

                    ${week.map(day => `
                        <div class="flex-1 flex flex-col
                                    items-center justify-end h-full">

                            <span class="text-[10px] mb-2">
                                ${day.minutes}
                            </span>

                            <div class="bg-[#E8DEC9] w-full
                                        rounded-t-md h-28
                                        flex items-end overflow-hidden">

                                <div class="bg-[#6E7E44]
                                            w-full rounded-t-md"
                                     style="height:${
                                        day.minutes
                                            ? Math.max(6, day.minutes / maxMinutes * 100)
                                            : 0
                                     }%">
                                </div>

                            </div>

                            <span class="text-[10px] mt-2">
                                ${day.label}
                            </span>

                        </div>
                    `).join("")}

                </div>

                <p class="text-xs text-[#5A4E38] mt-5">
                    Workout minutes recorded each day.
                </p>

            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-2xl p-5">

                <h3 class="font-serif font-bold mb-3">
                    Daily Goal
                </h3>

                <div class="bg-[#E8DEC9] rounded-full h-3">

                    <div class="bg-[#6E7E44] h-3 rounded-full"
                         style="width:${dailyGoalPercent()}%">
                    </div>

                </div>

                <p class="text-sm mt-3">
                    ${dailyGoalPercent()}% completed today
                </p>

            </div>

        </div>
    `;
}

function statCard(icon, value, label) {
    return `
        <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                    rounded-2xl p-5 text-center">

            <div class="text-2xl">${icon}</div>

            <p class="text-2xl font-serif font-bold mt-2">
                ${value}
            </p>

            <p class="text-xs text-[#5A4E38]">
                ${label}
            </p>

        </div>
    `;
}

// ==========================================
// PROFILE AND PREFERENCES
// ==========================================

function renderProfile(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">

            <div class="text-center">

                <div class="w-20 h-20 rounded-full
                            bg-[#E8DEC9] mx-auto
                            flex items-center justify-center
                            text-3xl font-serif font-bold">
                    ${escapeHTML(userStats.name.charAt(0).toUpperCase())}
                </div>

                <h2 class="text-2xl font-serif font-bold mt-3">
                    ${escapeHTML(userStats.name)}
                </h2>

                <p class="text-xs text-[#5A4E38]">
                    FITFLOW Member
                </p>

            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-2xl p-5 space-y-5">

                <h3 class="font-serif font-bold text-lg">
                    Goals & Health Preferences
                </h3>

                <div>
                    <label class="block text-sm mb-2 font-semibold">
                        Your Name
                    </label>

                    <input id="profile-name"
                           value="${escapeHTML(userStats.name)}"
                           maxlength="40"
                           class="w-full border border-[#D9CBA8]
                                  bg-white rounded-xl px-4 py-3">
                </div>

                <div>
                    <label class="block text-sm mb-2 font-semibold">
                        Fitness Goal
                    </label>

                    <select id="fitness-goal"
                            class="w-full border border-[#D9CBA8]
                                   bg-white rounded-xl px-4 py-3">

                        ${[
                            "General Fitness",
                            "Build Muscle",
                            "Lose Weight",
                            "Improve Endurance",
                            "Improve Flexibility"
                        ].map(goal => `
                            <option value="${goal}"
                                ${userStats.goal === goal ? "selected" : ""}>
                                ${goal}
                            </option>
                        `).join("")}

                    </select>
                </div>

                <div>
                    <label class="block text-sm mb-2 font-semibold">
                        Favorite Type of Workout
                    </label>

                    <select id="favorite-workout"
                            class="w-full border border-[#D9CBA8]
                                   bg-white rounded-xl px-4 py-3">

                        <option value="strength"
                            ${userStats.favoriteWorkout === "strength" ? "selected" : ""}>
                            💪 Strength Training
                        </option>

                        <option value="cardio"
                            ${userStats.favoriteWorkout === "cardio" ? "selected" : ""}>
                            🏃 Cardio
                        </option>

                        <option value="yoga"
                            ${userStats.favoriteWorkout === "yoga" ? "selected" : ""}>
                            🧘 Yoga & Flexibility
                        </option>

                    </select>

                    <p class="text-xs text-[#5A4E38] mt-2">
                        FITFLOW uses your favorite workout type
                        to personalize recommendations.
                    </p>
                </div>

                <button onclick="saveProfile()"
                        class="w-full bg-[#6E7E44] text-white
                               rounded-xl py-3 font-semibold">
                    Save Preferences
                </button>

            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9]
                        rounded-2xl p-5">

                <h3 class="font-serif font-bold mb-3">
                    Your Fitness Summary
                </h3>

                <p class="text-sm mb-2">
                    Goal: ${escapeHTML(userStats.goal)}
                </p>

                <p class="text-sm mb-2">
                    Favorite Workout:
                    ${escapeHTML(userStats.favoriteWorkout)}
                </p>

                <p class="text-sm">
                    Completed Workouts:
                    ${userStats.completedWorkoutsCount}
                </p>

            </div>

            <button onclick="resetData()"
                    class="w-full border border-red-300
                           text-red-700 rounded-xl py-3">
                Reset Fitness Data
            </button>

        </div>
    `;
}

function saveProfile() {
    const name = document.getElementById("profile-name");
    const goal = document.getElementById("fitness-goal");
    const favorite = document.getElementById("favorite-workout");

    if (!name || !goal || !favorite) return;

    userStats.name = name.value.trim() || "FITFLOW User";
    userStats.goal = goal.value;
    userStats.favoriteWorkout = favorite.value;

    saveData();
    renderProfile(document.getElementById("app-container"));

    alert("Your preferences have been saved!");
}

// ==========================================
// RESET DATA
// ==========================================

function resetData() {
    const confirmed = confirm(
        "Are you sure you want to reset all fitness progress?"
    );

    if (!confirmed) return;

    const name = userStats.name;
    const goal = userStats.goal;
    const favoriteWorkout = userStats.favoriteWorkout;

    userStats = {
        ...defaultData,
        name,
        goal,
        favoriteWorkout,
        activity: {}
    };

    saveData();
    switchTab("home");

    alert("Your fitness progress has been reset.");
}

// ==========================================
// INITIALIZE FITFLOW
// ==========================================

function initializeFitflow() {
    const container = document.getElementById("app-container");

    if (!container) {
        console.error(
            "FITFLOW initialization failed: app-container missing."
        );
        return;
    }

    syncToday();
    updateHeader();
    switchTab("home");

    console.log("FITFLOW loaded successfully!");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeFitflow
    );
} else {
    initializeFitflow();
}
