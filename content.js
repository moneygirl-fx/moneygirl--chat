console.log("ChatHomeBase Helper loaded with Smooth Drag, Character Counter, Live UI, Full AI Generation & Persona Scraping");

let lastFocusedField = null;
let isTyping = false;
let cancelTyping = false;
let lastDetectedMessageId = "";
let lastIncomingMessageText = "";
let currentObserver = null;
let typingWorker = null;
let animationFrameId = null; 
window.tfBubbleColor = '0, 210, 255'; 
window.tfThemeType = 'orbs'; 

// -------------------------------------------------------------
// REPLY HISTORY (API SAVER)
// -------------------------------------------------------------
let replyHistory = [];
let currentHistoryIndex = -1;

function updateHistoryButtons() {
  const prevBtn = document.getElementById("tf-prev-btn");
  if (!prevBtn) return;
  if (currentHistoryIndex > 0) {
    prevBtn.style.opacity = "1";
    prevBtn.style.pointerEvents = "auto";
  } else {
    prevBtn.style.opacity = "0.35";
    prevBtn.style.pointerEvents = "none";
  }
}

function addToHistory(replyText) {
  replyHistory.push(replyText);
  currentHistoryIndex = replyHistory.length - 1;
  updateHistoryButtons();
}

function showPreviousReply() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const textarea = document.getElementById("tf-reply-text");
    if (textarea) {
      textarea.value = textarea.defaultValue = replyHistory[currentHistoryIndex];
      updateCharCounterDisplay();
      setStatus(`History [${currentHistoryIndex + 1}/${replyHistory.length}]`);
    }
    updateHistoryButtons();
  }
}

// -------------------------------------------------------------
// AUDIO WAKE ENGINE (REPEATING CHIME + AUTO-STOP)
// -------------------------------------------------------------
let isSleepModeEnabled = localStorage.getItem("tf_sleep_mode") === "true";
let audioCtx = null;
let alarmInterval = null;
let alarmTimeout = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playAlarmSound() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now); 
  osc.frequency.setValueAtTime(1108.73, now + 0.15); 
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.05); 
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  
  osc.start(now);
  osc.stop(now + 0.8);
}

function triggerWakeAlarm() {
  if (!isSleepModeEnabled) return;
  stopWakeAlarm(); 
  initAudio();
  
  const stopBtn = document.getElementById('tf-stop-alarm-btn');
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  
  playAlarmSound(); 
  alarmInterval = setInterval(playAlarmSound, 1200); 
  
  alarmTimeout = setTimeout(() => {
    stopWakeAlarm();
  }, 240000);
}

function stopWakeAlarm() {
  if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
  if (alarmTimeout) { clearTimeout(alarmTimeout); alarmTimeout = null; }
  const stopBtn = document.getElementById('tf-stop-alarm-btn');
  if (stopBtn) stopBtn.style.display = 'none';
}

