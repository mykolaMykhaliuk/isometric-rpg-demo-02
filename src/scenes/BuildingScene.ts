import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { cartToIso } from '../utils/IsometricUtils';
import { WeaponType } from '../weapons/IWeapon';

interface BuildingData {
  buildingId: number;
  playerHealth: number;
  playerAmmo: number;
  currentWeapon?: WeaponType;
}

export class BuildingScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private buildingId: number = 0;
  private initialHealth: number = 100;
  private initialAmmo: number = 30;
  private initialWeapon: WeaponType = WeaponType.GUN;
  private mapWidth: number = 12;
  private mapHeight: number = 10;
  private offsetX: number = 400;
  private offsetY: number = 150;
  private currentScore: number = 0;

  // Interior map: 0 = floor, 1 = wall, 2 = exit door
  private interiorMaps: number[][][] = [
    // Building 0
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 1
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 2
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 3
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  ];

  private exitPosition: { x: number; y: number } = { x: 0, y: 0 };
  private wallBodies: Phaser.Physics.Arcade.StaticGroup | null = null;

  constructor() {
    super({ key: 'BuildingScene' });
  }

  init(data: BuildingData): void {
    this.buildingId = data.buildingId % this.interiorMaps.length;
    this.initialHealth = data.playerHealth || 100;
    this.initialAmmo = data.playerAmmo || 30;
    this.initialWeapon = data.currentWeapon || WeaponType.GUN;
  }

  create(): void {
    // Get current score from UIScene to maintain difficulty
    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene && uiScene.getScore) {
      this.currentScore = uiScene.getScore();
    }

    this.createInterior();
    this.createPlayer();
    this.createEnemyGroup();
    this.spawnInteriorEnemies();
    this.setupCamera();
    this.setupCollisions();
    this.setupEvents();

    // Add building title
    this.add.text(512, 30, `Building ${this.buildingId + 1}`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
  }

  private createInterior(): void {
    const currentMap = this.interiorMaps[this.buildingId];
    this.wallBodies = this.physics.add.staticGroup();

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = currentMap[y][x];
        const isoPos = cartToIso(x, y);
        const screenX = isoPos.x + this.offsetX;
        const screenY = isoPos.y + this.offsetY;

        if (tileType === 0 || tileType === 2) {
          // Floor tile
          const floor = this.add.image(screenX, screenY, 'tile_floor');
          floor.setOrigin(0.5, 0.5);
          floor.setDepth(y);

          if (tileType === 2) {
            // Exit door
            this.exitPosition = { x: screenX, y: screenY };

            const exitIndicator = this.add.circle(screenX, screenY, 12, 0x00ff00, 0.8);
            exitIndicator.setDepth(y + 50);
            
            // Outer glow
            const exitGlow = this.add.circle(screenX, screenY, 14, 0x00ff00, 0.4);
            exitGlow.setDepth(y + 49);
            
            // Pulsing animation
            this.tweens.add({
              targets: [exitIndicator, exitGlow],
              scale: { from: 1, to: 1.2 },
              alpha: { from: 0.8, to: 0.3 },
              duration: 1000,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            const exitHint = this.add.text(screenX, screenY - 30, 'E - Exit', {
              fontSize: '14px',
              fontStyle: 'bold',
              color: '#ffffff',
              backgroundColor: '#000000',
              padding: { x: 6, y: 4 },
              stroke: '#00ff00',
              strokeThickness: 2,
            }).setOrigin(0.5);
            exitHint.setDepth(y + 51);
            
            // Hint glow
            this.tweens.add({
              targets: exitHint,
              scale: { from: 1, to: 1.1 },
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
        } else if (tileType === 1) {
          // Wall tile
          const wall = this.add.image(screenX, screenY - 20, 'tile_wall');
          wall.setOrigin(0.5, 0.5);
          wall.setDepth(y + 100);

          // Add collision body for wall
          const wallBody = this.add.rectangle(screenX, screenY, 40, 20, 0x000000, 0);
          this.physics.add.existing(wallBody, true);
          this.wallBodies.add(wallBody);
        }
      }
    }
  }

  private createPlayer(): void {
    // Start near center
    const startTile = cartToIso(6, 5);
    const startX = startTile.x + this.offsetX;
    const startY = startTile.y + this.offsetY;

    this.player = new Player(this, startX, startY);

    // Restore player stats
    if (this.initialHealth < 100) {
      this.player.takeDamage(100 - this.initialHealth);
    }
    this.player.setAmmo(this.initialAmmo);

    // Restore weapon state
    this.player.setWeapon(this.initialWeapon);
  }

  private createEnemyGroup(): void {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
  }

  private spawnInteriorEnemies(): void {
    const currentMap = this.interiorMaps[this.buildingId];

    // Scale enemy count based on score
    const difficultyLevel = Math.floor(this.currentScore / 50);
    const baseMin = 2;
    const baseMax = 4;
    const minEnemies = Math.min(baseMin + difficultyLevel, 8);
    const maxEnemies = Math.min(baseMax + difficultyLevel, 10);
    const numEnemies = Phaser.Math.Between(minEnemies, maxEnemies);

    for (let i = 0; i < numEnemies; i++) {
      let attempts = 0;
      while (attempts < 20) {
        const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
        const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

        if (currentMap[tileY][tileX] === 0) {
          const isoPos = cartToIso(tileX, tileY);
          const spawnX = isoPos.x + this.offsetX;
          const spawnY = isoPos.y + this.offsetY;

          const distToPlayer = Phaser.Math.Distance.Between(spawnX, spawnY, this.player.x, this.player.y);
          if (distToPlayer > 100) {
            const enemy = new Enemy(this, spawnX, spawnY);
            enemy.setPlayer(this.player);
            this.enemies.add(enemy);
            break;
          }
        }
        attempts++;
      }
    }
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2);
  }

  private setupCollisions(): void {
    // Bullet vs Enemy
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

    // Player vs Walls
    if (this.wallBodies) {
      this.physics.add.collider(this.player, this.wallBodies);
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

  private setupEvents(): void {
    // Exit building on E key
    const keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    keyE.on('down', () => this.tryExitBuilding());

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
      this.currentScore = newScore;
    });
  }

  private tryExitBuilding(): void {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.exitPosition.x,
      this.exitPosition.y
    );

    if (distance < 40) {
      this.scene.start('CityScene');
    }
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
  }
}
