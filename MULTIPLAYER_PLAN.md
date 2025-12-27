# Multiplayer Implementation Plan

## Overview

Transform the single-player isometric RPG shooter into a cooperative multiplayer game where players can join the same session and play together in real-time.

**Key Constraints:**
- Server should be as small/minimal as possible
- First player creates a session, subsequent players join automatically
- Players see each other and can cooperate

---

## Architecture Decision: Minimal Server Approach

### Recommended: **Socket.IO with Hybrid Authority**

**Why Socket.IO over alternatives:**
- WebRTC (P2P) requires STUN/TURN servers and complex NAT traversal
- Raw WebSockets lack automatic reconnection and room management
- Socket.IO provides rooms, auto-reconnect, and binary support out-of-box

**Hybrid Authority Model:**
- **Server authoritative** for: enemy spawning, hit validation, score, pickups
- **Client predictive** for: own movement, animations, visual effects
- This minimizes server logic while preventing obvious cheating

---

## Server Implementation (~200-300 lines)

### File: `server/index.ts`

```typescript
// Minimal multiplayer server
import { Server } from 'socket.io';
import { createServer } from 'http';

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  armor: number;
  ammo: number;
  weapon: 'GUN' | 'SWORD';
  direction: { x: number; y: number };
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  targetPlayerId: string | null;
}

interface GameState {
  players: Map<string, Player>;
  enemies: Map<string, Enemy>;
  score: number;
  difficulty: number;
  scene: 'city' | 'building';
  buildingId?: number;
}
```

### Server Responsibilities (Minimal)

| Responsibility | Why Server-Side |
|----------------|-----------------|
| Room management | Auto-join first available room |
| Player registry | Track connected players |
| Enemy spawning | Prevent duplicate enemies |
| Hit validation | Prevent damage cheating |
| Pickup claims | First-come-first-served |
| Score tracking | Single source of truth |
| Scene sync | All players in same scene |

### Server Event Handlers

```typescript
// ~15 event handlers total
io.on('connection', (socket) => {
  // 1. Join/create room
  socket.on('joinGame', () => {})

  // 2. Player updates (broadcast to others)
  socket.on('playerMove', (data) => {})
  socket.on('playerAttack', (data) => {})
  socket.on('playerWeaponSwitch', (data) => {})

  // 3. Server-validated actions
  socket.on('requestHit', (data) => {})
  socket.on('requestPickup', (data) => {})
  socket.on('requestEnterBuilding', (data) => {})
  socket.on('requestExitBuilding', () => {})

  // 4. Disconnect handling
  socket.on('disconnect', () => {})
})
```

---

## Client Implementation

### New Files to Create

```
src/
├── network/
│   ├── NetworkManager.ts      # Socket.IO wrapper (~150 lines)
│   ├── NetworkPlayer.ts       # Remote player rendering (~100 lines)
│   └── types.ts               # Shared network types (~50 lines)
```

### Modifications to Existing Files

| File | Changes |
|------|---------|
| `main.ts` | Add network initialization before game start |
| `CityScene.ts` | Add NetworkManager integration, remote players |
| `BuildingScene.ts` | Same as CityScene |
| `Player.ts` | Send movement/attack events to network |
| `Enemy.ts` | Sync from server instead of local AI |
| `UIScene.ts` | Display connected players count |

---

## Implementation Phases

### Phase 1: Server Setup (~2 hours)

**Step 1.1: Add server dependencies**
```bash
npm install socket.io express
npm install -D @types/express
```

**Step 1.2: Create server entry point**
```
server/
├── index.ts         # Express + Socket.IO setup
├── GameRoom.ts      # Room state management
└── package.json     # Server-specific deps
```

**Step 1.3: Basic server structure**
```typescript
// server/index.ts
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const rooms = new Map<string, GameRoom>();

io.on('connection', (socket) => {
  // Auto-join first available room or create new
  let room = findAvailableRoom() || createRoom();
  socket.join(room.id);
  room.addPlayer(socket.id);

  // Broadcast new player to others
  socket.to(room.id).emit('playerJoined', {
    id: socket.id,
    // initial state
  });
});
```

---

### Phase 2: NetworkManager Client (~3 hours)

**Step 2.1: Create NetworkManager singleton**

