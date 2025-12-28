import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { BuildingScene } from './scenes/BuildingScene';
import { UIScene } from './scenes/UIScene';
import { ConversationScene } from './scenes/ConversationScene';

// Detect if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // For mobile, use full screen dimensions
    width: isMobile ? window.innerWidth : 1024,
    height: isMobile ? window.innerHeight : 768,
    min: {
      width: 320,
      height: 480,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  input: {
    activePointers: 3, // Support multi-touch for dual joysticks
  },
};

const game = new Phaser.Game(config);

// Handle orientation changes and resizing on mobile
if (isMobile) {
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    }, 100);
  });
}
