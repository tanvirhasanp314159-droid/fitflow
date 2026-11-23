
/* FITFLOW dynamic AI exercise animator */
(() => {
  const canvas = document.getElementById("exerciseCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const JOINTS = [
    "head", "neck", "ls", "rs", "le", "re", "lw", "rw",
    "pelvis", "lh", "rh", "lk", "rk", "la", "ra"
  ];

  const BASE = [
    130,53, 130,84, 110,98, 150,98,
    94,136, 166,136, 90,169, 170,169,
    130,170, 116,179, 144,179,
    109,226, 151,226, 105,277, 155,277
  ];

  const CACHE_PREFIX = "fitflow-motion-v1:";
  const DEFAULT_MOTION = {
    frames: [BASE],
    periodMs: 2500
  };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let current = DEFAULT_MOTION;
  let currentName = "";
  let paused = true;
  let elapsed = 0;
  let lastTimestamp = 0;
  let requestId = 0;

  function isValidMotion(data) {
    if (
      !data ||
      !Array.isArray(data.frames) ||
      data.frames.length < 2 ||
      data.frames.length > 6 ||
      !Number.isFinite(data.periodMs) ||
      data.periodMs < 600 ||
      data.periodMs > 8000
    ) return false;

    return data.frames.every(frame =>
      Array.isArray(frame) &&
      frame.length === 30 &&
      frame.every((v, i) =>
        Number.isFinite(v) &&
        v >= 0 &&
        v <= (i % 2 === 0 ? 280 : 310)
      )
    );
  }

  function keyFor(name) {
    return CACHE_PREFIX +
      name.toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 100);
  }

  function getCached(name) {
    try {
      const value = JSON.parse(
        localStorage.getItem(keyFor(name))
      );
      return isValidMotion(value) ? value : null;
    } catch {
      return null;
    }
  }

  function saveCached(name, motion) {
    try {
      localStorage.setItem(
        keyFor(name),
        JSON.stringify(motion)
      );
    } catch {
      // Caching is optional.
    }
  }

  function status(message) {
    const label = document.getElementById(
      "animationLabel"
    );

    if (label) label.textContent = message;
  }

  function interpolate(a, b, t) {
    return a + (b - a) * t;
  }

  function currentFrame() {
    const frames = current.frames;

    if (
      frames.length === 1 ||
      reducedMotion.matches
    ) return frames[0];

    const position =
      (elapsed % current.periodMs) /
      current.periodMs * frames.length;

    const index =
      Math.floor(position) % frames.length;

    const next =
      (index + 1) % frames.length;

    const part =
      position - Math.floor(position);

    const smooth =
      part * part * (3 - 2 * part);

    return frames[index].map((v, i) =>
      interpolate(v, frames[next][i], smooth)
    );
  }

  function limb(
    a,
    b,
    width = 10,
    color = "#6f8b48"
  ) {
    ctx.beginPath();

    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function draw(frame) {
    const p = Object.fromEntries(
      JOINTS.map((name, i) => [
        name,
        [frame[2 * i], frame[2 * i + 1]]
      ])
    );

    ctx.clearRect(
      0, 0, canvas.width, canvas.height
    );

    ctx.fillStyle = "#e7edde";
    ctx.fillRect(
      0, 0, canvas.width, canvas.height
    );

    // Floor
    limb(
      [20, 288],
      [260, 288],
      2,
      "#ccd7bc"
    );

    // Back limbs
    const back = "#9cb487";

    limb(p.rs, p.re, 11, back);
    limb(p.re, p.rw, 9, back);

    limb(p.rh, p.rk, 15, back);
    limb(p.rk, p.ra, 12, back);

    // Body
    limb(
      p.neck,
      p.pelvis,
      24,
      "#779457"
    );

    limb(
      p.ls,
      p.rs,
      17,
      "#779457"
    );

    // Legs
    limb(p.pelvis, p.lh, 14);
    limb(p.pelvis, p.rh, 14);

    limb(p.lh, p.lk, 14);
    limb(p.lk, p.la, 11);

    // Front arm
    limb(p.ls, p.le, 11);
    limb(p.le, p.lw, 9);

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
    ctx.beginPath();

    ctx.arc(
      p.head[0] - 6,
      p.head[1] - 2,
      2,
      0,
      Math.PI * 2
    );

    ctx.arc(
      p.head[0] + 6,
      p.head[1] - 2,
      2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#536d35";
    ctx.fill();
  }

  function render(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = Math.min(
      timestamp - lastTimestamp,
      50
    );

    lastTimestamp = timestamp;

    if (
      !paused &&
      !reducedMotion.matches
    ) {
      elapsed += Math.max(0, delta);
    }

    draw(currentFrame());

    requestAnimationFrame(render);
  }

  async function setExercise(name) {
    currentName = String(name || "").trim();

    const thisRequest = ++requestId;

    elapsed = 0;
    current = DEFAULT_MOTION;

    canvas.setAttribute(
      "aria-label",
      `Stylized illustration of ${currentName}; not a technique tutorial`
    );

    if (!currentName) {
      status(
        "Exercise instructions appear below"
      );
      return;
    }

    // First check if this exercise was
    // previously generated.
    const cached = getCached(currentName);

    if (cached) {
      current = cached;

      status(
        `AI movement illustration: ${currentName}`
      );
      return;
    }

    status(
      `Creating movement illustration: ${currentName}...`
    );

    try {
      const client = window.fitflowSupabase;

      if (!client) {
        throw new Error(
          "Supabase client not ready"
        );
      }

      // Request a new animation from Gemini.
      const { data, error } =
        await client.functions.invoke(
          "generate-animation",
          {
            body: {
              exercise: currentName
            }
          }
        );

      if (error) throw error;

      if (!isValidMotion(data)) {
        throw new Error(
          "Invalid animation data"
        );
      }

      saveCached(currentName, data);

      // Prevent an old response from replacing
      // a newer exercise animation.
      if (thisRequest !== requestId) return;

      current = data;
      elapsed = 0;

      status(
        `AI movement illustration: ${currentName}`
      );

    } catch (error) {
      console.warn(
        "FITFLOW animation unavailable:",
        error
      );

      if (thisRequest !== requestId) return;

      current = DEFAULT_MOTION;

      status(
        "No verified animation — follow the written exercise instructions"
      );
    }
  }

  function pause(value) {
    paused = Boolean(value);
  }

  // Compatible with existing script.js.
  window.fitflowAnimator = {
    setExercise,
    pause
  };

  requestAnimationFrame(render);
})();
