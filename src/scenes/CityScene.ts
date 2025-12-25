import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Ammo } from '../entities/Ammo';
import { cartToIso } from '../utils/IsometricUtils';

interface DoorData {
  tileX: number;
  tileY: number;
  buildingId: number;
}

export class CityScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private ammoItems!: Phaser.Physics.Arcade.Group;
  private doors: DoorData[] = [];
  private buildingBodies!: Phaser.Physics.Arcade.StaticGroup;
  private mapWidth: number = 40;
  private mapHeight: number = 40;
  private offsetX: number = 512;
  private offsetY: number = 100;
  private spawnTimer: number = 0;
  private spawnDelay: number = 5000;
  private maxEnemies: number = 10;

  // Map legend:
  // 0 = ground, 1 = road, 2 = building, 3 = water, 4 = door position
  private cityMap: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0],
    [0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0],
    [0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 0],
    [0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  constructor() {
    super({ key: 'CityScene' });
  }

  create(): void {
    this.createMap();
    this.createPlayer();
    this.createEnemyGroup();
    this.createAmmoGroup();
    this.spawnInitialEnemies();
    this.spawnAmmoItems();
    this.setupCamera();
    this.setupCollisions();
    this.setupEvents();
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
          default:
            texture = 'tile_ground';
        }

        const tile = this.add.image(screenX, screenY, texture);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(y);
      }
    }

    // Second pass: draw buildings and doors (need to be on top)
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        const isoPos = cartToIso(x, y);
        const screenX = isoPos.x + this.offsetX;
        const screenY = isoPos.y + this.offsetY;

        if (tileType === 2) {
          const building = this.add.image(screenX, screenY - 30, 'tile_building');
          building.setOrigin(0.5, 0.5);
          building.setDepth(y + 100);

          // Add collision body for building
          const buildingBody = this.add.rectangle(screenX, screenY, 50, 30, 0x000000, 0);
          this.physics.add.existing(buildingBody, true);
          this.buildingBodies.add(buildingBody);
        } else if (tileType === 4) {
          // Door position - add ground tile and mark as door
          this.doors.push({ tileX: x, tileY: y, buildingId: buildingId++ });

          // Add door indicator with glow effect
          const doorIndicator = this.add.circle(screenX, screenY, 10, 0xffff00, 0.7);
          doorIndicator.setDepth(y + 50);
          
          // Outer glow
          const doorGlow = this.add.circle(screenX, screenY, 12, 0xffff00, 0.3);
          doorGlow.setDepth(y + 49);
          
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
          const hint = this.add.text(screenX, screenY - 25, 'E', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 6, y: 4 },
            stroke: '#ffff00',
            strokeThickness: 2,
          }).setOrigin(0.5);
          hint.setDepth(y + 51);
          
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
  }

  private createPlayer(): void {
    // Start player on a road tile
    const startTile = cartToIso(9, 5);
    const startX = startTile.x + this.offsetX;
    const startY = startTile.y + this.offsetY;

    this.player = new Player(this, startX, startY);
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
    this.physics.add.overlap(
      this.player.getBullets(),
      this.enemies,
      this.handleBulletEnemyCollision,
      undefined,
      this
    );

    // Player vs Building collisions
    if (this.buildingBodies) {
      this.physics.add.collider(this.player, this.buildingBodies);
    }
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
    this.scene.start('BuildingScene', {
      buildingId,
      playerHealth: this.player.getHealth(),
      playerAmmo: this.player.getAmmo(),
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    // Spawn enemies periodically
    if (time > this.spawnTimer) {
      this.spawnEnemy();
      this.spawnTimer = time + this.spawnDelay;
    }
  }
}