```typescript
// src/network/NetworkManager.ts
import { io, Socket } from 'socket.io-client';

export class NetworkManager {
  private static instance: NetworkManager;
  private socket: Socket | null = null;
  private playerId: string = '';
  private roomId: string = '';

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve) => {
      this.socket = io(serverUrl);
      this.socket.on('connect', () => {
        this.playerId = this.socket!.id;
        resolve();
      });
    });
  }

  // Player movement (send frequently, ~20Hz)
  sendPlayerUpdate(data: PlayerUpdateData): void {
    this.socket?.volatile.emit('playerMove', data);
  }

  // Attack events (reliable delivery)
  sendAttack(data: AttackData): void {
    this.socket?.emit('playerAttack', data);
  }

  // Request server validation
  requestHit(enemyId: string, damage: number): void {
    this.socket?.emit('requestHit', { enemyId, damage });
  }
}
```

**Step 2.2: Network types**

```typescript
// src/network/types.ts
export interface PlayerUpdateData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: { x: number; y: number };
  health: number;
  weapon: 'GUN' | 'SWORD';
}

export interface AttackData {
  weapon: 'GUN' | 'SWORD';
  direction: { x: number; y: number };
  bulletId?: string;  // For gun
}

export interface EnemyState {
  id: string;
  x: number;
  y: number;
  health: number;
  isDying: boolean;
}

export interface ServerEvents {
  playerJoined: (data: PlayerUpdateData & { id: string }) => void;
  playerLeft: (playerId: string) => void;
  playerMoved: (data: PlayerUpdateData & { id: string }) => void;
  enemySpawned: (data: EnemyState) => void;
  enemyUpdated: (data: EnemyState) => void;
  enemyDied: (enemyId: string) => void;
  hitConfirmed: (data: { enemyId: string; newHealth: number }) => void;
  scoreUpdated: (score: number) => void;
}
```

---

### Phase 3: Remote Player Rendering (~2 hours)

**Step 3.1: Create NetworkPlayer entity**

```typescript
// src/network/NetworkPlayer.ts
export class NetworkPlayer extends Phaser.Physics.Arcade.Sprite {
  private targetX: number = 0;
  private targetY: number = 0;
  private playerId: string;
  private nameLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    super(scene, x, y, 'player_right');
    this.playerId = id;

    // Add name label above player
    this.nameLabel = scene.add.text(x, y - 40, `Player ${id.slice(0,4)}`, {
      fontSize: '12px',
      color: '#00ff00'
    });
  }

  // Smooth interpolation to target position
  update(time: number, delta: number): void {
    const lerp = 0.2;
    this.x += (this.targetX - this.x) * lerp;
    this.y += (this.targetY - this.y) * lerp;

    this.nameLabel.setPosition(this.x - 30, this.y - 40);
    this.setDepth(this.y + 10);
  }

  setTargetPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  updateFromServer(data: PlayerUpdateData): void {
    this.setTargetPosition(data.x, data.y);
    this.updateDirection(data.direction);
    // Update weapon visual, health indicator, etc.
  }
}
```

---

### Phase 4: Scene Integration (~4 hours)

**Step 4.1: Modify CityScene**

```typescript
// Add to CityScene.ts

private networkManager: NetworkManager;
private remotePlayers: Map<string, NetworkPlayer> = new Map();

create() {
  // ... existing code ...

  this.networkManager = NetworkManager.getInstance();
  this.setupNetworkEvents();

  // Start sending position updates
  this.time.addEvent({
    delay: 50, // 20Hz
    callback: this.sendPlayerUpdate,
    callbackScope: this,
    loop: true
  });
}

private setupNetworkEvents(): void {
  this.networkManager.on('playerJoined', (data) => {
    const remotePlayer = new NetworkPlayer(this, data.id, data.x, data.y);
    this.remotePlayers.set(data.id, remotePlayer);
    this.add.existing(remotePlayer);
  });

  this.networkManager.on('playerLeft', (playerId) => {
    const player = this.remotePlayers.get(playerId);
    player?.destroy();
    this.remotePlayers.delete(playerId);
  });

  this.networkManager.on('playerMoved', (data) => {
    const player = this.remotePlayers.get(data.id);
    player?.updateFromServer(data);
  });

  // Enemy spawning from server (not local)
  this.networkManager.on('enemySpawned', (data) => {
    this.spawnEnemyFromServer(data);
  });
}

private sendPlayerUpdate(): void {
  this.networkManager.sendPlayerUpdate({
    x: this.player.x,
    y: this.player.y,
    vx: this.player.body.velocity.x,
    vy: this.player.body.velocity.y,
    direction: this.player.getDirection(),
    health: this.player.getHealth(),
    weapon: this.player.getCurrentWeaponType()
  });
}
```

