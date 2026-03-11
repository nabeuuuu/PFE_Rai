/* ════════════════════════════════════════════════════════════
   script.js — Hand Navigation
   Le contenu est dans index.html (<article> dans #frames-grid)
   Ce fichier gère uniquement la logique et le hand tracking.
   ════════════════════════════════════════════════════════════ */

/* ─── 1. RÉCUPÈRE LES FRAMES DEPUIS LE HTML ─── */
const stageArea    = document.getElementById('stageArea');
const rawFrames    = document.querySelectorAll('#frames-grid article');

// Déplace chaque article dans la zone de scène et ajoute un label
rawFrames.forEach((article, i) => {
  const type  = article.dataset.type || 'text';
  const label = document.createElement('div');
  label.className   = 'frame-label';
  label.textContent = `${String(i + 1).padStart(2,'0')} — ${type}`;
  article.prepend(label);
  stageArea.appendChild(article);
});

const frames = stageArea.querySelectorAll('article');

/* ─── 2. STATE ─── */
let currentIndex = 0;
let isAnimating  = false;

/* ─── 3. DOM REFS ─── */
const frameListItems = document.getElementById('frameListItems');
const navInfo        = document.getElementById('navInfo');
const progressFill   = document.getElementById('progressFill');
const statusPill     = document.getElementById('statusPill');
const statusText     = document.getElementById('statusText');
const gestureValue   = document.getElementById('gestureValue');
const indLeft        = document.getElementById('indLeft');
const indRight       = document.getElementById('indRight');
const startBtn       = document.getElementById('startBtn');
const startOverlay   = document.getElementById('startOverlay');
const videoEl        = document.getElementById('videoEl');
const overlayCanvas  = document.getElementById('overlayCanvas');
const ctx            = overlayCanvas.getContext('2d');

/* ─── 4. CONSTRUIT LE SOMMAIRE ─── */
frames.forEach((article, i) => {
  const item = document.createElement('div');
  item.className   = 'frame-item';
  item.dataset.index = i;
  item.innerHTML = `
    <div class="frame-item-dot"></div>
    <div class="frame-item-info">
      <div class="frame-item-type">${article.dataset.type || 'text'}</div>
      <div class="frame-item-title">${article.dataset.title || `Frame ${i + 1}`}</div>
    </div>`;
  item.addEventListener('click', () => goTo(i));
  frameListItems.appendChild(item);
});

/* ─── 5. NAVIGATION ─── */
function goTo(index, instant = false) {
  if (index < 0 || index >= frames.length || isAnimating) return;
  if (index === currentIndex && !instant) return;

  const prevEl = frames[currentIndex];
  const nextEl = frames[index];

  if (prevEl && !instant) {
    isAnimating = true;
    prevEl.classList.add(index > currentIndex ? 'exit-left' : 'exit-right');
    prevEl.classList.remove('active');
    setTimeout(() => {
      prevEl.classList.remove('exit-left', 'exit-right');
      isAnimating = false;
    }, 650);
  } else if (prevEl) {
    prevEl.classList.remove('active');
  }

  currentIndex = index;
  nextEl.classList.remove('exit-left', 'exit-right');
  nextEl.classList.add('active');
  updateUI();
}

function next() { goTo(currentIndex + 1); flashIndicator('left'); }
function prev() { goTo(currentIndex - 1); flashIndicator('right'); }

function flashIndicator(side) {
  const el = side === 'left' ? indLeft : indRight;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 400);
}

function updateUI() {
  const total = frames.length;
  navInfo.textContent      = `${String(currentIndex + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
  progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;

  document.querySelectorAll('.frame-item').forEach((el, i) => {
    el.classList.toggle('current', i === currentIndex);
  });

  const activeItem = frameListItems.querySelector('.frame-item.current');
  if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ─── 6. HAND TRACKING ─── */

// Réglages — ajuste si besoin
const SWIPE_THRESHOLD = 0.18; // distance min (0.1 = sensible, 0.25 = moins)
const SWIPE_COOLDOWN  = 900;  // ms entre deux swipes

let swipeStartX   = null;
let swipeActive   = false;
let swipeCooldown = false;

function setStatus(active, text) {
  statusText.textContent = text;
  statusPill.classList.toggle('active', active);
}

function setGesture(text, triggered = false) {
  gestureValue.textContent = text;
  gestureValue.classList.toggle('triggered', triggered);
}

function onHandResults(results) {
  overlayCanvas.width  = videoEl.videoWidth  || 280;
  overlayCanvas.height = videoEl.videoHeight || 210;
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    swipeStartX = null;
    swipeActive = false;
    setGesture('Aucune main détectée');
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: 'rgba(200,169,126,0.5)', lineWidth: 2 });
  drawLandmarks(ctx, landmarks,  { color: '#c8a97e', lineWidth: 1, radius: 3 });

  const wristX = landmarks[0].x;

  if (swipeStartX === null) {
    swipeStartX = wristX;
    swipeActive = true;
    setGesture('Main détectée ✋');
    return;
  }

  if (swipeCooldown) { setGesture('…'); return; }

  const delta = swipeStartX - wristX;
  const pct   = Math.round(Math.abs(delta) / SWIPE_THRESHOLD * 100);
  setGesture(`Mouvement : ${Math.min(pct, 100)}%`);

  if (Math.abs(delta) >= SWIPE_THRESHOLD) {
    swipeCooldown = true;
    swipeStartX   = null;
    swipeActive   = false;

    if (delta > 0) { setGesture('Swipe → suivant ✦', true);   next(); }
    else           { setGesture('Swipe ← précédent ✦', true); prev(); }

    setTimeout(() => {
      swipeCooldown = false;
      setGesture('Main détectée ✋');
    }, SWIPE_COOLDOWN);
  }
}

async function startCamera() {
  startOverlay.style.display = 'none';
  setStatus(false, 'Chargement…');

  const hands = new Hands({ locateFile: f =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
  });

  hands.onResults(onHandResults);

  const camera = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 280, height: 210
  });

  camera.start()
    .then(() => setStatus(true, 'Hand tracking actif'))
    .catch(err => { setStatus(false, 'Erreur caméra'); console.error(err); });
}

/* ─── 7. CLAVIER (fallback) ─── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
});

/* ─── 8. INIT ─── */
startBtn.addEventListener('click', startCamera);
goTo(0, true);
