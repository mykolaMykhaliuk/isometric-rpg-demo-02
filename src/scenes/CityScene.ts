import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Wizard } from '../entities/Wizard';
import { Ammo } from '../entities/Ammo';
import { cartToIso, isoToCart } from '../utils/IsometricUtils';
import { WeaponType } from '../weapons/IWeapon';

interface DoorData {
  tileX: number;
  tileY: number;
  buildingId: number;
  isPortfolio: boolean;
}

interface BuildingLabel {
  text: string;
  centerX: number;
  centerY: number;
}

interface CitySceneData {
  fromBuildingId?: number;
  playerHealth?: number;
  playerAmmo?: number;
  playerArmor?: number;
  currentWeapon?: WeaponType;
}

export class CityScene extends Phaser.Scene {
  private player!: Player;
  private wizard!: Wizard;
  private enemies!: Phaser.Physics.Arcade.Group;
  private ammoItems!: Phaser.Physics.Arcade.Group;
  private doors: DoorData[] = [];
  private buildingBodies!: Phaser.Physics.Arcade.StaticGroup;
  private obstructions: Array<{ sprite: Phaser.GameObjects.Image, tileX: number, tileY: number }> = [];
  private mapWidth: number = 40;
  private mapHeight: number = 40;
  private offsetX: number = 512;
  private offsetY: number = 100;
  private spawnTimer: number = 0;
  private spawnDelay: number = 5000;
  private baseSpawnDelay: number = 5000;
  private maxEnemies: number = 10;
  private baseMaxEnemies: number = 10;

  // Data passed from BuildingScene when returning
  private fromBuildingId?: number;
  private initialHealth?: number;
  private initialAmmo?: number;
  private initialArmor?: number;
  private initialWeapon?: WeaponType;

  // Building labels for the four central buildings
  private buildingLabels: BuildingLabel[] = [
    { text: 'SKILLS', centerX: 11.5, centerY: 14 },
    { text: 'PROJECTS', centerX: 21.5, centerY: 14 },
    { text: 'EXPERIENCE', centerX: 31.5, centerY: 14 },
    { text: 'CERTIFICATIONS', centerX: 11.5, centerY: 26 },
    { text: 'CONTACTS', centerX: 21.5, centerY: 26 },
    { text: 'BATTLE', centerX: 31.5, centerY: 26 },
    
  ];

  // Map legend:
  // 0 = ground, 1 = road, 2 = building, 3 = water, 4 = battle building door, 5 = fence, 6 = portfolio building door
  private cityMap: number[][] = [
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5],
    [5, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  ];

  constructor() {
    super({ key: 'CityScene' });
  }

  init(data?: CitySceneData): void {
    this.fromBuildingId = data?.fromBuildingId;
    this.initialHealth = data?.playerHealth;
    this.initialAmmo = data?.playerAmmo;
    this.initialArmor = data?.playerArmor;
    this.initialWeapon = data?.currentWeapon;
  }

