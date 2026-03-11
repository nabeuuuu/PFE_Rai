const FRAMES = [
    {
        type: "text",
        title: "Bienvenue",
        content: {
            heading: "De l'oranie à l'international",
            body: "La région de l’Oranie est le territoire originel du répertoire bédoui. Le raï, dans sa version contemporaine, s’est développé dans les trois grands pôles que sont Oran, Sidi bel Abbès et Aïn Témouchent."
         
        }
    },
    {
        type: "photo",
        title: "Une image",
        content: {
            // Remplace src par le chemin de ton image
            src: "images/hamada.png",
            alt: "Cheikh hamada",
            caption: "Cheikh Hamada est consi- déré comme l’un des maîtres et des premiersmodernisateurs du chant bédouin."
        }
    },
    {
        type: "quote",
        title: "Citation",
        content: {
            text: "Le mouvement est une porte vers la présence.",
            author: "Anonyme"
        }
    },
    {
        type: "video",
        title: "Une vidéo",
        content: {
            // Remplace src par le chemin de ta vidéo (mp4 local ou URL)
            src: "https://www.w3schools.com/html/mov_bbb.mp4",
            poster: "" // optionnel : image de prévisualisation
        }
    },
    {
        type: "audio",
        title: "Un son",
        content: {
            // Remplace src par le chemin de ton fichier audio
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            trackName: "SoundHelix — Song 1",
            artist: "Exemple audio"
        }
    },
    {
        type: "text",
        title: "C'est tout !",
        content: {
            heading: "Tu peux personnaliser",
            body: "Modifie le tableau FRAMES en haut du script pour ajouter tes propres contenus : textes, photos, vidéos, sons ou citations. Les types disponibles sont : text, photo, video, audio, quote."
        }
    }
];
/* ════════════════════════════════════════════════════════════ */


/* ─── STATE ─── */
let currentIndex = 0;
let isAnimating = false;

/* ─── DOM REFS ─── */
const framesWrapper = document.getElementById('framesWrapper');
const frameListItems = document.getElementById('frameListItems');
const navInfo = document.getElementById('navInfo');
const progressFill = document.getElementById('progressFill');
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');
const gestureValue = document.getElementById('gestureValue');
const indLeft = document.getElementById('indLeft');
const indRight = document.getElementById('indRight');
const startBtn = document.getElementById('startBtn');
const startOverlay = document.getElementById('startOverlay');
const videoEl = document.getElementById('videoEl');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');

/* ─── BUILD FRAMES ─── */
function buildFrameHTML(frame, index) {
    const div = document.createElement('div');
    div.className = `frame frame-${frame.type}`;
    div.dataset.index = index;

    const label = `<div class="frame-label">${String(index + 1).padStart(2, '0')} — ${frame.type}</div>`;

    switch (frame.type) {

        case 'text':
            div.innerHTML = `${label}
        <h2>${frame.content.heading}</h2>
        <p>${frame.content.body}</p>`;
            break;

        case 'photo':
            div.innerHTML = `${label}
        <figure>
          <img src="${frame.content.src}" alt="${frame.content.alt}">
          <figcaption>${frame.content.caption || ''}</figcaption>
        </figure>`;
            break;

        case 'video':
            div.innerHTML = `${label}
        <video controls ${frame.content.poster ? `poster="${frame.content.poster}"` : ''}>
          <source src="${frame.content.src}" type="video/mp4">
        </video>`;
            break;

        case 'audio':
            div.innerHTML = `${label}
        <div class="audio-card">
          <span class="audio-icon">🎵</span>
          <h3>${frame.content.trackName}</h3>
          <p>${frame.content.artist}</p>
          <audio controls src="${frame.content.src}"></audio>
        </div>`;
            break;

        case 'quote':
            div.innerHTML = `${label}
        <blockquote>
          ${frame.content.text}
          <cite>— ${frame.content.author}</cite>
        </blockquote>`;
            break;

        default:
            div.innerHTML = `${label}<p>Type inconnu : ${frame.type}</p>`;
    }

    return div;
}

function buildSidebar() {
    FRAMES.forEach((f, i) => {
        const item = document.createElement('div');
        item.className = 'frame-item';
        item.dataset.index = i;
        item.innerHTML = `
      <div class="frame-item-dot"></div>
      <div class="frame-item-info">
        <div class="frame-item-type">${f.type}</div>
        <div class="frame-item-title">${f.title}</div>
      </div>`;
        item.addEventListener('click', () => goTo(i));
        frameListItems.appendChild(item);
    });
}

function init() {
    FRAMES.forEach((f, i) => {
        const el = buildFrameHTML(f, i);
        framesWrapper.appendChild(el);
    });
    buildSidebar();
    goTo(0, true);
}

/* ─── NAVIGATION ─── */
function goTo(index, instant = false) {
    if (index < 0 || index >= FRAMES.length || isAnimating) return;
    if (index === currentIndex && !instant) return;

    const prevEl = framesWrapper.querySelector('.frame.active');
    const nextEl = framesWrapper.querySelector(`[data-index="${index}"]`);

    if (!nextEl) return;

    if (prevEl && !instant) {
        isAnimating = true;
        const dir = index > currentIndex ? 'exit-left' : '';
        prevEl.classList.add(dir || 'exit-right');
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
    const total = FRAMES.length;
    navInfo.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;

    document.querySelectorAll('.frame-item').forEach((el, i) => {
        el.classList.toggle('current', i === currentIndex);
    });

    const activeItem = frameListItems.querySelector('.frame-item.current');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ─── HAND TRACKING ─── */

// Réglages swipe — ajuste si besoin
const SWIPE_THRESHOLD = 0.18;  // distance min pour valider (0.1 = très sensible, 0.25 = moins)
const SWIPE_COOLDOWN = 900;   // ms de pause après un swipe validé

let swipeStartX = null;
let swipeActive = false;
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
    overlayCanvas.width = videoEl.videoWidth || 280;
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
    drawLandmarks(ctx, landmarks, { color: '#c8a97e', lineWidth: 1, radius: 3 });

    const wristX = landmarks[0].x;

    if (swipeStartX === null) {
        swipeStartX = wristX;
        swipeActive = true;
        setGesture('Main détectée ✋');
        return;
    }

    if (swipeCooldown) {
        setGesture('…');
        return;
    }

    const delta = swipeStartX - wristX;
    const pct = Math.round(Math.abs(delta) / SWIPE_THRESHOLD * 100);
    setGesture(`Mouvement : ${Math.min(pct, 100)}%`);

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        swipeCooldown = true;
        swipeStartX = null;
        swipeActive = false;

        if (delta > 0) {
            setGesture('Swipe → suivant ✦', true);
            next();
        } else {
            setGesture('Swipe ← précédent ✦', true);
            prev();
        }

        setTimeout(() => {
            swipeCooldown = false;
            setGesture('Main détectée ✋');
        }, SWIPE_COOLDOWN);
    }
}

async function startCamera() {
    startOverlay.style.display = 'none';
    setStatus(false, 'Chargement…');

    const hands = new Hands({
        locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6
    });

    hands.onResults(onHandResults);

    const camera = new Camera(videoEl, {
        onFrame: async () => { await hands.send({ image: videoEl }); },
        width: 280,
        height: 210
    });

    camera.start()
        .then(() => setStatus(true, 'Hand tracking actif'))
        .catch(err => {
            setStatus(false, 'Erreur caméra');
            console.error(err);
        });
}

/* ─── KEYBOARD FALLBACK ─── */
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
});

/* ─── START ─── */
startBtn.addEventListener('click', startCamera);
init();
