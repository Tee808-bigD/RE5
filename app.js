// MoonShot ToonMotion AI - Frontend Application Logic

// Topics Database
const TOPICS = [
  {
    id: "scifi",
    title: "Sci-Fi Cyberpunk Street",
    category: "Sci-Fi / Cyberpunk",
    image: "assets/scifi_cyberpunk.jpg",
    prompt: "A futuristic cyberpunk street at night, flying neon cars, towering skyscrapers with digital billboards, vibrant purple and cyan colors, premium animated cartoon style, high-end 2D anime style, detailed background.",
    description: "A neon-drenched metropolis comes to life with flying vehicles cutting through heavy rain. The motion synthesis captures the parallax effect of towering skyscrapers against floating platforms.",
    motionWeight: 8.5,
    seed: 40829104,
    aspectRatio: "16:9",
    class: "playing-scifi"
  },
  {
    id: "forest",
    title: "Enchanted Forest Retreat",
    category: "Fantasy / Whimsical",
    image: "assets/enchanted_forest.jpg",
    prompt: "A mystical enchanted forest at twilight, giant glowing mushrooms, a cozy tiny wooden cabin with warm light shining from windows, fireflies floating in the air, fantasy adventure cartoon style, beautiful Ghibli-inspired art, vivid magical atmosphere.",
    description: "Fireflies drift lazily through a magical woodland scene. The waterfall in the background is rendered with a smooth flow map, and the chimney smoke has a soft, physical wind drift.",
    motionWeight: 4.2,
    seed: 19302947,
    aspectRatio: "16:9",
    class: "playing-forest"
  },
  {
    id: "cozy",
    title: "Cozy Rainy Afternoon",
    category: "Slice of Life / Lo-Fi",
    image: "assets/cozy_rainy_day.jpg",
    prompt: "A cute fluffy cat curled up on a soft windowsill cushion, looking out at a rainy modern city street through a window glass covered in raindrops. Inside, warm golden lighting, a steaming cup of tea nearby, aesthetic lo-fi cartoon illustration, cozy anime style.",
    description: "A relaxing lo-fi scene depicting a sleepy cat watching traffic down below. The window pane shows simulated water trails while delicate rising steam mimics real fluid dynamics.",
    motionWeight: 2.0,
    seed: 88492019,
    aspectRatio: "16:9",
    class: "playing-cozy"
  },
  {
    id: "steampunk",
    title: "Steampunk Sky Voyage",
    category: "Epic / Adventure",
    image: "assets/steampunk_voyage.jpg",
    prompt: "An epic steampunk airship sailing through a sky filled with golden clouds at sunset, massive propellers spinning, brass and iron details, dynamic light rays, adventure anime style, detailed fantasy design.",
    description: "An airship plows through golden sunset clouds. Propellers spin at high speed with custom motion blur, and the sunlight dynamically rays through the moving cloud formations.",
    motionWeight: 9.0,
    seed: 74930218,
    aspectRatio: "16:9",
    class: "playing-steampunk"
  }
];

// App State
let state = {
  activeTopic: TOPICS[0],
  isPlaying: false,
  isMuted: false,
  volume: 70,
  isLooping: true,
  currentTime: 0, // In seconds (0 to 4.0)
  duration: 4.0, // Fixed loop duration of 4s
  fps: 24,
  animationFrameId: null,
  generationProgress: 0,
  isGenerating: false,
  particles: []
};