  create(): void {
    this.createMap();
    this.createPlayer();
    this.createWizard();
    this.createEnemyGroup();
    this.createAmmoGroup();
    this.spawnInitialEnemies();
    this.spawnAmmoItems();
    this.setupCamera();
    this.setupCollisions();
    this.setupEvents();

    // Get current score from UIScene to maintain difficulty
    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene && uiScene.getScore) {
      this.updateDifficultyBasedOnScore(uiScene.getScore());
    }
  }

  private createMap(): void {
    let buildingId = 0;
    this.buildingBodies = this.physics.add.staticGroup();

    // First pass: draw ground and roads (sorted for isometric)
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        const isoPos = cartToIso(x, y);
        const screenX = isoPos.x + this.offsetX;
        const screenY = isoPos.y + this.offsetY;

        let texture: string;
        switch (tileType) {
          case 1:
            texture = 'tile_road';
            break;
          case 3:
            texture = 'tile_water';
            break;
          case 5:
            // Fence will be rendered in second pass
            texture = 'tile_ground';
            break;
          default:
            texture = 'tile_ground';
        }

        const tile = this.add.image(screenX, screenY, texture);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(y);
      }
    }

    // Second pass: draw buildings, fences, and doors (need to be on top)
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        const isoPos = cartToIso(x, y);
        const screenX = isoPos.x + this.offsetX;
        const screenY = isoPos.y + this.offsetY;

        if (tileType === 2) {
          const building = this.add.image(screenX, screenY - 30, 'tile_building');
          building.setOrigin(0.5, 0.5);
          building.setDepth(screenY);

          // Store reference for transparency system
          this.obstructions.push({ sprite: building, tileX: x, tileY: y });

          // Add collision body for building
          const buildingBody = this.add.rectangle(screenX, screenY, 50, 30, 0x000000, 0);
          this.physics.add.existing(buildingBody, true);
          this.buildingBodies.add(buildingBody);
        } else if (tileType === 5) {
          // Render fence with proper offset
          const fence = this.add.image(screenX, screenY - 10, 'tile_fence');
          fence.setOrigin(0.5, 0.5);
          fence.setDepth(screenY);

          // Store reference for transparency system
          this.obstructions.push({ sprite: fence, tileX: x, tileY: y });

          // Add collision body for fence
          const fenceBody = this.add.rectangle(screenX, screenY, 50, 30, 0x000000, 0);
          this.physics.add.existing(fenceBody, true);
          this.buildingBodies.add(fenceBody);
        } else if (tileType === 4 || tileType === 6) {
          // Door position - add ground tile and mark as door
          const isPortfolioDoor = tileType === 6;
          const doorColor = isPortfolioDoor ? 0x00bfff : 0xffff00; // Cyan for portfolio, yellow for battle

          this.doors.push({ tileX: x, tileY: y, buildingId: buildingId++, isPortfolio: isPortfolioDoor });

          // Add door indicator with glow effect
          const doorIndicator = this.add.circle(screenX, screenY, 10, doorColor, 0.7);
          doorIndicator.setDepth(screenY + 150);

          // Outer glow
          const doorGlow = this.add.circle(screenX, screenY, 12, doorColor, 0.3);
          doorGlow.setDepth(screenY + 149);

          // Pulsing animation
          this.tweens.add({
            targets: [doorIndicator, doorGlow],
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.7, to: 0.4 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });

          // Add interaction hint with better styling
          const hintColor = isPortfolioDoor ? '#00bfff' : '#ffff00';
          const hint = this.add.text(screenX, screenY - 25, 'E', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 6, y: 4 },
            stroke: hintColor,
            strokeThickness: 2,
          }).setOrigin(0.5);
          hint.setDepth(screenY + 151);

          // Hint glow
          this.tweens.add({
            targets: hint,
            scale: { from: 1, to: 1.1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
      }
    }

    // Third pass: add building labels
    this.createBuildingLabels();
  }

  private createBuildingLabels(): void {
    for (const label of this.buildingLabels) {
      const isoPos = cartToIso(label.centerX, label.centerY);
      const screenX = isoPos.x + this.offsetX;
      const screenY = isoPos.y + this.offsetY;

      // Create individual letter sprites laid out across the roof
      const letterSpacing = 18;
      const totalWidth = (label.text.length - 1) * letterSpacing;
      const startX = screenX - totalWidth / 2;

      for (let i = 0; i < label.text.length; i++) {
        const letter = label.text[i];
        const letterX = startX + i * letterSpacing;
        const letterY = screenY - 80; // Position above building

        // Create text with isometric appearance
        const text = this.add.text(letterX, letterY, letter, {
          fontSize: '24px',
          fontFamily: 'Arial Black, Arial',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
        }).setOrigin(0.5);

        // Apply slight rotation and scale for isometric effect
        text.setAngle(-10);
        text.setScale(1.2, 0.8);
        text.setDepth(screenY + 150);

        // Add shadow effect
        const shadow = this.add.text(letterX + 2, letterY + 2, letter, {
          fontSize: '24px',
          fontFamily: 'Arial Black, Arial',
          fontStyle: 'bold',
          color: '#000000',
        }).setOrigin(0.5);
        shadow.setAlpha(0.5);
        shadow.setAngle(-10);
        shadow.setScale(1.2, 0.8);
        shadow.setDepth(screenY + 149);
      }
    }
  }

  private createPlayer(): void {
    let startX: number;
    let startY: number;

    // Check if returning from a building
    if (this.fromBuildingId !== undefined && this.doors[this.fromBuildingId]) {
      // Spawn at the door the player entered from
      const door = this.doors[this.fromBuildingId];
      const doorIso = cartToIso(door.tileX, door.tileY);
      startX = doorIso.x + this.offsetX;
      startY = doorIso.y + this.offsetY;
    } else {
      // Default starting position
      const startTile = cartToIso(9, 5);
      startX = startTile.x + this.offsetX;
      startY = startTile.y + this.offsetY;
    }

    this.player = new Player(this, startX, startY);

    // Restore player stats if returning from a building
    if (this.initialHealth !== undefined && this.initialHealth < 100) {
      this.player.takeDamage(100 - this.initialHealth);
    }
    if (this.initialAmmo !== undefined) {
      this.player.setAmmo(this.initialAmmo);
    }
    if (this.initialArmor !== undefined) {
      this.player.setArmor(this.initialArmor);
    }
    if (this.initialWeapon !== undefined) {
      this.player.setWeapon(this.initialWeapon);
    }
  }

  private createWizard(): void {
    // Place wizard near spawn location (tile 7, 5)
    const wizardTile = cartToIso(7, 5);
    const wizardX = wizardTile.x + this.offsetX;
    const wizardY = wizardTile.y + this.offsetY;

    this.wizard = new Wizard(this, wizardX, wizardY);
    this.wizard.setPlayer(this.player);
  }

  private createEnemyGroup(): void {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
  }

  private createAmmoGroup(): void {
    this.ammoItems = this.physics.add.group({
      classType: Ammo,
      runChildUpdate: true,
    });
  }

  private spawnInitialEnemies(): void {
    for (let i = 0; i < 5; i++) {
      this.spawnEnemy();
    }
  }

  private spawnAmmoItems(): void {
    // Spawn ammo at various locations on the map
    const ammoSpawnPositions = [
      { x: 2, y: 2 },
      { x: 6, y: 6 },
      { x: 13, y: 6 },
      { x: 17, y: 2 },
      { x: 6, y: 13 },
      { x: 13, y: 13 },
      { x: 19, y: 9 },
      { x: 2, y: 17 },
      { x: 17, y: 17 },
      { x: 23, y: 6 },
      { x: 27, y: 2 },
      { x: 30, y: 13 },
      { x: 35, y: 6 },
      { x: 37, y: 17 },
      { x: 23, y: 23 },
      { x: 27, y: 27 },
      { x: 30, y: 30 },
      { x: 35, y: 35 },
    ];

    for (const pos of ammoSpawnPositions) {
      const tileType = this.cityMap[pos.y]?.[pos.x];
      // Only spawn on ground (0) or road (1) tiles
      if (tileType === 0 || tileType === 1) {
        const isoPos = cartToIso(pos.x, pos.y);
        const spawnX = isoPos.x + this.offsetX;
        const spawnY = isoPos.y + this.offsetY;

        const ammo = new Ammo(this, spawnX, spawnY);
        ammo.setPlayer(this.player);
        this.ammoItems.add(ammo);
      }
    }
  }

  private spawnEnemy(): void {
    if (this.enemies.getLength() >= this.maxEnemies) return;

    // Find a valid spawn position (on ground or road, away from player)
    let spawnX: number, spawnY: number;
    let attempts = 0;

    do {
      const tileX = Phaser.Math.Between(1, this.mapWidth - 2);
      const tileY = Phaser.Math.Between(1, this.mapHeight - 2);
      const tileType = this.cityMap[tileY][tileX];

      if (tileType === 0 || tileType === 1) {
        const isoPos = cartToIso(tileX, tileY);
        spawnX = isoPos.x + this.offsetX;
        spawnY = isoPos.y + this.offsetY;

        const distToPlayer = Phaser.Math.Distance.Between(spawnX, spawnY, this.player.x, this.player.y);
        if (distToPlayer > 200) break;
      }
      attempts++;
    } while (attempts < 50);

    if (attempts < 50) {
      const enemy = new Enemy(this, spawnX!, spawnY!);
      enemy.setPlayer(this.player);
      this.enemies.add(enemy);
    }
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // Set world bounds based on isometric map size
    const mapBounds = this.calculateMapBounds();
    this.physics.world.setBounds(
      mapBounds.minX - 100,
      mapBounds.minY - 100,
      mapBounds.width + 200,
      mapBounds.height + 200
    );
  }

  private calculateMapBounds(): { minX: number; minY: number; width: number; height: number } {
    const topLeft = cartToIso(0, 0);
    const topRight = cartToIso(this.mapWidth, 0);
    const bottomLeft = cartToIso(0, this.mapHeight);
    const bottomRight = cartToIso(this.mapWidth, this.mapHeight);

    const minX = Math.min(topLeft.x, bottomLeft.x) + this.offsetX;
    const maxX = Math.max(topRight.x, bottomRight.x) + this.offsetX;
    const minY = topLeft.y + this.offsetY;
    const maxY = bottomRight.y + this.offsetY + 100;

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private setupCollisions(): void {
    // Bullet vs Enemy collisions
    const bullets = this.player.getBullets();
    if (bullets) {
      this.physics.add.overlap(
        bullets,
        this.enemies,
        this.handleBulletEnemyCollision,
        undefined,
        this
      );
    }

    // Player vs Building/Fence collisions
    if (this.buildingBodies) {
      this.physics.add.collider(this.player, this.buildingBodies);
      // Enemy vs Building/Fence collisions
      this.physics.add.collider(this.enemies, this.buildingBodies);
      // Bullet vs Building/Fence collisions
      if (bullets) {
        this.physics.add.collider(bullets, this.buildingBodies, this.handleBulletBuildingCollision, undefined, this);
      }
    }
  }

  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  private handleBulletEnemyCollision(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    const enemyEntity = enemy as Enemy;

    // Guard against invalid or already processed objects
    if (!bulletSprite || !bulletSprite.active) return;
    if (!enemyEntity || !enemyEntity.active || enemyEntity.isEnemyDying()) return;

    // Disable bullet completely to prevent further collisions
    bulletSprite.setActive(false);
    bulletSprite.setVisible(false);
    bulletSprite.setVelocity(0, 0);
    if (bulletSprite.body) {
      bulletSprite.body.enable = false;
    }

    // Hit particle effect
    const hitEffect = this.add.particles(
      bulletSprite.x,
      bulletSprite.y,
      'bullet',
      {
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0 },
        lifespan: 150,
        quantity: 4,
        tint: [0xffff00, 0xffaa00, 0xff6600],
      }
    );
    hitEffect.setDepth(bulletSprite.y + 10);
    this.time.delayedCall(150, () => hitEffect.destroy());

    enemyEntity.takeDamage(20);
  }

  private handleBulletBuildingCollision(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _building: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;

    // Guard against invalid or already processed objects
    if (!bulletSprite || !bulletSprite.active) return;

    // Disable bullet completely to prevent further collisions
    bulletSprite.setActive(false);
    bulletSprite.setVisible(false);
    bulletSprite.setVelocity(0, 0);
    if (bulletSprite.body) {
      bulletSprite.body.enable = false;
    }

    // Impact particle effect
    const impactEffect = this.add.particles(
      bulletSprite.x,
      bulletSprite.y,
      'bullet',
      {
        speed: { min: 20, max: 60 },
        scale: { start: 0.2, end: 0 },
        lifespan: 100,
        quantity: 3,
        tint: [0x888888, 0x666666, 0x444444],
      }
    );
    impactEffect.setDepth(bulletSprite.y + 10);
    this.time.delayedCall(100, () => impactEffect.destroy());
  }

  private setupEvents(): void {
    // Enter building on E key
    const keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    keyE.on('down', () => this.tryEnterBuilding());

    // Enemy killed event
    this.events.on('enemyKilled', (points: number) => {
      const uiScene = this.scene.get('UIScene');
      uiScene.events.emit('addScore', points);
    });

    // Player died event
    this.events.on('playerDied', () => {
      this.scene.pause();
      const uiScene = this.scene.get('UIScene');
      uiScene.events.emit('showGameOver');
    });

    // Listen for score updates from UIScene
    const uiScene = this.scene.get('UIScene');
    uiScene.events.on('scoreUpdated', (newScore: number) => {
      this.updateDifficultyBasedOnScore(newScore);
    });
  }

  private tryEnterBuilding(): void {
    for (const door of this.doors) {
      const doorIso = cartToIso(door.tileX, door.tileY);
      const doorScreenX = doorIso.x + this.offsetX;
      const doorScreenY = doorIso.y + this.offsetY;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        doorScreenX,
        doorScreenY
      );

      if (distance < 40) {
        this.enterBuilding(door.buildingId);
        return;
      }
    }
  }

  private enterBuilding(buildingId: number): void {
    const door = this.doors.find(d => d.buildingId === buildingId);
    this.scene.start('BuildingScene', {
      buildingId,
      playerHealth: this.player.getHealth(),
      playerAmmo: this.player.getAmmo(),
      playerArmor: this.player.getArmor(),
      currentWeapon: this.player.getCurrentWeaponType(),
      isPortfolio: door?.isPortfolio ?? false,
    });
  }

  private updateDifficultyBasedOnScore(newScore: number): void {
    // Calculate difficulty multiplier based on score
    // Every 50 points increases difficulty
    const difficultyLevel = Math.floor(newScore / 50);

    // Increase max enemies: +2 enemies per difficulty level, capped at 30
    this.maxEnemies = Math.min(this.baseMaxEnemies + difficultyLevel * 2, 30);

    // Decrease spawn delay: faster spawning as score increases, minimum 1 second
    this.spawnDelay = Math.max(this.baseSpawnDelay - difficultyLevel * 400, 1000);
  }

  private updateObstructionTransparency(): void {
    // Convert player screen position to tile coordinates (subtract offset first)
    const playerTilePos = isoToCart(this.player.x - this.offsetX, this.player.y - this.offsetY);

    this.obstructions.forEach(obstruction => {
      // Player is "behind" obstruction if:
      // 1. Player's tile Y is greater than obstruction's tile Y (further back in iso space)
      // 2. Player is horizontally close to the obstruction (within X tiles)

      const isPlayerBehind =
        playerTilePos.y > obstruction.tileY - 3  &&
        Math.abs(playerTilePos.x - obstruction.tileX) <= 4 &&
        obstruction.tileY >= playerTilePos.y &&
        obstruction.tileX >= playerTilePos.x;

      // Set transparency: 0.3 when behind, 1.0 when not
      const targetAlpha = isPlayerBehind ? 0.3 : 1.0;

      // Smooth transition
      obstruction.sprite.alpha = Phaser.Math.Linear(obstruction.sprite.alpha, targetAlpha, 0.1);
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.wizard.update(time, delta);

    // Update obstruction transparency based on player position
    this.updateObstructionTransparency();

    // Spawn enemies periodically
    if (time > this.spawnTimer) {
      this.spawnEnemy();
      this.spawnTimer = time + this.spawnDelay;
    }
  }
}
