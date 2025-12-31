import {
  Scene,
  Mesh,
  Vector3,
  TransformNode,
  Animation,
  PhysicsAggregate,
  PhysicsShapeType,
} from '@babylonjs/core';
import { TileFactory } from './TileFactory';
import { TileType, GAME_CONFIG } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

interface DoorData {
  tileX: number;
  tileY: number;
  buildingId: number;
  isPortfolio: boolean;
  worldPosition: Vector3;
  mesh: Mesh;
}

interface BuildingLabel {
  text: string;
  centerX: number;
  centerY: number;
}

/**
 * Builds the 3D game world from tile maps
 */
export class MapBuilder {
  private scene: Scene;
  private tileSize: number = GAME_CONFIG.TILE_SIZE;
  private mapContainer: TransformNode;
  private collisionMeshes: Mesh[] = [];
  private doors: DoorData[] = [];
  private buildings: Mesh[] = [];

  // Building labels
  private readonly buildingLabels: BuildingLabel[] = [
    { text: 'SKILLS', centerX: 11.5, centerY: 14 },
    { text: 'PROJECTS', centerX: 21.5, centerY: 14 },
    { text: 'EXPERIENCE', centerX: 31.5, centerY: 14 },
    { text: 'CERTIFICATIONS', centerX: 11.5, centerY: 26 },
    { text: 'CONTACTS', centerX: 21.5, centerY: 26 },
    { text: 'BATTLE', centerX: 31.5, centerY: 26 },
  ];

  // City map data (from original Phaser game)
  private readonly cityMap: number[][] = [
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

  constructor(scene: Scene) {
    this.scene = scene;
    this.mapContainer = new TransformNode('mapContainer', scene);
    TileFactory.initialize(scene);
  }

  /**
   * Build the city map
   */
  buildCityMap(): void {
    const mapHeight = this.cityMap.length;
    const mapWidth = this.cityMap[0].length;
    let buildingId = 0;

    // Collect positions for instancing
    const groundPositions: Vector3[] = [];
    const roadPositions: Vector3[] = [];

    // First pass: collect positions
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        const worldPos = MathUtils.tileToWorld(x, y, this.tileSize);

        if (tileType === TileType.GROUND) {
          groundPositions.push(worldPos.clone());
        } else if (tileType === TileType.ROAD) {
          roadPositions.push(worldPos.clone());
        }
      }
    }

    // Create base meshes and instances for ground and road
    const baseGround = TileFactory.createGround('base_ground');
    baseGround.setEnabled(false);
    TileFactory.createInstancedTiles(baseGround, groundPositions, 'ground');

    const baseRoad = TileFactory.createRoad('base_road');
    baseRoad.setEnabled(false);
    TileFactory.createInstancedTiles(baseRoad, roadPositions, 'road');

    // Second pass: create unique tiles
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        const worldPos = MathUtils.tileToWorld(x, y, this.tileSize);

