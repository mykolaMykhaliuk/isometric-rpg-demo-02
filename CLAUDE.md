# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Isometric RPG shooter built with Phaser 3 and TypeScript. Features procedurally generated isometric city maps, dual weapon system (gun/sword), building interiors, dynamic difficulty scaling, and enemy spawning.

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3000, auto-opens browser)
npm run build    # TypeScript compilation + Vite production build
npm run preview  # Preview production build locally
```

## Architecture

### Scene Management & Flow

The game uses Phaser's multi-scene architecture with persistent UI overlay:

1. **BootScene** - Asset generation entry point
   - Procedurally creates all sprites (tiles, player, enemies, weapons, ammo) using Graphics API
   - No external assets - everything is code-generated
   - Launches CityScene and UIScene on completion

2. **CityScene** - Main overworld
   - 40x40 tile isometric map with roads, buildings, water
   - Player spawns at fixed position (9, 5 in tile coords)
   - Enemies spawn dynamically based on score (difficulty scaling every 50 points)
   - Building doors marked with yellow pulsing indicators at tile type `4`

3. **BuildingScene** - Interior spaces
   - 12x10 tile interiors with walls, floors, and exit doors
   - Multiple building layouts (indexed by buildingId % interiorMaps.length)
   - Enemies spawn based on score (2-10 enemies, scales with difficulty)
   - Exit door marked with green pulsing indicator at tile type `2`

4. **UIScene** - Persistent HUD overlay
   - Runs in parallel with game scenes via `scene.launch()`
   - Listens to events from both CityScene and BuildingScene
   - Displays: health bar, ammo count, weapon indicator, score, controls, game over screen
   - Acts as event hub for score tracking and difficulty updates

### Scene Transitions & State Persistence

**CityScene → BuildingScene:**
```typescript
this.scene.start('BuildingScene', {
  buildingId: number,
  playerHealth: number,
  playerAmmo: number,
  currentWeapon: WeaponType,
});
```

**BuildingScene → CityScene:**
```typescript
this.scene.start('CityScene'); // Resets to defaults
```

**Critical:** Player state (health, ammo, weapon) must be passed via scene data when entering buildings. Exiting buildings resets the player.

### Weapon System (Strategy Pattern)

Implemented using Strategy Pattern to decouple weapon behavior from Player:

```
IWeapon (interface)
├── Gun (ranged, ammo-based)
└── Sword (melee arc, unlimited)

WeaponManager (inventory)
└── Player (delegates attack to current weapon)
```

**Weapon switching:**
- Number keys: `1` = Gun, `2` = Sword
- Mouse wheel: scroll to cycle
- Auto-switch: Gun → Sword when ammo = 0 (1 second cooldown)
- Switch cooldown: 300ms between manual switches
- Cannot switch during active attack (`isAttacking()` check)

**Gun (src/weapons/Gun.ts):**
- Damage: 20 HP
- Cooldown: 200ms
- Ammo: 30 max (consumed per shot)
- Uses Phaser bullet pool (maxSize: 50)
- Bullets auto-deactivate after 2 seconds

**Sword (src/weapons/Sword.ts):**
- Damage: 35 HP
- Cooldown: 400ms
- Ammo: Unlimited
- Range: 60 pixels
- Arc: 90° cone in mouse direction
- Hit detection: geometry-based (distance + angle checks)
- Double-damage prevention: Set tracks enemies hit per swing

### Isometric Coordinate System

All rendering uses isometric projection (64x32 tiles):

```typescript
// Cartesian (tile grid) → Isometric (screen)
cartToIso(cartX, cartY) → { x, y }

// Isometric (screen) → Cartesian (tile grid)
isoToCart(isoX, isoY) → { x, y }
```

**Depth sorting:** All entities use `setDepth(y)` or `setDepth(y + offset)` for proper layering. Higher Y values render in front.

**Map structure:** 2D arrays where:
- `0` = ground
- `1` = road
- `2` = building (CityScene) / wall (BuildingScene)
- `3` = water (CityScene only)
- `4` = door position

### Enemy AI & Collision

**Enemy behavior (src/entities/Enemy.ts):**
- Detection range: 300 pixels (chases player)
- Attack range: 30 pixels (melee damage)
- Wander when idle: random targets every 2-4 seconds
- Attack damage: 10 HP every 1 second
- Health: 30 HP
- Speed: 60 px/s (90 px/s when chasing)

**Collision setup pattern:**
```typescript
// Gun bullets vs enemies
this.physics.add.overlap(
  player.getBullets(),
  enemies,
  handleBulletEnemyCollision
);

