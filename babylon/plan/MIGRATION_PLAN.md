# Babylon.js 3D Migration Plan

## Executive Summary

This document outlines the complete migration strategy for converting the current Phaser 3 isometric 2D RPG shooter into a full 3D game using Babylon.js. The migration transforms the pseudo-3D isometric view into true 3D space while preserving all gameplay mechanics, features, and the portfolio showcase functionality.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Target Architecture Design](#2-target-architecture-design)
3. [Technology Stack](#3-technology-stack)
4. [Migration Phases](#4-migration-phases)
5. [Detailed Component Migration](#5-detailed-component-migration)
6. [3D Asset Strategy](#6-3d-asset-strategy)
7. [Physics & Collision System](#7-physics--collision-system)
8. [Camera System](#8-camera-system)
9. [Lighting & Materials](#9-lighting--materials)
10. [Animation System](#10-animation-system)
11. [UI/HUD Migration](#11-uihud-migration)
12. [Performance Considerations](#12-performance-considerations)
13. [Testing Strategy](#13-testing-strategy)
14. [Risk Assessment](#14-risk-assessment)
15. [File Structure](#15-file-structure)
16. [Implementation Checklist](#16-implementation-checklist)

---

## 1. Current Architecture Analysis

### 1.1 Existing Technology Stack
- **Framework**: Phaser 3.70.0
- **Language**: TypeScript 5.9.3
- **Bundler**: Vite 7.3.0
- **Physics**: Phaser Arcade Physics (2D, no gravity)
- **Rendering**: 2D isometric projection (64x32 tiles)

### 1.2 Current Scene Structure
```
BootScene       → Asset generation (procedural sprites)
CityScene       → Main 40x40 overworld map
BuildingScene   → 12x10 interior spaces
UIScene         → Persistent HUD overlay
ConversationScene → Wizard dialogue system
```

### 1.3 Core Systems to Migrate
| System | Current Implementation | Migration Complexity |
|--------|----------------------|---------------------|
| Map Rendering | 2D tile array with isometric projection | High |
| Player Entity | Phaser.Physics.Arcade.Sprite with 8-direction sprites | High |
| Enemy AI | Detection/chase/attack with wander behavior | Medium |
| Weapon System | Strategy pattern (Gun/Sword) | Medium |
| Collision | Arcade Physics overlap/collider | High |
| Camera | Phaser camera with follow | Medium |
| UI/HUD | Phaser DOM elements | Medium |
| Events | Phaser event emitter | Low |
| Particles | Phaser particles | Medium |

### 1.4 Current Coordinate System
```typescript
// Isometric projection formulas (to be replaced with 3D)
cartToIso(x, y) → { x: (x-y)*32, y: (x+y)*16 }
isoToCart(x, y) → { x: (x/32+y/16)/2, y: (y/16-x/32)/2 }
```

---

## 2. Target Architecture Design

### 2.1 Babylon.js Architecture
```
src/
├── main.ts                    # Babylon Engine & Scene initialization
├── core/
│   ├── Game.ts               # Main game controller
│   ├── SceneManager.ts       # Scene transitions
│   └── EventBus.ts           # Global event system
├── scenes/
│   ├── LoadingScene.ts       # Asset loading
│   ├── CityScene.ts          # 3D city environment
│   ├── BuildingScene.ts      # 3D building interiors
│   └── UIScene.ts            # Babylon GUI overlay
├── entities/
│   ├── Player.ts             # 3D player with animations
│   ├── Enemy.ts              # 3D enemy with AI
│   ├── Wizard.ts             # NPC with dialogue
│   ├── Pickup.ts             # Base pickup class
│   ├── Ammo.ts               # Ammo pickup
│   ├── Health.ts             # Health pickup
│   └── Armor.ts              # Armor pickup
├── weapons/
│   ├── IWeapon.ts            # Weapon interface
│   ├── WeaponManager.ts      # Weapon inventory
│   ├── Gun.ts                # Ranged weapon (3D projectiles)
│   └── Sword.ts              # Melee weapon (3D swing)
├── world/
│   ├── MapBuilder.ts         # 3D city/building generator
│   ├── TileTypes.ts          # 3D tile definitions
│   └── Door.ts               # Door interaction
├── systems/
│   ├── InputManager.ts       # Keyboard/mouse handling
│   ├── CollisionManager.ts   # Physics collision setup
│   ├── DifficultyManager.ts  # Score-based scaling
│   └── ParticleManager.ts    # 3D particle effects
├── cameras/
│   ├── GameCamera.ts         # Isometric-style 3D camera
│   └── CameraController.ts   # Camera follow/zoom
├── ui/
│   ├── HUD.ts                # Health/ammo/score display
│   ├── GameOverScreen.ts     # Game over overlay
│   └── DialogueBox.ts        # Conversation UI
├── assets/
│   ├── models/               # GLTF/GLB 3D models
│   ├── textures/             # Material textures
│   └── audio/                # Sound effects (future)
└── utils/
    ├── MathUtils.ts          # 3D math helpers
    └── Constants.ts          # Game constants
```

### 2.2 3D World Layout
```
Y (up)
│
│    Z (depth/forward)
│   /
│  /
│ /
└────────── X (right)

City: 40x40 units on XZ plane
Building: 12x10 units on XZ plane
Tile size: 1x1 unit (scalable)
```

### 2.3 Camera Configuration (Isometric-style 3D)
- **Type**: ArcRotateCamera or UniversalCamera
- **Angle**: 45° azimuth, 35.264° elevation (true isometric)
- **Mode**: Orthographic (for classic isometric feel) or Perspective
- **Follow**: Smooth lerp following player

---

## 3. Technology Stack

### 3.1 Core Dependencies
```json
{
  "dependencies": {
    "@babylonjs/core": "^7.x",
    "@babylonjs/gui": "^7.x",
    "@babylonjs/loaders": "^7.x",
    "@babylonjs/materials": "^7.x",
    "@babylonjs/havok": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vite": "^7.3.0"
  }
}
```

### 3.2 Physics Engine Options
| Option | Pros | Cons |
|--------|------|------|
| Havok (Recommended) | Official, performant, full features | Requires WASM loading |
| Cannon.js | Lightweight, easy setup | Less features |
| Oimo.js | Fast, simple | Limited collision shapes |
| Custom | Full control | Development time |

**Recommendation**: Use Havok for production-quality physics.

---

## 4. Migration Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Babylon.js project structure
- [ ] Configure Vite for Babylon.js
- [ ] Create basic scene with engine initialization
- [ ] Implement scene manager for transitions
- [ ] Set up isometric-style camera
- [ ] Create basic ground plane and test cube

### Phase 2: World Building (Week 2)
- [ ] Create MapBuilder for 3D tile placement
- [ ] Build 3D tile assets (ground, road, building, water, fence)
- [ ] Implement city map rendering in 3D
- [ ] Add building interiors
- [ ] Create door system with transitions
- [ ] Implement transparency/culling for buildings

### Phase 3: Player & Controls (Week 3)
- [ ] Create 3D player model (or placeholder)
- [ ] Implement WASD/arrow key movement in 3D
- [ ] Add player rotation to face movement direction
- [ ] Set up camera follow system
- [ ] Implement world bounds collision
- [ ] Add player state management

### Phase 4: Weapon System (Week 4)
- [ ] Port IWeapon interface to Babylon.js
- [ ] Implement Gun with 3D projectiles
- [ ] Create bullet physics and pooling
- [ ] Implement Sword with 3D swing animation
- [ ] Add melee detection with ray/sphere casting
- [ ] Port WeaponManager
- [ ] Add weapon switching (1, 2, scroll)

### Phase 5: Enemy System (Week 5)
- [ ] Create 3D enemy model (or placeholder)
- [ ] Port enemy AI (detection, chase, attack, wander)
- [ ] Implement enemy spawning system
- [ ] Add enemy-player collision
- [ ] Create death animations and particles
- [ ] Implement difficulty scaling

### Phase 6: Pickups & Interactions (Week 6)
- [ ] Create 3D pickup models (ammo, health, armor)
- [ ] Implement pickup spawn system
- [ ] Add player-pickup collision detection
- [ ] Port Wizard NPC with dialogue
- [ ] Implement door interactions

### Phase 7: UI & HUD (Week 7)
- [ ] Set up Babylon.GUI for HUD
- [ ] Create health bar with armor overlay
- [ ] Implement ammo counter
- [ ] Add weapon indicator icons
- [ ] Create score display
- [ ] Build game over screen
- [ ] Port dialogue/conversation UI

### Phase 8: Polish & Effects (Week 8)
- [ ] Add 3D particle effects (muzzle flash, explosions)
- [ ] Implement lighting (ambient, directional)
- [ ] Add shadows
- [ ] Create material shaders
- [ ] Add post-processing effects
- [ ] Optimize performance
- [ ] Add sound effects (optional)

### Phase 9: Testing & Refinement (Week 9)
- [ ] Full gameplay testing
- [ ] Performance profiling
- [ ] Bug fixing
- [ ] Balance adjustments
- [ ] Cross-browser testing

---

## 5. Detailed Component Migration

### 5.1 Game Initialization

**Current (Phaser):**
```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene: [BootScene, CityScene, BuildingScene, UIScene],
};
new Phaser.Game(config);
```

**Target (Babylon.js):**
```typescript
// main.ts
import { Engine, Scene, HavokPlugin } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

async function initGame() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const engine = new Engine(canvas, true);

  // Initialize physics
  const havok = await HavokPhysics();
  const physicsPlugin = new HavokPlugin(true, havok);

  // Create main scene
  const scene = new Scene(engine);
  scene.enablePhysics(new Vector3(0, 0, 0), physicsPlugin);

  // Initialize game systems
  const game = new Game(engine, scene);
  await game.initialize();

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Resize handler
  window.addEventListener('resize', () => engine.resize());
}

initGame();
```

### 5.2 Scene Management

**Current (Phaser):**
```typescript
this.scene.start('BuildingScene', { buildingId, playerHealth, playerAmmo });
```

**Target (Babylon.js):**
```typescript
// core/SceneManager.ts
export class SceneManager {
  private engine: Engine;
  private currentScene: Scene | null = null;
  private scenes: Map<string, () => Promise<Scene>> = new Map();

  async switchScene(sceneName: string, data?: any): Promise<void> {
    // Dispose current scene
    if (this.currentScene) {
      this.currentScene.dispose();
    }

    // Create and load new scene
    const createScene = this.scenes.get(sceneName);
    if (createScene) {
      this.currentScene = await createScene();
      if (data) {
        (this.currentScene as any).initData = data;
      }
    }
  }
}
```

### 5.3 Player Entity

**Current (Phaser):**
```typescript
export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 150;
  // 8 direction textures, arcade physics body
}
```

**Target (Babylon.js):**
```typescript
// entities/Player.ts
import {
  Mesh, Scene, Vector3, PhysicsAggregate,
  PhysicsShapeType, ActionManager, ExecuteCodeAction
} from '@babylonjs/core';

export class Player {
  private mesh: Mesh;
  private scene: Scene;
  private physicsBody: PhysicsAggregate;
  private speed: number = 5; // Units per second
  private health: number = 100;
  private velocity: Vector3 = Vector3.Zero();
  private weaponManager: WeaponManager;

  constructor(scene: Scene, position: Vector3) {
    this.scene = scene;
    this.createMesh(position);
    this.setupPhysics();
    this.setupInput();
    this.weaponManager = new WeaponManager(scene);
  }

  private createMesh(position: Vector3): void {
    // Option 1: Primitive placeholder
    this.mesh = MeshBuilder.CreateCapsule('player', {
      height: 1.8,
      radius: 0.3
    }, this.scene);

    // Option 2: Load GLTF model
    // const result = await SceneLoader.ImportMeshAsync(
    //   '', 'assets/models/', 'player.glb', this.scene
    // );
    // this.mesh = result.meshes[0] as Mesh;

    this.mesh.position = position;
  }

  private setupPhysics(): void {
    this.physicsBody = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.CAPSULE,
      { mass: 1, restitution: 0, friction: 0.5 },
      this.scene
    );
    // Lock rotation to prevent tipping
    this.physicsBody.body.setAngularVelocity(Vector3.Zero());
    this.physicsBody.body.disablePreStep = false;
  }

  update(deltaTime: number): void {
    this.handleMovement(deltaTime);
    this.handleAttack();
    this.updateRotation();
  }

  private handleMovement(deltaTime: number): void {
    const input = InputManager.getInstance();
    const moveDir = new Vector3(
      (input.isKeyDown('D') ? 1 : 0) - (input.isKeyDown('A') ? 1 : 0),
      0,
      (input.isKeyDown('W') ? 1 : 0) - (input.isKeyDown('S') ? 1 : 0)
    );

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.velocity = moveDir.scale(this.speed);
      this.physicsBody.body.setLinearVelocity(this.velocity);
    } else {
      this.physicsBody.body.setLinearVelocity(Vector3.Zero());
    }
  }

  get position(): Vector3 {
    return this.mesh.position;
  }
}
```

### 5.4 Enemy AI

**Current (Phaser):**
```typescript
// Detection range: 300px, attack range: 30px, wander behavior
```

**Target (Babylon.js):**
```typescript
// entities/Enemy.ts
export class Enemy {
  private mesh: Mesh;
  private target: Player | null = null;
  private state: 'idle' | 'wander' | 'chase' | 'attack' = 'idle';
  private detectionRange: number = 15; // 3D units
  private attackRange: number = 1.5;
  private speed: number = 3;
  private wanderTarget: Vector3 | null = null;
  private wanderTimer: number = 0;

  update(deltaTime: number): void {
    if (!this.target) return;

    const distance = Vector3.Distance(
      this.mesh.position,
      this.target.position
    );

    if (distance < this.detectionRange) {
      if (distance < this.attackRange) {
        this.attack();
      } else {
        this.chase(deltaTime);
      }
    } else {
      this.wander(deltaTime);
    }
  }

  private chase(deltaTime: number): void {
    const direction = this.target!.position
      .subtract(this.mesh.position)
      .normalize();
    direction.y = 0; // Keep on ground

    this.mesh.position.addInPlace(
      direction.scale(this.speed * 1.5 * deltaTime)
    );
    this.lookAt(this.target!.position);
  }

  private wander(deltaTime: number): void {
    // Random wander behavior
    if (!this.wanderTarget || this.wanderTimer <= 0) {
      this.wanderTarget = this.mesh.position.add(
        new Vector3(
          Math.random() * 6 - 3,
          0,
          Math.random() * 6 - 3
        )
      );
      this.wanderTimer = 2 + Math.random() * 2;
    }

    this.wanderTimer -= deltaTime;

    const direction = this.wanderTarget
      .subtract(this.mesh.position)
      .normalize();
    direction.y = 0;

    this.mesh.position.addInPlace(
      direction.scale(this.speed * deltaTime)
    );
  }
}
```

### 5.5 Weapon System (Gun)

**Target (Babylon.js):**
```typescript
// weapons/Gun.ts
export class Gun implements IWeapon {
  private scene: Scene;
  private bulletPool: Mesh[] = [];
  private activeBullets: Set<Mesh> = new Set();
  private ammo: number = 30;
  private damage: number = 20;
  private cooldown: number = 0;
  private cooldownTime: number = 0.2; // seconds

  constructor(scene: Scene) {
    this.scene = scene;
    this.createBulletPool(50);
  }

  private createBulletPool(count: number): void {
    for (let i = 0; i < count; i++) {
      const bullet = MeshBuilder.CreateSphere(
        `bullet_${i}`,
        { diameter: 0.1 },
        this.scene
      );
      bullet.setEnabled(false);

      // Add physics
      new PhysicsAggregate(
        bullet,
        PhysicsShapeType.SPHERE,
        { mass: 0.1, restitution: 0 },
        this.scene
      );

      this.bulletPool.push(bullet);
    }
  }

  attack(player: Player, targetPoint: Vector3): void {
    if (this.ammo <= 0 || this.cooldown > 0) return;

    const bullet = this.getPooledBullet();
    if (!bullet) return;

    // Position at player
    bullet.position = player.position.clone();
    bullet.position.y += 0.8; // Gun height
    bullet.setEnabled(true);

    // Calculate direction
    const direction = targetPoint
      .subtract(bullet.position)
      .normalize();

    // Apply velocity
    const physicsBody = bullet.physicsBody;
    if (physicsBody) {
      physicsBody.setLinearVelocity(direction.scale(40));
    }

    // Emit muzzle flash particles
    this.createMuzzleFlash(bullet.position, direction);

    this.ammo--;
    this.cooldown = this.cooldownTime;
    this.activeBullets.add(bullet);

    // Auto-deactivate after 2 seconds
    setTimeout(() => this.deactivateBullet(bullet), 2000);
  }

  private createMuzzleFlash(position: Vector3, direction: Vector3): void {
    const particleSystem = new ParticleSystem('muzzle', 20, this.scene);
    particleSystem.emitter = position.add(direction.scale(0.2));
    particleSystem.minLifeTime = 0.05;
    particleSystem.maxLifeTime = 0.1;
    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;
    particleSystem.color1 = new Color4(1, 1, 0, 1);
    particleSystem.color2 = new Color4(1, 0.5, 0, 1);
    particleSystem.start();
    setTimeout(() => particleSystem.dispose(), 100);
  }
}
```

### 5.6 Weapon System (Sword)

**Target (Babylon.js):**
```typescript
// weapons/Sword.ts
export class Sword implements IWeapon {
  private scene: Scene;
  private damage: number = 35;
  private range: number = 2.5;
  private arcAngle: number = Math.PI / 2; // 90 degrees
  private cooldown: number = 0;
  private cooldownTime: number = 0.4;
  private swingMesh: Mesh | null = null;

  attack(player: Player, targetPoint: Vector3): void {
    if (this.cooldown > 0) return;

    // Calculate swing direction
    const direction = targetPoint
      .subtract(player.position)
      .normalize();
    direction.y = 0;

    const aimAngle = Math.atan2(direction.z, direction.x);

    // Create visual swing effect
    this.createSwingArc(player.position, aimAngle);

    // Detect enemies in arc using raycasting or sphere overlap
    this.detectAndDamageEnemies(player.position, aimAngle);

    this.cooldown = this.cooldownTime;
  }

  private detectAndDamageEnemies(origin: Vector3, aimAngle: number): void {
    const enemies = EnemyManager.getInstance().getEnemies();
    const hitEnemies: Enemy[] = [];

    for (const enemy of enemies) {
      if (!enemy.isActive()) continue;

      const distance = Vector3.Distance(origin, enemy.position);
      if (distance > this.range) continue;

      // Angle check
      const toEnemy = enemy.position.subtract(origin).normalize();
      const enemyAngle = Math.atan2(toEnemy.z, toEnemy.x);
      let angleDiff = enemyAngle - aimAngle;

      // Normalize angle difference
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) <= this.arcAngle / 2) {
        hitEnemies.push(enemy);
      }
    }

    // Apply damage
    for (const enemy of hitEnemies) {
      enemy.takeDamage(this.damage);
      this.createHitEffect(enemy.position);
    }
  }

  private createSwingArc(origin: Vector3, angle: number): void {
    // Create arc mesh for visual feedback
    const arc = MeshBuilder.CreateTorus('swingArc', {
      diameter: this.range * 2,
      thickness: 0.1,
      arc: this.arcAngle / (Math.PI * 2)
    }, this.scene);

    arc.position = origin.clone();
    arc.position.y += 0.8;
    arc.rotation.y = angle - this.arcAngle / 2;

    // Fade out animation
    const animation = new Animation(
      'fadeOut', 'visibility', 60,
      Animation.ANIMATIONTYPE_FLOAT
    );
    animation.setKeys([
      { frame: 0, value: 1 },
      { frame: 12, value: 0 }
    ]);
    arc.animations = [animation];

    this.scene.beginAnimation(arc, 0, 12, false, 1, () => {
      arc.dispose();
    });
  }
}
```

---

## 6. 3D Asset Strategy

### 6.1 Asset Options

| Approach | Pros | Cons |
|----------|------|------|
| Procedural Generation | No external assets, consistent style | Complex, limited detail |
| Low-poly GLTF Models | Professional look, animations | File size, loading time |
| Voxel-style | Retro charm, easy to create | Less detail |
| Hybrid | Best of both | More development time |

### 6.2 Procedural Tile Generation (Recommended for MVP)

```typescript
// world/TileFactory.ts
export class TileFactory {
  static createGroundTile(scene: Scene): Mesh {
    const ground = MeshBuilder.CreateBox('ground', {
      width: 1, height: 0.1, depth: 1
    }, scene);

    const material = new StandardMaterial('groundMat', scene);
    material.diffuseColor = new Color3(0.2, 0.5, 0.2);
    ground.material = material;

    return ground;
  }

  static createBuildingTile(scene: Scene): Mesh {
    // Create building block
    const building = MeshBuilder.CreateBox('building', {
      width: 1, height: 2.5, depth: 1
    }, scene);

    const material = new StandardMaterial('buildingMat', scene);
    material.diffuseColor = new Color3(0.4, 0.35, 0.35);
    building.material = material;

    // Add roof
    const roof = MeshBuilder.CreateBox('roof', {
      width: 1.1, height: 0.2, depth: 1.1
    }, scene);
    roof.position.y = 1.35;
    roof.parent = building;

    return building;
  }

  static createRoadTile(scene: Scene): Mesh {
    const road = MeshBuilder.CreateBox('road', {
      width: 1, height: 0.05, depth: 1
    }, scene);

    const material = new StandardMaterial('roadMat', scene);
    material.diffuseColor = new Color3(0.3, 0.3, 0.35);
    road.material = material;

    return road;
  }

  static createWaterTile(scene: Scene): Mesh {
    const water = MeshBuilder.CreateGround('water', {
      width: 1, height: 1
    }, scene);

    const material = new WaterMaterial('waterMat', scene);
    material.windForce = -5;
    material.waveHeight = 0.1;
    water.material = material;

    return water;
  }

  static createFenceTile(scene: Scene): Mesh {
    const fence = MeshBuilder.CreateBox('fence', {
      width: 1, height: 0.8, depth: 0.1
    }, scene);

    const material = new StandardMaterial('fenceMat', scene);
    material.diffuseColor = new Color3(0.4, 0.3, 0.2);
    fence.material = material;

    return fence;
  }
}
```

### 6.3 Model Loading (For Polish Phase)

```typescript
// assets/AssetLoader.ts
export class AssetLoader {
  private static meshCache: Map<string, Mesh> = new Map();

  static async loadModel(
    scene: Scene,
    fileName: string
  ): Promise<Mesh> {
    if (this.meshCache.has(fileName)) {
      return this.meshCache.get(fileName)!.clone(fileName + '_clone');
    }

    const result = await SceneLoader.ImportMeshAsync(
      '',
      'assets/models/',
      fileName,
      scene
    );

    const mesh = result.meshes[0] as Mesh;
    this.meshCache.set(fileName, mesh);

    return mesh;
  }
}
```

---

## 7. Physics & Collision System

### 7.1 Havok Physics Setup

```typescript
// core/PhysicsManager.ts
import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';

export class PhysicsManager {
  private static instance: PhysicsManager;
  private plugin: HavokPlugin | null = null;

  static async initialize(scene: Scene): Promise<PhysicsManager> {
    if (!this.instance) {
      this.instance = new PhysicsManager();
      await this.instance.setup(scene);
    }
    return this.instance;
  }

  private async setup(scene: Scene): Promise<void> {
    const havok = await HavokPhysics();
    this.plugin = new HavokPlugin(true, havok);
    scene.enablePhysics(new Vector3(0, -9.81, 0), this.plugin);
  }

  createCharacterBody(mesh: Mesh, scene: Scene): PhysicsAggregate {
    return new PhysicsAggregate(
      mesh,
      PhysicsShapeType.CAPSULE,
      {
        mass: 1,
        restitution: 0,
        friction: 0.5
      },
      scene
    );
  }

  createStaticBody(mesh: Mesh, scene: Scene): PhysicsAggregate {
    return new PhysicsAggregate(
      mesh,
      PhysicsShapeType.BOX,
      { mass: 0 },
      scene
    );
  }

  createBulletBody(mesh: Mesh, scene: Scene): PhysicsAggregate {
    return new PhysicsAggregate(
      mesh,
      PhysicsShapeType.SPHERE,
      {
        mass: 0.1,
        restitution: 0.2
      },
      scene
    );
  }
}
```

### 7.2 Collision Detection

```typescript
// systems/CollisionManager.ts
export class CollisionManager {
  private scene: Scene;

  setupCollisions(
    player: Player,
    enemies: Enemy[],
    buildings: Mesh[]
  ): void {
    // Bullet-Enemy collision using observables
    player.onBulletFired.add((bullet) => {
      bullet.physicsBody.body.onCollide = (collider) => {
        const enemy = this.findEnemyByMesh(collider.mesh);
        if (enemy && !enemy.isDying) {
          this.handleBulletHit(bullet, enemy);
        }
      };
    });

    // Alternatively, use action manager for trigger zones
    for (const enemy of enemies) {
      enemy.mesh.actionManager = new ActionManager(this.scene);
      enemy.mesh.actionManager.registerAction(
        new ExecuteCodeAction(
          {
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: player.mesh
          },
          () => {
            if (!enemy.isDying) {
              enemy.onPlayerContact(player);
            }
          }
        )
      );
    }
  }

  private handleBulletHit(bullet: Mesh, enemy: Enemy): void {
    // Deactivate bullet
    bullet.setEnabled(false);
    bullet.physicsBody?.dispose();

    // Create hit effect
    this.createHitParticles(bullet.position);

    // Damage enemy
    enemy.takeDamage(20);
  }
}
```

---

## 8. Camera System

### 8.1 Isometric-Style 3D Camera

```typescript
// cameras/GameCamera.ts
import {
  ArcRotateCamera, Vector3, Scene,
  Animation, EasingFunction, QuadraticEase
} from '@babylonjs/core';

export class GameCamera {
  private camera: ArcRotateCamera;
  private target: TransformNode | null = null;
  private followSpeed: number = 0.1;
  private isometricAngle = {
    alpha: Math.PI / 4,       // 45° horizontal rotation
    beta: Math.PI / 3.5,      // ~51° from vertical (isometric look)
    radius: 25                // Distance from target
  };

  constructor(scene: Scene) {
    this.camera = new ArcRotateCamera(
      'gameCamera',
      this.isometricAngle.alpha,
      this.isometricAngle.beta,
      this.isometricAngle.radius,
      Vector3.Zero(),
      scene
    );

    // Lock camera rotation (user can't rotate)
    this.camera.lowerAlphaLimit = this.isometricAngle.alpha;
    this.camera.upperAlphaLimit = this.isometricAngle.alpha;
    this.camera.lowerBetaLimit = this.isometricAngle.beta;
    this.camera.upperBetaLimit = this.isometricAngle.beta;

    // Optional: Use orthographic projection for true isometric
    // this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    // this.camera.orthoTop = 15;
    // this.camera.orthoBottom = -15;
    // this.camera.orthoLeft = -20;
    // this.camera.orthoRight = 20;

    // Allow zoom with mouse wheel
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 40;
    this.camera.wheelPrecision = 50;
  }

  setTarget(target: TransformNode): void {
    this.target = target;
  }

  update(): void {
    if (!this.target) return;

    // Smooth follow
    const targetPos = this.target.position;
    const currentPos = this.camera.target;

    this.camera.target = Vector3.Lerp(
      currentPos,
      targetPos,
      this.followSpeed
    );
  }

  zoomTo(level: number, duration: number = 500): void {
    const animation = new Animation(
      'zoomAnim',
      'radius',
      60,
      Animation.ANIMATIONTYPE_FLOAT
    );

    const ease = new QuadraticEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(ease);

    animation.setKeys([
      { frame: 0, value: this.camera.radius },
      { frame: 60 * (duration / 1000), value: level }
    ]);

    this.camera.animations = [animation];
    this.camera.getScene().beginAnimation(this.camera, 0, 60, false);
  }
}
```

### 8.2 Building Transparency System

```typescript
// cameras/OcclusionManager.ts
export class OcclusionManager {
  private buildings: Mesh[] = [];
  private player: TransformNode;
  private camera: Camera;

  update(): void {
    for (const building of this.buildings) {
      // Cast ray from camera to player
      const ray = new Ray(
        this.camera.position,
        this.player.position.subtract(this.camera.position).normalize(),
        Vector3.Distance(this.camera.position, this.player.position)
      );

      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return mesh === building;
      });

      // Fade building if it's between camera and player
      if (hit?.pickedMesh === building) {
        this.fadeBuilding(building, 0.3);
      } else {
        this.fadeBuilding(building, 1.0);
      }
    }
  }

  private fadeBuilding(building: Mesh, targetAlpha: number): void {
    const material = building.material as StandardMaterial;
    if (!material) return;

    material.alpha = Scalar.Lerp(material.alpha, targetAlpha, 0.1);

    if (targetAlpha < 1) {
      material.transparencyMode = Material.MATERIAL_ALPHABLEND;
      building.visibility = material.alpha;
    }
  }
}
```

---

## 9. Lighting & Materials

### 9.1 Scene Lighting

```typescript
// world/LightingManager.ts
export class LightingManager {
  private ambientLight: HemisphericLight;
  private sunLight: DirectionalLight;
  private shadowGenerator: ShadowGenerator;

  constructor(scene: Scene) {
    // Ambient light from above
    this.ambientLight = new HemisphericLight(
      'ambient',
      new Vector3(0, 1, 0),
      scene
    );
    this.ambientLight.intensity = 0.6;
    this.ambientLight.groundColor = new Color3(0.2, 0.2, 0.25);

    // Directional sun light with shadows
    this.sunLight = new DirectionalLight(
      'sun',
      new Vector3(-1, -2, -1).normalize(),
      scene
    );
    this.sunLight.intensity = 0.8;
    this.sunLight.position = new Vector3(20, 40, 20);

    // Shadow generator
    this.shadowGenerator = new ShadowGenerator(1024, this.sunLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;
  }

  addShadowCaster(mesh: Mesh): void {
    this.shadowGenerator.addShadowCaster(mesh);
  }

  enableShadowReceiver(mesh: Mesh): void {
    mesh.receiveShadows = true;
  }

  setTimeOfDay(hour: number): void {
    // 0-24 hour cycle affecting light color/intensity
    const dayProgress = hour / 24;

    if (hour >= 6 && hour < 18) {
      // Daytime
      this.sunLight.intensity = 0.8;
      this.sunLight.diffuse = new Color3(1, 0.95, 0.9);
    } else {
      // Night time
      this.sunLight.intensity = 0.2;
      this.sunLight.diffuse = new Color3(0.5, 0.5, 0.7);
      this.ambientLight.intensity = 0.3;
    }
  }
}
```

### 9.2 Material Library

```typescript
// world/MaterialLibrary.ts
export class MaterialLibrary {
  private static materials: Map<string, Material> = new Map();

  static initialize(scene: Scene): void {
    // Ground material
    const ground = new StandardMaterial('mat_ground', scene);
    ground.diffuseColor = new Color3(0.25, 0.5, 0.25);
    ground.specularColor = Color3.Black();
    this.materials.set('ground', ground);

    // Road material
    const road = new StandardMaterial('mat_road', scene);
    road.diffuseColor = new Color3(0.35, 0.35, 0.4);
    road.specularColor = new Color3(0.1, 0.1, 0.1);
    this.materials.set('road', road);

    // Building material with texture
    const building = new StandardMaterial('mat_building', scene);
    building.diffuseColor = new Color3(0.5, 0.45, 0.4);
    building.specularColor = new Color3(0.1, 0.1, 0.1);
    // building.diffuseTexture = new Texture('assets/textures/brick.jpg', scene);
    this.materials.set('building', building);

    // Water material
    const water = new WaterMaterial('mat_water', scene);
    water.windForce = -5;
    water.waveHeight = 0.05;
    water.waterColor = new Color3(0.1, 0.3, 0.5);
    this.materials.set('water', water);

    // Enemy material (glowing)
    const enemy = new StandardMaterial('mat_enemy', scene);
    enemy.diffuseColor = new Color3(0.3, 0.7, 0.3);
    enemy.emissiveColor = new Color3(0.1, 0.3, 0.1);
    this.materials.set('enemy', enemy);

    // Bullet material (emissive)
    const bullet = new StandardMaterial('mat_bullet', scene);
    bullet.emissiveColor = new Color3(1, 0.8, 0);
    this.materials.set('bullet', bullet);
  }

  static get(name: string): Material | undefined {
    return this.materials.get(name);
  }
}
```

---

## 10. Animation System

### 10.1 Character Animations

```typescript
// animations/AnimationController.ts
export class AnimationController {
  private mesh: Mesh;
  private scene: Scene;
  private currentAnim: AnimationGroup | null = null;
  private animations: Map<string, AnimationGroup> = new Map();

  constructor(mesh: Mesh, scene: Scene) {
    this.mesh = mesh;
    this.scene = scene;
  }

  // For procedural meshes
  createWalkAnimation(): void {
    const walkAnim = new Animation(
      'walk',
      'position.y',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    walkAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 5, value: 0.05 },
      { frame: 10, value: 0 }
    ]);

    const animGroup = new AnimationGroup('walkGroup', this.scene);
    animGroup.addTargetedAnimation(walkAnim, this.mesh);
    this.animations.set('walk', animGroup);
  }

  createDeathAnimation(): Animation[] {
    const scaleAnim = new Animation(
      'deathScale',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3
    );
    scaleAnim.setKeys([
      { frame: 0, value: this.mesh.scaling.clone() },
      { frame: 20, value: new Vector3(0.3, 0.3, 0.3) }
    ]);

    const rotateAnim = new Animation(
      'deathRotate',
      'rotation.y',
      60,
      Animation.ANIMATIONTYPE_FLOAT
    );
    rotateAnim.setKeys([
      { frame: 0, value: 0 },
      { frame: 20, value: Math.PI * 2 }
    ]);

    const fadeAnim = new Animation(
      'deathFade',
      'visibility',
      60,
      Animation.ANIMATIONTYPE_FLOAT
    );
    fadeAnim.setKeys([
      { frame: 0, value: 1 },
      { frame: 20, value: 0 }
    ]);

    return [scaleAnim, rotateAnim, fadeAnim];
  }

  play(animName: string, loop: boolean = true): void {
    if (this.currentAnim) {
      this.currentAnim.stop();
    }

    const anim = this.animations.get(animName);
    if (anim) {
      this.currentAnim = anim;
      anim.start(loop);
    }
  }

  stop(): void {
    if (this.currentAnim) {
      this.currentAnim.stop();
      this.currentAnim = null;
    }
  }
}
```

### 10.2 GLTF Animation Loading

```typescript
// For loaded GLTF models with embedded animations
async loadCharacterWithAnimations(scene: Scene): Promise<{
  mesh: Mesh,
  animations: Map<string, AnimationGroup>
}> {
  const result = await SceneLoader.ImportMeshAsync(
    '',
    'assets/models/',
    'character.glb',
    scene
  );

  const animations = new Map<string, AnimationGroup>();

  // GLTF animations are automatically loaded
  for (const animGroup of result.animationGroups) {
    animations.set(animGroup.name, animGroup);
    animGroup.stop(); // Stop all by default
  }

  return {
    mesh: result.meshes[0] as Mesh,
    animations
  };
}
```

---

## 11. UI/HUD Migration

### 11.1 Babylon.GUI Setup

```typescript
// ui/HUD.ts
import { AdvancedDynamicTexture, Rectangle, TextBlock, Image, StackPanel } from '@babylonjs/gui';

export class HUD {
  private advancedTexture: AdvancedDynamicTexture;
  private healthBar: Rectangle;
  private healthFill: Rectangle;
  private armorBar: Rectangle;
  private ammoText: TextBlock;
  private scoreText: TextBlock;
  private weaponIcon: Image;

  constructor(scene: Scene) {
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    this.createHealthBar();
    this.createArmorBar();
    this.createAmmoCounter();
    this.createScoreDisplay();
    this.createWeaponIndicator();
    this.createControlsHint();
  }

  private createHealthBar(): void {
    // Container
    this.healthBar = new Rectangle('healthBar');
    this.healthBar.width = '200px';
    this.healthBar.height = '20px';
    this.healthBar.cornerRadius = 5;
    this.healthBar.color = 'white';
    this.healthBar.thickness = 2;
    this.healthBar.background = '#333';
    this.healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.healthBar.left = '20px';
    this.healthBar.top = '20px';
    this.advancedTexture.addControl(this.healthBar);

    // Fill
    this.healthFill = new Rectangle('healthFill');
    this.healthFill.width = '100%';
    this.healthFill.height = '100%';
    this.healthFill.background = '#ff4444';
    this.healthFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthBar.addControl(this.healthFill);

    // Label
    const label = new TextBlock('healthLabel', 'HP');
    label.color = 'white';
    label.fontSize = 12;
    label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.paddingLeft = '5px';
    this.healthBar.addControl(label);
  }

  private createAmmoCounter(): void {
    const panel = new StackPanel('ammoPanel');
    panel.isVertical = false;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.left = '-20px';
    panel.top = '-20px';
    this.advancedTexture.addControl(panel);

    this.ammoText = new TextBlock('ammoText', '30 / 30');
    this.ammoText.color = 'white';
    this.ammoText.fontSize = 24;
    this.ammoText.fontFamily = 'monospace';
    panel.addControl(this.ammoText);
  }

  private createScoreDisplay(): void {
    this.scoreText = new TextBlock('scoreText', 'Score: 0');
    this.scoreText.color = 'white';
    this.scoreText.fontSize = 24;
    this.scoreText.fontFamily = 'Arial';
    this.scoreText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.scoreText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.top = '20px';
    this.advancedTexture.addControl(this.scoreText);
  }

  updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100;
    this.healthFill.width = `${percent}%`;

    // Color gradient based on health
    if (percent > 60) {
      this.healthFill.background = '#44ff44';
    } else if (percent > 30) {
      this.healthFill.background = '#ffff44';
    } else {
      this.healthFill.background = '#ff4444';
    }
  }

  updateAmmo(current: number, max: number): void {
    this.ammoText.text = `${current} / ${max}`;

    if (current <= 0) {
      this.ammoText.color = '#ff4444';
    } else if (current <= 10) {
      this.ammoText.color = '#ffff44';
    } else {
      this.ammoText.color = 'white';
    }
  }

  updateScore(score: number): void {
    this.scoreText.text = `Score: ${score}`;
  }
}
```

### 11.2 Game Over Screen

```typescript
// ui/GameOverScreen.ts
export class GameOverScreen {
  private container: Rectangle;
  private advancedTexture: AdvancedDynamicTexture;

  constructor(advancedTexture: AdvancedDynamicTexture) {
    this.advancedTexture = advancedTexture;
    this.create();
    this.hide();
  }

  private create(): void {
    // Semi-transparent overlay
    this.container = new Rectangle('gameOverContainer');
    this.container.width = 1;
    this.container.height = 1;
    this.container.background = 'rgba(0, 0, 0, 0.7)';
    this.advancedTexture.addControl(this.container);

    // Game Over text
    const title = new TextBlock('gameOverTitle', 'GAME OVER');
    title.color = '#ff4444';
    title.fontSize = 64;
    title.fontFamily = 'Arial Black';
    title.top = '-100px';
    this.container.addControl(title);

    // Score display
    const scoreText = new TextBlock('finalScore', 'Final Score: 0');
    scoreText.color = 'white';
    scoreText.fontSize = 32;
    scoreText.top = '0px';
    this.container.addControl(scoreText);

    // Restart button
    const restartBtn = Button.CreateSimpleButton('restartBtn', 'RESTART');
    restartBtn.width = '200px';
    restartBtn.height = '50px';
    restartBtn.color = 'white';
    restartBtn.background = '#444';
    restartBtn.top = '100px';
    restartBtn.onPointerClickObservable.add(() => {
      this.onRestart?.();
    });
    this.container.addControl(restartBtn);
  }

  show(finalScore: number): void {
    this.container.isVisible = true;
    // Update score display
  }

  hide(): void {
    this.container.isVisible = false;
  }

  onRestart?: () => void;
}
```

---

## 12. Performance Considerations

### 12.1 Optimization Strategies

```typescript
// systems/PerformanceManager.ts
export class PerformanceManager {
  private scene: Scene;
  private lodDistance: number = 30;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupOptimizations();
  }

  private setupOptimizations(): void {
    // Freeze materials that don't change
    this.scene.materials.forEach(mat => {
      if (mat instanceof StandardMaterial) {
        mat.freeze();
      }
    });

    // Enable octree for mesh picking
    this.scene.createOrUpdateSelectionOctree();

    // Hardware scaling for lower-end devices
    const engine = this.scene.getEngine();
    if (engine.getCaps().maxTextureSize < 4096) {
      engine.setHardwareScalingLevel(1.5);
    }
  }

  // Instance static objects (buildings, fences)
  createInstancedBuildings(buildingPositions: Vector3[]): void {
    const baseMesh = TileFactory.createBuildingTile(this.scene);
    baseMesh.setEnabled(false);

    for (const pos of buildingPositions) {
      const instance = baseMesh.createInstance('building_' + pos.toString());
      instance.position = pos;
    }
  }

  // Level of Detail for distant objects
  setupLOD(mesh: Mesh): void {
    // Simplified mesh for distance
    const simplifiedMesh = mesh.clone('lod_' + mesh.name);
    simplifiedMesh.simplify(
      [{ distance: this.lodDistance, quality: 0.3 }],
      false,
      SimplificationType.QUADRATIC
    );

    mesh.addLODLevel(this.lodDistance, simplifiedMesh);
  }

  // Frustum culling is automatic, but we can add custom culling
  setupCustomCulling(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      const camera = this.scene.activeCamera!;

      this.scene.meshes.forEach(mesh => {
        if (mesh.name.startsWith('enemy_')) {
          const distance = Vector3.Distance(
            mesh.position,
            camera.position
          );
          mesh.setEnabled(distance < 50);
        }
      });
    });
  }
}
```

### 12.2 Object Pooling

```typescript
// systems/ObjectPool.ts
export class ObjectPool<T extends { setEnabled: (val: boolean) => void }> {
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 10) {
    this.factory = factory;
    this.prewarm(initialSize);
  }

  private prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      obj.setEnabled(false);
      this.pool.push(obj);
    }
  }

  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.factory();
    }

    obj.setEnabled(true);
    this.activeObjects.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.activeObjects.has(obj)) return;

    obj.setEnabled(false);
    this.activeObjects.delete(obj);
    this.pool.push(obj);
  }

  releaseAll(): void {
    for (const obj of this.activeObjects) {
      obj.setEnabled(false);
      this.pool.push(obj);
    }
    this.activeObjects.clear();
  }
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
// tests/weapons.test.ts
describe('Gun', () => {
  let scene: Scene;
  let gun: Gun;

  beforeEach(() => {
    scene = new Scene(new NullEngine());
    gun = new Gun(scene);
  });

  test('should have 30 initial ammo', () => {
    expect(gun.getAmmoCount()).toBe(30);
  });

  test('should decrease ammo on attack', () => {
    gun.attack(mockPlayer, new Vector3(1, 0, 0));
    expect(gun.getAmmoCount()).toBe(29);
  });

  test('should not attack when out of ammo', () => {
    gun.setAmmo(0);
    const result = gun.canAttack();
    expect(result).toBe(false);
  });
});
```

### 13.2 Integration Tests

```typescript
// tests/gameplay.test.ts
describe('Gameplay Integration', () => {
  test('enemy should die after taking enough damage', async () => {
    const scene = await createTestScene();
    const enemy = new Enemy(scene, Vector3.Zero());

    // 30 HP, 20 damage per bullet = 2 hits to kill
    enemy.takeDamage(20);
    expect(enemy.isAlive()).toBe(true);

    enemy.takeDamage(20);
    expect(enemy.isAlive()).toBe(false);
  });

  test('player should lose health when attacked by enemy', async () => {
    const scene = await createTestScene();
    const player = new Player(scene, Vector3.Zero());
    const enemy = new Enemy(scene, new Vector3(1, 0, 0));

    const initialHealth = player.getHealth();
    enemy.attack(player);

    expect(player.getHealth()).toBe(initialHealth - 10);
  });
});
```

### 13.3 Performance Tests

```typescript
// tests/performance.test.ts
describe('Performance', () => {
  test('should maintain 60 FPS with 30 enemies', async () => {
    const scene = await createTestScene();

    for (let i = 0; i < 30; i++) {
      new Enemy(scene, new Vector3(
        Math.random() * 40,
        0,
        Math.random() * 40
      ));
    }

    const fps = await measureFPS(scene, 1000);
    expect(fps).toBeGreaterThan(55);
  });

  test('bullet pool should handle rapid fire', async () => {
    const scene = await createTestScene();
    const gun = new Gun(scene);

    // Simulate rapid fire
    for (let i = 0; i < 50; i++) {
      gun.attack(mockPlayer, new Vector3(1, 0, 0));
    }

    expect(gun.getActiveBullets().length).toBeLessThanOrEqual(50);
  });
});
```

---

## 14. Risk Assessment

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance issues with physics | Medium | High | Use Havok, optimize collision shapes |
| Asset loading delays | Medium | Medium | Implement loading screen, asset preloading |
| Browser compatibility | Low | High | Test on multiple browsers, use fallbacks |
| Mobile performance | High | Medium | Implement quality settings, reduce effects |
| Memory leaks | Medium | High | Proper disposal, object pooling |

### 14.2 Design Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Losing isometric aesthetic | Medium | High | Lock camera angles, use orthographic projection |
| UI readability in 3D | Medium | Medium | Use Babylon.GUI, overlay approach |
| Control feel changes | High | Medium | Extensive playtesting, adjust movement speed |
| Collision detection changes | Medium | High | Careful physics setup, hitbox tuning |

### 14.3 Rollback Strategy

- Maintain Phaser version in separate branch
- Feature flags for gradual rollout
- A/B testing capability

---

## 15. File Structure

### 15.1 Final Project Structure

```
babylon-game/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── main.ts                     # Entry point
│   ├── core/
│   │   ├── Game.ts                 # Main game loop
│   │   ├── SceneManager.ts         # Scene transitions
│   │   ├── EventBus.ts             # Global events
│   │   └── GameState.ts            # State management
│   ├── scenes/
│   │   ├── LoadingScene.ts         # Asset loading
│   │   ├── CityScene.ts            # Overworld
│   │   ├── BuildingScene.ts        # Interiors
│   │   └── UIScene.ts              # GUI layer
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Enemy.ts
│   │   ├── Wizard.ts
│   │   ├── Ammo.ts
│   │   ├── Health.ts
│   │   └── Armor.ts
│   ├── weapons/
│   │   ├── IWeapon.ts
│   │   ├── WeaponManager.ts
│   │   ├── Gun.ts
│   │   └── Sword.ts
│   ├── world/
│   │   ├── MapBuilder.ts
│   │   ├── TileFactory.ts
│   │   ├── TileTypes.ts
│   │   ├── Door.ts
│   │   └── MaterialLibrary.ts
│   ├── systems/
│   │   ├── InputManager.ts
│   │   ├── CollisionManager.ts
│   │   ├── DifficultyManager.ts
│   │   ├── ParticleManager.ts
│   │   ├── PhysicsManager.ts
│   │   └── PerformanceManager.ts
│   ├── cameras/
│   │   ├── GameCamera.ts
│   │   ├── CameraController.ts
│   │   └── OcclusionManager.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── GameOverScreen.ts
│   │   ├── DialogueBox.ts
│   │   └── ControlsHint.ts
│   ├── animations/
│   │   └── AnimationController.ts
│   ├── config/
│   │   ├── GameConfig.ts           # Game constants
│   │   └── portfolioData.ts        # Portfolio content
│   └── utils/
│       ├── MathUtils.ts
│       ├── ObjectPool.ts
│       └── Constants.ts
├── assets/
│   ├── models/                     # GLTF/GLB models
│   │   ├── player.glb
│   │   ├── enemy.glb
│   │   └── environment/
│   ├── textures/                   # Material textures
│   │   ├── ground.png
│   │   ├── brick.png
│   │   └── road.png
│   └── audio/                      # Sound effects
│       ├── shoot.mp3
│       ├── hit.mp3
│       └── ambient.mp3
├── tests/
│   ├── unit/
│   │   ├── weapons.test.ts
│   │   └── entities.test.ts
│   └── integration/
│       └── gameplay.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 16. Implementation Checklist

### Phase 1: Foundation
- [ ] Initialize Babylon.js engine
- [ ] Set up Vite configuration for Babylon.js
- [ ] Create basic scene with ground plane
- [ ] Implement isometric camera
- [ ] Add lighting (ambient + directional)
- [ ] Create scene manager skeleton
- [ ] Set up event bus

### Phase 2: World Building
- [ ] Create TileFactory with all tile types
- [ ] Implement MapBuilder for city layout
- [ ] Render 40x40 city map
- [ ] Add building collision bodies
- [ ] Implement door indicators
- [ ] Create building interior generator
- [ ] Add scene transition (city → building)
- [ ] Implement building transparency system

### Phase 3: Player System
- [ ] Create player mesh/model
- [ ] Implement WASD movement
- [ ] Add player physics body
- [ ] Set up camera follow
- [ ] Add player rotation toward movement
- [ ] Implement world bounds
- [ ] Add player state (health, ammo, armor)

### Phase 4: Weapon System
- [ ] Create IWeapon interface
- [ ] Implement Gun class
- [ ] Create bullet pool
- [ ] Add bullet physics
- [ ] Implement bullet-enemy collision
- [ ] Create muzzle flash particles
- [ ] Implement Sword class
- [ ] Add sword swing animation
- [ ] Implement melee arc detection
- [ ] Create hit particles
- [ ] Build WeaponManager
- [ ] Add weapon switching (1, 2, scroll)
- [ ] Implement auto-switch when out of ammo

### Phase 5: Enemy System
- [ ] Create enemy mesh/model
- [ ] Implement enemy AI states
- [ ] Add detection behavior
- [ ] Implement chase behavior
- [ ] Add attack behavior
- [ ] Implement wander behavior
- [ ] Set up enemy spawning
- [ ] Add spawn timer and limits
- [ ] Create death animation
- [ ] Add explosion particles
- [ ] Implement difficulty scaling

### Phase 6: Pickups & NPCs
- [ ] Create ammo pickup mesh
- [ ] Implement pickup collision
- [ ] Add ammo pickup effect
- [ ] Create health pickup
- [ ] Create armor pickup
- [ ] Implement Wizard NPC
- [ ] Add Wizard dialogue trigger
- [ ] Create dialogue UI
- [ ] Port portfolio data

### Phase 7: UI/HUD
- [ ] Set up Babylon.GUI
- [ ] Create health bar
- [ ] Add armor bar overlay
- [ ] Implement ammo counter
- [ ] Add weapon indicator
- [ ] Create score display
- [ ] Build controls hint
- [ ] Create game over screen
- [ ] Add restart functionality
- [ ] Implement dialogue box

### Phase 8: Polish
- [ ] Add shadows
- [ ] Implement post-processing
- [ ] Add ambient particles
- [ ] Create building labels in 3D
- [ ] Optimize performance
- [ ] Add loading screen
- [ ] Implement quality settings
- [ ] Add sound effects (optional)

### Phase 9: Testing
- [ ] Unit test weapons
- [ ] Unit test entities
- [ ] Integration test gameplay
- [ ] Performance testing
- [ ] Browser compatibility
- [ ] Mobile testing (optional)
- [ ] Bug fixing
- [ ] Balance tuning

---

## Appendix A: Coordinate System Mapping

### Phaser Isometric → Babylon.js 3D

| Phaser (2D Isometric) | Babylon.js (3D) |
|----------------------|-----------------|
| Screen X | World X |
| Screen Y | World Z (depth) |
| Depth (Y-based) | World Y (automatic) |
| 64x32 tile | 1x1x1 unit cube |
| cartToIso() | Direct 3D position |

### Conversion Formula

```typescript
// Old Phaser tile position to new Babylon world position
function phaserTileToBabylon(tileX: number, tileY: number): Vector3 {
  // In Phaser, tiles were 64x32 pixels
  // In Babylon, each tile is 1 unit
  return new Vector3(
    tileX,      // X stays the same
    0,          // Y is ground level
    tileY       // Phaser Y becomes Babylon Z
  );
}
```

---

## Appendix B: Key Differences Summary

| Aspect | Phaser 3 | Babylon.js |
|--------|----------|------------|
| Coordinate System | 2D (X, Y) with isometric projection | True 3D (X, Y, Z) |
| Physics | Arcade (2D overlap/collider) | Havok/Cannon (3D rigid bodies) |
| Sprites | 2D texture-based | 3D meshes with materials |
| Camera | 2D with bounds | 3D with full rotation |
| Particles | Phaser ParticleEmitter | Babylon ParticleSystem |
| UI | DOM or Phaser Text | Babylon.GUI (WebGL) |
| Animation | Sprite sheets, tweens | Skeletal, keyframe, procedural |
| Lighting | N/A (baked into sprites) | Real-time (ambient, directional, shadows) |
| Depth Sorting | Manual (setDepth) | Automatic (Z-buffer) |

---

## Appendix C: Resource Links

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [Havok Physics Guide](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin)
- [Babylon.GUI](https://doc.babylonjs.com/features/featuresDeepDive/gui/gui)
- [GLTF/GLB Exporter](https://doc.babylonjs.com/features/featuresDeepDive/Exporters)
- [Performance Optimization](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene)

---

*Document Version: 1.0*
*Last Updated: Migration Planning Phase*
*Target Completion: Full 3D Game with Babylon.js*
