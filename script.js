
tailwind.config = {
    theme: {
        extend: {
            colors: {
                parchment: {
                    50: '#FAF8F5',
                    100: '#F4EFE6',
                    200: '#E8DEC9',
                    300: '#D9CBA8',
                    400: '#C7B484',
                    800: '#5A4E38',
                    900: '#3D3323'
                },
                olive: {
                    600: '#6E7E44',
                    700: '#586535',
                    800: '#434D28'
                },
                charcoal: '#2C2A29',
                rust: '#B85D33'
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'Georgia', 'serif'],
                sans: ['"Inter"', 'sans-serif']
            }
        }
    }
};

// State Management
let currentTab = 'home';

let userStats = {
    streak: 4,
    calories: 320,
    steps: 4250,
    activeMinutes: 35,
    completedWorkoutsCount: 12,
    totalHours: 28,
    prs: 8
};

// Workout Database
const workoutsData = [
    {
        id: 1,
        title: "Full Body Strength",
        type: "strength",
        duration: 30,
        level: "Beginner",
        desc: "Build overall functional strength and muscle tone.",
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
        desc: "Awaken your metabolism and boost daily energy.",
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
        desc: "Release stiffness and improve flexibility.",
        exercises: [
            "Cat-Cow",
            "Downward Dog",
            "Child's Pose",
            "World's Greatest Stretch",
            "Spinal Twist"
        ]
    },
    {
        id: 4,
        title: "Core & Stability",
        type: "strength",
        duration: 10,
        level: "Beginner",
        desc: "Target your core for better posture and stability.",
        exercises: [
            "Plank Hold",
            "Bicycle Crunches",
            "Leg Raises",
            "Russian Twists"
        ]
    }
];

let activeWorkout = null;
let activeExerciseIdx = 0;
let timerInterval = null;
let timeLeft = 45;
let isPaused = false;

let animationFrameId = null;
let animProgress = 0;

// Stick Figure Animation Engine
function drawStickFigure(canvasId, exerciseName, progress) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = '#E8DEC9';
    ctx.lineWidth = 0.5;

    for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.strokeStyle = '#3D3323';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cycle = Math.sin(progress * Math.PI * 4);
    const bounce = Math.abs(cycle) * 6;

    ctx.save();
    ctx.translate(w / 2, h / 2 + 20 - bounce);

    // Head
    ctx.beginPath();
    ctx.arc(0, -50, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(0, 0);
    ctx.stroke();

    if (exerciseName.toLowerCase().includes('squat')) {
        const depth = Math.sin(progress * Math.PI * 2) * 15;

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(25, -20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-18, 20 + depth);
        ctx.lineTo(-25, 45);

        ctx.moveTo(0, 0);
        ctx.lineTo(18, 20 + depth);
        ctx.lineTo(25, 45);
        ctx.stroke();

    } else if (exerciseName.toLowerCase().includes('push')) {
        ctx.save();
        ctx.rotate(Math.PI / 2);
        ctx.translate(15, -10);

        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -45 + bounce);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 45);
        ctx.stroke();

        ctx.restore();

    } else {
        const armSwing = cycle * 15;

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-20 - armSwing, -10);

        ctx.moveTo(0, -30);
        ctx.lineTo(20 + armSwing, -10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, 45);

        ctx.moveTo(0, 0);
        ctx.lineTo(12, 45);
        ctx.stroke();
    }

    ctx.restore();
}

// Tab Navigation
function switchTab(tab) {
    currentTab = tab;
    stopWorkoutTimer();

    ['home', 'workouts', 'progress', 'profile'].forEach(t => {
        const btn = document.getElementById(`nav-${t}`);

        if (btn) {
            if (t === tab) {
                btn.className =
                    "flex flex-col items-center space-y-1 text-olive-600 font-semibold transition";
            } else {
                btn.className =
                    "flex flex-col items-center space-y-1 text-[#5A4E38]/70 hover:text-olive-600 transition";
            }
        }
    });

    renderContent();
}

