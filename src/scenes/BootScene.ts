import Phaser from 'phaser';
import { TILE_WIDTH, TILE_HEIGHT } from '../utils/IsometricUtils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingBar();
  }

  create(): void {
    this.createIsometricTiles();
    this.createPlayerSprite();
    this.createEnemySprite();
    this.createBulletSprite();
    this.createDoorSprite();
    this.createAmmoSprite();

    this.scene.start('CityScene');
    this.scene.launch('UIScene');
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }

  private createIsometricTiles(): void {
    // Ground tile
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(0x4a7c59, 1);
    groundGraphics.beginPath();
    groundGraphics.moveTo(TILE_WIDTH / 2, 0);
    groundGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    groundGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    groundGraphics.lineTo(0, TILE_HEIGHT / 2);
    groundGraphics.closePath();
    groundGraphics.fillPath();
    groundGraphics.lineStyle(1, 0x3d6b4a, 1);
    groundGraphics.strokePath();
    groundGraphics.generateTexture('tile_ground', TILE_WIDTH, TILE_HEIGHT);
    groundGraphics.destroy();

    // Road tile
    const roadGraphics = this.make.graphics({ x: 0, y: 0 });
    roadGraphics.fillStyle(0x555555, 1);
    roadGraphics.beginPath();
    roadGraphics.moveTo(TILE_WIDTH / 2, 0);
    roadGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    roadGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    roadGraphics.lineTo(0, TILE_HEIGHT / 2);
    roadGraphics.closePath();
    roadGraphics.fillPath();
    roadGraphics.lineStyle(1, 0x444444, 1);
    roadGraphics.strokePath();
    // Road markings
    roadGraphics.lineStyle(2, 0xffff00, 0.5);
    roadGraphics.lineBetween(TILE_WIDTH / 2, TILE_HEIGHT / 4, TILE_WIDTH / 2, 3 * TILE_HEIGHT / 4);
    roadGraphics.generateTexture('tile_road', TILE_WIDTH, TILE_HEIGHT);
    roadGraphics.destroy();

    // Building tile (with 3D effect)
    const buildingGraphics = this.make.graphics({ x: 0, y: 0 });
    const buildingHeight = 60;

    // Top
    buildingGraphics.fillStyle(0x8b7355, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(TILE_WIDTH / 2, 0);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(0, TILE_HEIGHT / 2);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();

    // Right face
    buildingGraphics.fillStyle(0x6b5344, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2 + buildingHeight);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + buildingHeight);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();

    // Left face
    buildingGraphics.fillStyle(0x5a4435, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(0, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + buildingHeight);
    buildingGraphics.lineTo(0, TILE_HEIGHT / 2 + buildingHeight);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();

    // Windows
    buildingGraphics.fillStyle(0xffffaa, 0.8);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 8, TILE_HEIGHT / 2 + 10, 8, 10);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 8, TILE_HEIGHT / 2 + 30, 8, 10);
    buildingGraphics.fillRect(10, TILE_HEIGHT / 2 + 10, 8, 10);
    buildingGraphics.fillRect(10, TILE_HEIGHT / 2 + 30, 8, 10);

    buildingGraphics.generateTexture('tile_building', TILE_WIDTH, TILE_HEIGHT + buildingHeight);
    buildingGraphics.destroy();

    // Water tile
    const waterGraphics = this.make.graphics({ x: 0, y: 0 });
    waterGraphics.fillStyle(0x4488cc, 1);
    waterGraphics.beginPath();
    waterGraphics.moveTo(TILE_WIDTH / 2, 0);
    waterGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    waterGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    waterGraphics.lineTo(0, TILE_HEIGHT / 2);
    waterGraphics.closePath();
    waterGraphics.fillPath();
    waterGraphics.lineStyle(1, 0x66aaee, 1);
    waterGraphics.strokePath();
    waterGraphics.generateTexture('tile_water', TILE_WIDTH, TILE_HEIGHT);
    waterGraphics.destroy();

    // Interior floor tile
    const floorGraphics = this.make.graphics({ x: 0, y: 0 });
    floorGraphics.fillStyle(0x8b6914, 1);
    floorGraphics.beginPath();
    floorGraphics.moveTo(TILE_WIDTH / 2, 0);
    floorGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    floorGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    floorGraphics.lineTo(0, TILE_HEIGHT / 2);
    floorGraphics.closePath();
    floorGraphics.fillPath();
    floorGraphics.lineStyle(1, 0x7a5a10, 1);
    floorGraphics.strokePath();
    floorGraphics.generateTexture('tile_floor', TILE_WIDTH, TILE_HEIGHT);
    floorGraphics.destroy();

    // Wall tile
    const wallGraphics = this.make.graphics({ x: 0, y: 0 });
    const wallHeight = 40;

    wallGraphics.fillStyle(0x888888, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(TILE_WIDTH / 2, 0);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(0, TILE_HEIGHT / 2);
    wallGraphics.closePath();
    wallGraphics.fillPath();

    wallGraphics.fillStyle(0x666666, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2 + wallHeight);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + wallHeight);
    wallGraphics.closePath();
    wallGraphics.fillPath();

    wallGraphics.fillStyle(0x555555, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(0, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + wallHeight);
    wallGraphics.lineTo(0, TILE_HEIGHT / 2 + wallHeight);
    wallGraphics.closePath();
    wallGraphics.fillPath();

    wallGraphics.generateTexture('tile_wall', TILE_WIDTH, TILE_HEIGHT + wallHeight);
    wallGraphics.destroy();
  }

  private createPlayerSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Body
    graphics.fillStyle(0x3366cc, 1);
    graphics.fillCircle(16, 20, 10);

    // Head
    graphics.fillStyle(0xffcc99, 1);
    graphics.fillCircle(16, 8, 6);

    // Gun
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(22, 18, 10, 4);

    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
  }

  private createEnemySprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Bug body (oval)
    graphics.fillStyle(0x44aa44, 1);
    graphics.fillEllipse(16, 16, 24, 16);

    // Eyes
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(10, 12, 4);
    graphics.fillCircle(22, 12, 4);

    // Mandibles
    graphics.fillStyle(0x227722, 1);
    graphics.fillTriangle(6, 20, 2, 28, 10, 24);
    graphics.fillTriangle(26, 20, 30, 28, 22, 24);

    // Legs
    graphics.lineStyle(2, 0x227722, 1);
    graphics.lineBetween(8, 16, 2, 24);
    graphics.lineBetween(24, 16, 30, 24);
    graphics.lineBetween(8, 20, 4, 28);
    graphics.lineBetween(24, 20, 28, 28);

    graphics.generateTexture('enemy_bug', 32, 32);
    graphics.destroy();
  }

  private createBulletSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(4, 4, 3);
    graphics.fillStyle(0xff8800, 1);
    graphics.fillCircle(4, 4, 2);

    graphics.generateTexture('bullet', 8, 8);
    graphics.destroy();
  }

  private createDoorSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Door frame
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(0, 0, 32, 48);

    // Door
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(4, 4, 24, 40);

    // Handle
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(22, 26, 3);

    graphics.generateTexture('door', 32, 48);
    graphics.destroy();
  }

  private createAmmoSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Ammo box/crate
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(0, 0, 16, 12);

    // Ammo box top
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(0, 0, 16, 4);

    // Ammo bullets inside
    graphics.fillStyle(0xffd700, 1);
    graphics.fillRect(3, 6, 2, 4);
    graphics.fillRect(6, 6, 2, 4);
    graphics.fillRect(9, 6, 2, 4);
    graphics.fillRect(12, 6, 2, 4);

    // Highlight
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.strokeRect(0, 0, 16, 12);

    graphics.generateTexture('ammo', 16, 12);
    graphics.destroy();
  }
}
