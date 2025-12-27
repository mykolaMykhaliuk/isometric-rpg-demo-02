import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { BuildingScene } from './scenes/BuildingScene';
import { UIScene } from './scenes/UIScene';
import { ConversationScene } from './scenes/ConversationScene';

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
};

// Start in single player mode by default
(window as any).__OFFLINE_MODE__ = true;
(window as any).__GAME_MODE__ = 'single'; // 'single' or 'multiplayer'

// Store server URL for later use
(window as any).__SERVER_URL__ = 'http://localhost:3001';

// Start game immediately in single player mode
new Phaser.Game(config);
