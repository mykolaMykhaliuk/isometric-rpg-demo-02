// Game Constants
export const GAME_CONFIG = {
  // World
  CITY_SIZE: 40,
  BUILDING_SIZE: { width: 12, height: 10 },
  TILE_SIZE: 2, // World units per tile

  // Player
  PLAYER_SPEED: 8,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_MAX_ARMOR: 100,
  PLAYER_HEIGHT: 1.8,
  PLAYER_RADIUS: 0.4,

  // Weapons
  GUN_DAMAGE: 20,
  GUN_COOLDOWN: 0.2,
  GUN_MAX_AMMO: 30,
  GUN_BULLET_SPEED: 50,
  GUN_BULLET_LIFETIME: 2,

  SWORD_DAMAGE: 35,
  SWORD_COOLDOWN: 0.4,
  SWORD_RANGE: 3,
  SWORD_ARC_ANGLE: Math.PI / 2,

  // Enemies
  ENEMY_HEALTH: 30,
  ENEMY_SPEED: 4,
  ENEMY_CHASE_SPEED: 6,
  ENEMY_DAMAGE: 10,
  ENEMY_ATTACK_COOLDOWN: 1,
  ENEMY_DETECTION_RANGE: 15,
  ENEMY_ATTACK_RANGE: 1.5,
  ENEMY_WANDER_RANGE: 5,

  // Spawning
  BASE_MAX_ENEMIES: 10,
  MAX_ENEMIES_CAP: 30,
  BASE_SPAWN_DELAY: 5,
  MIN_SPAWN_DELAY: 1,
  SPAWN_DISTANCE_FROM_PLAYER: 10,

  // Difficulty
  DIFFICULTY_SCORE_INTERVAL: 50,
  ENEMIES_PER_DIFFICULTY: 2,
  SPAWN_DELAY_REDUCTION: 0.4,

  // Camera
  CAMERA_DISTANCE: 30,
  CAMERA_ALPHA: Math.PI / 4,
  CAMERA_BETA: Math.PI / 3.2,
  CAMERA_FOLLOW_SPEED: 0.08,
  CAMERA_MIN_ZOOM: 20,
  CAMERA_MAX_ZOOM: 50,

  // Pickups
  AMMO_PICKUP_AMOUNT: 10,
  HEALTH_PICKUP_AMOUNT: 25,
  ARMOR_PICKUP_AMOUNT: 50,

  // Points
  ENEMY_KILL_POINTS: 10,
};

// Colors
export const COLORS = {
  // Environment
  GROUND: { r: 0.2, g: 0.45, b: 0.2 },
  ROAD: { r: 0.35, g: 0.35, b: 0.4 },
  BUILDING: { r: 0.55, g: 0.5, b: 0.45 },
  BUILDING_ROOF: { r: 0.4, g: 0.35, b: 0.35 },
  WATER: { r: 0.1, g: 0.4, b: 0.7 },
  FENCE: { r: 0.45, g: 0.35, b: 0.25 },
  FLOOR: { r: 0.5, g: 0.45, b: 0.4 },
  WALL: { r: 0.6, g: 0.55, b: 0.5 },

  // Entities
  PLAYER: { r: 0.2, g: 0.5, b: 0.9 },
  PLAYER_ACCENT: { r: 0.9, g: 0.7, b: 0.2 },
  ENEMY: { r: 0.3, g: 0.7, b: 0.3 },
  ENEMY_GLOW: { r: 0.1, g: 0.4, b: 0.1 },

  // Pickups
  AMMO: { r: 0.9, g: 0.8, b: 0.2 },
  HEALTH: { r: 0.9, g: 0.2, b: 0.2 },
  ARMOR_BLUE: { r: 0.3, g: 0.5, b: 0.9 },
  ARMOR_RED: { r: 0.9, g: 0.3, b: 0.3 },

  // Effects
  MUZZLE_FLASH: { r: 1, g: 0.9, b: 0.3 },
  BULLET: { r: 1, g: 0.8, b: 0.2 },
  SWORD_TRAIL: { r: 0.8, g: 0.85, b: 0.9 },

  // UI
  DOOR_BATTLE: { r: 1, g: 0, b: 0 },
  DOOR_PORTFOLIO: { r: 0, g: 1, b: 0 },
};

// Tile Types
export enum TileType {
  GROUND = 0,
  ROAD = 1,
  BUILDING = 2,
  WATER = 3,
  DOOR_BATTLE = 4,
  FENCE = 5,
  DOOR_PORTFOLIO = 6,
  FLOOR = 7,
  WALL = 8,
  EXIT_DOOR = 9,
}

// Weapon Types
export enum WeaponType {
  GUN = 'gun',
  SWORD = 'sword',
}

// Game States
export enum GameState {
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  DIALOGUE = 'dialogue',
}

// Scene Types
export enum SceneType {
  CITY = 'city',
  BUILDING = 'building',
}
