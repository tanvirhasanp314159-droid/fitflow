// FITFLOW Application Logic
let currentTab = 'home';
let userStats = {
    streak: 4,
    calories: 320,
    steps: 4250,
    activeMinutes: 35,
    completedWorkoutsCount: 12,
    totalHours: 28
};

const workoutsData = [
    { id: 1, title: "Full Body Strength", type: "strength", duration: 30, level: "Beginner", desc: "Build overall functional strength and muscle tone.", exercises: ["Squats", "Push-ups", "Lunges", "Plank", "Glute Bridges", "Mountain Climbers"] },
    { id: 2, title: "Morning Cardio Boost", type: "cardio", duration: 15, level: "Intermediate", desc: "Awaken your metabolism and boost daily energy.", exercises: ["Jumping Jacks", "High Knees", "Burpees", "Butt Kicks", "Skater Hops"] },
    { id: 3, title: "Mobility & Flow", type: "yoga", duration: 20, level: "All Levels", desc: "Release stiffness and improve flexibility.", exercises: ["Cat-Cow", "Downward Dog", "Child's Pose", "World's Greatest Stretch", "Spinal Twist"] },
    { id: 4, title: "Core & Stability", type: "strength", duration: 10, level: "Beginner", desc: "Target your core for better posture and stability.", exercises: ["Plank Hold", "Bicycle Crunches", "Leg Raises", "Russian Twists"] }
];

let activeWorkout = null;
let activeExerciseIdx = 0;
let timerInterval = null;
let timeLeft = 45;
let isPaused = false;
let animationFrameId = null;
let animProgress = 0;

function drawStickFigure(canvasId, exerciseName, progress) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    ctx.strokeStyle = '#E8DEC9';
    ctx.lineWidth = 0.5;
    for(let x=0; x<w; x+=20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for(let y=0; y<h; y+=20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    ctx.strokeStyle = '#3D3323';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cycle = Math.sin(progress * Math.PI * 4);
    const bounce = Math.abs(Math.sin(progress * Math.PI * 4)) * 6;

    ctx.save();
    ctx.translate(w/2, h/2 + 20 - bounce);

    ctx.beginPath();
    ctx.arc(0, -50, 12, 0, Math.PI * 2);
    ctx.stroke();

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

function switchTab(tab) {
    currentTab = tab;
    stopWorkoutTimer();
    ['home', 'workouts', 'progress', 'profile'].forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        if (btn) {
            if (t === tab) {
                btn.className = "nav-item active";
            } else {
                btn.className = "nav-item";
            }
        }
    });
    renderContent();
}

