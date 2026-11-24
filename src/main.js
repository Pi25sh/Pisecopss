import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const game = new Game(container);

  // Splash screen dismissal
  const splash = document.getElementById('splash-screen');
  const startBtn = document.getElementById('start-btn');

  if (startBtn && splash) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('autostart')) {
      splash.style.display = 'none';
    } else {
      startBtn.addEventListener('click', () => {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.style.display = 'none';
        }, 500);
      });
    }
  }
});
