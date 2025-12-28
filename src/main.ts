import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { BuildingScene } from './scenes/BuildingScene';
import { UIScene } from './scenes/UIScene';
import { ConversationScene } from './scenes/ConversationScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
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

new Phaser.Game(config);