**Step 4.2: Modify Enemy spawning**

```typescript
// Remove local spawning timer
// Instead, receive spawns from server:

private spawnEnemyFromServer(data: EnemyState): void {
  const enemy = new Enemy(this, data.x, data.y);
  enemy.setServerId(data.id);
  this.enemies.add(enemy);
}

// When enemy takes damage locally, request validation:
handleBulletEnemyCollision(bullet, enemy) {
  // Don't apply damage locally - request from server
  this.networkManager.requestHit(enemy.getServerId(), 20);
  bullet.deactivate();
}

// Server confirms hit:
this.networkManager.on('hitConfirmed', (data) => {
  const enemy = this.findEnemyById(data.enemyId);
  if (enemy) {
    enemy.setHealth(data.newHealth);
    if (data.newHealth <= 0) {
      enemy.die();
    }
  }
});
```

---

### Phase 5: Synchronized Game Flow (~3 hours)

**Step 5.1: Building entry synchronization**

```typescript
// When local player enters building:
enterBuilding(buildingId: number): void {
  this.networkManager.requestEnterBuilding(buildingId);
}

// Server broadcasts to all:
this.networkManager.on('sceneChange', (data) => {
  if (data.scene === 'building') {
    this.scene.start('BuildingScene', {
      buildingId: data.buildingId,
      // ... state
    });
  }
});
```

**Step 5.2: Score synchronization**

```typescript
// Score managed by server
this.networkManager.on('scoreUpdated', (score) => {
  const uiScene = this.scene.get('UIScene') as UIScene;
  uiScene.setScore(score);

  // Update difficulty locally based on score
  this.updateDifficulty(Math.floor(score / 50));
});
```

---

### Phase 6: Polish & Edge Cases (~2 hours)

**6.1: Connection handling**
- Show "Connecting..." overlay on start
- Handle disconnection gracefully
- Reconnection logic

**6.2: Player indicators**
- Different colors for local vs remote players
- Health bars above remote players
- Weapon indicators

**6.3: Latency compensation**
- Client-side prediction for local movement
- Interpolation for remote players
- Dead reckoning for smooth visuals

---

## Data Flow Diagrams

### Player Movement
```
Local Player Input
       ↓
Apply locally (prediction)
       ↓
Send to server (50ms interval)
       ↓
Server broadcasts to room
       ↓
Remote clients interpolate
```

### Enemy Damage
```
Local Player Attacks
       ↓
Visual feedback (particles, etc.)
       ↓
requestHit(enemyId, damage) → Server
       ↓
Server validates (distance, cooldowns)
       ↓
hitConfirmed → All clients
       ↓
Update enemy health display
```

### Pickup Claim
```
Player approaches pickup
       ↓
requestPickup(pickupId) → Server
       ↓
Server checks: not already claimed?
       ↓
pickupClaimed → Claiming player (add ammo/health)
       ↓
pickupRemoved → All clients (hide pickup)
```

---

## Server Code (~200 lines total)

