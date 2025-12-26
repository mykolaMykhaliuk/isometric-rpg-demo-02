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
    this.createWizardSprite();
    this.createBulletSprite();
    this.createDoorSprite();
    this.createAmmoSprite();
    this.createArmorSprites();
    this.createHealthSprites();
    this.createWeaponIcons();
    this.createSwordSprite();

    this.scene.start('CityScene');
    this.scene.launch('UIScene');
    this.scene.launch('ConversationScene');
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
    // Ground tile with gradient and texture
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Base shape with gradient effect (simulated with multiple fills)
    groundGraphics.fillStyle(0x5a8d6a, 1);
    groundGraphics.beginPath();
    groundGraphics.moveTo(TILE_WIDTH / 2, 0);
    groundGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    groundGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    groundGraphics.lineTo(0, TILE_HEIGHT / 2);
    groundGraphics.closePath();
    groundGraphics.fillPath();
    
    // Lighter center for depth
    groundGraphics.fillStyle(0x6ba07a, 0.6);
    groundGraphics.fillCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_WIDTH / 3);
    
    // Darker edges
    groundGraphics.lineStyle(2, 0x4a7c59, 1);
    groundGraphics.strokePath();
    groundGraphics.lineStyle(1, 0x3d6b4a, 0.8);
    groundGraphics.lineBetween(TILE_WIDTH / 2, 0, TILE_WIDTH / 2, TILE_HEIGHT);
    groundGraphics.lineBetween(0, TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT / 2);
    
    // Texture dots
    groundGraphics.fillStyle(0x4a7c59, 0.4);
    for (let i = 0; i < 8; i++) {
      const x = TILE_WIDTH / 2 + (Math.random() - 0.5) * TILE_WIDTH * 0.6;
      const y = TILE_HEIGHT / 2 + (Math.random() - 0.5) * TILE_HEIGHT * 0.6;
      groundGraphics.fillCircle(x, y, 1.5);
    }
    
    groundGraphics.generateTexture('tile_ground', TILE_WIDTH, TILE_HEIGHT);
    groundGraphics.destroy();

    // Road tile with better texture and markings
    const roadGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Base road color
    roadGraphics.fillStyle(0x4a4a4a, 1);
    roadGraphics.beginPath();
    roadGraphics.moveTo(TILE_WIDTH / 2, 0);
    roadGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    roadGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    roadGraphics.lineTo(0, TILE_HEIGHT / 2);
    roadGraphics.closePath();
    roadGraphics.fillPath();
    
    // Road texture with lighter patches
    roadGraphics.fillStyle(0x555555, 0.5);
    roadGraphics.fillCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_WIDTH / 4);
    
    // Border
    roadGraphics.lineStyle(2, 0x333333, 1);
    roadGraphics.strokePath();
    
    // Center line (dashed effect)
    roadGraphics.lineStyle(3, 0xffff00, 0.8);
    roadGraphics.lineBetween(TILE_WIDTH / 2, TILE_HEIGHT / 4, TILE_WIDTH / 2, 3 * TILE_HEIGHT / 4);
    
    // Side markings
    roadGraphics.lineStyle(1, 0xffffff, 0.6);
    roadGraphics.lineBetween(TILE_WIDTH / 2 - 12, TILE_HEIGHT / 2 - 4, TILE_WIDTH / 2 - 12, TILE_HEIGHT / 2 + 4);
    roadGraphics.lineBetween(TILE_WIDTH / 2 + 12, TILE_HEIGHT / 2 - 4, TILE_WIDTH / 2 + 12, TILE_HEIGHT / 2 + 4);
    
    roadGraphics.generateTexture('tile_road', TILE_WIDTH, TILE_HEIGHT);
    roadGraphics.destroy();

    // Building tile (with enhanced 3D effect and details)
    const buildingGraphics = this.make.graphics({ x: 0, y: 0 });
    const buildingHeight = 60;

    // Top (roof) with gradient effect
    buildingGraphics.fillStyle(0x9b8365, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(TILE_WIDTH / 2, 0);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(0, TILE_HEIGHT / 2);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();
    
    // Roof highlight
    buildingGraphics.fillStyle(0xab9375, 0.5);
    buildingGraphics.fillTriangle(TILE_WIDTH / 2, 0, TILE_WIDTH * 0.75, TILE_HEIGHT / 4, TILE_WIDTH / 2, TILE_HEIGHT / 2);
    
    // Roof shadow
    buildingGraphics.fillStyle(0x7b6345, 0.5);
    buildingGraphics.fillTriangle(TILE_WIDTH / 2, TILE_HEIGHT, TILE_WIDTH * 0.25, TILE_HEIGHT * 0.75, TILE_WIDTH / 2, TILE_HEIGHT / 2);

    // Right face with gradient
    buildingGraphics.fillStyle(0x7b6344, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2 + buildingHeight);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + buildingHeight);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();
    
    // Right face highlight
    buildingGraphics.fillStyle(0x8b7354, 0.4);
    buildingGraphics.fillRect(TILE_WIDTH * 0.85, TILE_HEIGHT / 2 + 5, TILE_WIDTH * 0.15, buildingHeight - 10);

    // Left face with gradient
    buildingGraphics.fillStyle(0x6a5435, 1);
    buildingGraphics.beginPath();
    buildingGraphics.moveTo(0, TILE_HEIGHT / 2);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    buildingGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + buildingHeight);
    buildingGraphics.lineTo(0, TILE_HEIGHT / 2 + buildingHeight);
    buildingGraphics.closePath();
    buildingGraphics.fillPath();
    
    // Left face shadow
    buildingGraphics.fillStyle(0x5a4435, 0.4);
    buildingGraphics.fillRect(0, TILE_HEIGHT / 2 + 5, TILE_WIDTH * 0.15, buildingHeight - 10);

    // Window frames and glass
    // Right side windows
    buildingGraphics.fillStyle(0x654321, 1);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 6, TILE_HEIGHT / 2 + 8, 10, 12);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 6, TILE_HEIGHT / 2 + 28, 10, 12);
    
    buildingGraphics.fillStyle(0x4a90e2, 0.7);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 8, TILE_HEIGHT / 2 + 10, 6, 8);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 8, TILE_HEIGHT / 2 + 30, 6, 8);
    
    // Window reflections
    buildingGraphics.fillStyle(0xffffff, 0.3);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 9, TILE_HEIGHT / 2 + 11, 2, 3);
    buildingGraphics.fillRect(TILE_WIDTH / 2 + 9, TILE_HEIGHT / 2 + 31, 2, 3);
    
    // Left side windows
    buildingGraphics.fillStyle(0x654321, 1);
    buildingGraphics.fillRect(8, TILE_HEIGHT / 2 + 8, 10, 12);
    buildingGraphics.fillRect(8, TILE_HEIGHT / 2 + 28, 10, 12);
    
    buildingGraphics.fillStyle(0x4a90e2, 0.7);
    buildingGraphics.fillRect(10, TILE_HEIGHT / 2 + 10, 6, 8);
    buildingGraphics.fillRect(10, TILE_HEIGHT / 2 + 30, 6, 8);
    
    // Window reflections
    buildingGraphics.fillStyle(0xffffff, 0.3);
    buildingGraphics.fillRect(11, TILE_HEIGHT / 2 + 11, 2, 3);
    buildingGraphics.fillRect(11, TILE_HEIGHT / 2 + 31, 2, 3);
    
    // Building outline
    buildingGraphics.lineStyle(1, 0x5a4435, 1);
    buildingGraphics.strokePath();

    buildingGraphics.generateTexture('tile_building', TILE_WIDTH, TILE_HEIGHT + buildingHeight);
    buildingGraphics.destroy();

    // Water tile with animated effect simulation
    const waterGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Base water color with gradient
    waterGraphics.fillStyle(0x3a7aac, 1);
    waterGraphics.beginPath();
    waterGraphics.moveTo(TILE_WIDTH / 2, 0);
    waterGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    waterGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    waterGraphics.lineTo(0, TILE_HEIGHT / 2);
    waterGraphics.closePath();
    waterGraphics.fillPath();
    
    // Lighter center
    waterGraphics.fillStyle(0x4a9acc, 0.6);
    waterGraphics.fillCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_WIDTH / 3);
    
    // Wave patterns
    waterGraphics.lineStyle(2, 0x5aabee, 0.5);
    waterGraphics.beginPath();
    waterGraphics.arc(TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_WIDTH / 4, 0, Math.PI * 2);
    waterGraphics.strokePath();
    
    waterGraphics.lineStyle(1, 0x66bbff, 0.4);
    waterGraphics.beginPath();
    waterGraphics.arc(TILE_WIDTH / 2, TILE_HEIGHT / 2, TILE_WIDTH / 6, 0, Math.PI * 2);
    waterGraphics.strokePath();
    
    // Ripple highlights
    waterGraphics.fillStyle(0x88ccff, 0.3);
    for (let i = 0; i < 3; i++) {
      const x = TILE_WIDTH / 2 + (Math.random() - 0.5) * TILE_WIDTH * 0.4;
      const y = TILE_HEIGHT / 2 + (Math.random() - 0.5) * TILE_HEIGHT * 0.4;
      waterGraphics.fillCircle(x, y, 3);
    }
    
    // Border
    waterGraphics.lineStyle(2, 0x2a6a9c, 1);
    waterGraphics.strokePath();
    
    waterGraphics.generateTexture('tile_water', TILE_WIDTH, TILE_HEIGHT);
    waterGraphics.destroy();

    // Interior floor tile with wood texture
    const floorGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Base wood color
    floorGraphics.fillStyle(0x9b7924, 1);
    floorGraphics.beginPath();
    floorGraphics.moveTo(TILE_WIDTH / 2, 0);
    floorGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    floorGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    floorGraphics.lineTo(0, TILE_HEIGHT / 2);
    floorGraphics.closePath();
    floorGraphics.fillPath();
    
    // Wood grain effect
    floorGraphics.lineStyle(1, 0x8b6914, 0.6);
    for (let i = 0; i < 4; i++) {
      const y = TILE_HEIGHT / 2 + (i - 1.5) * 4;
      floorGraphics.lineBetween(0, y, TILE_WIDTH, y + TILE_HEIGHT / 2);
    }
    
    // Highlight
    floorGraphics.fillStyle(0xab8934, 0.4);
    floorGraphics.fillTriangle(TILE_WIDTH / 2, 0, TILE_WIDTH * 0.75, TILE_HEIGHT / 4, TILE_WIDTH / 2, TILE_HEIGHT / 2);
    
    // Border
    floorGraphics.lineStyle(2, 0x7a5a10, 1);
    floorGraphics.strokePath();
    
    floorGraphics.generateTexture('tile_floor', TILE_WIDTH, TILE_HEIGHT);
    floorGraphics.destroy();

    // Wall tile with better 3D effect
    const wallGraphics = this.make.graphics({ x: 0, y: 0 });
    const wallHeight = 40;

    // Top face
    wallGraphics.fillStyle(0x989898, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(TILE_WIDTH / 2, 0);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(0, TILE_HEIGHT / 2);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    
    // Top highlight
    wallGraphics.fillStyle(0xa8a8a8, 0.5);
    wallGraphics.fillTriangle(TILE_WIDTH / 2, 0, TILE_WIDTH * 0.75, TILE_HEIGHT / 4, TILE_WIDTH / 2, TILE_HEIGHT / 2);

    // Right face
    wallGraphics.fillStyle(0x767676, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2 + wallHeight);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + wallHeight);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    
    // Right face highlight
    wallGraphics.fillStyle(0x868686, 0.4);
    wallGraphics.fillRect(TILE_WIDTH * 0.85, TILE_HEIGHT / 2 + 2, TILE_WIDTH * 0.15, wallHeight - 4);

    // Left face
    wallGraphics.fillStyle(0x656565, 1);
    wallGraphics.beginPath();
    wallGraphics.moveTo(0, TILE_HEIGHT / 2);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    wallGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT + wallHeight);
    wallGraphics.lineTo(0, TILE_HEIGHT / 2 + wallHeight);
    wallGraphics.closePath();
    wallGraphics.fillPath();
    
    // Left face shadow
    wallGraphics.fillStyle(0x555555, 0.4);
    wallGraphics.fillRect(0, TILE_HEIGHT / 2 + 2, TILE_WIDTH * 0.15, wallHeight - 4);
    
    // Wall texture lines
    wallGraphics.lineStyle(1, 0x707070, 0.5);
    wallGraphics.lineBetween(TILE_WIDTH / 2, TILE_HEIGHT + 5, TILE_WIDTH / 2, TILE_HEIGHT + wallHeight - 5);
    wallGraphics.lineBetween(TILE_WIDTH * 0.25, TILE_HEIGHT / 2 + 5, TILE_WIDTH * 0.25, TILE_HEIGHT / 2 + wallHeight - 5);
    wallGraphics.lineBetween(TILE_WIDTH * 0.75, TILE_HEIGHT / 2 + 5, TILE_WIDTH * 0.75, TILE_HEIGHT / 2 + wallHeight - 5);
    
    // Outline
    wallGraphics.lineStyle(1, 0x555555, 1);
    wallGraphics.strokePath();

    wallGraphics.generateTexture('tile_wall', TILE_WIDTH, TILE_HEIGHT + wallHeight);
    wallGraphics.destroy();

    // Fence tile - simple centered post with connection rails
    const fenceGraphics = this.make.graphics({ x: 0, y: 0 });
    const fenceHeight = 20;
    const postWidth = 4;
    const railWidth = 2;

    // Ground base
    fenceGraphics.fillStyle(0x5a8d6a, 1);
    fenceGraphics.beginPath();
    fenceGraphics.moveTo(TILE_WIDTH / 2, 0);
    fenceGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2);
    fenceGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT);
    fenceGraphics.lineTo(0, TILE_HEIGHT / 2);
    fenceGraphics.closePath();
    fenceGraphics.fillPath();

    // Center post - simple vertical rectangle
    const postX = TILE_WIDTH / 2 - postWidth / 2;
    const postY = TILE_HEIGHT / 2;

    // Horizontal rails connecting to adjacent tiles
    // Top rail - connects horizontally across the tile
    fenceGraphics.fillStyle(0x7a5a10, 1);
    fenceGraphics.fillRect(0, postY + 5, TILE_WIDTH, railWidth);

    // Bottom rail
    fenceGraphics.fillRect(0, postY + 12, TILE_WIDTH, railWidth);

    // Rail highlights
    fenceGraphics.fillStyle(0x8b6914, 0.5);
    fenceGraphics.fillRect(0, postY + 5, TILE_WIDTH, 1);
    fenceGraphics.fillRect(0, postY + 12, TILE_WIDTH, 1);

    // Post shadow/back
    fenceGraphics.fillStyle(0x6a4910, 1);
    fenceGraphics.fillRect(postX + 1, postY, postWidth, fenceHeight);

    // Post main
    fenceGraphics.fillStyle(0x8b6914, 1);
    fenceGraphics.fillRect(postX, postY, postWidth, fenceHeight);

    // Post highlight
    fenceGraphics.fillStyle(0xab8934, 0.6);
    fenceGraphics.fillRect(postX, postY, 1, fenceHeight);

    // Post top cap
    fenceGraphics.fillStyle(0x9b7924, 1);
    fenceGraphics.fillRect(postX - 1, postY - 2, postWidth + 2, 2);

    fenceGraphics.generateTexture('tile_fence', TILE_WIDTH, TILE_HEIGHT + fenceHeight);
    fenceGraphics.destroy();
  }

  private createPlayerSprite(): void {
    // Create player facing right (default)
    this.createPlayerDirection('player_right', 'right');
    
    // Create player facing left (mirrored)
    this.createPlayerDirection('player_left', 'left');
    
    // Create player facing up
    this.createPlayerDirection('player_up', 'up');
    
    // Create player facing down
    this.createPlayerDirection('player_down', 'down');
    
    // Create diagonal directions
    this.createPlayerDirection('player_upRight', 'upRight');
    this.createPlayerDirection('player_upLeft', 'upLeft');
    this.createPlayerDirection('player_downRight', 'downRight');
    this.createPlayerDirection('player_downLeft', 'downLeft');
  }

  private createPlayerDirection(key: string, direction: string): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.clear(); // Ensure graphics are cleared

    // Body with shading
    graphics.fillStyle(0x4477dd, 1);
    graphics.fillCircle(16, 20, 10);
    
    // Body highlight
    graphics.fillStyle(0x5588ee, 0.8);
    graphics.fillCircle(14, 18, 6);
    
    // Body shadow
    graphics.fillStyle(0x3355bb, 0.8);
    graphics.fillCircle(18, 22, 6);

    // Torso/vest
    graphics.fillStyle(0x2a4a8a, 1);
    graphics.fillRect(12, 16, 8, 8);
    
    // Vest highlight
    graphics.fillStyle(0x3a5a9a, 0.6);
    graphics.fillRect(12, 16, 8, 4);

    // Head with shading
    graphics.fillStyle(0xffdd99, 1);
    graphics.fillCircle(16, 8, 6);
    
    // Head highlight
    graphics.fillStyle(0xffeeaa, 0.8);
    graphics.fillCircle(15, 7, 3);
    
    // Eyes - adjust based on direction
    graphics.fillStyle(0x000000, 1);
    if (direction.includes('right') || direction === 'right') {
      graphics.fillCircle(14, 7, 1);
      graphics.fillCircle(18, 7, 1);
    } else if (direction.includes('left') || direction === 'left') {
      graphics.fillCircle(14, 7, 1);
      graphics.fillCircle(18, 7, 1);
    } else {
      graphics.fillCircle(14, 7, 1);
      graphics.fillCircle(18, 7, 1);
    }
    
    // Gun positioning based on direction
    let gunX = 20;
    let gunY = 17;
    let gunWidth = 8;
    let gunHeight = 5;
    let gunBarrelX = 22;
    let gunBarrelY = 18;
    let gunBarrelWidth = 12;
    let gunBarrelHeight = 3;
    
    if (direction === 'right') {
      // Gun pointing right
      gunBarrelX = 22;
      gunBarrelY = 18;
      gunBarrelWidth = 12;
      gunBarrelHeight = 3;
    } else if (direction === 'left') {
      // Gun pointing left
      gunBarrelX = 2;
      gunBarrelY = 18;
      gunBarrelWidth = 12;
      gunBarrelHeight = 3;
    } else if (direction === 'up') {
      // Gun pointing up
      gunBarrelX = 18;
      gunBarrelY = 2;
      gunBarrelWidth = 3;
      gunBarrelHeight = 12;
    } else if (direction === 'down') {
      // Gun pointing down
      gunBarrelX = 18;
      gunBarrelY = 22;
      gunBarrelWidth = 3;
      gunBarrelHeight = 12;
    } else if (direction === 'upRight') {
      // Gun pointing up-right (diagonal)
      gunBarrelX = 20;
      gunBarrelY = 10;
      gunBarrelWidth = 8;
      gunBarrelHeight = 8;
    } else if (direction === 'upLeft') {
      // Gun pointing up-left (diagonal)
      gunBarrelX = 6;
      gunBarrelY = 10;
      gunBarrelWidth = 8;
      gunBarrelHeight = 8;
    } else if (direction === 'downRight') {
      // Gun pointing down-right (diagonal)
      gunBarrelX = 20;
      gunBarrelY = 22;
      gunBarrelWidth = 8;
      gunBarrelHeight = 8;
    } else if (direction === 'downLeft') {
      // Gun pointing down-left (diagonal)
      gunBarrelX = 6;
      gunBarrelY = 22;
      gunBarrelWidth = 8;
      gunBarrelHeight = 8;
    }
    
    // Gun barrel
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(gunBarrelX, gunBarrelY, gunBarrelWidth, gunBarrelHeight);
    
    // Gun body
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(gunX, gunY, gunWidth, gunHeight);
    
    // Gun highlight
    graphics.fillStyle(0x666666, 0.6);
    graphics.fillRect(gunX, gunY, gunWidth, 2);
    
    // Gun grip
    graphics.fillStyle(0x2a2a2a, 1);
    graphics.fillRect(18, 19, 3, 4);

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  private createEnemySprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Bug body (oval) with gradient
    graphics.fillStyle(0x55bb55, 1);
    graphics.fillEllipse(16, 16, 24, 16);
    
    // Body highlight
    graphics.fillStyle(0x66cc66, 0.7);
    graphics.fillEllipse(14, 14, 16, 10);
    
    // Body segments
    graphics.lineStyle(1, 0x44aa44, 0.8);
    graphics.lineBetween(8, 12, 24, 12);
    graphics.lineBetween(8, 16, 24, 16);
    graphics.lineBetween(8, 20, 24, 20);

    // Glowing eyes
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(10, 12, 5);
    graphics.fillCircle(22, 12, 5);
    
    // Eye glow
    graphics.fillStyle(0xff6666, 0.8);
    graphics.fillCircle(10, 12, 3);
    graphics.fillCircle(22, 12, 3);
    
    // Eye pupils
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(10, 12, 2);
    graphics.fillCircle(22, 12, 2);
    
    // Eye shine
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(11, 11, 1);
    graphics.fillCircle(23, 11, 1);

    // Mandibles with detail
    graphics.fillStyle(0x337733, 1);
    graphics.fillTriangle(6, 20, 2, 28, 10, 24);
    graphics.fillTriangle(26, 20, 30, 28, 22, 24);
    
    // Mandible highlight
    graphics.fillStyle(0x448844, 0.6);
    graphics.fillTriangle(7, 21, 4, 26, 9, 23);
    graphics.fillTriangle(25, 21, 28, 26, 23, 23);

    // Legs with joints
    graphics.lineStyle(3, 0x337733, 1);
    graphics.lineBetween(8, 16, 2, 24);
    graphics.lineBetween(24, 16, 30, 24);
    graphics.lineBetween(8, 20, 4, 28);
    graphics.lineBetween(24, 20, 28, 28);
    
    // Leg joints
    graphics.fillStyle(0x337733, 1);
    graphics.fillCircle(8, 16, 2);
    graphics.fillCircle(24, 16, 2);
    graphics.fillCircle(8, 20, 2);
    graphics.fillCircle(24, 20, 2);
    graphics.fillCircle(2, 24, 2);
    graphics.fillCircle(30, 24, 2);
    graphics.fillCircle(4, 28, 2);
    graphics.fillCircle(28, 28, 2);
    
    // Wings (optional detail)
    graphics.fillStyle(0x44aa44, 0.4);
    graphics.fillEllipse(16, 10, 20, 8);

    graphics.generateTexture('enemy_bug', 32, 32);
    graphics.destroy();
  }

  private createWizardSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Wizard robe (body) with gradient
    graphics.fillStyle(0x5533aa, 1);
    graphics.fillEllipse(16, 22, 18, 20);

    // Robe highlight
    graphics.fillStyle(0x6644bb, 0.7);
    graphics.fillEllipse(14, 20, 12, 14);

    // Robe shadow
    graphics.fillStyle(0x4422aa, 0.8);
    graphics.fillEllipse(18, 24, 12, 14);

    // Belt
    graphics.fillStyle(0x8b6914, 1);
    graphics.fillRect(10, 18, 12, 2);

    // Belt buckle
    graphics.fillStyle(0xffd700, 1);
    graphics.fillRect(14, 17, 4, 4);
    graphics.fillStyle(0xffee88, 0.6);
    graphics.fillRect(14, 17, 2, 2);

    // Sleeves
    graphics.fillStyle(0x5533aa, 1);
    graphics.fillCircle(8, 18, 4);
    graphics.fillCircle(24, 18, 4);

    // Hands
    graphics.fillStyle(0xffdd99, 1);
    graphics.fillCircle(6, 20, 3);
    graphics.fillCircle(26, 20, 3);

    // Staff (left hand)
    graphics.lineStyle(3, 0x8b6914, 1);
    graphics.lineBetween(4, 22, 4, 6);

    // Staff orb
    graphics.fillStyle(0x4488ff, 1);
    graphics.fillCircle(4, 4, 5);
    graphics.fillStyle(0x66aaff, 0.8);
    graphics.fillCircle(3, 3, 3);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(3, 3, 1);

    // Head with shading
    graphics.fillStyle(0xffdd99, 1);
    graphics.fillCircle(16, 12, 6);

    // Head highlight
    graphics.fillStyle(0xffeeaa, 0.8);
    graphics.fillCircle(15, 11, 3);

    // Eyes
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(14, 11, 1);
    graphics.fillCircle(18, 11, 1);

    // Eye shine
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(14, 10, 0.5);
    graphics.fillCircle(18, 10, 0.5);

    // Beard
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillEllipse(16, 15, 8, 5);
    graphics.fillStyle(0xeeeeee, 0.6);
    graphics.fillEllipse(15, 14, 5, 3);

    // Wizard hat
    graphics.fillStyle(0x5533aa, 1);
    graphics.fillTriangle(16, 0, 10, 8, 22, 8);

    // Hat brim
    graphics.fillStyle(0x6644bb, 1);
    graphics.fillEllipse(16, 8, 14, 4);

    // Hat highlight
    graphics.fillStyle(0x7755cc, 0.6);
    graphics.fillTriangle(16, 0, 13, 4, 16, 6);

    // Hat stars
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(14, 4, 1);
    graphics.fillCircle(18, 6, 1);

    graphics.generateTexture('wizard', 32, 32);
    graphics.destroy();
  }

  private createBulletSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Outer glow
    graphics.fillStyle(0xffff00, 0.8);
    graphics.fillCircle(4, 4, 4);
    
    // Main bullet body
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillCircle(4, 4, 3);
    
    // Core
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 1.5);
    
    // Highlight
    graphics.fillStyle(0xffff88, 0.9);
    graphics.fillCircle(3, 3, 1);

    graphics.generateTexture('bullet', 8, 8);
    graphics.destroy();
  }

  private createDoorSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Door frame with 3D effect
    graphics.fillStyle(0x9b5523, 1);
    graphics.fillRect(0, 0, 32, 48);
    
    // Frame highlight
    graphics.fillStyle(0xab6533, 0.6);
    graphics.fillRect(1, 1, 30, 2);
    graphics.fillRect(1, 1, 2, 46);
    
    // Frame shadow
    graphics.fillStyle(0x7b4513, 0.6);
    graphics.fillRect(1, 45, 30, 2);
    graphics.fillRect(29, 1, 2, 46);

    // Door panel
    graphics.fillStyle(0x754321, 1);
    graphics.fillRect(4, 4, 24, 40);
    
    // Door panels (wood planks)
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(6, 6, 20, 8);
    graphics.fillRect(6, 16, 20, 8);
    graphics.fillRect(6, 26, 20, 8);
    graphics.fillRect(6, 36, 20, 6);
    
    // Panel highlights
    graphics.fillStyle(0x855431, 0.5);
    graphics.fillRect(6, 6, 20, 2);
    graphics.fillRect(6, 16, 20, 2);
    graphics.fillRect(6, 26, 20, 2);
    graphics.fillRect(6, 36, 20, 2);
    
    // Wood grain lines
    graphics.lineStyle(1, 0x5a3412, 0.6);
    graphics.lineBetween(6, 10, 26, 10);
    graphics.lineBetween(6, 20, 26, 20);
    graphics.lineBetween(6, 30, 26, 30);
    graphics.lineBetween(6, 39, 26, 39);

    // Door handle with detail
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(22, 26, 4);
    
    // Handle highlight
    graphics.fillStyle(0xffffaa, 0.8);
    graphics.fillCircle(21, 25, 2);
    
    // Handle shadow
    graphics.fillStyle(0xccaa00, 0.6);
    graphics.fillCircle(23, 27, 2);
    
    // Handle base
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(20, 24, 4, 4);

    graphics.generateTexture('door', 32, 48);
    graphics.destroy();
  }

  private createAmmoSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Ammo box/crate base
    graphics.fillStyle(0x9b5523, 1);
    graphics.fillRect(0, 0, 16, 12);
    
    // Box shadow
    graphics.fillStyle(0x7b4513, 0.8);
    graphics.fillRect(1, 1, 14, 11);

    // Ammo box top with 3D effect
    graphics.fillStyle(0x754321, 1);
    graphics.fillRect(0, 0, 16, 4);
    
    // Top highlight
    graphics.fillStyle(0x855431, 0.6);
    graphics.fillRect(1, 1, 14, 2);
    
    // Top edge
    graphics.lineStyle(1, 0x654321, 1);
    graphics.lineBetween(0, 4, 16, 4);

    // Ammo bullets inside with detail
    graphics.fillStyle(0xffd700, 1);
    graphics.fillRect(3, 6, 2, 4);
    graphics.fillRect(6, 6, 2, 4);
    graphics.fillRect(9, 6, 2, 4);
    graphics.fillRect(12, 6, 2, 4);
    
    // Bullet tips
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillRect(3, 6, 2, 1);
    graphics.fillRect(6, 6, 2, 1);
    graphics.fillRect(9, 6, 2, 1);
    graphics.fillRect(12, 6, 2, 1);
    
    // Bullet highlights
    graphics.fillStyle(0xffffaa, 0.8);
    graphics.fillRect(3, 7, 1, 2);
    graphics.fillRect(6, 7, 1, 2);
    graphics.fillRect(9, 7, 1, 2);
    graphics.fillRect(12, 7, 1, 2);

    // Box edges and highlights
    graphics.lineStyle(1, 0xffffff, 0.6);
    graphics.strokeRect(0, 0, 16, 12);
    graphics.lineStyle(1, 0x5a3412, 0.8);
    graphics.lineBetween(0, 0, 16, 0);
    graphics.lineBetween(0, 0, 0, 12);
    
    // Box label/strap
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(2, 4, 12, 1);

    graphics.generateTexture('ammo', 16, 12);
    graphics.destroy();
  }

  private createArmorSprites(): void {
    // Blue Armor (32x32)
    const blueArmor = this.make.graphics({ x: 0, y: 0 });

    // Shield shape base
    blueArmor.fillStyle(0x2255aa, 1);
    blueArmor.fillRoundedRect(6, 4, 20, 24, 4);

    // Shield border/frame
    blueArmor.lineStyle(2, 0x4488ff, 1);
    blueArmor.strokeRoundedRect(6, 4, 20, 24, 4);

    // Inner highlight
    blueArmor.fillStyle(0x5599ff, 0.6);
    blueArmor.fillRoundedRect(9, 7, 14, 18, 3);

    // Metallic sheen
    blueArmor.fillStyle(0x88ccff, 0.4);
    blueArmor.fillRoundedRect(10, 8, 6, 16, 2);

    // Center emblem/design
    blueArmor.fillStyle(0x1144aa, 1);
    blueArmor.fillCircle(16, 16, 4);
    blueArmor.fillStyle(0x66aaff, 0.8);
    blueArmor.fillCircle(16, 16, 2);

    blueArmor.generateTexture('armor_blue', 32, 32);
    blueArmor.destroy();
  }

  private createHealthSprites(): void {
    // Red Heart (28x28)
    const redHeart = this.make.graphics({ x: 0, y: 0 });

    // Heart shape using two circles and triangle
    // Left lobe
    redHeart.fillStyle(0xff0044, 1);
    redHeart.fillCircle(10, 10, 6);
    // Right lobe
    redHeart.fillCircle(18, 10, 6);
    // Bottom point (triangle)
    redHeart.beginPath();
    redHeart.moveTo(4, 10);
    redHeart.lineTo(24, 10);
    redHeart.lineTo(14, 22);
    redHeart.closePath();
    redHeart.fillPath();

    // Highlight on left lobe
    redHeart.fillStyle(0xff6688, 0.7);
    redHeart.fillCircle(9, 8, 3);

    // Outline for definition
    redHeart.lineStyle(1.5, 0xcc0033, 1);
    redHeart.strokeCircle(10, 10, 6);
    redHeart.strokeCircle(18, 10, 6);
    redHeart.beginPath();
    redHeart.moveTo(4, 10);
    redHeart.lineTo(24, 10);
    redHeart.lineTo(14, 22);
    redHeart.closePath();
    redHeart.strokePath();

    redHeart.generateTexture('heart_red', 28, 28);
    redHeart.destroy();
  }

  private createWeaponIcons(): void {
    // Gun icon (16x16)
    const gunIcon = this.make.graphics({ x: 0, y: 0 });
    gunIcon.fillStyle(0x444444, 1);
    gunIcon.fillRect(2, 6, 8, 4);
    gunIcon.fillStyle(0x222222, 1);
    gunIcon.fillRect(10, 7, 6, 2);
    gunIcon.fillStyle(0x666666, 0.6);
    gunIcon.fillRect(2, 6, 8, 1);
    gunIcon.generateTexture('weapon_gun_icon', 16, 16);
    gunIcon.destroy();

    // Sword icon (16x16)
    const swordIcon = this.make.graphics({ x: 0, y: 0 });
    // Blade
    swordIcon.fillStyle(0xcccccc, 1);
    swordIcon.fillRect(7, 2, 2, 10);
    // Tip
    swordIcon.fillTriangle(6, 2, 10, 2, 8, 0);
    // Cross-guard
    swordIcon.fillStyle(0x8b7355, 1);
    swordIcon.fillRect(5, 11, 6, 2);
    // Handle
    swordIcon.fillStyle(0x654321, 1);
    swordIcon.fillRect(7, 13, 2, 3);
    // Highlight
    swordIcon.fillStyle(0xffffff, 0.6);
    swordIcon.fillRect(7, 3, 1, 8);
    swordIcon.generateTexture('weapon_sword_icon', 16, 16);
    swordIcon.destroy();
  }

  private createSwordSprite(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Blade (24x4 horizontal)
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillRect(0, 10, 20, 3);

    // Blade edge highlight
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(0, 10, 20, 1);

    // Blade edge shadow
    graphics.fillStyle(0x888888, 0.6);
    graphics.fillRect(0, 12, 20, 1);

    // Tip
    graphics.fillStyle(0xcccccc, 1);
    graphics.fillTriangle(20, 9, 20, 14, 24, 11.5);

    // Cross-guard
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(-2, 8, 4, 8);

    // Handle
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(-6, 10, 4, 4);

    graphics.generateTexture('sword_sprite', 32, 24);
    graphics.destroy();
  }
}