        if (tileType === TileType.BUILDING) {
          const building = TileFactory.createBuilding(`building_${x}_${y}`);
          building.position = worldPos;
          building.parent = this.mapContainer;
          this.buildings.push(building);

          // Add collision
          this.addBuildingCollision(building, worldPos);
        } else if (tileType === TileType.FENCE) {
          // Add ground under fence
          const ground = TileFactory.createGround(`fence_ground_${x}_${y}`);
          ground.position = worldPos;
          ground.parent = this.mapContainer;

          const fence = TileFactory.createFence(`fence_${x}_${y}`);
          fence.position = worldPos;
          fence.parent = this.mapContainer;

          // Add collision
          this.addFenceCollision(fence, worldPos);
        } else if (tileType === TileType.DOOR_BATTLE || tileType === TileType.DOOR_PORTFOLIO) {
          // Add ground under door
          const ground = TileFactory.createGround(`door_ground_${x}_${y}`);
          ground.position = worldPos;
          ground.parent = this.mapContainer;

          const isPortfolio = tileType === TileType.DOOR_PORTFOLIO;
          const doorIndicator = TileFactory.createDoorIndicator(
            `door_${x}_${y}`,
            !isPortfolio
          );
          doorIndicator.position = worldPos;
          doorIndicator.parent = this.mapContainer;

          // Animate door indicator
          this.animateDoorIndicator(doorIndicator);

          this.doors.push({
            tileX: x,
            tileY: y,
            buildingId: buildingId++,
            isPortfolio,
            worldPosition: worldPos,
            mesh: doorIndicator,
          });
        } else if (tileType === TileType.WATER) {
          const water = TileFactory.createWater(`water_${x}_${y}`);
          water.position = worldPos;
          water.parent = this.mapContainer;

          // Animate water
          this.animateWater(water);
        }
      }
    }

    // Create building labels
    this.createBuildingLabels3D();
  }

  private addBuildingCollision(building: Mesh, position: Vector3): void {
    // Create invisible collision box
    const collisionBox = Mesh.CreateBox(
      'collision_' + building.name,
      1,
      this.scene
    );
    collisionBox.scaling = new Vector3(
      this.tileSize * 0.9,
      5,
      this.tileSize * 0.9
    );
    collisionBox.position = position.clone();
    collisionBox.position.y = 2.5;
    collisionBox.isVisible = false;
    collisionBox.checkCollisions = true;

    this.collisionMeshes.push(collisionBox);
  }

  private addFenceCollision(fence: Mesh, position: Vector3): void {
    const collisionBox = Mesh.CreateBox(
      'collision_' + fence.name,
      1,
      this.scene
    );
    collisionBox.scaling = new Vector3(this.tileSize, 1.2, 0.2);
    collisionBox.position = position.clone();
    collisionBox.position.y = 0.6;
    collisionBox.isVisible = false;
    collisionBox.checkCollisions = true;

    this.collisionMeshes.push(collisionBox);
  }

  private animateDoorIndicator(door: Mesh): void {
    const pulseAnim = new Animation(
      'doorPulse',
      'scaling',
      30,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    pulseAnim.setKeys([
      { frame: 0, value: new Vector3(1, 1, 1) },
      { frame: 15, value: new Vector3(1.2, 1.2, 1.2) },
      { frame: 30, value: new Vector3(1, 1, 1) },
    ]);

    door.animations = [pulseAnim];
    this.scene.beginAnimation(door, 0, 30, true);
  }

  private animateWater(water: Mesh): void {
    // Simple wave animation using vertex positions
    const waveAnim = new Animation(
      'waterWave',
      'position.y',
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    waveAnim.setKeys([
      { frame: 0, value: -0.1 },
      { frame: 30, value: -0.05 },
      { frame: 60, value: -0.1 },
    ]);

    water.animations = [waveAnim];
    this.scene.beginAnimation(water, 0, 60, true);
  }

  private createBuildingLabels3D(): void {
    // Create 3D text for building labels using simple planes
    for (const label of this.buildingLabels) {
      const worldPos = MathUtils.tileToWorld(label.centerX, label.centerY, this.tileSize);
      worldPos.y = 6; // Above buildings

      // Create a simple placeholder for now
      // Full 3D text would require dynamic textures
      const labelMesh = Mesh.CreatePlane(
        `label_${label.text}`,
        3,
        this.scene
      );
      labelMesh.position = worldPos;
      labelMesh.billboardMode = Mesh.BILLBOARDMODE_Y;

      // Will be replaced with proper dynamic texture text
    }
  }

  /**
   * Get all collision meshes for physics setup
   */
  getCollisionMeshes(): Mesh[] {
    return this.collisionMeshes;
  }

  /**
   * Get all door data
   */
  getDoors(): DoorData[] {
    return this.doors;
  }

  /**
   * Get buildings for occlusion/transparency
   */
  getBuildings(): Mesh[] {
    return this.buildings;
  }

  /**
   * Get player spawn position
   */
  getPlayerSpawnPosition(): Vector3 {
    return MathUtils.tileToWorld(9, 5, this.tileSize);
  }

  /**
   * Get valid spawn positions for enemies
   */
  getValidSpawnPositions(): Vector3[] {
    const positions: Vector3[] = [];
    const mapHeight = this.cityMap.length;
    const mapWidth = this.cityMap[0].length;

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileType = this.cityMap[y][x];
        if (tileType === TileType.GROUND || tileType === TileType.ROAD) {
          positions.push(MathUtils.tileToWorld(x, y, this.tileSize));
        }
      }
    }

    return positions;
  }

  /**
   * Check if position is walkable
   */
  isWalkable(worldPos: Vector3): boolean {
    const tile = MathUtils.worldToTile(worldPos, this.tileSize);
    if (
      tile.y < 0 ||
      tile.y >= this.cityMap.length ||
      tile.x < 0 ||
      tile.x >= this.cityMap[0].length
    ) {
      return false;
    }
    const tileType = this.cityMap[tile.y][tile.x];
    return (
      tileType === TileType.GROUND ||
      tileType === TileType.ROAD ||
      tileType === TileType.DOOR_BATTLE ||
      tileType === TileType.DOOR_PORTFOLIO
    );
  }

  dispose(): void {
    this.collisionMeshes.forEach((mesh) => mesh.dispose());
    this.buildings.forEach((mesh) => mesh.dispose());
    this.doors.forEach((door) => door.mesh.dispose());
    this.mapContainer.dispose();
  }
}
