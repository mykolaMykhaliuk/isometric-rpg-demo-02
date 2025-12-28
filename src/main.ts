import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { BuildingScene } from './scenes/BuildingScene';
import { UIScene } from './scenes/UIScene';
import { ConversationScene } from './scenes/ConversationScene';

// Detect if we're on a mobile/touch device
const isMobile = (): boolean => {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return hasTouch && isMobileUA;
};

// Get appropriate dimensions for the device
const getGameDimensions = () => {
  const mobile = isMobile();
  
  if (mobile) {
    // On mobile, use the full screen dimensions
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  
  // Desktop default
  return {
    width: 1024,
    height: 768,
  };
};

const dimensions = getGameDimensions();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
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
    mode: isMobile() ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
    activePointers: 3, // Support multi-touch
    touch: {
      capture: true,
    },
  },
};

const game = new Phaser.Game(config);

// Handle orientation change and resize on mobile
window.addEventListener('resize', () => {
  if (isMobile()) {
    game.scale.resize(window.innerWidth, window.innerHeight);
  }
});

// Prevent default touch behaviors that might interfere with game
document.addEventListener('touchmove', (e) => {
  if (e.target instanceof HTMLCanvasElement) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent context menu on long press
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLCanvasElement) {
    e.preventDefault();
  }
});
