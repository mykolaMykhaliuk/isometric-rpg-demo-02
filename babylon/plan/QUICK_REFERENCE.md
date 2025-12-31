# Babylon.js Migration Quick Reference

## Key Technology Mapping

| Current (Phaser) | Target (Babylon.js) |
|------------------|---------------------|
| `Phaser.Game` | `Engine + Scene` |
| `Phaser.Scene` | `Scene` class |
| `Phaser.Physics.Arcade.Sprite` | `Mesh + PhysicsAggregate` |
| `Phaser.Physics.Arcade.Group` | `Array<Mesh>` + Object Pool |
| `this.physics.add.overlap()` | `PhysicsBody.onCollide` |
| `this.add.image()` | `MeshBuilder.Create*()` |
| `this.cameras.main` | `ArcRotateCamera` |
| `this.tweens.add()` | `Animation` + `scene.beginAnimation()` |
| `Phaser.Input.Keyboard` | Custom `InputManager` |
| DOM/Text elements | `Babylon.GUI` |
| `cartToIso()` | Direct 3D Vector3 |

## Package Installation

```bash
npm install @babylonjs/core @babylonjs/gui @babylonjs/loaders @babylonjs/materials @babylonjs/havok
```

## Basic Setup Template

```typescript
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin } from '@babylonjs/core';

async function createGame() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const engine = new Engine(canvas, true);

  // Physics
  const havok = await HavokPhysics();
  const scene = new Scene(engine);
  scene.enablePhysics(new Vector3(0, 0, 0), new HavokPlugin(true, havok));

  // Camera (isometric-style)
  const camera = new ArcRotateCamera('cam', Math.PI/4, Math.PI/3.5, 25, Vector3.Zero(), scene);

  // Lighting
  new HemisphericLight('light', new Vector3(0, 1, 0), scene);

  // Render loop
  engine.runRenderLoop(() => scene.render());
}
```

## Critical Migration Points

1. **Coordinates**: Phaser Y → Babylon Z (forward/depth)
2. **Physics**: Arcade overlap → Havok collision callbacks
3. **Depth sorting**: Manual `setDepth()` → Automatic Z-buffer
4. **Sprites → Meshes**: 2D textures become 3D geometry
5. **Camera lock**: Prevent user rotation for isometric feel
6. **UI**: Phaser DOM → Babylon.GUI (AdvancedDynamicTexture)

## Phase Order

1. Foundation (engine, camera, lighting)
2. World (map, tiles, buildings)
3. Player (mesh, movement, physics)
4. Weapons (gun, sword, projectiles)
5. Enemies (AI, spawning, combat)
6. Pickups (ammo, health, armor)
7. UI (HUD, game over, dialogue)
8. Polish (effects, optimization)

## Key Files to Create First

```
src/main.ts              # Engine init
src/core/Game.ts         # Main loop
src/systems/InputManager.ts  # Keyboard/mouse
src/cameras/GameCamera.ts    # Isometric camera
src/world/TileFactory.ts     # Procedural tiles
src/entities/Player.ts       # Player entity
```

## Useful Links

- Docs: https://doc.babylonjs.com/
- Playground: https://playground.babylonjs.com/
- Examples: https://www.babylonjs-playground.com/