// -------------------------------------------------------------
// HYPER-MODERN DYNAMIC THEME ENGINE 
// -------------------------------------------------------------
const tfThemes = [
  { name: "Cyber Aurora", bg: "rgba(10, 14, 26, 0.72)", title: "#ffffff", primaryText: "#00f2fe", primary: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", primaryHover: "linear-gradient(135deg, #00d2ff 0%, #0082ff 100%)", text: "#f1f5f9", inputBg: "rgba(15, 23, 42, 0.65)", bubble: "0, 210, 255", shadow: "rgba(0, 198, 255, 0.35)", type: "orbs" },
  { name: "Neon Cyberpunk", bg: "rgba(18, 10, 28, 0.78)", title: "#ff007f", primaryText: "#00f0ff", primary: "linear-gradient(135deg, #ff007f 0%, #7928ca 100%)", primaryHover: "linear-gradient(135deg, #ff2a9d 0%, #8b3dff 100%)", text: "#ffffff", inputBg: "rgba(28, 14, 45, 0.7)", bubble: "255, 0, 127", shadow: "rgba(255, 0, 127, 0.4)", type: "matrix" },
  { name: "Obsidian Core", bg: "rgba(13, 13, 16, 0.85)", title: "#ffffff", primaryText: "#a1a1aa", primary: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)", primaryHover: "linear-gradient(135deg, #52525b 0%, #27272a 100%)", text: "#f4f4f5", inputBg: "rgba(24, 24, 27, 0.75)", bubble: "161, 161, 170", shadow: "rgba(0, 0, 0, 0.9)", type: "minimal" },
  { name: "Emerald Matrix", bg: "rgba(5, 20, 14, 0.8)", title: "#10b981", primaryText: "#34d399", primary: "linear-gradient(135deg, #059669 0%, #10b981 100%)", primaryHover: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", text: "#ecfdf5", inputBg: "rgba(6, 31, 22, 0.7)", bubble: "16, 185, 129", shadow: "rgba(16, 185, 129, 0.35)", type: "matrix" },
  { name: "Sunset Horizon", bg: "rgba(28, 16, 22, 0.78)", title: "#ff7e5f", primaryText: "#feb47b", primary: "linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)", primaryHover: "linear-gradient(135deg, #ff9175 0%, #febe8f 100%)", text: "#fff5f0", inputBg: "rgba(42, 21, 30, 0.7)", bubble: "255, 126, 95", shadow: "rgba(255, 126, 95, 0.4)", type: "orbs" },
  { name: "Arctic Frost", bg: "rgba(240, 246, 255, 0.82)", title: "#0f172a", primaryText: "#2563eb", primary: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", primaryHover: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)", text: "#1e293b", inputBg: "rgba(255, 255, 255, 0.85)", bubble: "59, 130, 246", shadow: "rgba(59, 130, 246, 0.25)", type: "minimal" }
];

let currentThemeIndex = 0;

function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--tf-bg', theme.bg);
  root.style.setProperty('--tf-title', theme.title);
  root.style.setProperty('--tf-primary-text', theme.primaryText);
  root.style.setProperty('--tf-primary', theme.primary);
  root.style.setProperty('--tf-primary-hover', theme.primaryHover);
  root.style.setProperty('--tf-text', theme.text);
  root.style.setProperty('--tf-input-bg', theme.inputBg);
  root.style.setProperty('--tf-shadow', theme.shadow);
  root.style.setProperty('--tf-bubble', theme.bubble);
  window.tfBubbleColor = theme.bubble;
  window.tfThemeType = theme.type; 
}

function startThemeEngine() {
  applyTheme(tfThemes[currentThemeIndex]);
}

function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % tfThemes.length;
  applyTheme(tfThemes[currentThemeIndex]);
  setStatus(`Theme: ${tfThemes[currentThemeIndex].name}`);
}

// -------------------------------------------------------------
// AI REWARD SIGNAL CALCULATOR
// -------------------------------------------------------------
function calculateRewardSignal(suggested, final) {
  if (!suggested || !final) return 1.0;
  if (suggested.trim() === final.trim()) return 0.0; 

  const sWords = suggested.toLowerCase().match(/\b(\w+)\b/g) || [];
  const fWords = final.toLowerCase().match(/\b(\w+)\b/g) || [];

  if (sWords.length === 0 || fWords.length === 0) return 1.0;

  const intersection = sWords.filter(word => fWords.includes(word)).length;
  const union = new Set([...sWords, ...fWords]).size;
  
  const distance = 1 - (intersection / union);
  return parseFloat(distance.toFixed(2));
}

// -------------------------------------------------------------
// UNLIMITED DAILY COUNTER ENGINE
// -------------------------------------------------------------
function getDailyStats() {
  const now = new Date();
  const targetReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  if (now < targetReset) targetReset.setUTCDate(targetReset.getUTCDate() - 1);

  const activePeriodId = targetReset.getTime().toString();
  let stats = JSON.parse(localStorage.getItem('money_girl_stats') || '{}');
  
  if (stats.periodId !== activePeriodId) {
    stats = { periodId: activePeriodId, count: 0 }; 
    localStorage.setItem('money_girl_stats', JSON.stringify(stats));
  }
  return stats;
}

function incrementDailyCount() {
  const stats = getDailyStats();
  stats.count += 1;
  localStorage.setItem('money_girl_stats', JSON.stringify(stats));
  updateCounterUI();
}

function updateCounterUI() {
  const stats = getDailyStats();
  const counterTextEl = document.getElementById('tf-counter-text');
  if (!counterTextEl) return;
  counterTextEl.innerHTML = `<span class="tf-stat-icon">⚡</span> Sent Today: <strong class="tf-stat-count">${stats.count}</strong>`; 
}

// -------------------------------------------------------------
// UI & STYLES (NEXT-GEN GLASSMORPHISM & ANIMATIONS)
// -------------------------------------------------------------
function injectStyles() {
  if (document.getElementById("tf-helper-styles")) return;

  const fontImport = document.createElement("style");
  fontImport.textContent = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');`;
  document.head.appendChild(fontImport);

  const style = document.createElement("style");
  style.id = "tf-helper-styles";
  style.textContent = `
    :root {
      --tf-bg: rgba(10, 14, 26, 0.72);
      --tf-title: #ffffff;
      --tf-primary-text: #00f2fe;
      --tf-primary: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
      --tf-primary-hover: linear-gradient(135deg, #00d2ff 0%, #0082ff 100%);
      --tf-text: #f1f5f9;
      --tf-input-bg: rgba(15, 23, 42, 0.65);
      --tf-shadow: rgba(0, 198, 255, 0.35);
      --tf-bubble: 0, 210, 255;
    }

    @keyframes tfPopIn {
      0% { opacity: 0; transform: scale(0.9) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes tfPulseRing {
      0% { box-shadow: 0 0 0 0 rgba(var(--tf-bubble), 0.6); }
      70% { box-shadow: 0 0 0 12px rgba(var(--tf-bubble), 0); }
      100% { box-shadow: 0 0 0 0 rgba(var(--tf-bubble), 0); }
    }

    @keyframes tfEqualizer {
      0%, 100% { height: 4px; }
      50% { height: 14px; }
    }

    @keyframes tfBorderGlow {
      0% { border-color: rgba(var(--tf-bubble), 0.3); }
      50% { border-color: rgba(var(--tf-bubble), 0.7); }
      100% { border-color: rgba(var(--tf-bubble), 0.3); }
    }

    #tf-helper-box {
      position: fixed;
      bottom: 40px;
      left: 30px;
      width: 440px; 
      min-width: 340px;
      min-height: 380px; 
      background: var(--tf-bg);
      backdrop-filter: blur(28px) saturate(210%);
      -webkit-backdrop-filter: blur(28px) saturate(210%);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 28px;
      animation: tfPopIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, tfBorderGlow 4s infinite ease-in-out;
      font-family: 'Plus Jakarta Sans', sans-serif;
      z-index: 999999;
      padding: 24px;
      color: var(--tf-text);
      display: flex;
      flex-direction: column;
      resize: both; 
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px var(--tf-shadow);
      will-change: transform, left, top;
      transition: background 0.6s ease, box-shadow 0.6s ease, border-color 0.6s ease;
    }

    #tf-helper-box.tf-is-dragging {
      opacity: 0.92;
      cursor: grabbing !important;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6), 0 0 45px var(--tf-shadow);
    }
    
    #tf-helper-box::-webkit-scrollbar { width: 5px; height: 5px; }
    #tf-helper-box::-webkit-scrollbar-thumb { background: rgba(var(--tf-bubble), 0.6); border-radius: 10px; }
    #tf-helper-box::-webkit-scrollbar-track { background: transparent; }

    #tf-live-canvas {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: -1 !important;
      pointer-events: none !important;
      border-radius: inherit !important;
      opacity: 0.5;
    }

    .tf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      cursor: grab;
      position: relative;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .tf-header:active {
      cursor: grabbing;
    }
    
    .tf-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .tf-avatar-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tf-avatar {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      background: var(--tf-primary);
      border: 2px solid rgba(255,255,255,0.25);
      box-shadow: 0 0 15px rgba(var(--tf-bubble), 0.5);
      object-fit: cover;
    }

    .tf-online-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid #0f172a;
      border-radius: 50%;
      animation: tfPulseRing 2s infinite;
    }

    .tf-title-block {
      display: flex;
      flex-direction: column;
    }

    .tf-title {
      font-weight: 800;
      font-size: 16px;
      color: var(--tf-title);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tf-subtitle {
      font-size: 10px;
      color: var(--tf-primary-text);
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      opacity: 0.85;
    }
    
    .tf-top-controls {
      display: flex; align-items: center; gap: 6px;
    }

    .tf-icon-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      font-size: 13px;
      padding: 7px 11px;
      cursor: pointer;
      color: var(--tf-text);
      font-weight: 700;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(10px);
    }
    .tf-icon-btn:hover { 
      background: rgba(255, 255, 255, 0.18); 
      transform: translateY(-2px) scale(1.04); 
      border-color: rgba(255, 255, 255, 0.25);
    }
    .tf-icon-btn:active {
      transform: translateY(1px) scale(0.96);
    }

    .tf-info-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
    }

    #tf-counter-text {
      font-size: 12px; color: rgba(255, 255, 255, 0.7); font-weight: 600;
      display: flex; align-items: center; gap: 6px;
    }

    .tf-stat-icon { color: #f59e0b; }
    .tf-stat-count { color: var(--tf-title); font-size: 14px; font-weight: 800; }

    #tf-status {
      font-size: 11px; color: var(--tf-text); font-weight: 700;
      letter-spacing: 0.5px;
      background: rgba(255, 255, 255, 0.08); 
      padding: 6px 12px; border-radius: 20px;
      display: flex; align-items: center; gap: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .tf-typing-indicator {
      display: none; align-items: flex-end; gap: 3px; height: 14px;
    }
    .tf-typing-indicator.active { display: flex; }
    .tf-typing-indicator span {
      width: 3px; background-color: var(--tf-primary-text); border-radius: 3px;
      animation: tfEqualizer 1s infinite ease-in-out;
    }
    .tf-typing-indicator span:nth-child(1) { animation-delay: 0.1s; }
    .tf-typing-indicator span:nth-child(2) { animation-delay: 0.3s; }
    .tf-typing-indicator span:nth-child(3) { animation-delay: 0.2s; }

    .tf-textarea-wrapper {
      position: relative; flex-grow: 1; display: flex; flex-direction: column; margin-bottom: 16px;
    }

    #tf-reply-text {
      flex-grow: 1; min-height: 130px; 
      background: var(--tf-input-bg);
      border: 1px solid rgba(255, 255, 255, 0.12); 
      border-radius: 18px;
      color: var(--tf-text); 
      padding: 16px; 
      padding-bottom: 34px;
      font-size: 13.5px; 
      line-height: 1.6; 
      resize: none; 
      box-sizing: border-box;
      backdrop-filter: blur(20px);
      font-family: 'JetBrains Mono', monospace;
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    #tf-reply-text:focus {
      outline: none; 
      border-color: rgba(var(--tf-bubble), 0.8);
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(var(--tf-bubble), 0.25); 
      background: rgba(10, 15, 30, 0.8);
    }

    #tf-char-counter {
      position: absolute; bottom: 12px; right: 14px; font-size: 11px;
      color: #ffffff; font-weight: 800; pointer-events: none;
      background: var(--tf-primary); padding: 3px 9px; border-radius: 10px; opacity: 0.9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      font-family: 'JetBrains Mono', monospace;
    }

    .tf-action-grid {
      display: grid;
      grid-template-columns: auto 1fr 1fr auto; 
      gap: 10px;
      position: relative;
    }

    .tf-action-grid button {
      padding: 13px 16px; border: none; border-radius: 16px;
      font-weight: 800; font-size: 12.5px; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative; overflow: hidden;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-transform: uppercase; letter-spacing: 0.8px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }

    span.tf-ripple {
      position: absolute; border-radius: 50%; transform: scale(0);
      animation: rippleEffect 0.6s linear; background-color: rgba(255, 255, 255, 0.35);
    }
    @keyframes rippleEffect { to { transform: scale(4); opacity: 0; } }

    #tf-prev-btn { 
      background: rgba(255, 255, 255, 0.08); 
      color: var(--tf-text); 
      border: 1px solid rgba(255, 255, 255, 0.12); 
      opacity: 0.35; 
      pointer-events: none; 
    }
    #tf-prev-btn:hover { background: rgba(255, 255, 255, 0.18); transform: translateY(-2px); }
    
    #tf-type-btn { 
      background: var(--tf-primary); 
      color: #ffffff; 
      box-shadow: 0 6px 20px rgba(var(--tf-bubble), 0.4); 
      border: 1px solid rgba(255,255,255,0.3); 
    }
    #tf-type-btn:hover { 
      background: var(--tf-primary-hover); 
      transform: translateY(-3px) scale(1.02); 
      box-shadow: 0 10px 28px rgba(var(--tf-bubble), 0.6); 
    }
    #tf-type-btn:active { transform: translateY(1px) scale(0.97); }
    
    #tf-regenerate-btn { 
      background: rgba(255, 255, 255, 0.08); 
      color: var(--tf-text); 
      border: 1px solid rgba(255, 255, 255, 0.12); 
    }
    #tf-regenerate-btn:hover { 
      background: rgba(255, 255, 255, 0.18); 
      transform: translateY(-2px) scale(1.02); 
      border-color: rgba(255, 255, 255, 0.25);
    }
    #tf-regenerate-btn:active { transform: translateY(1px) scale(0.97); }
    
    #tf-stop-btn { 
      background: rgba(239, 68, 68, 0.15); 
      color: #fca5a5; 
      border: 1px solid rgba(239, 68, 68, 0.3); 
    }
    #tf-stop-btn:hover { 
      background: rgba(239, 68, 68, 0.4); 
      color: #ffffff; 
      transform: translateY(-2px);
    }

    #tf-reopen-btn {
      position: fixed; bottom: 30px; left: 30px;
      background: var(--tf-bg); backdrop-filter: blur(25px) saturate(200%);
      color: var(--tf-title); border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 40px; padding: 14px 28px; font-weight: 800; font-size: 13px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 20px var(--tf-shadow); cursor: pointer; z-index: 999999;
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); 
      text-transform: uppercase; letter-spacing: 1px; display: none;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #tf-reopen-btn:hover { 
      transform: translateY(-4px) scale(1.05); 
      border-color: rgba(255,255,255,0.4); 
      box-shadow: 0 20px 45px rgba(0,0,0,0.6), 0 0 30px var(--tf-shadow); 
    }
  `;
  document.head.appendChild(style);
}

function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("tf-ripple");
  const ripple = button.querySelector(".tf-ripple");
  if (ripple) ripple.remove();
  button.appendChild(circle);
}

// -------------------------------------------------------------
// LIVE UI RESPONSES (Confetti & New Canvas Engine)
// -------------------------------------------------------------
function triggerConfetti() {
  const box = document.getElementById("tf-helper-box");
  for (let i = 0; i < 35; i++) {
    const confetti = document.createElement("div");
    confetti.style.position = "absolute";
    confetti.style.width = `${Math.random() * 6 + 4}px`; 
    confetti.style.height = `${Math.random() * 6 + 4}px`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 65%)`;
    confetti.style.left = "50%"; confetti.style.top = "75%";
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    confetti.style.zIndex = "9999";
    confetti.style.pointerEvents = "none";
    box.appendChild(confetti);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 6 + Math.random() * 12;
    let x = 0, y = 0;

    const animate = () => {
      x += Math.cos(angle) * velocity; 
      y += Math.sin(angle) * velocity + 1.8; 
      confetti.style.transform = `translate(${x}px, ${y}px) rotate(${x * 4}deg)`;
      confetti.style.opacity = Math.max(0, 1 - y / 220);
      if (y > 220) { confetti.remove(); } else { requestAnimationFrame(animate); }
    };
    requestAnimationFrame(animate);
  }
}

function initLiveBackgroundAnimation() {
  if (window.innerWidth <= 600) return;
  const canvas = document.getElementById("tf-live-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width; canvas.height = rect.height;

  let time = 0;
  
  function renderLoop() {
    if (window.innerWidth <= 600) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    time += 0.015;

    const type = window.tfThemeType;
    const rgbColors = window.tfBubbleColor.split(',').map(Number);
    const [r, g, b] = rgbColors.length === 3 ? rgbColors : [0, 210, 255]; 

    if (type === 'matrix') {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.18)`;
      ctx.font = "12px 'JetBrains Mono', monospace";
      for (let i = 0; i < canvas.width; i += 18) {
        let y = (time * 80 + i * 22) % canvas.height;
        ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), i, y);
      }
    } else if (type === 'orbs') {
      for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        let cx = canvas.width / 2 + Math.sin(time + i * 2) * (canvas.width / 3.5);
        let cy = canvas.height / 2 + Math.cos(time * 0.7 + i) * (canvas.height / 3.5);
        let radius = 55 + Math.sin(time * 1.5 + i) * 15;
        let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }
  renderLoop();
}

