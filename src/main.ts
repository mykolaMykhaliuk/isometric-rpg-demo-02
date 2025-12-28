import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { BuildingScene } from './scenes/BuildingScene';
import { UIScene } from './scenes/UIScene';
import { ConversationScene } from './scenes/ConversationScene';

// Detect mobile device
const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  navigator.userAgent || navigator.vendor || (window as any).opera || ''
) || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Set initial dimensions based on device
let gameWidth = 1024;
let gameHeight = 768;

if (isMobile) {
  // Use full screen on mobile
  gameWidth = window.innerWidth;
  gameHeight = window.innerHeight;
} else {
  // Desktop: use fixed size or scale to fit
  const maxWidth = 1024;
  const maxHeight = 768;
  const scale = Math.min(window.innerWidth / maxWidth, window.innerHeight / maxHeight, 1);
  gameWidth = Math.floor(maxWidth * scale);
  gameHeight = Math.floor(maxHeight * scale);
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: gameWidth,
  height: gameHeight,
  parent: 'game-container',
  backgroundColor: '#2d2d44',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, CityScene, BuildingScene, UIScene, ConversationScene],
  dom: {
    createContainer: true,
  },
  pixelArt: false,
  antialias: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameWidth,
    height: gameHeight,
  },
};

// Handle window resize
window.addEventListener('resize', () => {
  if (isMobile) {
    // On mobile, update game size on resize (orientation change)
    const game = (window as any).gameInstance as Phaser.Game;
    if (game) {
      game.scale.resize(window.innerWidth, window.innerHeight);
    }
  }
});

const game = new Phaser.Game(config);
(window as any).gameInstance = game; // Store reference for resize handler