// Main Page Renderer
function renderContent() {
    const container = document.getElementById('app-container');

    if (currentTab === 'home') {
        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <div>
                    <p class="text-sm text-[#5A4E38] font-medium">
                        Good morning,
                    </p>
                    <h2 class="text-3xl font-serif font-bold text-[#3D3323]">
                        Tate.
                    </h2>
                </div>

                <!-- Daily Goal -->
                <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div class="space-y-2">
                        <div class="relative w-24 h-24 flex items-center justify-center">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="38"
                                    stroke="#E8DEC9" stroke-width="8"
                                    fill="transparent"/>

                                <circle cx="48" cy="48" r="38"
                                    stroke="#6E7E44" stroke-width="8"
                                    stroke-dasharray="238"
                                    stroke-dashoffset="76"
                                    stroke-linecap="round"
                                    fill="transparent"/>
                            </svg>

                            <div class="absolute text-center">
                                <span class="text-xl font-bold font-serif text-[#3D3323]">
                                    68%
                                </span>
                            </div>
                        </div>

                        <p class="text-xs text-center text-[#5A4E38] font-medium">
                            Daily Goal
                        </p>
                    </div>

                    <div class="space-y-3 pl-4 flex-1 border-l border-[#E8DEC9]">
                        <div class="flex items-center space-x-3 text-sm">
                            <span class="p-2 bg-[#E8DEC9]/50 rounded-lg">🔥</span>
                            <div>
                                <p class="font-bold text-[#3D3323]">
                                    ${userStats.calories} kcal
                                </p>
                                <p class="text-xs text-[#5A4E38]">
                                    Calories Burned
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3 text-sm">
                            <span class="p-2 bg-[#E8DEC9]/50 rounded-lg">👟</span>
                            <div>
                                <p class="font-bold text-[#3D3323]">
                                    ${userStats.steps.toLocaleString()}
                                </p>
                                <p class="text-xs text-[#5A4E38]">
                                    Daily Steps
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center space-x-3 text-sm">
                            <span class="p-2 bg-[#E8DEC9]/50 rounded-lg">⏱️</span>
                            <div>
                                <p class="font-bold text-[#3D3323]">
                                    ${userStats.activeMinutes} min
                                </p>
                                <p class="text-xs text-[#5A4E38]">
                                    Active Time
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Featured Workout -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h3 class="font-serif font-bold text-lg text-[#3D3323]">
                            Today's Workout
                        </h3>

                        <button onclick="switchTab('workouts')"
                            class="text-xs font-semibold text-olive-600 hover:underline">
                            See all →
                        </button>
                    </div>

                    <div onclick="startWorkout(0)"
                        class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-4 shadow-sm hover:border-olive-600 transition cursor-pointer flex items-center justify-between">

                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-[#E8DEC9]/60 rounded-xl flex items-center justify-center overflow-hidden">
                                <canvas id="thumb-canvas-0" width="60" height="60"></canvas>
                            </div>

                            <div>
                                <h4 class="font-bold text-[#3D3323]">
                                    Full Body Strength
                                </h4>
                                <p class="text-xs text-[#5A4E38] mt-0.5">
                                    30 min • Beginner
                                </p>
                            </div>
                        </div>

                        <div class="w-10 h-10 rounded-full bg-olive-600 text-white flex items-center justify-center shadow">
                            ▶
                        </div>
                    </div>
                </div>

                <!-- Motivation -->
                <div class="bg-[#E8DEC9]/30 border border-[#D9CBA8] rounded-2xl p-5 text-center space-y-1">
                    <p class="font-serif italic text-sm text-[#3D3323]">
                        "Stronger than yesterday."
                    </p>
                    <p class="text-[10px] uppercase tracking-widest text-[#5A4E38]">
                        Daily Mantra
                    </p>
                </div>
            </div>
        `;

        setTimeout(() => {
            drawStickFigure('thumb-canvas-0', 'Squats', 0.5);
        }, 50);

    } else if (currentTab === 'workouts') {
        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <div>
                    <h2 class="text-2xl font-serif font-bold text-[#3D3323]">
                        Explore Workouts
                    </h2>
                    <p class="text-xs text-[#5A4E38]">
                        Choose your path and move forward.
                    </p>
                </div>

                <div class="relative">
                    <input type="text"
                        placeholder="Search workouts..."
                        class="w-full bg-[#FAF8F5] border border-[#E8DEC9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-olive-600 text-[#3D3323]"
                        oninput="filterWorkouts(this.value)">
                </div>

                <div id="workout-list" class="space-y-3">
                    ${workoutsData.map((w, idx) => `
                        <div onclick="startWorkout(${idx})"
                            class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-4 shadow-sm hover:border-olive-600 transition cursor-pointer flex items-center justify-between">

                            <div class="space-y-1">
                                <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-[#E8DEC9] text-[#5A4E38] rounded">
                                    ${w.type}
                                </span>

                                <h4 class="font-bold text-[#3D3323] text-lg">
                                    ${w.title}
                                </h4>

                                <p class="text-xs text-[#5A4E38]">
                                    ${w.desc}
                                </p>

                                <div class="flex items-center space-x-3 text-xs text-[#5A4E38] pt-1">
                                    <span>⏱️ ${w.duration} mins</span>
                                    <span>⚡ ${w.level}</span>
                                </div>
                            </div>

                            <div class="w-8 h-8 rounded-full bg-[#E8DEC9] flex items-center justify-center text-[#3D3323]">
                                →
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

    } else if (currentTab === 'progress') {
        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <div>
                    <h2 class="text-2xl font-serif font-bold text-[#3D3323]">
                        Your Progress
                    </h2>
                    <p class="text-xs text-[#5A4E38]">
                        Consistency is your superpower.
                    </p>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-4 text-center">
                        <p class="text-2xl font-bold font-serif text-[#3D3323]">
                            ${userStats.completedWorkoutsCount}
                        </p>
                        <p class="text-xs text-[#5A4E38] mt-1">
                            Workouts Done
                        </p>
                    </div>

                    <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-4 text-center">
                        <p class="text-2xl font-bold font-serif text-[#3D3323]">
                            ${userStats.totalHours} hrs
                        </p>
                        <p class="text-xs text-[#5A4E38] mt-1">
                            Total Time
                        </p>
                    </div>
                </div>

                <!-- Activity Chart -->
                <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-5 space-y-4">
                    <h3 class="font-serif font-bold text-[#3D3323]">
                        7-Day Activity
                    </h3>

                    <div class="flex justify-between items-end h-32 pt-4 px-2 border-b border-[#E8DEC9]">
                        ${[40, 65, 30, 85, 95, 60, 75].map((val, i) => `
                            <div class="flex flex-col items-center space-y-2 flex-1">
                                <div class="w-6 bg-olive-600 rounded-t"
                                    style="height: ${val}%"></div>

                                <span class="text-[10px] text-[#5A4E38] font-medium">
                                    ${['M','T','W','T','F','S','S'][i]}
                                </span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex justify-between text-xs text-[#5A4E38]">
                        <span>Weekly Avg: 45 min/day</span>
                        <span class="text-olive-600 font-semibold">
                            +12% vs last week
                        </span>
                    </div>
                </div>

                <!-- Achievements -->
                <div class="space-y-3">
                    <h3 class="font-serif font-bold text-[#3D3323]">
                        Achievements
                    </h3>

                    <div class="grid grid-cols-4 gap-3">
                        <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-xl p-3 text-center">
                            <span class="text-xl">🔥</span>
                            <p class="text-[10px] font-semibold">4-Day Streak</p>
                        </div>

                        <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-xl p-3 text-center">
                            <span class="text-xl">⚡</span>
                            <p class="text-[10px] font-semibold">Speed Demon</p>
                        </div>

                        <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-xl p-3 text-center">
                            <span class="text-xl">🏆</span>
                            <p class="text-[10px] font-semibold">10 Workouts</p>
                        </div>

                        <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-xl p-3 text-center opacity-50">
                            <span class="text-xl">👑</span>
                            <p class="text-[10px] font-semibold">Master</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } else if (currentTab === 'profile') {
        container.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <div class="text-center space-y-2">
                    <div class="w-20 h-20 rounded-full bg-[#E8DEC9] border-4 border-[#D9CBA8] mx-auto flex items-center justify-center font-serif font-bold text-2xl text-[#5A4E38]">
                        T
                    </div>

                    <h2 class="text-xl font-serif font-bold text-[#3D3323]">
                        Tate
                    </h2>

                    <p class="text-xs text-[#5A4E38]">
                        Fitness Enthusiast • Joined Jan 2026
                    </p>
                </div>

                <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl divide-y divide-[#E8DEC9] overflow-hidden">

                    <div onclick="alert('Settings panel coming soon!')"
                        class="p-4 flex items-center justify-between hover:bg-[#E8DEC9]/20 cursor-pointer">
                        <span>⚙️ Settings & Preferences</span>
                        <span>→</span>
                    </div>

                    <div onclick="alert('Notification settings updated.')"
                        class="p-4 flex items-center justify-between hover:bg-[#E8DEC9]/20 cursor-pointer">
                        <span>🔔 Reminders & Notifications</span>
                        <span>→</span>
                    </div>

                    <div onclick="alert('Exporting data to JSON...')"
                        class="p-4 flex items-center justify-between hover:bg-[#E8DEC9]/20 cursor-pointer">
                        <span>📥 Export Workout History</span>
                        <span>→</span>
                    </div>

                    <div onclick="resetData()"
                        class="p-4 flex items-center justify-between hover:bg-[#E8DEC9]/20 cursor-pointer text-red-700">
                        <span>🔄 Reset Local Data</span>
                        <span>→</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Start a Workout
function startWorkout(index) {
    stopWorkoutTimer();

    activeWorkout = workoutsData[index];
    activeExerciseIdx = 0;
    timeLeft = 45;
    isPaused = false;

    const container = document.getElementById('app-container');

    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">

            <div class="flex items-center justify-between">
                <button onclick="switchTab('home')"
                    class="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8DEC9]">
                    ← Back
                </button>

                <h3 class="font-serif font-bold text-lg text-[#3D3323]">
                    ${activeWorkout.title}
                </h3>

                <button onclick="togglePause()"
                    class="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8DEC9]">
                    ⏸️
                </button>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-1">
                <div class="flex justify-between text-xs text-[#5A4E38]">
                    <span>
                        Exercise <span id="current-ex-num">1</span>
                        of ${activeWorkout.exercises.length}
                    </span>

                    <span id="ex-name-label">
                        ${activeWorkout.exercises[0]}
                    </span>
                </div>

                <div class="w-full bg-[#E8DEC9] h-2 rounded-full overflow-hidden">
                    <div id="workout-progress-bar"
                        class="bg-olive-600 h-full transition-all duration-300"
                        style="width: ${100 / activeWorkout.exercises.length}%">
                    </div>
                </div>
            </div>

            <!-- Animated Workout Display -->
            <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-3xl p-6 text-center space-y-6 shadow-sm">

                <div class="relative w-48 h-48 mx-auto bg-[#E8DEC9]/30 rounded-2xl border border-[#D9CBA8] flex items-center justify-center overflow-hidden">
                    <canvas id="active-canvas" width="180" height="180"></canvas>
                </div>

                <div>
                    <h2 id="active-exercise-title"
                        class="text-2xl font-serif font-bold text-[#3D3323]">
                        ${activeWorkout.exercises[0]}
                    </h2>

                    <p class="text-xs text-[#5A4E38] mt-1">
                        Keep breathing and maintain proper form.
                    </p>
                </div>

                <!-- Timer -->
                <div class="relative w-28 h-28 mx-auto flex items-center justify-center">

                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="46"
                            stroke="#E8DEC9" stroke-width="6"
                            fill="transparent"/>

                        <circle id="timer-ring"
                            cx="56" cy="56" r="46"
                            stroke="#6E7E44" stroke-width="6"
                            stroke-dasharray="289"
                            stroke-dashoffset="0"
                            stroke-linecap="round"
                            fill="transparent"/>
                    </svg>

                    <div class="absolute text-center">
                        <span id="timer-display"
                            class="text-2xl font-bold font-serif text-[#3D3323]">
                            0:45
                        </span>
                    </div>
                </div>

                <!-- Controls -->
                <div class="flex items-center justify-center space-x-4 pt-2">

                    <button onclick="togglePause()" id="pause-btn"
                        class="px-6 py-3 bg-[#E8DEC9] text-[#3D3323] rounded-2xl font-semibold text-sm">
                        Pause
                    </button>

                    <button onclick="nextExercise()"
                        class="px-6 py-3 bg-olive-600 text-white rounded-2xl font-semibold text-sm shadow">
                        Next Exercise →
                    </button>

                </div>
            </div>
        </div>
    `;

    startWorkoutTimer();
}

// Timer and Workout Animation
function startWorkoutTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    function animateCanvas() {
        if (!activeWorkout) return;

        if (!isPaused) {
            animProgress += 0.02;
        }

        const currentEx = activeWorkout.exercises[activeExerciseIdx];

        drawStickFigure('active-canvas', currentEx, animProgress);

        animationFrameId = requestAnimationFrame(animateCanvas);
    }

    animateCanvas();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                nextExercise();
            }
        }
    }, 1000);
}