// -------------------------------------------------------------
// BUTTERY SMOOTH DRAG & CORE LOGIC
// -------------------------------------------------------------
function makeBoxDraggable(box) {
  let isDragging = false;
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let dragReq = null;

  function updatePosition() {
    if (isDragging) {
      currentX += (targetX - currentX) * 0.4;
      currentY += (targetY - currentY) * 0.4;
      box.style.left = `${currentX}px`;
      box.style.top = `${currentY}px`;
      dragReq = requestAnimationFrame(updatePosition);
    } else {
      box.style.left = `${targetX}px`;
      box.style.top = `${targetY}px`;
    }
  }

  box.addEventListener("mousedown", (e) => {
    if (window.innerWidth <= 600) return;
    if (e.target.closest("textarea, input, button") || e.target === box) return; 
    
    isDragging = true;
    const rect = box.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    currentX = rect.left;
    currentY = rect.top;
    targetX = currentX;
    targetY = currentY;
    
    box.style.left = `${currentX}px`;
    box.style.top = `${currentY}px`;
    box.style.right = "auto"; 
    box.style.bottom = "auto";
    box.style.transition = "none"; 
    box.classList.add("tf-is-dragging");
    
    document.body.style.userSelect = "none"; 
    e.preventDefault();

    if (dragReq) cancelAnimationFrame(dragReq);
    dragReq = requestAnimationFrame(updatePosition);
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    targetX = e.clientX - mouseX;
    targetY = e.clientY - mouseY;
  });
  
  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    box.classList.remove("tf-is-dragging");
    document.body.style.userSelect = ""; 
    box.style.transition = ""; 
    localStorage.setItem("tf-helper-position", JSON.stringify({ left: targetX, top: targetY }));
  });
}

