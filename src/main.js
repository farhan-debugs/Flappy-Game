import { FlappyGame } from './game.js';
import { getAudioContext, toggleAudioMute, isAudioMuted } from './audio.js';

// Setup PWA Service Worker
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration error:', err);
    });
  });
}

// Elements
const canvas = document.getElementById('game-canvas');
const muteBtn = document.getElementById('btn-mute');
const pauseBtn = document.getElementById('btn-pause');
const fullscreenBtn = document.getElementById('btn-fullscreen');
const installBtn = document.getElementById('btn-install');

// Create Game Instance
const game = new FlappyGame(canvas);

// Sound State
function updateMuteButtonUI() {
  const muted = isAudioMuted();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.title = muted ? 'Unmute Audio' : 'Mute Audio';
}
updateMuteButtonUI();

muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  getAudioContext();
  toggleAudioMute();
  updateMuteButtonUI();
});

// Pause Button
pauseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  game.togglePause();
  pauseBtn.textContent = game.state === 'PAUSED' ? '▶️' : '⏸️';
});

// Fullscreen Button
fullscreenBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    fullscreenBtn.textContent = '🗗';
  } else {
    document.exitFullscreen().catch(() => {});
    fullscreenBtn.textContent = '⛶';
  }
});

// PWA Install Prompt handling
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    deferredPrompt = null;
  });
}

// Action Trigger (Flap / Start / Restart)
function handleAction() {
  getAudioContext(); // Resume Web Audio on user gesture
  game.flap();
  if (game.state === 'PLAYING') {
    pauseBtn.textContent = '⏸️';
  }
}

// Keyboard Controls (Windows)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    handleAction();
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    game.togglePause();
    pauseBtn.textContent = game.state === 'PAUSED' ? '▶️' : '⏸️';
  } else if (e.code === 'KeyR' && game.state === 'GAMEOVER') {
    e.preventDefault();
    game.reset();
  } else if (e.code === 'KeyM') {
    e.preventDefault();
    toggleAudioMute();
    updateMuteButtonUI();
  }
});

// Mouse Controls
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  handleAction();
});

// Touch Controls (Android / Mobile)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleAction();
}, { passive: false });

// Game Loop
function loop() {
  if (game.state !== 'PAUSED') {
    game.update();
  }
  game.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
