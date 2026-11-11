
"use strict";

/* ========================================
   FITFLOW V2 - JAVASCRIPT
======================================== */

const STORAGE_KEY = "fitflow_v2";

const WORKOUTS = [
    {
        id: 1,
        name: "Full Body Strength",
        type: "strength",
        level: "Beginner",
        icon: "💪",
        description: "Build strength using simple bodyweight movements.",
        exercises: [
            ["Squats", "Keep your chest lifted and bend your knees."],
            ["Push-ups", "Keep your body straight and lower with control."],
            ["Lunges", "Step forward and lower gently."],
            ["Plank", "Engage your core and keep your body aligned."],
            ["Glute Bridges", "Lift your hips while squeezing your glutes."],
            ["Mountain Climbers", "Bring your knees toward your chest."]
        ]
    },
    {
        id: 2,
        name: "Morning Cardio Boost",
        type: "cardio",
        level: "Intermediate",
        icon: "🏃",
        description: "Raise your heart rate and build endurance.",
        exercises: [
            ["Jumping Jacks", "Jump your feet apart while raising your arms."],
            ["High Knees", "Jog in place, lifting your knees."],
            ["Butt Kicks", "Jog gently, kicking toward your glutes."],
            ["Skater Hops", "Step or hop from side to side."],
            ["March in Place", "Finish with a controlled marching pace."]
        ]
    },
    {
        id: 3,
        name: "Mobility & Flow",
        type: "yoga",
        level: "All Levels",
        icon: "🧘",
        description: "Improve mobility, flexibility, and relaxation.",
        exercises: [
            ["Cat-Cow", "Alternate between rounding and extending your spine."],
            ["Downward Dog", "Lift your hips and lengthen your back."],
            ["Child's Pose", "Relax your hips back and extend your arms."],
            ["Spinal Twist", "Rotate gently without forcing the movement."]
        ]
    },
    {
        id: 4,
        name: "Core & Stability",
        type: "strength",
        level: "Beginner",
        icon: "⚡",
        description: "Develop stability and strengthen your midsection.",
        exercises: [
            ["Plank Hold", "Hold a strong, straight body position."],
            ["Bicycle Crunches", "Rotate your torso in a controlled motion."],
            ["Leg Raises", "Lift and lower your legs slowly."],
            ["Bird Dog", "Extend opposite arms and legs while balanced."]
        ]
    },
    {
        id: 5,
        name: "Gentle Cardio",
        type: "cardio",
        level: "Beginner",
        icon: "🚶",
        description: "Enjoy a low-impact workout for everyday movement.",
        exercises: [
            ["March in Place", "March steadily at a comfortable pace."],
            ["Side Steps", "Step from side to side."],
            ["Arm Circles", "Make smooth circles with your arms."],
            ["Step Touch", "Step sideways and bring your feet together."]
        ]
    }
];

const DEFAULT_DATA = {
    name: "Tate",
    goal: "General fitness",
    favorite: "strength",
    history: {}
};

const SECONDS_PER_EXERCISE = 45;
const DAILY_MINUTE_GOAL = 5;

function loadData() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (!saved || typeof saved !== "object") {
            return structuredClone(DEFAULT_DATA);
        }

        return {
            ...DEFAULT_DATA,
            ...saved,
            history: saved.history || {}
        };
    } catch (error) {
        return {
            ...DEFAULT_DATA,
            history: {}
        };
    }
}

let data = loadData();
let currentPage = "home";
let activeFilter = "all";
let searchQuery = "";
let suggestedId = null;

let session = null;
let timerId = null;
let animationId = null;
let animationPhase = 0;

const app = document.getElementById("app");

/* ========================================
   UTILITIES
======================================== */

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch (error) {
        console.warn("Unable to save locally.", error);
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => {
        const codes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return codes[char];
    });
}

function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function offsetDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function todayData() {
    return data.history[dateKey()] || {
        count: 0,
        seconds: 0
    };
}

function allEntries() {
    return Object.values(data.history);
}

function totalWorkouts() {
    return allEntries().reduce(
        (sum, entry) => sum + (entry.count || 0),
        0
    );
}

function totalSeconds() {
    return allEntries().reduce(
        (sum, entry) => sum + (entry.seconds || 0),
        0
    );
}

function formatMinutes(seconds) {
    return (seconds / 60).toFixed(1);
}

