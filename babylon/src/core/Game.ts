import {
  Engine,
  Scene,
  Vector3,
  Color4,
  Mesh,
  MeshBuilder,
} from '@babylonjs/core';
import { GameCamera } from '../cameras/GameCamera';
import { InputManager } from '../systems/InputManager';
import { LightingManager } from '../systems/LightingManager';
import { MapBuilder } from '../world/MapBuilder';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Ammo } from '../entities/Ammo';
import { Health } from '../entities/Health';
import { Armor } from '../entities/Armor';
import { Pickup } from '../entities/Pickup';
import { HUD } from '../ui/HUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import { EventBus, GameEvents } from './EventBus';
import { GAME_CONFIG, GameState } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

/**
 * Main game class - orchestrates all game systems
 */
export class Game {
  private engine: Engine;
  private scene: Scene;
  private camera: GameCamera;
  private inputManager: InputManager;
  private lightingManager: LightingManager;
  private mapBuilder: MapBuilder;
  private player: Player;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private hud: HUD;
  private gameOverScreen: GameOverScreen;
  private eventBus: EventBus;

  // Game state
  private state: GameState = GameState.LOADING;
  private score: number = 0;
  private difficultyLevel: number = 0;

  // Spawning
  private spawnTimer: number = 0;
  private spawnDelay: number = GAME_CONFIG.BASE_SPAWN_DELAY;
  private maxEnemies: number = GAME_CONFIG.BASE_MAX_ENEMIES;

  // Ground plane for mouse picking
  private groundPlane: Mesh;

  constructor(engine: Engine) {
    this.engine = engine;
    this.eventBus = EventBus.getInstance();
    this.scene = this.createScene();
    this.groundPlane = this.createGroundPlane();
    this.inputManager = InputManager.getInstance();
    this.inputManager.initialize(this.scene);
    this.camera = new GameCamera(this.scene);
    this.lightingManager = new LightingManager(this.scene);
    this.mapBuilder = new MapBuilder(this.scene);
    this.player = null!;
    this.hud = null!;
    this.gameOverScreen = null!;
  }