// Update Timer
function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    const ring = document.getElementById('timer-ring');

    if (display) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;

        display.innerText =
            `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    if (ring) {
        const dashoffset = 289 - (289 * (45 - timeLeft)) / 45;
        ring.style.strokeDashoffset = dashoffset;
    }
}

// Pause or Resume
function togglePause() {
    isPaused = !isPaused;

    const btn = document.getElementById('pause-btn');

    if (btn) {
        btn.innerText = isPaused ? 'Resume' : 'Pause';
    }
}

// Next Exercise
function nextExercise() {
    activeExerciseIdx++;

    if (activeExerciseIdx >= activeWorkout.exercises.length) {
        stopWorkoutTimer();

        userStats.completedWorkoutsCount++;
        userStats.calories += 150;
        userStats.activeMinutes += activeWorkout.duration;

        renderCompletionScreen();

    } else {
        timeLeft = 45;

        const titleEl = document.getElementById('active-exercise-title');
        const nameLabel = document.getElementById('ex-name-label');
        const numEl = document.getElementById('current-ex-num');
        const progressBar = document.getElementById('workout-progress-bar');

        const nextEx = activeWorkout.exercises[activeExerciseIdx];

        if (titleEl) titleEl.innerText = nextEx;
        if (nameLabel) nameLabel.innerText = nextEx;
        if (numEl) numEl.innerText = activeExerciseIdx + 1;

        if (progressBar) {
            progressBar.style.width =
                `${((activeExerciseIdx + 1) / activeWorkout.exercises.length) * 100}%`;
        }

        updateTimerDisplay();
    }
}

// Stop Timer and Animation
function stopWorkoutTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Workout Completion
function renderCompletionScreen() {
    const container = document.getElementById('app-container');

    container.innerHTML = `
        <div class="space-y-6 text-center py-10 animate-fadeIn">

            <div class="w-24 h-24 bg-olive-600 text-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg">
                🏆
            </div>

            <div class="space-y-2">
                <h2 class="text-3xl font-serif font-bold text-[#3D3323]">
                    Workout Complete!
                </h2>

                <p class="text-sm text-[#5A4E38]">
                    You crushed
                    <span class="font-bold text-[#3D3323]">
                        ${activeWorkout.title}
                    </span>.
                </p>
            </div>

            <div class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-6 grid grid-cols-2 gap-4">

                <div>
                    <p class="text-xl font-bold font-serif text-[#3D3323]">
                        +150 kcal
                    </p>

                    <p class="text-xs text-[#5A4E38]">
                        Energy Burned
                    </p>
                </div>

                <div>
                    <p class="text-xl font-bold font-serif text-[#3D3323]">
                        ${activeWorkout.duration} min
                    </p>

                    <p class="text-xs text-[#5A4E38]">
                        Duration
                    </p>
                </div>
            </div>

            <button onclick="switchTab('home')"
                class="w-full py-4 bg-olive-600 text-white rounded-2xl font-semibold shadow hover:bg-olive-700 transition">
                Return Home
            </button>
        </div>
    `;
}

// Workout Search
function filterWorkouts(query) {
    const list = document.getElementById('workout-list');

    if (!list) return;

    const filtered = workoutsData.filter(w =>
        w.title.toLowerCase().includes(query.toLowerCase()) ||
        w.type.toLowerCase().includes(query.toLowerCase())
    );

    list.innerHTML = filtered.map(w => `
        <div onclick="startWorkout(${workoutsData.indexOf(w)})"
            class="bg-[#FAF8F5] border border-[#E8DEC9] rounded-2xl p-4 shadow-sm hover:border-olive-600 transition cursor-pointer flex items-center justify-between">

            <div class="space-y-1">

                <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-[#E8DEC9] text-[#5A4E38] rounded">
                    ${w.type}
                </span>

                <h4 class="font-bold text-[#3D3323] text-lg">
                    ${w.title}
                </h4>

                <p class="text-xs text-[#5A4E38]">
                    ${w.desc}
                </p>

                <div class="flex items-center space-x-3 text-xs text-[#5A4E38] pt-1">
                    <span>⏱️ ${w.duration} mins</span>
                    <span>⚡ ${w.level}</span>
                </div>
            </div>

            <div class="w-8 h-8 rounded-full bg-[#E8DEC9] flex items-center justify-center text-[#3D3323]">
                →
            </div>
        </div>
    `).join('');
}

// Reset Fitness Data
function resetData() {
    if (confirm("Reset all workout stats and streaks?")) {
        userStats = {
            streak: 1,
            calories: 0,
            steps: 0,
            activeMinutes: 0,
            completedWorkoutsCount: 0,
            totalHours: 0,
            prs: 0
        };

        document.getElementById('header-streak').innerText = '1 Day';

        switchTab('home');
        alert("Data reset successfully.");
    }
}

// Initialize Website
window.onload = () => {
    renderContent();
};