function calculateStreak() {
    let streak = 0;
    let offset = 0;

    // Yesterday can count if today isn't completed yet
    if (todayData().count === 0) {
        offset = -1;
    }

    while (true) {
        const key = dateKey(offsetDate(offset));
        const entry = data.history[key];

        if (!entry || entry.count < 1) {
            break;
        }

        streak++;
        offset--;

        if (streak > 10000) break;
    }

    return streak;
}

function dailyProgress() {
    const today = todayData();

    const workoutPart = today.count >= 1 ? 50 : 0;
    const timePart = Math.min(
        50,
        (today.seconds / (DAILY_MINUTE_GOAL * 60)) * 50
    );

    return Math.round(workoutPart + timePart);
}

function workoutById(id) {
    return WORKOUTS.find(w => w.id === Number(id));
}

function workoutDuration(workout) {
    const seconds = workout.exercises.length *
        SECONDS_PER_EXERCISE;

    return `${Math.ceil(seconds / 60)} min`;
}

function updateHeader() {
    const header = document.getElementById("header-streak");
    const avatar = document.querySelector(".avatar");

    if (header) {
        const streak = calculateStreak();
        header.textContent =
            `${streak} ${streak === 1 ? "day" : "days"}`;
    }

    if (avatar) {
        avatar.textContent =
            (data.name || "T").charAt(0).toUpperCase();
    }
}

function showMessage(message) {
    const existing = document.getElementById("status-message");

    if (existing) existing.remove();

    const element = document.createElement("div");
    element.id = "status-message";
    element.className = "message";
    element.textContent = message;

    app.querySelector(".page")?.appendChild(element);
}

/* ========================================
   NAVIGATION
======================================== */