  private createScene(): Scene {
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.12, 0.12, 0.18, 1);
    return scene;
  }

  private createGroundPlane(): Mesh {
    // Large invisible plane for mouse picking
    const ground = MeshBuilder.CreateGround(
      'pickingGround',
      { width: 200, height: 200 },
      this.scene
    );
    ground.position.y = 0;
    ground.isPickable = true;
    ground.visibility = 0;
    return ground;
  }

  async initialize(): Promise<void> {
    this.updateLoadingProgress(10, 'Initializing materials...');

    // Initialize materials
    MaterialLibrary.initialize(this.scene);
    this.updateLoadingProgress(20, 'Building world...');

    // Build the map
    this.mapBuilder.buildCityMap();
    this.updateLoadingProgress(50, 'Creating player...');

    // Create player
    const spawnPos = this.mapBuilder.getPlayerSpawnPosition();
    this.player = new Player(this.scene, spawnPos);
    this.updateLoadingProgress(60, 'Setting up camera...');

    // Setup camera to follow player
    this.camera.setTarget(this.player.mesh);
    this.updateLoadingProgress(70, 'Creating UI...');

    // Create UI
    this.hud = new HUD(this.scene);
    this.gameOverScreen = new GameOverScreen(this.hud.getAdvancedTexture());
    this.gameOverScreen.onRestart = () => this.restart();
    this.updateLoadingProgress(80, 'Spawning entities...');

    // Setup event listeners
    this.setupEventListeners();

    // Initial spawns
    this.spawnInitialEnemies();
    this.spawnPickups();
    this.updateLoadingProgress(90, 'Finalizing...');

    // Connect player weapon manager to enemies
    this.player.getWeaponManager().setEnemiesGetter(() => this.enemies);

    // Enable shadows on ground
    const collisionMeshes = this.mapBuilder.getCollisionMeshes();
    collisionMeshes.forEach((mesh) => {
      this.lightingManager.enableShadowReceiver(mesh);
    });

    this.updateLoadingProgress(100, 'Ready!');

    // Hide loading screen
    setTimeout(() => {
      this.hideLoadingScreen();
      this.state = GameState.PLAYING;
    }, 500);
  }

  private updateLoadingProgress(percent: number, text: string): void {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    if (loadingBar) {
      loadingBar.style.width = `${percent}%`;
    }
    if (loadingText) {
      loadingText.textContent = text;
    }

    this.eventBus.emit(GameEvents.LOADING_PROGRESS, percent, text);
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
    this.eventBus.emit(GameEvents.LOADING_COMPLETE);
  }

  private setupEventListeners(): void {
    // Player died
    this.eventBus.on(GameEvents.PLAYER_DIED, () => {
      this.state = GameState.GAME_OVER;
      this.gameOverScreen.setScore(this.score);
      this.gameOverScreen.show(this.score);
    });

    // Enemy killed - add score
    this.eventBus.on(GameEvents.ENEMY_KILLED, (points: number) => {
      this.score += points;
      this.updateDifficulty();
    });

    // Score changed
    this.eventBus.on(GameEvents.SCORE_CHANGED, (newScore: number) => {
      this.score = newScore;
    });
  }

  private spawnInitialEnemies(): void {
    for (let i = 0; i < 5; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    if (this.enemies.length >= this.maxEnemies) return;

    const validPositions = this.mapBuilder.getValidSpawnPositions();
    if (validPositions.length === 0) return;

    // Find position away from player
    let spawnPos: Vector3 | null = null;
    let attempts = 0;

    while (attempts < 20) {
      const randomPos = validPositions[Math.floor(Math.random() * validPositions.length)];
      const distToPlayer = MathUtils.distanceXZ(randomPos, this.player.position);

      if (distToPlayer > GAME_CONFIG.SPAWN_DISTANCE_FROM_PLAYER) {
        spawnPos = randomPos.clone();
        break;
      }
      attempts++;
    }

    if (!spawnPos) {
      spawnPos = MathUtils.randomPointInRing(
        this.player.position,
        GAME_CONFIG.SPAWN_DISTANCE_FROM_PLAYER,
        GAME_CONFIG.SPAWN_DISTANCE_FROM_PLAYER * 2
      );
    }

    const enemy = new Enemy(this.scene, spawnPos);
    enemy.setTarget(this.player);
    this.enemies.push(enemy);

    this.eventBus.emit(GameEvents.ENEMY_SPAWNED, enemy);
  }

  private spawnPickups(): void {
    const spawnPositions = [
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

    for (const pos of spawnPositions) {
      const worldPos = MathUtils.tileToWorld(pos.x, pos.y, GAME_CONFIG.TILE_SIZE);

      if (this.mapBuilder.isWalkable(worldPos)) {
        // Randomly choose pickup type
        const rand = Math.random();
        let pickup: Pickup;

        if (rand < 0.6) {
          pickup = new Ammo(this.scene, worldPos);
        } else if (rand < 0.85) {
          pickup = new Health(this.scene, worldPos);
        } else {
          pickup = new Armor(this.scene, worldPos, Math.random() < 0.3 ? 'red' : 'blue');
        }

        this.pickups.push(pickup);
      }
    }
  }

  private updateDifficulty(): void {
    const newLevel = Math.floor(this.score / GAME_CONFIG.DIFFICULTY_SCORE_INTERVAL);

    if (newLevel !== this.difficultyLevel) {
      this.difficultyLevel = newLevel;

      // Update max enemies
      this.maxEnemies = Math.min(
        GAME_CONFIG.BASE_MAX_ENEMIES + this.difficultyLevel * GAME_CONFIG.ENEMIES_PER_DIFFICULTY,
        GAME_CONFIG.MAX_ENEMIES_CAP
      );

      // Update spawn delay
      this.spawnDelay = Math.max(
        GAME_CONFIG.BASE_SPAWN_DELAY - this.difficultyLevel * GAME_CONFIG.SPAWN_DELAY_REDUCTION,
        GAME_CONFIG.MIN_SPAWN_DELAY
      );

      this.eventBus.emit(GameEvents.DIFFICULTY_CHANGED, this.difficultyLevel);
    }
  }

  update(): void {
    if (this.state !== GameState.PLAYING) return;

    const deltaTime = this.engine.getDeltaTime() / 1000;

    // Update player
    this.player.update(deltaTime);

    // Update camera
    this.camera.update(deltaTime);

    // Update enemies
    this.updateEnemies(deltaTime);

    // Update pickups
    this.updatePickups(deltaTime);

    // Check bullet-enemy collisions
    this.checkBulletCollisions();

    // Spawn timer
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnDelay) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Clear input state for next frame
    this.inputManager.update();
  }

  private updateEnemies(deltaTime: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.isActive) {
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(deltaTime);
    }
  }

  private updatePickups(deltaTime: number): void {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];

      if (!pickup.isActive) {
        this.pickups.splice(i, 1);
        continue;
      }

      const collected = pickup.update(deltaTime, this.player);
      if (collected) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private checkBulletCollisions(): void {
    const gun = this.player.getWeaponManager().getGun();
    if (!gun) return;

    const bullets = gun.getActiveBullets();

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      // Check against each enemy
      for (const enemy of this.enemies) {
        if (!enemy.isActive) continue;

        const distance = MathUtils.distanceXZ(bullet.mesh.position, enemy.position);

        if (distance < 1) {
          // Hit!
          gun.handleBulletHit(bullet, enemy.position);
          enemy.takeDamage(gun.getDamage());
          break;
        }
      }
    }
  }

  private restart(): void {
    // Reset score
    this.score = 0;
    this.difficultyLevel = 0;
    this.spawnDelay = GAME_CONFIG.BASE_SPAWN_DELAY;
    this.maxEnemies = GAME_CONFIG.BASE_MAX_ENEMIES;

    // Clear enemies
    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    this.enemies = [];

    // Clear pickups
    for (const pickup of this.pickups) {
      pickup.dispose();
    }
    this.pickups = [];

    // Reset player
    const spawnPos = this.mapBuilder.getPlayerSpawnPosition();
    this.player.setPosition(spawnPos);
    this.player.resetStats();

    // Respawn
    this.spawnInitialEnemies();
    this.spawnPickups();

    // Reset HUD
    this.hud.setScore(0);

    // Resume game
    this.state = GameState.PLAYING;
  }

  getScene(): Scene {
    return this.scene;
  }

  dispose(): void {
    this.player.dispose();
    this.enemies.forEach((e) => e.dispose());
    this.pickups.forEach((p) => p.dispose());
    this.mapBuilder.dispose();
    this.camera.dispose();
    this.lightingManager.dispose();
    this.hud.dispose();
    MaterialLibrary.dispose();
    this.scene.dispose();
  }
}