// Sword hits enemies directly via arc detection
// No physics collision - uses geometry checks in Sword.attack()
```

**Important:** Collision handlers must check `enemy.isEnemyDying()` to prevent double-damage during death animation.

### Event-Driven Communication

Scenes communicate via Phaser's event system:

**Emitted by game scenes (CityScene/BuildingScene):**
- `'healthChanged'` → (current, max)
- `'ammoChanged'` → (current, max, weaponType?)
- `'weaponChanged'` → (weaponType, weapon)
- `'weaponAutoSwitch'` → (weaponType)
- `'enemyKilled'` → (points)
- `'playerDied'` → ()

**Emitted by UIScene:**
- `'addScore'` → (points) - received from game scenes
- `'scoreUpdated'` → (newScore) - broadcasts to game scenes
- `'showGameOver'` → ()
- `'getScore'` → (callback) - query current score

### Dynamic Difficulty Scaling

Score-based difficulty in CityScene (src/scenes/CityScene.ts:434-444):

```typescript
// Every 50 points = 1 difficulty level
difficultyLevel = Math.floor(score / 50)

// City spawning:
maxEnemies = min(10 + level * 2, 30)  // Cap at 30
spawnDelay = max(5000 - level * 400, 1000)  // Min 1 second

// Building spawning:
minEnemies = min(2 + level, 8)
maxEnemies = min(4 + level, 10)
```

Score is managed by UIScene and broadcast via `scoreUpdated` event.

### Asset Generation Pattern

All sprites are procedurally generated in BootScene using `make.graphics()`:

```typescript
const graphics = this.make.graphics({ x: 0, y: 0 });
graphics.fillStyle(color, alpha);
graphics.fillRect/fillTriangle/etc(...);
graphics.generateTexture('texture_key', width, height);
graphics.destroy();
```

**Key textures:**
- `tile_ground`, `tile_road`, `tile_water`, `tile_building`, `tile_floor`, `tile_wall`
- `player_[direction]` (8 directions: right, left, up, down, upRight, upLeft, downRight, downLeft)
- `enemy_bug`
- `bullet`, `ammo`
- `weapon_gun_icon`, `weapon_sword_icon`, `sword_sprite`

### Player Controls

**Movement:** WASD or Arrow Keys (150 px/s)
**Attack:** Left Mouse Button (hold for continuous)
**Aim:** Mouse cursor (auto-calculates direction)
**Enter/Exit Buildings:** E key (within 40 pixels of door)
**Weapon Switch:** Number keys (1, 2) or Mouse Wheel

### Critical Implementation Details

1. **Bullet depth management:** Bullets update depth every 16ms while active to maintain isometric layering during flight (src/weapons/Gun.ts:73-85)

2. **Enemy death flag:** Set `isDying = true` immediately in `die()` to prevent collision callbacks during death animation (src/entities/Enemy.ts:144)

3. **Sword enemy access:** Sword weapon accesses enemies via scene property `currentScene.enemies` or `currentScene.getEnemies()` - scenes must expose this (src/weapons/Sword.ts:99-101)

4. **Ammo pickup behavior:** Always adds to gun ammo pool, even when sword is equipped (src/entities/Player.ts:241-247)

5. **Scene restart pattern:** UIScene persists across scene changes, so weapon/score state is maintained via events, not scene data

6. **TypeScript strict mode:** Enabled with `noUnusedLocals` and `noUnusedParameters` - use `_` prefix for intentionally unused parameters

## Project Structure

```
src/
├── main.ts                 # Phaser game initialization
├── scenes/                 # Phaser scene classes
│   ├── BootScene.ts       # Asset generation & scene launch
│   ├── CityScene.ts       # Main overworld gameplay
│   ├── BuildingScene.ts   # Interior gameplay
│   └── UIScene.ts         # Persistent HUD overlay
├── entities/              # Game entities (extend Phaser.Sprite)
│   ├── Player.ts          # Player character with weapon system
│   ├── Enemy.ts           # AI-controlled enemies
│   └── Ammo.ts            # Ammo pickups
├── weapons/               # Weapon system (Strategy Pattern)
│   ├── IWeapon.ts         # Weapon interface & WeaponType enum
│   ├── Gun.ts             # Ranged weapon implementation
│   └── Sword.ts           # Melee weapon implementation
├── managers/              # Game managers
│   └── WeaponManager.ts   # Weapon inventory & switching
└── utils/
    └── IsometricUtils.ts  # Coordinate conversion utilities
```