function navigate(page) {
    if (!["home", "workouts", "progress", "profile"].includes(page)) {
        return;
    }

    stopTimer();
    session = null;
    currentPage = page;

    document.querySelectorAll(".nav-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    renderPage();
    updateHeader();

    window.scrollTo({ top: 0, behavior: "instant" });
}

function renderPage() {
    if (!app) return;

    if (currentPage === "home") renderHome();
    if (currentPage === "workouts") renderWorkouts();
    if (currentPage === "progress") renderProgress();
    if (currentPage === "profile") renderProfile();
}

/* ========================================
   WORKOUT RECOMMENDATIONS
======================================== */

function getRecommendation() {
    if (suggestedId !== null) {
        return workoutById(suggestedId) || WORKOUTS[0];
    }

    return WORKOUTS.find(
        workout => workout.type === data.favorite
    ) || WORKOUTS[0];
}

function changeRecommendation() {
    const current = getRecommendation();

    const preferred = WORKOUTS.filter(
        workout =>
            workout.type === data.favorite &&
            workout.id !== current.id
    );

    const alternatives = preferred.length
        ? preferred
        : WORKOUTS.filter(workout => workout.id !== current.id);

    if (!alternatives.length) return;

    const next = alternatives[
        Math.floor(Math.random() * alternatives.length)
    ];

    suggestedId = next.id;
    renderHome();
}

function workoutCard(workout) {
    return `
        <div class="card">
            <div class="workout-card">
                <div class="workout-icon">
                    ${workout.icon}
                </div>

                <div class="grow">
                    <span class="pill">
                        ${escapeHTML(workout.type.toUpperCase())}
                    </span>

                    <h3>${escapeHTML(workout.name)}</h3>

                    <p class="muted">
                        ${workout.exercises.length} exercises ·
                        ${workoutDuration(workout)} ·
                        ${escapeHTML(workout.level)}
                    </p>
                </div>
            </div>

            <p class="muted" style="margin-top:14px">
                ${escapeHTML(workout.description)}
            </p>

            <button class="btn btn-primary btn-full"
                    data-start="${workout.id}">
                ▶ Start workout
            </button>
        </div>
    `;
}

/* ========================================
   HOME PAGE
======================================== */

function renderHome() {
    const today = todayData();
    const progress = dailyProgress();
    const recommendation = getRecommendation();
    const streak = calculateStreak();

    app.innerHTML = `
        <section class="page">

            <p class="eyebrow">
                YOUR PERSONAL FITNESS SPACE
            </p>

            <h1>
                Move at your pace,
                ${escapeHTML(data.name)}.
            </h1>

            <p class="subtitle">
                A little progress every day adds up.
            </p>

            <div class="card">

                <div class="row space-between">
                    <h2>Today's progress</h2>
                    <span class="pill">Daily goal</span>
                </div>

                <div class="progress-overview">

                    <div class="progress-circle"
                         style="--progress:${progress}%">
                        <span>${progress}%</span>
                    </div>

                    <div class="progress-details">
                        <p>
                            ✅ <strong>${today.count}</strong>
                            workouts
                        </p>

                        <p>
                            ⏱ <strong>${formatMinutes(today.seconds)}</strong>
                            min trained
                        </p>

                        <p>
                            🔥 <strong>${streak}</strong>
                            day streak
                        </p>
                    </div>

                </div>

                <p class="muted" style="margin:15px 0 0">
                    Goal: Complete a workout and train for
                    ${DAILY_MINUTE_GOAL} minutes today.
                </p>
            </div>

            <div class="section-heading">
                <h2>Recommended for you</h2>
                <span class="small-label">Personalized</span>
            </div>

            ${workoutCard(recommendation)}

            <button class="btn btn-secondary btn-full"
                    data-action="change-recommendation">
                🔄 Suggest another workout
            </button>

            <p class="muted" style="margin-top:10px">
                Based on your favorite type:
                ${escapeHTML(data.favorite)}.
            </p>

            <div class="section-heading">
                <h2>Your daily motivation</h2>
            </div>

            <div class="card soft-card center">
                <p style="font-family:Georgia,serif;font-style:italic">
                    "Progress is built one movement at a time."
                </p>
                <span class="eyebrow">KEEP GOING</span>
            </div>

        </section>
    `;
}

/* ========================================
   WORKOUT LIBRARY
======================================== */

function renderWorkouts() {
    app.innerHTML = `
        <section class="page">

            <p class="eyebrow">FIND YOUR MOVEMENT</p>

            <h1>Explore workouts</h1>

            <p class="subtitle">
                Find a routine that fits your energy and goals.
            </p>

            <input
                id="search-workouts"
                class="search-input"
                type="search"
                placeholder="Search workouts..."
                value="${escapeHTML(searchQuery)}"
            >

            <div class="filter-row">

                ${[
                    ["all", "All"],
                    ["strength", "💪 Strength"],
                    ["cardio", "🏃 Cardio"],
                    ["yoga", "🧘 Yoga"]
                ].map(([value, label]) => `
                    <button
                        class="filter ${activeFilter === value ? "active" : ""}"
                        data-filter="${value}">
                        ${label}
                    </button>
                `).join("")}

            </div>

            <div id="workout-results"></div>

        </section>
    `;

    updateWorkoutResults();
}

function updateWorkoutResults() {
    const results = document.getElementById("workout-results");

    if (!results) return;

    const matching = WORKOUTS.filter(workout => {
        const matchesFilter =
            activeFilter === "all" ||
            workout.type === activeFilter;

        const query = searchQuery.toLowerCase();

        const matchesSearch =
            workout.name.toLowerCase().includes(query) ||
            workout.description.toLowerCase().includes(query) ||
            workout.type.toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
    });

    results.innerHTML = matching.length
        ? matching.map(workoutCard).join("")
        : `
            <div class="card center">
                <h3>No workouts found</h3>
                <p class="muted">
                    Try another search or category.
                </p>
            </div>
        `;
}

/* ========================================
   WORKOUT PLAYER
======================================== */

function startWorkout(id) {
    const workout = workoutById(id);
    if (!workout) return;

    stopTimer();

    session = {
        workout,
        index: 0,
        remaining: SECONDS_PER_EXERCISE,
        elapsed: 0,
        paused: false
    };

    renderPlayer();
    startTimer();
}

function renderPlayer() {
    if (!session) return;

    const workout = session.workout;
    const exercise = workout.exercises[session.index];

    const percent = (
        (session.index / workout.exercises.length) * 100
    );

    app.innerHTML = `
        <section class="page">

            <div class="row space-between">
                <button class="btn btn-outline btn-small"
                        data-page="workouts">
                    ← Back
                </button>

                <span class="exercise-counter">
                    ${escapeHTML(workout.name)}
                </span>
            </div>

            <div style="margin:20px 0">
                <div class="row space-between">
                    <span class="exercise-counter">
                        Exercise ${session.index + 1} of
                        ${workout.exercises.length}
                    </span>

                    <span class="exercise-counter">
                        ${Math.round(percent)}% finished
                    </span>
                </div>

                <div class="progress-track"
                     style="margin-top:10px">
                    <div class="progress-fill"
                         style="width:${percent}%">
                    </div>
                </div>
            </div>

            <div class="card center">

                <div class="exercise-scene">
                    <canvas id="exercise-canvas"
                            width="330"
                            height="220">
                    </canvas>
                </div>

                <h2 style="margin-top:20px">
                    ${escapeHTML(exercise[0])}
                </h2>

                <div class="tip">
                    ${escapeHTML(exercise[1])}
                </div>

                <p class="muted" style="margin-top:12px">
                    Animated movement guide
                </p>

                <div class="timer-display"
                     id="timer-display">
                    0:45
                </div>

                <div class="button-row">
                    <button class="btn btn-secondary"
                            id="pause-button"
                            data-action="pause">
                        ⏸ Pause
                    </button>

                    <button class="btn btn-primary"
                            data-action="next">
                        Next →
                    </button>
                </div>

            </div>

            <p class="muted center">
                Stop if you experience pain or dizziness.
                Move within a comfortable range.
            </p>

        </section>
    `;

    updateTimerDisplay();
    startAnimation();
}

function startTimer() {
    if (timerId) clearInterval(timerId);

    timerId = setInterval(() => {
        if (!session || session.paused) return;

        session.remaining--;
        session.elapsed++;

        updateTimerDisplay();

        if (session.remaining <= 0) {
            nextExercise();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const display = document.getElementById("timer-display");

    if (!display || !session) return;

    const seconds = Math.max(0, session.remaining);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    display.textContent =
        `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function togglePause() {
    if (!session) return;

    session.paused = !session.paused;

    const button = document.getElementById("pause-button");

    if (button) {
        button.textContent = session.paused
            ? "▶ Resume"
            : "⏸ Pause";
    }
}

function nextExercise() {
    if (!session) return;

    stopTimer();

    session.index++;

    if (session.index >= session.workout.exercises.length) {
        completeWorkout();
        return;
    }

    session.remaining = SECONDS_PER_EXERCISE;
    session.paused = false;

    renderPlayer();
    startTimer();
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/* ========================================
   ANIMATED EXERCISE ILLUSTRATION
======================================== */

function startAnimation() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    animationPhase = 0;

    function frame() {
        if (!session) return;

        if (!session.paused) {
            animationPhase += 0.035;
        }

        drawExercise(
            session.workout.exercises[session.index][0],
            animationPhase
        );

        animationId = requestAnimationFrame(frame);
    }

    frame();
}

function drawExercise(name, phase) {
    const canvas = document.getElementById("exercise-canvas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const movement = Math.sin(phase);
    const lowerName = name.toLowerCase();

    // Ground
    ctx.strokeStyle = "#cabb9e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 194);
    ctx.lineTo(295, 194);
    ctx.stroke();

    ctx.strokeStyle = "#52643b";
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
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.stroke();
    }

    const floorExercise = [
        "push", "plank", "mountain", "bird dog",
        "glute bridge", "leg raise", "bicycle"
    ].some(word => lowerName.includes(word));

    const yogaExercise = [
        "downward", "cat-cow", "child",
        "spinal"
    ].some(word => lowerName.includes(word));

    if (floorExercise) {
        const bend = lowerName.includes("push")
            ? movement * 9
            : 0;

        head(87, 134 + bend);
        line(103, 137 + bend, 217, 142);
        line(120, 139, 116, 190);
        line(217, 142, 260, 190);
        line(217, 142, 241, 190);

    } else if (yogaExercise) {
        const sway = movement * 7;

        head(106, 142 + sway);
        line(122, 146 + sway, 164, 92);
        line(164, 92, 225, 155);
        line(122, 146 + sway, 100, 192);
        line(225, 155, 245, 192);

    } else {
        const isSquat = lowerName.includes("squat");
        const isJumping = [
            "jump", "high knees", "butt kicks",
            "skater"
        ].some(word => lowerName.includes(word));

        const isLunge = lowerName.includes("lunge");

        const bounce = isJumping
            ? Math.abs(movement) * 22
            : 0;

        const squat = isSquat
            ? Math.max(0, movement) * 23
            : 0;

        ctx.save();
        ctx.translate(0, squat - bounce);

        head(165, 63);
        line(165, 77, 165, 133);

        const swing = movement * 17;

        line(165, 92, 132 - swing, 120);
        line(165, 92, 198 + swing, 120);

        if (isSquat) {
            line(165, 133, 128, 156);
            line(128, 156, 120, 191 - squat);
            line(165, 133, 202, 156);
            line(202, 156, 210, 191 - squat);
        } else if (isLunge) {
            line(165, 133, 128, 161);
            line(128, 161, 111, 192);
            line(165, 133, 198, 152);
            line(198, 152, 218, 192);
        } else {
            line(165, 133, 145 - swing, 192);
            line(165, 133, 185 + swing, 192);
        }

        ctx.restore();
    }
}

/* ========================================
   COMPLETE AND SAVE WORKOUT
======================================== */

function completeWorkout() {
    if (!session) return;

    stopTimer();

    const workout = session.workout;
    const seconds = session.elapsed;

    const today = dateKey();

    if (!data.history[today]) {
        data.history[today] = {
            count: 0,
            seconds: 0
        };
    }

    data.history[today].count++;
    data.history[today].seconds += seconds;

    saveData();
    updateHeader();

    session = null;

    app.innerHTML = `
        <section class="page center"
                 style="padding-top:35px">

            <div style="font-size:65px">🏆</div>

            <h1 style="margin-top:20px">
                Workout complete!
            </h1>

            <p class="subtitle">
                Great job finishing
                ${escapeHTML(workout.name)}.
            </p>

            <div class="stats-grid">

                <div class="stat-box">
                    <div class="stat-value">
                        ${workout.exercises.length}
                    </div>
                    <div class="stat-label">
                        Exercises finished
                    </div>
                </div>

                <div class="stat-box">
                    <div class="stat-value">
                        ${formatMinutes(seconds)}
                    </div>
                    <div class="stat-label">
                        Active minutes
                    </div>
                </div>

            </div>

            <p class="muted" style="margin-top:20px">
                Your workout has been saved to today's progress.
            </p>

            <div class="stack">
                <button class="btn btn-primary btn-full"
                        data-page="progress">
                    View my progress
                </button>

                <button class="btn btn-secondary btn-full"
                        data-page="home">
                    Return home
                </button>
            </div>

        </section>
    `;
}

/* ========================================
   PROGRESS PAGE
======================================== */

function renderProgress() {
    const count = totalWorkouts();
    const minutes = formatMinutes(totalSeconds());
    const streak = calculateStreak();
    const today = todayData();

    const days = [];

    for (let offset = -6; offset <= 0; offset++) {
        const date = offsetDate(offset);
        const key = dateKey(date);

        days.push({
            label: date.toLocaleDateString("en-US", {
                weekday: "short"
            }),
            seconds: data.history[key]?.seconds || 0
        });
    }

    const maximum = Math.max(
        300,
        ...days.map(day => day.seconds)
    );

    app.innerHTML = `
        <section class="page">

            <p class="eyebrow">YOUR FITNESS JOURNEY</p>

            <h1>Your progress</h1>

            <p class="subtitle">
                Every completed workout is a step forward.
            </p>

            <div class="stats-grid">

                <div class="stat-box">
                    <div>✅</div>
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">Total workouts</div>
                </div>

                <div class="stat-box">
                    <div>⏱️</div>
                    <div class="stat-value">${minutes}</div>
                    <div class="stat-label">Minutes trained</div>
                </div>

                <div class="stat-box">
                    <div>🔥</div>
                    <div class="stat-value">${streak}</div>
                    <div class="stat-label">Day streak</div>
                </div>

                <div class="stat-box">
                    <div>🏅</div>
                    <div class="stat-value">${today.count}</div>
                    <div class="stat-label">Today's workouts</div>
                </div>

            </div>

            <div class="section-heading">
                <h2>Weekly activity</h2>
            </div>

            <div class="card">

                <p class="muted">
                    Workout minutes over the past 7 days.
                </p>

                <div class="weekly-chart">

                    ${days.map(day => {
                        const height = day.seconds
                            ? Math.max(
                                4,
                                day.seconds / maximum * 100
                            )
                            : 0;

                        return `
                            <div class="chart-column">
                                <div class="chart-value">
                                    ${formatMinutes(day.seconds)}
                                </div>

                                <div class="bar-area">
                                    <div class="chart-bar"
                                         style="height:${height}%">
                                    </div>
                                </div>

                                <span>${day.label}</span>
                            </div>
                        `;
                    }).join("")}

                </div>

            </div>

            <div class="section-heading">
                <h2>Today's goal</h2>
            </div>

            <div class="card">

                <div class="row space-between">
                    <strong>Daily completion</strong>
                    <span>${dailyProgress()}%</span>
                </div>

                <div class="progress-track"
                     style="margin-top:14px">
                    <div class="progress-fill"
                         style="width:${dailyProgress()}%">
                    </div>
                </div>

                <p class="muted" style="margin-top:14px">
                    Complete one workout and
                    ${DAILY_MINUTE_GOAL} active minutes.
                </p>

            </div>

        </section>
    `;
}

/* ========================================
   PROFILE AND FITNESS PREFERENCES
======================================== */

function renderProfile() {
    app.innerHTML = `
        <section class="page">

            <div class="center">
                <div class="profile-avatar">
                    ${escapeHTML((data.name || "T").charAt(0).toUpperCase())}
                </div>

                <h1>${escapeHTML(data.name)}</h1>

                <p class="subtitle">
                    Your fitness preferences
                </p>
            </div>

            <div class="card">

                <h2>Goals & health</h2>

                <div class="form-group">
                    <label class="form-label" for="profile-name">
                        Your name
                    </label>

                    <input
                        class="form-input"
                        id="profile-name"
                        maxlength="40"
                        value="${escapeHTML(data.name)}"
                    >
                </div>

                <div class="form-group">
                    <label class="form-label" for="fitness-goal">
                        Main fitness goal
                    </label>

                    <select class="form-select" id="fitness-goal">

                        ${[
                            "General fitness",
                            "Build muscle",
                            "Improve endurance",
                            "Improve flexibility",
                            "Stay active"
                        ].map(goal => `
                            <option value="${goal}"
                                ${data.goal === goal ? "selected" : ""}>
                                ${goal}
                            </option>
                        `).join("")}

                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="favorite-type">
                        Favorite type of workout
                    </label>

                    <select class="form-select" id="favorite-type">

                        <option value="strength"
                            ${data.favorite === "strength" ? "selected" : ""}>
                            💪 Strength training
                        </option>

                        <option value="cardio"
                            ${data.favorite === "cardio" ? "selected" : ""}>
                            🏃 Cardio
                        </option>

                        <option value="yoga"
                            ${data.favorite === "yoga" ? "selected" : ""}>
                            🧘 Yoga and flexibility
                        </option>

                    </select>

                    <p class="form-help">
                        We use this preference to recommend
                        workouts you might enjoy.
                    </p>
                </div>

                <button class="btn btn-primary btn-full"
                        data-action="save-profile">
                    Save preferences
                </button>

            </div>

            <div class="card">
                <h2>Your current plan</h2>

                <p class="muted">
                    Goal: ${escapeHTML(data.goal)}
                </p>

                <p class="muted">
                    Favorite workouts:
                    ${escapeHTML(data.favorite)}
                </p>

                <p class="muted">
                    Total completed workouts:
                    ${totalWorkouts()}
                </p>
            </div>

            <button class="btn btn-danger btn-full"
                    data-action="reset">
                Reset workout progress
            </button>

        </section>
    `;
}

function saveProfile() {
    const nameInput = document.getElementById("profile-name");
    const goalInput = document.getElementById("fitness-goal");
    const typeInput = document.getElementById("favorite-type");

    if (!nameInput || !goalInput || !typeInput) return;

    data.name = nameInput.value.trim() || "FITFLOW User";
    data.goal = goalInput.value;
    data.favorite = typeInput.value;

    suggestedId = null;

    saveData();
    updateHeader();
    renderProfile();

    showMessage("Preferences saved successfully!");
}

function resetProgress() {
    const confirmed = confirm(
        "Reset your workout history? This cannot be undone."
    );

    if (!confirmed) return;

    data.history = {};

    saveData();
    navigate("progress");
}

/* ========================================
   BUTTON EVENT HANDLING
======================================== */

document.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.page) {
        navigate(button.dataset.page);
        return;
    }

    if (button.dataset.start) {
        startWorkout(button.dataset.start);
        return;
    }

    if (button.dataset.filter) {
        activeFilter = button.dataset.filter;
        renderWorkouts();
        return;
    }

    const action = button.dataset.action;

    if (action === "change-recommendation") {
        changeRecommendation();
    }

    if (action === "pause") {
        togglePause();
    }

    if (action === "next") {
        nextExercise();
    }

    if (action === "save-profile") {
        saveProfile();
    }

    if (action === "reset") {
        resetProgress();
    }
});

document.addEventListener("input", event => {
    if (event.target.id === "search-workouts") {
        searchQuery = event.target.value;
        updateWorkoutResults();
    }
});

/* ========================================
   INITIALIZE WEBSITE
======================================== */

function initializeApp() {
    if (!app) {
        console.error(
            "FITFLOW error: #app element was not found."
        );
        return;
    }

    updateHeader();
    navigate("home");

    console.log("FITFLOW V2 loaded successfully!");
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}