// DOM Elements
const elements = {
  topicsList: document.getElementById("topicsList"),
  playerBgImage: document.getElementById("playerBgImage"),
  motionCanvas: document.getElementById("motionCanvas"),
  splashPlayBtn: document.getElementById("splashPlayBtn"),
  playBtn: document.getElementById("playBtn"),
  playIcon: document.getElementById("playIcon"),
  loopBtn: document.getElementById("loopBtn"),
  timeDisplay: document.getElementById("timeDisplay"),
  timeline: document.getElementById("timeline"),
  timelineProgress: document.getElementById("timelineProgress"),
  volumeBtn: document.getElementById("volumeBtn"),
  volumeIcon: document.getElementById("volumeIcon"),
  volumeSlider: document.getElementById("volumeSlider"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  terminalConsole: document.getElementById("terminalConsole"),
  clearLogBtn: document.getElementById("clearLogBtn"),
  promptTextarea: document.getElementById("promptTextarea"),
  charCount: document.getElementById("charCount"),
  motionStrength: document.getElementById("motionStrength"),
  motionWeightVal: document.getElementById("motionWeightVal"),
  aspectRatio: document.getElementById("aspectRatio"),
  seedInput: document.getElementById("seedInput"),
  randomSeedBtn: document.getElementById("randomSeedBtn"),
  frameRate: document.getElementById("frameRate"),
  generateBtn: document.getElementById("generateBtn"),
  topicDescription: document.getElementById("topicDescription"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingPhase: document.getElementById("loadingPhase"),
  progressBarFill: document.getElementById("progressBarFill"),
  progressPercent: document.getElementById("progressPercent"),
  playerContainer: document.getElementById("playerContainer")
};

// Canvas context
const ctx = elements.motionCanvas.getContext("2d");

// Initialize Lucide Icons
lucide.createIcons();

// Setup UI
function init() {
  renderTopicsList();
  selectTopic(TOPICS[0].id);
  setupEventListeners();
  resizeCanvas();
  addLog("System initialized.", "info");
  addLog("ToonMotion Diffusion engine online: v1.5-preview-502.", "success");
}

// Render Left Panel Topics
function renderTopicsList() {
  elements.topicsList.innerHTML = "";
  TOPICS.forEach(topic => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.setAttribute("data-id", topic.id);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    
    card.innerHTML = `
      <div class="topic-thumb-wrapper">
        <img src="${topic.image}" alt="${topic.title}" class="topic-thumb">
      </div>
      <div class="topic-card-info">
        <h3 class="topic-card-title">${topic.title}</h3>
        <p class="topic-card-desc">${topic.category}</p>
        <span class="motion-badge">
          <i data-lucide="activity"></i> Motion Weight: ${topic.motionWeight}
        </span>
      </div>
    `;
    
    card.addEventListener("click", () => {
      if (!state.isGenerating) {
        selectTopic(topic.id);
      } else {
        addLog("Cannot switch topic while video synthesis is running.", "warning");
      }
    });
    
    elements.topicsList.appendChild(card);
  });
  lucide.createIcons({ attrs: { class: 'lucide-badge-icon' } });
}

// Select Active Topic
function selectTopic(topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;
  
  state.activeTopic = topic;
  
  // Highlight card
  document.querySelectorAll(".topic-card").forEach(card => {
    if (card.getAttribute("data-id") === topicId) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  // Pause playing first
  pauseVideo();

  // Update Player background
  elements.playerBgImage.src = topic.image;
  elements.playerBgImage.className = "player-bg"; // clear animation class
  
  // Update Parameter values
  elements.promptTextarea.value = topic.prompt;
  elements.charCount.textContent = `${topic.prompt.length}/500`;
  elements.motionStrength.value = topic.motionWeight;
  elements.motionWeightVal.textContent = topic.motionWeight.toFixed(1);
  elements.seedInput.value = topic.seed;
  elements.aspectRatio.value = topic.aspectRatio;
  elements.topicDescription.textContent = topic.description;

  // Reset timeline
  state.currentTime = 0;
  updateTimelineUI();

  // Reset particles
  initParticlesForTopic(topicId);

  addLog(`Loaded topic: "${topic.title}"`, "info");
}

// Helper: Add Terminal Logs
function addLog(text, type = "info") {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  line.innerHTML = `<span style="color: var(--text-muted)">[${time}]</span> [${type.toUpperCase()}] ${text}`;
  
  elements.terminalConsole.appendChild(line);
  elements.terminalConsole.scrollTop = elements.terminalConsole.scrollHeight;
}

// Particles Initialization based on Topic
function initParticlesForTopic(topicId) {
  state.particles = [];
  const canvasWidth = elements.motionCanvas.width;
  const canvasHeight = elements.motionCanvas.height;

  if (topicId === "scifi") {
    // Cyberpunk Neon Rain
    for (let i = 0; i < 60; i++) {
      state.particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight - canvasHeight,
        length: Math.random() * 25 + 15,
        speed: Math.random() * 8 + 10,
        angle: Math.PI / 6, // 30 degrees drift
        width: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? "rgba(0, 242, 254, 0.6)" : "rgba(255, 0, 127, 0.6)"
      });
    }
  } else if (topicId === "forest") {
    // Glowing Magic Fireflies
    for (let i = 0; i < 40; i++) {
      state.particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        pulseSpeed: Math.random() * 0.05 + 0.02,
        opacity: Math.random(),
        color: Math.random() > 0.3 ? "rgba(57, 255, 20, " : "rgba(255, 179, 71, " // green-yellow or gold
      });
    }
  } else if (topicId === "cozy") {
    // Steaming tea + Window Raindrops
    // 10 Steam particles
    for (let i = 0; i < 12; i++) {
      state.particles.push({
        type: "steam",
        x: canvasWidth * 0.32 + (Math.random() - 0.5) * 15, // near the cup
        y: canvasHeight * 0.75 + Math.random() * 20,
        radius: Math.random() * 4 + 2,
        speedY: Math.random() * 0.5 + 0.3,
        amplitude: Math.random() * 1.5 + 0.5,
        frequency: Math.random() * 0.05 + 0.02,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
    // 40 Glass Raindrops
    for (let i = 0; i < 40; i++) {
      state.particles.push({
        type: "drop",
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: Math.random() * 1.5 + 0.8,
        speedY: Math.random() * 1.5 + 0.5,
        length: Math.random() * 6 + 3,
        trail: []
      });
    }
  } else if (topicId === "steampunk") {
    // Spinning Propellers & Golden Clouds
    // Clouds
    for (let i = 0; i < 5; i++) {
      state.particles.push({
        type: "cloud",
        x: Math.random() * canvasWidth + canvasWidth,
        y: Math.random() * (canvasHeight * 0.6),
        radius: Math.random() * 80 + 50,
        speedX: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.2 + 0.1
      });
    }
    // Sun Ray opacity pulse
    state.particles.push({
      type: "lens",
      angle: 0,
      opacity: 0.15
    });
  }
}

// Handle Canvas Resize
function resizeCanvas() {
  const rect = elements.playerBgImage.getBoundingClientRect();
  if (rect.width > 0) {
    elements.motionCanvas.width = rect.width;
    elements.motionCanvas.height = rect.height;
    initParticlesForTopic(state.activeTopic.id);
  }
}

// Particle Rendering Loop
function drawParticles() {
  if (!ctx) return;
  const canvasWidth = elements.motionCanvas.width;
  const canvasHeight = elements.motionCanvas.height;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (state.activeTopic.id === "scifi") {
    // Draw Cyberpunk Neon Rain
    state.particles.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth = p.width;
      ctx.strokeStyle = p.color;
      
      const dx = p.length * Math.cos(p.angle);
      const dy = p.length * Math.sin(p.angle);
      
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + dx, p.y + dy);
      ctx.stroke();

      // Update position
      if (state.isPlaying) {
        p.x += p.speed * Math.cos(p.angle);
        p.y += p.speed * Math.sin(p.angle);

        // Reset particle
        if (p.y > canvasHeight || p.x > canvasWidth) {
          p.y = -p.length;
          p.x = Math.random() * canvasWidth - 100;
        }
      }
    });

  } else if (state.activeTopic.id === "forest") {
    // Draw Magic Fireflies with glowing dropshadows
    state.particles.forEach(p => {
      ctx.beginPath();
      p.opacity += p.pulseSpeed;
      if (p.opacity > 1 || p.opacity < 0.1) {
        p.pulseSpeed = -p.pulseSpeed;
      }
      
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.max(0.1, Math.min(1, p.opacity)) + ")";
      ctx.shadowColor = p.color.includes("57") ? "rgba(57, 255, 20, 0.8)" : "rgba(255, 179, 71, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Update position
      if (state.isPlaying) {
        p.x += p.speedX;
        p.y += p.speedY;

        // Bounce borders
        if (p.x < 0 || p.x > canvasWidth) p.speedX = -p.speedX;
        if (p.y < 0 || p.y > canvasHeight) p.speedY = -p.speedY;
      }
    });

  } else if (state.activeTopic.id === "cozy") {
    // Draw Cozy Steam & Drops
    state.particles.forEach(p => {
      if (p.type === "steam") {
        ctx.beginPath();
        // sine wave shift
        const offset = Math.sin(p.y * p.frequency + p.phase) * p.amplitude;
        ctx.arc(p.x + offset, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 243, 250, ${p.opacity})`;
        ctx.fill();

        // Update
        if (state.isPlaying) {
          p.y -= p.speedY;
          p.phase += 0.02;
          p.opacity -= 0.003;

          if (p.opacity <= 0 || p.y < canvasHeight * 0.4) {
            p.y = canvasHeight * 0.75 + Math.random() * 20;
            p.x = canvasWidth * 0.32 + (Math.random() - 0.5) * 15;
            p.opacity = Math.random() * 0.5 + 0.2;
          }
        }
      } else if (p.type === "drop") {
        // Draw trickling glass drops
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();

        // Draw trail
        p.trail.forEach((t, index) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.radius * (index / p.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * (index / p.trail.length)})`;
          ctx.fill();
        });

        if (state.isPlaying) {
          // Add trail
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.shift();

          p.y += p.speedY;
          // random side shift
          if (Math.random() > 0.95) p.x += (Math.random() - 0.5) * 2;

          if (p.y > canvasHeight) {
            p.y = -p.length;
            p.x = Math.random() * canvasWidth;
            p.trail = [];
            p.speedY = Math.random() * 1.5 + 0.5;
          }
        }
      }
    });

  } else if (state.activeTopic.id === "steampunk") {
    // Clouds & Spinning Propeller overlays
    state.particles.forEach(p => {
      if (p.type === "cloud") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.arc(p.x - p.radius * 0.6, p.y + p.radius * 0.2, p.radius * 0.8, 0, Math.PI * 2);
        ctx.arc(p.x + p.radius * 0.6, p.y + p.radius * 0.2, p.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 218, 160, ${p.opacity})`; // Warm sunset colored clouds
        ctx.fill();

        if (state.isPlaying) {
          p.x -= p.speedX;
          if (p.x + p.radius * 2.5 < 0) {
            p.x = canvasWidth + p.radius * 2;
            p.y = Math.random() * (canvasHeight * 0.6);
          }
        }
      } else if (p.type === "lens") {
        // Glowing sunbeam effect
        p.angle += 0.005;
        const beamGrad = ctx.createRadialGradient(
          canvasWidth * 0.85, canvasHeight * 0.35, 10,
          canvasWidth * 0.85, canvasHeight * 0.35, canvasWidth * 0.7
        );
        beamGrad.addColorStop(0, `rgba(255, 235, 180, ${p.opacity})`);
        beamGrad.addColorStop(0.3, `rgba(255, 195, 120, ${p.opacity * 0.5})`);
        beamGrad.addColorStop(1, "rgba(255, 195, 120, 0)");

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(canvasWidth * 0.85, canvasHeight * 0.35, canvasWidth * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Propellers (drawn on top of the airship area)
        // Draw small propeller blades spinning
        const propCenter1 = { x: canvasWidth * 0.175, y: canvasHeight * 0.55 };
        const propCenter2 = { x: canvasWidth * 0.51, y: canvasHeight * 0.76 };
        
        drawSpinningPropeller(propCenter1, 40, p.angle * 22);
        drawSpinningPropeller(propCenter2, 58, -p.angle * 24);
      }
    });
  }
}

function drawSpinningPropeller(center, radius, angle) {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);
  
  // Center pin
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#3e2723";
  ctx.fill();

  // 3 blades
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    
    // Blade blur trail
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.ellipse(0, -radius/2, 6, radius/2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(100, 70, 40, 0.25)";
    ctx.fill();
    
    // Solid blade
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(-2, -radius);
    ctx.lineTo(2, -radius);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fillStyle = "rgba(78, 52, 46, 0.85)";
    ctx.strokeStyle = "rgba(255, 200, 100, 0.4)";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// Animation loop callback
function animationLoop(timestamp) {
  if (!state.isPlaying) return;

  // Frame rate control
  const interval = 1000 / state.fps;
  
  // Calculate simulated timeline progress
  state.currentTime += 0.0166; // approx 60fps increments
  if (state.currentTime >= state.duration) {
    if (state.isLooping) {
      state.currentTime = 0;
      addLog("Loop triggered, restarting frames.", "info");
    } else {
      pauseVideo();
      state.currentTime = state.duration;
    }
  }

  updateTimelineUI();
  drawParticles();

  state.animationFrameId = requestAnimationFrame(animationLoop);
}

// Start Playing
function playVideo() {
  if (state.isPlaying) return;

  state.isPlaying = true;
  elements.playIcon.setAttribute("data-lucide", "pause");
  lucide.createIcons({ attrs: { id: 'playIcon' } });
  elements.splashPlayBtn.style.opacity = "0";
  elements.splashPlayBtn.style.pointerEvents = "none";
  
  // Apply image dynamic scale classes
  elements.playerBgImage.classList.add(state.activeTopic.class);

  addLog(`Playing video synthesis preview...`, "info");
  
  state.animationFrameId = requestAnimationFrame(animationLoop);
}

// Pause Playing
function pauseVideo() {
  if (!state.isPlaying) return;

  state.isPlaying = false;
  elements.playIcon.setAttribute("data-lucide", "play");
  lucide.createIcons({ attrs: { id: 'playIcon' } });
  elements.splashPlayBtn.style.opacity = "1";
  elements.splashPlayBtn.style.pointerEvents = "auto";
  
  // Remove scale animation
  elements.playerBgImage.classList.remove(state.activeTopic.class);

  addLog(`Playback paused.`, "info");

  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
}

// Update Playback timeline slider
function updateTimelineUI() {
  const percent = (state.currentTime / state.duration) * 100;
  elements.timeline.value = percent;
  elements.timelineProgress.style.width = `${percent}%`;

  const currStr = state.currentTime.toFixed(2);
  const durStr = state.duration.toFixed(2);
  elements.timeDisplay.textContent = `0:${currStr.padStart(5, '0')} / 0:${durStr.padStart(5, '0')}`;
}

// Event Listeners setup
function setupEventListeners() {
  // Splash play button
  elements.splashPlayBtn.addEventListener("click", playVideo);
  
  // Controls
  elements.playBtn.addEventListener("click", () => {
    if (state.isPlaying) pauseVideo();
    else playVideo();
  });

  // Loop toggle
  elements.loopBtn.addEventListener("click", () => {
    state.isLooping = !state.isLooping;
    if (state.isLooping) {
      elements.loopBtn.querySelector("i").classList.add("active");
      addLog("Loop playback enabled.", "info");
    } else {
      elements.loopBtn.querySelector("i").classList.remove("active");
      addLog("Loop playback disabled. Video will stop at duration end.", "info");
    }
  });

  // Timeline slider interaction
  elements.timeline.addEventListener("input", (e) => {
    const wasPlaying = state.isPlaying;
    pauseVideo();
    state.currentTime = (e.target.value / 100) * state.duration;
    updateTimelineUI();
    drawParticles(); // re-draw at new timestamp
    if (wasPlaying) playVideo();
  });

  // Volume control
  elements.volumeSlider.addEventListener("input", (e) => {
    state.volume = e.target.value;
    if (state.volume == 0) {
      muteVolume(true);
    } else {
      muteVolume(false);
      state.isMuted = false;
    }
  });

  elements.volumeBtn.addEventListener("click", () => {
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
      muteVolume(true);
    } else {
      muteVolume(false);
    }
  });

  // Fullscreen button
  elements.fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      elements.playerContainer.requestFullscreen()
        .then(() => {
          setTimeout(resizeCanvas, 150);
          addLog("Fullscreen enabled.", "info");
        })
        .catch(err => {
          addLog(`Error entering fullscreen: ${err.message}`, "warning");
        });
    } else {
      document.exitFullscreen();
      addLog("Fullscreen disabled.", "info");
    }
  });

  document.addEventListener("fullscreenchange", () => {
    setTimeout(resizeCanvas, 150);
  });

  // Clear Console Logs
  elements.clearLogBtn.addEventListener("click", () => {
    elements.terminalConsole.innerHTML = "";
    addLog("Console log cleared.", "info");
  });

  // Character counter for prompt
  elements.promptTextarea.addEventListener("input", (e) => {
    elements.charCount.textContent = `${e.target.value.length}/500`;
  });

  // Slider motion weight indicator
  elements.motionStrength.addEventListener("input", (e) => {
    elements.motionWeightVal.textContent = parseFloat(e.target.value).toFixed(1);
  });

  // Random Seed Generator
  elements.randomSeedBtn.addEventListener("click", () => {
    const randomSeed = Math.floor(10000000 + Math.random() * 90000000);
    elements.seedInput.value = randomSeed;
    addLog(`Generated new random seed: ${randomSeed}`, "info");
  });

  // Synthesis Action Button
  elements.generateBtn.addEventListener("click", () => {
    if (state.isGenerating) return;
    synthesizeVideo();
  });

  // Handle window resizing
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  // Set initial canvas dimension on background image load
  elements.playerBgImage.onload = () => {
    resizeCanvas();
    drawParticles();
  };
}

// Volume helper functions
function muteVolume(mute) {
  if (mute) {
    elements.volumeIcon.setAttribute("data-lucide", "volume-x");
    elements.volumeSlider.value = 0;
    addLog("Audio output muted.", "info");
  } else {
    elements.volumeIcon.setAttribute("data-lucide", "volume-2");
    elements.volumeSlider.value = state.volume;
    addLog(`Audio output enabled: Vol ${state.volume}%`, "info");
  }
  lucide.createIcons({ attrs: { id: 'volumeIcon' } });
}

// Simulated Video Generation Synthesis
function synthesizeVideo() {
  state.isGenerating = true;
  pauseVideo();
  
  elements.loadingOverlay.classList.add("active");
  elements.generateBtn.disabled = true;
  elements.generateBtn.style.opacity = "0.6";

  const customPrompt = elements.promptTextarea.value;
  const customWeight = parseFloat(elements.motionStrength.value);
  const customSeed = parseInt(elements.seedInput.value);
  const customAspect = elements.aspectRatio.value;

  addLog(`--- START VIDEO LOOP SYNTHESIS ---`, "success");
  addLog(`Prompt: "${customPrompt.substring(0, 50)}..."`, "info");
  addLog(`Parameters: MotionWeight: ${customWeight}, Seed: ${customSeed}, AspectRatio: ${customAspect}`, "info");

  const phases = [
    { percent: 10, label: "Initializing Diffusion Model lattices...", duration: 600, log: "Initializing latent spaces..." },
    { percent: 30, label: "Injecting Text Embedding guidance...", duration: 800, log: `Applying Cross-Attention matrices for prompt details...` },
    { percent: 55, label: "Synthesizing Motion vectors...", duration: 1000, log: `Interpolating frame transitions (Motion scale: ${customWeight})...` },
    { percent: 80, label: "Denoising Keyframe latents...", duration: 900, log: `Performing denoise calculations (Seed: ${customSeed})...` },
    { percent: 95, label: "Rendering Temporal filters...", duration: 600, log: "Filtering video loop edge boundaries..." },
    { percent: 100, label: "Synthesis Complete!", duration: 400, log: "Compilation successful. Video stream buffered." }
  ];

  let currentPhaseIndex = 0;

  function runPhase() {
    if (currentPhaseIndex >= phases.length) {
      // Done generating!
      setTimeout(() => {
        elements.loadingOverlay.classList.remove("active");
        elements.generateBtn.disabled = false;
        elements.generateBtn.style.opacity = "1";
        state.isGenerating = false;
        
        // Update model properties
        state.activeTopic.prompt = customPrompt;
        state.activeTopic.motionWeight = customWeight;
        state.activeTopic.seed = customSeed;
        state.activeTopic.aspectRatio = customAspect;
        
        // Render update list to update badge numbers
        const activeId = state.activeTopic.id;
        const index = TOPICS.findIndex(t => t.id === activeId);
        if (index !== -1) {
          TOPICS[index].prompt = customPrompt;
          TOPICS[index].motionWeight = customWeight;
          TOPICS[index].seed = customSeed;
          TOPICS[index].aspectRatio = customAspect;
          renderTopicsList();
          selectTopic(activeId);
        }

        addLog(`--- SYNTHESIS COMPLETE ---`, "success");
        playVideo();
      }, 500);
      return;
    }

    const phase = phases[currentPhaseIndex];
    elements.loadingPhase.textContent = phase.label;
    elements.progressBarFill.style.width = `${phase.percent}%`;
    elements.progressPercent.textContent = `${phase.percent}%`;
    
    addLog(phase.log, "info");

    setTimeout(() => {
      currentPhaseIndex++;
      runPhase();
    }, phase.duration);
  }

  runPhase();
}

// Kick off initialization on page load
window.addEventListener("DOMContentLoaded", init);
