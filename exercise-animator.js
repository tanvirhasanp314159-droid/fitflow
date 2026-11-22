
// ============================================
// FITFLOW HUMAN-LIKE EXERCISE ANIMATOR
// ============================================

(() => {
  const canvas =
    document.getElementById("exerciseCanvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // ==========================================
  // DEFAULT BODY JOINTS
  // ==========================================

  const BASE = {
    head: [130, 53],
    neck: [130, 84],

    ls: [110, 98],
    rs: [150, 98],

    le: [94, 136],
    re: [166, 136],

    lw: [90, 169],
    rw: [170, 169],

    pelvis: [130, 170],

    lh: [116, 179],
    rh: [144, 179],

    lk: [109, 226],
    rk: [151, 226],

    la: [105, 277],
    ra: [155, 277]
  };

  const pose = changes => ({
    ...BASE,
    ...changes
  });

  // ==========================================
  // STANDING
  // ==========================================

  const standing = pose({});

  // ==========================================
  // MARCHING LEFT
  // ==========================================

  const marchLeft = pose({
    head: [130, 49],
    neck: [130, 80],

    ls: [110, 94],
    rs: [150, 94],

    pelvis: [130, 166],

    lh: [116, 175],
    rh: [144, 175],

    lk: [110, 190],
    la: [126, 236],

    rk: [151, 223],
    ra: [155, 277],

    le: [109, 126],
    lw: [134, 139],

    re: [176, 124],
    rw: [169, 160]
  });

  // ==========================================
  // MARCHING RIGHT
  // ==========================================

  const marchRight = pose({
    head: [130, 49],
    neck: [130, 80],

    ls: [110, 94],
    rs: [150, 94],

    pelvis: [130, 166],

    lh: [116, 175],
    rh: [144, 175],

    lk: [109, 223],
    la: [105, 277],

    rk: [150, 190],
    ra: [133, 236],

    le: [85, 124],
    lw: [91, 160],

    re: [151, 126],
    rw: [125, 139]
  });

  // ==========================================
  // SQUAT
  // ==========================================

  const squat = pose({
    head: [145, 91],
    neck: [140, 121],

    ls: [121, 132],
    rs: [159, 132],

    le: [104, 151],
    re: [176, 151],

    lw: [120, 155],
    rw: [161, 155],

    pelvis: [133, 207],

    lh: [116, 212],
    rh: [149, 212],

    lk: [91, 237],
    rk: [181, 237],

    la: [101, 277],
    ra: [181, 277]
  });

  // ==========================================
  // JUMPING JACK
  // ==========================================

  const jumpingJack = pose({
    head: [130, 47],
    neck: [130, 78],

    ls: [110, 98],
    rs: [150, 98],

    le: [80, 74],
    re: [180, 74],

    lw: [98, 24],
    rw: [162, 24],

    pelvis: [130, 166],

    lh: [116, 179],
    rh: [144, 179],

    lk: [83, 224],
    rk: [177, 224],

    la: [56, 276],
    ra: [204, 276]
  });

  // ==========================================
  // STRETCH
  // ==========================================

  const stretch = pose({
    le: [99, 61],
    re: [161, 61],

    lw: [111, 15],
    rw: [149, 15]
  });

  // ==========================================
  // LUNGE
  // ==========================================

  const lunge = pose({
    head: [136, 59],
    neck: [136, 89],

    ls: [116, 101],
    rs: [156, 101],

    le: [100, 140],
    re: [172, 140],

    lw: [101, 170],
    rw: [171, 170],

    pelvis: [138, 181],

    lh: [123, 186],
    rh: [152, 186],

    lk: [83, 221],
    rk: [177, 230],

    la: [82, 277],
    ra: [210, 277]
  });

  // ==========================================
  // LEFT PUNCH
  // ==========================================

  const punchLeft = pose({
    head: [132, 53],
    neck: [132, 84],

    ls: [112, 98],
    rs: [152, 98],

    le: [102, 109],
    lw: [65, 108],

    re: [162, 120],
    rw: [150, 133]
  });

  // ==========================================
  // RIGHT PUNCH
  // ==========================================

  const punchRight = pose({
    head: [128, 53],
    neck: [128, 84],

    ls: [108, 98],
    rs: [148, 98],

    le: [98, 120],
    lw: [110, 133],

    re: [158, 109],
    rw: [195, 108]
  });

  // ==========================================
  // PUSH-UP / PLANK
  // ==========================================

  const plank = pose({
    head: [53, 178],
    neck: [78, 177],

    ls: [96, 181],
    rs: [101, 187],

    le: [100, 222],
    re: [112, 224],

    lw: [103, 271],
    rw: [115, 271],

    pelvis: [172, 183],

    lh: [170, 180],
    rh: [173, 188],

    lk: [215, 184],
    rk: [216, 193],

    la: [248, 194],
    ra: [249, 203]
  });

  const pushupDown = pose({
    ...plank,

    head: [53, 213],
    neck: [78, 211],

    ls: [96, 218],
    rs: [101, 223],

    le: [108, 242],
    re: [119, 244],

    pelvis: [172, 217],

    lh: [170, 214],
    rh: [173, 222],

    lk: [215, 204],
    rk: [216, 210]
  });

  // ==========================================
  // EXERCISE SEQUENCES
  // ==========================================

  const sequences = {
    march: [
      standing,
      marchLeft,
      standing,
      marchRight
    ],

    squat: [
      standing,
      squat
    ],

    jack: [
      standing,
      jumpingJack
    ],

    lunge: [
      standing,
      lunge
    ],

    punch: [
      standing,
      punchLeft,
      standing,
      punchRight
    ],

    stretch: [
      standing,
      stretch
    ],

    pushup: [
      plank,
      pushupDown
    ],

    gentle: [
      standing,
      stretch
    ]
  };

  // ==========================================
  // ANIMATION DURATIONS
  // ==========================================

  const durations = {
    march: 1900,
    squat: 2700,
    jack: 2100,
    lunge: 3100,
    punch: 1600,
    stretch: 4200,
    pushup: 2600,
    gentle: 5200
  };

  // ==========================================
  // ANIMATION STATE
  // ==========================================

  let movement = "march";
  let paused = true;

  let elapsed = 0;
  let previousFrame = 0;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  // ==========================================
  // RECOGNIZE EXERCISES FROM GEMINI
  // ==========================================

  function detectExercise(name) {
    const text = String(name || "")
      .toLowerCase();

    if (/push.?up|plank/.test(text)) {
      return "pushup";
    }

    if (
      /jumping jack|step jack|star jump/.test(text)
    ) {
      return "jack";
    }

    if (
      /squat|sit.to.stand|chair stand/.test(text)
    ) {
      return "squat";
    }

    if (/lunge|split squat/.test(text)) {
      return "lunge";
    }

    if (/punch|box|jab/.test(text)) {
      return "punch";
    }

    if (
      /march|walk|step|high knee|knee lift/.test(text)
    ) {
      return "march";
    }

    if (
      /stretch|reach|shoulder|arm circle/.test(text)
    ) {
      return "stretch";
    }

    return "gentle";
  }

  // ==========================================
  // SMOOTH INTERPOLATION
  // ==========================================

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function getCurrentPose() {
    const frames = sequences[movement];
    const duration = durations[movement];

    const phase =
      (elapsed % duration) / duration *
      frames.length;

    const firstIndex =
      Math.floor(phase) % frames.length;

    const nextIndex =
      (firstIndex + 1) % frames.length;

    const fraction =
      phase - Math.floor(phase);

    // Smooth acceleration and deceleration.
    const smooth =
      fraction * fraction * (3 - 2 * fraction);

    const firstPose = frames[firstIndex];
    const nextPose = frames[nextIndex];

    const result = {};

    for (const joint of Object.keys(BASE)) {
      const start = firstPose[joint];
      const end = nextPose[joint];

      result[joint] = [
        lerp(start[0], end[0], smooth),
        lerp(start[1], end[1], smooth)
      ];
    }

    return result;
  }

  // ==========================================
  // DRAW LIMBS
  // ==========================================

  function drawLimb(
    start,
    end,
    width = 11,
    color = "#6f8b48"
  ) {
    ctx.beginPath();

    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";

    ctx.stroke();
  }

  // ==========================================
  // DRAW JOINTS
  // ==========================================

  function drawJoint(point, radius = 5) {
    ctx.beginPath();

    ctx.arc(
      point[0],
      point[1],
      radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#6f8b48";
    ctx.fill();
  }

  // ==========================================
  // DRAW HUMAN FIGURE
  // ==========================================

  function drawFigure(p) {
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Background
    ctx.fillStyle = "#e7edde";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Floor
    drawLimb(
      [20, 288],
      [260, 288],
      2,
      "#ccd7bc"
    );

    const backColor = "#9cb487";

    // Back arm
    drawLimb(p.rs, p.re, 11, backColor);
    drawLimb(p.re, p.rw, 9, backColor);

    // Back leg
    drawLimb(p.rh, p.rk, 15, backColor);
    drawLimb(p.rk, p.ra, 12, backColor);

    // Torso
    drawLimb(
      p.neck,
      p.pelvis,
      25,
      "#779457"
    );

    // Shoulders
    drawLimb(
      p.ls,
      p.rs,
      17,
      "#779457"
    );

    // Hips
    drawLimb(p.pelvis, p.lh, 16);
    drawLimb(p.pelvis, p.rh, 16);

    // Front leg
    drawLimb(p.lh, p.lk, 15);
    drawLimb(p.lk, p.la, 12);

    // Front arm
    drawLimb(p.ls, p.le, 11);
    drawLimb(p.le, p.lw, 9);

    // Joint circles
    ["le", "re", "lk", "rk"].forEach(joint => {
      drawJoint(p[joint]);
    });

    // Head
    ctx.beginPath();

    ctx.arc(
      p.head[0],
      p.head[1],
      19,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#fff8e9";
    ctx.fill();

    ctx.strokeStyle = "#536d35";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Eyes
    const sideView = movement === "pushup";

    ctx.fillStyle = "#536d35";
    ctx.beginPath();

    ctx.arc(
      p.head[0] + (sideView ? -8 : -6),
      p.head[1] - 2,
      2,
      0,
      Math.PI * 2
    );

    if (!sideView) {
      ctx.arc(
        p.head[0] + 6,
        p.head[1] - 2,
        2,
        0,
        Math.PI * 2
      );
    }

    ctx.fill();

    // Mouth
    ctx.beginPath();

    ctx.arc(
      p.head[0],
      p.head[1] + 5,
      5,
      0,
      Math.PI
    );

    ctx.strokeStyle = "#536d35";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================

  function animate(timestamp) {
    if (!previousFrame) {
      previousFrame = timestamp;
    }

    const delta = Math.min(
      50,
      timestamp - previousFrame
    );

    previousFrame = timestamp;

    if (!paused && !reducedMotion.matches) {
      elapsed += delta;
    }

    const currentPose = getCurrentPose();

    drawFigure(currentPose);

    requestAnimationFrame(animate);
  }

  // ==========================================
  // PUBLIC CONTROLS
  // ==========================================

  function setExercise(exerciseName) {
    movement = detectExercise(exerciseName);
    elapsed = 0;

    canvas.setAttribute(
      "aria-label",
      "Stylized " + movement +
      " exercise demonstration"
    );
  }

  function pauseAnimation(value) {
    paused = Boolean(value);
  }

  // Functions called by script.js
  window.fitflowAnimator = {
    setExercise,
    pause: pauseAnimation
  };

  requestAnimationFrame(animate);

})();