function renderContent() {
    const container = document.getElementById('app-container');
    if (!container) return;

    if (currentTab === 'home') {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p style="font-size: 14px; color: #5A4E38; font-weight: 500;">Good morning,</p>
                <h2 style="font-size: 28px; font-weight: 700; color: #3D3323;">Tate.</h2>
            </div>
            <div class="card" style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h3 style="font-size: 18px; font-weight: 700; color: #3D3323; margin-bottom: 6px;">Daily Goal</h3>
                    <p style="font-size: 14px; color: #6E7E44; font-weight: 600;">68% Completed</p>
                </div>
                <div>
                    <p style="font-size: 14px; color: #3D3323; font-weight: 700;">🔥 ${userStats.calories} kcal</p>
                    <p style="font-size: 12px; color: #5A4E38;">👟 ${userStats.steps} steps</p>
                </div>
            </div>
            <div class="card" style="cursor: pointer;" onclick="startWorkout(0)">
                <span style="font-size: 10px; text-transform: uppercase; background: #E8DEC9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Featured</span>
                <h3 style="font-size: 20px; font-weight: 700; color: #3D3323; margin-top: 8px;">Full Body Strength</h3>
                <p style="font-size: 12px; color: #5A4E38; margin-top: 4px;">30 mins • Beginner level</p>
                <div style="margin-top: 12px;"><button class="btn-primary" style="padding: 8px 16px; width: auto;">Start Workout →</button></div>
            </div>
        `;
    } else if (currentTab === 'workouts') {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; color: #3D3323;">Explore Workouts</h2>
                <p style="font-size: 12px; color: #5A4E38;">Choose a routine to get moving.</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${workoutsData.map((w, idx) => `
                    <div class="card" style="margin-bottom: 0; cursor: pointer;" onclick="startWorkout(${idx})">
                        <span style="font-size: 10px; text-transform: uppercase; background: #E8DEC9; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${w.type}</span>
                        <h4 style="font-size: 18px; font-weight: 700; color: #3D3323; margin-top: 6px;">${w.title}</h4>
                        <p style="font-size: 12px; color: #5A4E38; margin: 4px 0;">${w.desc}</p>
                        <p style="font-size: 11px; color: #6E7E44; font-weight: 600;">⏱️ ${w.duration} mins • ⚡ ${w.level}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (currentTab === 'progress') {
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="font-size: 24px; font-weight: 700; color: #3D3323;">Your Progress</h2>
                <p style="font-size: 12px; color: #5A4E38;">Consistency is your superpower.</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="card" style="text-align: center; margin-bottom: 0;">
                    <p style="font-size: 24px; font-weight: 700; color: #3D3323;">${userStats.completedWorkoutsCount}</p>
                    <p style="font-size: 12px; color: #5A4E38;">Workouts Done</p>
                </div>
                <div class="card" style="text-align: center; margin-bottom: 0;">
                    <p style="font-size: 24px; font-weight: 700; color: #3D3323;">${userStats.totalHours} hrs</p>
                    <p style="font-size: 12px; color: #5A4E38;">Total Active Time</p>
                </div>
            </div>
        `;
    } else if (currentTab === 'profile') {
        container.innerHTML = `
            <div style="margin-bottom: 20px; text-align: center;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: #E8DEC9; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #5A4E38;">T</div>
                <h2 style="font-size: 20px; font-weight: 700; color: #3D3323;">Tate</h2>
                <p style="font-size: 12px; color: #5A4E38;">Fitness Enthusiast</p>
            </div>
            <div class="card" style="cursor: pointer;" onclick="alert('Settings feature coming soon!')">
                <p style="font-weight: 600; color: #3D3323;">⚙️ Settings & Preferences</p>
            </div>
        `;
    }
}

function startWorkout(index) {
    activeWorkout = workoutsData[index];
    activeExerciseIdx = 0;
    timeLeft = 45;
    isPaused = false;

    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <button class="btn-primary" style="width: auto; padding: 6px 12px; background: #FAF8F5; color: #3D3323; border: 1px solid #E8DEC9;" onclick="switchTab('home')">← Back</button>
            <h3 style="font-size: 16px; font-weight: 700; color: #3D3323;">${activeWorkout.title}</h3>
            <span></span>
        </div>
        <div class="card" style="text-align: center;">
            <div class="canvas-box">
                <canvas id="active-canvas" width="180" height="180"></canvas>
            </div>
            <h2 id="active-exercise-title" style="font-size: 22px; font-weight: 700; color: #3D3323; margin-bottom: 4px;">${activeWorkout.exercises[0]}</h2>
            <p style="font-size: 13px; color: #5A4E38; margin-bottom: 16px;">Maintain proper form and steady breathing.</p>
            <div style="font-size: 36px; font-weight: 700; font-family: 'Playfair Display', serif; color: #3D3323; margin-bottom: 16px;" id="timer-display">0:45</div>
            <div style="display: flex; gap: 8px;">
                <button class="btn-primary" style="background: #E8DEC9; color: #3D3323;" id="pause-btn" onclick="togglePause()">Pause</button>
                <button class="btn-primary" onclick="nextExercise()">Next Exercise →</button>
            </div>
        </div>
    `;
    startWorkoutTimer();
}

function startWorkoutTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    function animateCanvas() {
        animProgress += 0.02;
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

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    if (display) {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    if (btn) btn.innerText = isPaused ? 'Resume' : 'Pause';
}

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
        const nextEx = activeWorkout.exercises[activeExerciseIdx];
        if (titleEl) titleEl.innerText = nextEx;
    }
}

function stopWorkoutTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

function renderCompletionScreen() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
            <h2 style="font-size: 24px; font-weight: 700; color: #3D3323; margin-bottom: 8px;">Workout Complete!</h2>
            <p style="font-size: 14px; color: #5A4E38; margin-bottom: 24px;">You successfully crushed ${activeWorkout.title}.</p>
            <button class="btn-primary" onclick="switchTab('home')">Return Home</button>
        </div>
    `;
}

window.onload = () => {
    renderContent();
};