function restoreSavedPosition(box) {
  if (window.innerWidth <= 600) return;
  const savedPosition = localStorage.getItem("tf-helper-position");
  if (!savedPosition) return;
  try {
    const { left, top } = JSON.parse(savedPosition);
    if (left !== undefined && top !== undefined) {
      box.style.left = typeof left === "number" ? `${left}px` : left;
      box.style.top = typeof top === "number" ? `${top}px` : top;
      box.style.right = "auto"; box.style.bottom = "auto"; box.style.transform = "none";
    }
  } catch (e) {}
}

document.addEventListener("focusin", (event) => {
  const el = event.target;
  if (!el || (el.closest && (el.closest("#tf-helper-box") || el.closest("#tf-reopen-btn")))) return;
  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable) {
    lastFocusedField = el; setStatus("Field selected");
  }
});

function setStatus(text, showTyping = false) {
  const status = document.getElementById("tf-status");
  if (status) {
    status.innerHTML = `<span>${text}</span><div class="tf-typing-indicator ${showTyping ? 'active' : ''}"><span></span><span></span><span></span></div>`;
  }
}

function findReplyField() {
  return document.querySelector('textarea[data-testid="messageTextArea"]') || document.querySelector("textarea") || lastFocusedField;
}

function insertCharIntoInput(el, char) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, start) + char + el.value.slice(end);
  const cursor = start + char.length;
  el.selectionStart = el.selectionEnd = cursor;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertCharIntoContentEditable(el, char) {
  el.focus();
  const selection = window.getSelection();
  if (!selection) return;
  let range = selection.rangeCount === 0 ? document.createRange() : selection.getRangeAt(0);
  if (selection.rangeCount === 0) {
    range.selectNodeContents(el); range.collapse(false); selection.addRange(range);
  }
  range.deleteContents();
  const textNode = document.createTextNode(char);
  range.insertNode(textNode);
  range.setStartAfter(textNode); range.collapse(true);
  selection.removeAllRanges(); selection.addRange(range);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function getDelayForChar(char) {
  const base = 40 + Math.random() * 30;
  if (char === " ") return base + 30;
  if ([".", ",", "!", "?"].includes(char)) return base + 120;
  if (char === "\n") return base + 150;
  return base;
}

function createTypingWorker() {
  const workerCode = `
    self.onmessage = async function(e) {
      if (e.data.action === 'start') {
        const text = e.data.text; const delays = e.data.delays;
        for (let i = 0; i < text.length; i++) {
          await new Promise(r => setTimeout(r, delays[i]));
          self.postMessage({ action: 'typeChar', char: text[i], isLast: i === text.length - 1 });
        }
      }
    };
  `;
  return new Worker(URL.createObjectURL(new Blob([workerCode], { type: "application/javascript" })));
}

function typeIntoReplyField(text) {
  const el = findReplyField();
  if (!el || isTyping) return;

  isTyping = true; cancelTyping = false; setStatus("Typing...", true); el.focus();
  const delays = Array.from(text).map(char => getDelayForChar(char));
  if (typingWorker) typingWorker.terminate();
  typingWorker = createTypingWorker();

  typingWorker.onmessage = function(e) {
    if (cancelTyping) { typingWorker.terminate(); isTyping = false; setStatus("Stopped"); return; }
    if (e.data.action === 'typeChar') {
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") insertCharIntoInput(el, e.data.char);
      else if (el.isContentEditable) insertCharIntoContentEditable(el, e.data.char);

      if (e.data.isLast) {
        if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") el.dispatchEvent(new Event("change", { bubbles: true }));
        typingWorker.terminate(); isTyping = false; setStatus("Done");
      }
    }
  };
  typingWorker.postMessage({ action: 'start', text, delays });
}

function updateCharCounterDisplay() {
  const textarea = document.getElementById("tf-reply-text");
  const charCounter = document.getElementById("tf-char-counter");
  if (textarea && charCounter) charCounter.textContent = textarea.value.length;
}

// -------------------------------------------------------------
// LOGBOOK SCRAPING, PERSONA SCRAPING & MESSAGING LOGIC
// -------------------------------------------------------------
function getLogbookEntries() {
  const container = document.querySelector('[data-testid="logbookCategory-updates"]');
  if (!container) return "--- LOGBOOK ENTRIES ---\nNo logbook data found.";

  const comments = container.querySelectorAll('[data-testid^="logbookComment-"]');
  const timestamps = container.querySelectorAll('[data-testid^="logbookCreatedAt-"]');
  let logData = "--- LOGBOOK ENTRIES ---\n";

  comments.forEach((comment, index) => {
      const time = timestamps[index] ? timestamps[index].innerText.trim() : "Unknown Time";
      const text = comment.innerText.trim();
      logData += `${time}: ${text}\n`;
  });
  return logData;
}

async function getFullLogbookContext() {
  const logButton = document.querySelector('[data-testid="addNewLogbookButton-customer"]');
  if (!logButton) {
      const profileDetailsBtn = document.querySelector('[data-testid="showProfileDetails"]');
      if (profileDetailsBtn) {
          profileDetailsBtn.click();
          await new Promise(r => setTimeout(r, 800));
      }
  }
  return getLogbookEntries();
}

// Scrapes the right-hand panel to get persona details
function getPersonaProfile() {
  const elements = Array.from(document.querySelectorAll('div, span, p'));
  const youAreLabel = elements.find(el => el.textContent && el.textContent.trim().toLowerCase() === 'you are');

  if (!youAreLabel) {
    return "--- PERSONA PROFILE ---\n[Warning: Persona profile not detected. Stick to generic identity.]";
  }

  let container = youAreLabel.parentElement;
  for (let i = 0; i < 4; i++) {
    if (container && container.parentElement) container = container.parentElement;
  }

  if (container) {
    return "--- PERSONA PROFILE (YOU MUST ADOPT THIS IDENTITY, NAME, AND LOCATION) ---\n" + container.innerText.trim();
  }
  
  return "";
}

function getMessageItems() {
  return document.querySelectorAll('div[data-testid="messagesList"] div[data-testid="messageItem"]');
}

function getRecentConversationContext() {
  const items = Array.from(getMessageItems()).slice(-40);
  if (!items.length) return "";
  let contextLines = [];

  items.forEach((item) => {
    let text = item.innerText ? item.innerText.trim() : "";
    if (!text) return;
    text = text.replace(/^(hi|hello|hey|good morning|good afternoon).{0,10}$/im, '').replace(/automated message|system alert/ig, '').trim();
    if (text.length < 2) return; 

    let isAgentOnRight = false, parent = item;
    for (let i = 0; i < 5; i++) {
      if (!parent) break;
      const c = (parent.className || "").toLowerCase();
      const s = (parent.getAttribute("style") || "").toLowerCase();
      const id = (parent.getAttribute("data-testid") || "").toLowerCase();
      if (c.includes("right") || c.includes("end") || c.includes("sent") || c.includes("out") || s.includes("flex-end") || s.includes("margin-left: auto") || id.includes("sent")) {
        isAgentOnRight = true; break;
      }
      parent = parent.parentElement;
    }
    contextLines.push(isAgentOnRight ? `Me: ${text}` : `Customer: ${text}`);
  });
  return contextLines.join("\n");
}

function getAgentStyleExamples() {
  const items = Array.from(getMessageItems()).slice(-40);
  let agentMessages = [];

  items.forEach((item) => {
    let text = item.innerText ? item.innerText.trim() : "";
    if (!text) return;
    text = text.replace(/^(hi|hello|hey|good morning|good afternoon).{0,10}$/im, '').replace(/automated message|system alert/ig, '').trim();
    if (text.length < 2) return; 

    let isAgentOnRight = false, parent = item;
    for (let i = 0; i < 5; i++) {
      if (!parent) break;
      const c = (parent.className || "").toLowerCase();
      const s = (parent.getAttribute("style") || "").toLowerCase();
      const id = (parent.getAttribute("data-testid") || "").toLowerCase();
      if (c.includes("right") || c.includes("end") || c.includes("sent") || c.includes("out") || s.includes("flex-end") || s.includes("margin-left: auto") || id.includes("sent")) {
        isAgentOnRight = true; break;
      }
      parent = parent.parentElement;
    }
    if (isAgentOnRight) agentMessages.push(text);
  });
  return agentMessages;
}

function requestGeneratedReply(fullContext) {
  return new Promise((resolve) => {
    const styleHistory = getAgentStyleExamples();
    chrome.runtime.sendMessage(
      { type: "GENERATE_REPLY", incomingMessage: fullContext, agentHistory: styleHistory },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve("Connection error. Ensure server is active.");
        } else {
          resolve(response ? response.reply : "Thanks for your message.");
        }
      }
    );
  });
}