```typescript
// server/index.ts - Complete minimal server

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

interface Player {
  id: string; x: number; y: number;
  health: number; weapon: string;
}
interface Enemy {
  id: string; x: number; y: number;
  health: number;
}
interface Room {
  id: string;
  players: Map<string, Player>;
  enemies: Map<string, Enemy>;
  score: number;
  scene: 'city' | 'building';
  enemyCounter: number;
}

const rooms = new Map<string, Room>();
const playerRooms = new Map<string, string>();

function getOrCreateRoom(): Room {
  // Find room with space or create new
  for (const room of rooms.values()) {
    if (room.players.size < 4) return room;
  }
  const room: Room = {
    id: `room-${Date.now()}`,
    players: new Map(),
    enemies: new Map(),
    score: 0,
    scene: 'city',
    enemyCounter: 0
  };
  rooms.set(room.id, room);
  startEnemySpawner(room);
  return room;
}

function startEnemySpawner(room: Room): void {
  const spawn = () => {
    if (room.players.size === 0) return;
    const maxEnemies = 10 + Math.floor(room.score / 50) * 2;
    if (room.enemies.size >= maxEnemies) return;

    const enemy: Enemy = {
      id: `enemy-${room.enemyCounter++}`,
      x: 200 + Math.random() * 1000,
      y: 200 + Math.random() * 600,
      health: 30
    };
    room.enemies.set(enemy.id, enemy);
    io.to(room.id).emit('enemySpawned', enemy);

    const delay = Math.max(1000, 5000 - Math.floor(room.score / 50) * 400);
    setTimeout(spawn, delay);
  };
  spawn();
}

io.on('connection', (socket: Socket) => {
  const room = getOrCreateRoom();
  socket.join(room.id);
  playerRooms.set(socket.id, room.id);

  const player: Player = {
    id: socket.id, x: 580, y: 300,
    health: 100, weapon: 'GUN'
  };
  room.players.set(socket.id, player);

  // Send current state to new player
  socket.emit('gameState', {
    playerId: socket.id,
    players: Array.from(room.players.values()),
    enemies: Array.from(room.enemies.values()),
    score: room.score
  });

  // Notify others
  socket.to(room.id).emit('playerJoined', player);

  // Position updates
  socket.on('playerMove', (data) => {
    const p = room.players.get(socket.id);
    if (p) { Object.assign(p, data); }
    socket.to(room.id).emit('playerMoved', { ...data, id: socket.id });
  });

  // Attack events
  socket.on('playerAttack', (data) => {
    socket.to(room.id).emit('playerAttacked', {
      ...data, id: socket.id
    });
  });

  // Hit validation
  socket.on('requestHit', ({ enemyId, damage }) => {
    const enemy = room.enemies.get(enemyId);
    if (!enemy || enemy.health <= 0) return;

    enemy.health -= damage;
    if (enemy.health <= 0) {
      room.enemies.delete(enemyId);
      room.score += 10;
      io.to(room.id).emit('enemyDied', enemyId);
      io.to(room.id).emit('scoreUpdated', room.score);
    } else {
      io.to(room.id).emit('enemyUpdated', enemy);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    room.players.delete(socket.id);
    playerRooms.delete(socket.id);
    io.to(room.id).emit('playerLeft', socket.id);

    if (room.players.size === 0) {
      rooms.delete(room.id);
    }
  });
});

httpServer.listen(3001, () => {
  console.log('Game server on :3001');
});
```

---

## Package.json Updates

```json
{
  "scripts": {
    "dev": "vite",
    "server": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\""
  },
  "dependencies": {
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "socket.io": "^4.7.0",
    "express": "^4.18.0",
    "@types/express": "^4.17.0",
    "tsx": "^4.0.0",
    "concurrently": "^8.0.0"
  }
}
```

---

## File Changes Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `server/index.ts` | **CREATE** | ~150 |
| `src/network/NetworkManager.ts` | **CREATE** | ~120 |
| `src/network/NetworkPlayer.ts` | **CREATE** | ~80 |
| `src/network/types.ts` | **CREATE** | ~50 |
| `src/main.ts` | MODIFY | ~10 |
| `src/scenes/CityScene.ts` | MODIFY | ~80 |
| `src/scenes/BuildingScene.ts` | MODIFY | ~60 |
| `src/entities/Player.ts` | MODIFY | ~20 |
| `src/entities/Enemy.ts` | MODIFY | ~30 |
| `src/scenes/UIScene.ts` | MODIFY | ~15 |
| `package.json` | MODIFY | ~10 |

**Total: ~625 lines of changes**

---

## Implementation Order

1. **Server setup** - Get basic room/player management working
2. **NetworkManager** - Connect client to server
3. **Player sync** - See other players move
4. **Enemy sync** - Server-spawned enemies
5. **Combat sync** - Validated hits and deaths
6. **Score sync** - Shared progression
7. **Scene sync** - Building transitions together
8. **Polish** - UI indicators, connection handling

---

## Testing Checklist

- [ ] Two browser tabs can connect
- [ ] Players see each other
- [ ] Movement is smooth (no jitter)
- [ ] Attacks are visible to both players
- [ ] Enemies spawn for all players
- [ ] Killing enemy updates score for all
- [ ] Entering building transitions all players
- [ ] Disconnect removes player cleanly
- [ ] Reconnection works
- [ ] 4-player stress test

---

## Future Enhancements (Out of Scope)

- Player authentication/names
- Multiple rooms/lobbies
- Chat system
- Leaderboards
- Spectator mode
- Mobile support