function saveLearningExample(finalText) {
  return new Promise((resolve) => {
    const textarea = document.getElementById("tf-reply-text");
    const suggested = textarea ? textarea.defaultValue || "" : "";
    const rewardScore = calculateRewardSignal(suggested, finalText);
    
    setStatus("Learning...");
    chrome.runtime.sendMessage(
      { type: "SAVE_LEARNING", payload: { incoming: lastIncomingMessageText || "Context", suggested: suggested, final: finalText, rewardSignal: rewardScore } },
      (response) => {
        setStatus(chrome.runtime.lastError || !response || !response.ok ? "Learn Fail" : "Learned!");
        setTimeout(() => setStatus("Ready"), 2000); resolve();
      }
    );
  });
}

async function loadSuggestionIntoTextarea() {
  const log = getRecentConversationContext();
  if (!log) { setStatus("No context"); return; }
  
  setStatus("Reading...", true);
  const logbook = await getFullLogbookContext();
  const persona = getPersonaProfile();
  
  const combinedContext = log + "\n\n" + logbook + "\n\n" + persona;
  
  setStatus("Generating...", true);
  const textarea = document.getElementById("tf-reply-text");
  if (!textarea) return;
  
  const generatedReply = await requestGeneratedReply(combinedContext);
  textarea.value = textarea.defaultValue = generatedReply;
  
  addToHistory(generatedReply);
  updateCharCounterDisplay(); 
  setStatus("Regenerated");
}

function showHelperBox() {
  const box = document.getElementById("tf-helper-box");
  const reopenButton = document.getElementById("tf-reopen-btn");
  if (box) box.style.display = "flex";
  if (reopenButton) reopenButton.style.display = "none";
}
