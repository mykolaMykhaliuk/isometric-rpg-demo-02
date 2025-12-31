import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  Color3,
  VertexData,
  StandardMaterial,
} from '@babylonjs/core';
import { MaterialLibrary } from './MaterialLibrary';
import { TileType, GAME_CONFIG } from '../utils/Constants';

/**
 * Factory for creating 3D tile meshes
 */
export class TileFactory {
  private static scene: Scene;
  private static tileSize: number = GAME_CONFIG.TILE_SIZE;

  static initialize(scene: Scene): void {
    this.scene = scene;
    MaterialLibrary.initialize(scene);
  }

  /**
   * Create a ground tile
   */
  static createGround(name: string = 'ground'): Mesh {
    const ground = MeshBuilder.CreateBox(
      name,
      {
        width: this.tileSize,
        height: 0.15,
        depth: this.tileSize,
      },
      this.scene
    );

    ground.material = MaterialLibrary.get('ground');
    ground.receiveShadows = true;
    ground.position.y = -0.075;

    return ground;
  }

  /**
   * Create a road tile with lane markings
   */
  static createRoad(name: string = 'road'): Mesh {
    const road = MeshBuilder.CreateBox(
      name,
      {
        width: this.tileSize,
        height: 0.12,
        depth: this.tileSize,
      },
      this.scene
    );

    road.material = MaterialLibrary.get('road');
    road.receiveShadows = true;
    road.position.y = -0.06;

    return road;
  }

  /**
   * Create a detailed building block with windows
   */
  static createBuilding(name: string = 'building'): Mesh {
    const parent = new Mesh(name, this.scene);

    // Main building body
    const body = MeshBuilder.CreateBox(
      name + '_body',
      {
        width: this.tileSize * 0.9,
        height: 5,
        depth: this.tileSize * 0.9,
      },
      this.scene
    );
    body.material = MaterialLibrary.get('building');
    body.position.y = 2.5;
    body.parent = parent;

    // Roof
    const roof = MeshBuilder.CreateBox(
      name + '_roof',
      {
        width: this.tileSize * 0.95,
        height: 0.3,
        depth: this.tileSize * 0.95,
      },
      this.scene
    );
    roof.material = MaterialLibrary.get('roof');
    roof.position.y = 5.15;
    roof.parent = parent;

    // Add windows (decorative cubes with emissive material)
    this.addBuildingWindows(parent, name, body);

    parent.receiveShadows = true;

    return parent;
  }

  private static addBuildingWindows(parent: Mesh, name: string, body: Mesh): void {
    const windowMat = new StandardMaterial(name + '_windowMat', this.scene);
    windowMat.diffuseColor = new Color3(0.8, 0.9, 1);
    windowMat.emissiveColor = new Color3(0.3, 0.35, 0.4);
    windowMat.alpha = 0.9;

    const windowWidth = 0.3;
    const windowHeight = 0.5;
    const windowDepth = 0.05;
    const floors = 3;
    const windowsPerFloor = 2;

    const buildingWidth = this.tileSize * 0.9;

    // Front and back windows
    for (let floor = 0; floor < floors; floor++) {
      const floorY = 1 + floor * 1.4;

      for (let w = 0; w < windowsPerFloor; w++) {
        const xOffset = (w - (windowsPerFloor - 1) / 2) * 0.6;

        // Front window
        const frontWindow = MeshBuilder.CreateBox(
          name + `_window_f_${floor}_${w}`,
          { width: windowWidth, height: windowHeight, depth: windowDepth },
          this.scene
        );
        frontWindow.material = windowMat;
        frontWindow.position = new Vector3(xOffset, floorY, buildingWidth / 2 + 0.01);
        frontWindow.parent = parent;

        // Back window
        const backWindow = MeshBuilder.CreateBox(
          name + `_window_b_${floor}_${w}`,
          { width: windowWidth, height: windowHeight, depth: windowDepth },
          this.scene
        );
        backWindow.material = windowMat;
        backWindow.position = new Vector3(xOffset, floorY, -buildingWidth / 2 - 0.01);
        backWindow.parent = parent;

        // Side windows
        const leftWindow = MeshBuilder.CreateBox(
          name + `_window_l_${floor}_${w}`,
          { width: windowDepth, height: windowHeight, depth: windowWidth },
          this.scene
        );
        leftWindow.material = windowMat;
        leftWindow.position = new Vector3(-buildingWidth / 2 - 0.01, floorY, xOffset);
        leftWindow.parent = parent;

        const rightWindow = MeshBuilder.CreateBox(
          name + `_window_r_${floor}_${w}`,
          { width: windowDepth, height: windowHeight, depth: windowWidth },
          this.scene
        );
        rightWindow.material = windowMat;
        rightWindow.position = new Vector3(buildingWidth / 2 + 0.01, floorY, xOffset);
        rightWindow.parent = parent;
      }
    }
  }

  /**
   * Create water tile with animated effect
   */
  static createWater(name: string = 'water'): Mesh {
    const water = MeshBuilder.CreateGround(
      name,
      {
        width: this.tileSize,
        height: this.tileSize,
        subdivisions: 8,
      },
      this.scene
    );

    water.material = MaterialLibrary.get('water');
    water.position.y = -0.1;

    return water;
  }

  /**
   * Create fence tile
   */
  static createFence(name: string = 'fence'): Mesh {
    const parent = new Mesh(name, this.scene);

    // Fence posts
    const postCount = 3;
    const postSpacing = this.tileSize / (postCount + 1);
    const fenceMat = MaterialLibrary.get('fence');

    for (let i = 1; i <= postCount; i++) {
      const post = MeshBuilder.CreateBox(
        name + `_post_${i}`,
        { width: 0.1, height: 1.2, depth: 0.1 },
        this.scene
      );
      post.material = fenceMat;
      post.position = new Vector3(
        -this.tileSize / 2 + i * postSpacing,
        0.6,
        0
      );
      post.parent = parent;
    }

    // Horizontal rails
    const railHeight = [0.3, 0.7, 1.0];
    for (const h of railHeight) {
      const rail = MeshBuilder.CreateBox(
        name + `_rail_${h}`,
        { width: this.tileSize * 0.95, height: 0.06, depth: 0.04 },
        this.scene
      );
      rail.material = fenceMat;
      rail.position.y = h;
      rail.parent = parent;
    }

    parent.receiveShadows = true;

    return parent;
  }

  /**
   * Create floor tile (for building interiors)
   */
  static createFloor(name: string = 'floor'): Mesh {
    const floor = MeshBuilder.CreateBox(
      name,
      {
        width: this.tileSize,
        height: 0.1,
        depth: this.tileSize,
      },
      this.scene
    );

    floor.material = MaterialLibrary.get('floor');
    floor.receiveShadows = true;
    floor.position.y = -0.05;

    return floor;
  }

  /**
   * Create wall tile (for building interiors)
   */
  static createWall(name: string = 'wall'): Mesh {
    const wall = MeshBuilder.CreateBox(
      name,
      {
        width: this.tileSize,
        height: 3,
        depth: this.tileSize,
      },
      this.scene
    );

    wall.material = MaterialLibrary.get('wall');
    wall.position.y = 1.5;

    return wall;
  }

  /**
   * Create door indicator (glowing marker)
   */
  static createDoorIndicator(name: string, isBattle: boolean): Mesh {
    const parent = new Mesh(name, this.scene);

    // Base glow circle
    const glow = MeshBuilder.CreateDisc(
      name + '_glow',
      { radius: 0.8, tessellation: 32 },
      this.scene
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.02;
    glow.material = isBattle
      ? MaterialLibrary.get('door_battle')
      : MaterialLibrary.get('door_portfolio');
    glow.parent = parent;

    // Inner marker
    const marker = MeshBuilder.CreateTorus(
      name + '_marker',
      { diameter: 0.6, thickness: 0.08, tessellation: 32 },
      this.scene
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.05;
    marker.material = isBattle
      ? MaterialLibrary.get('door_battle')
      : MaterialLibrary.get('door_portfolio');
    marker.parent = parent;

    return parent;
  }

  /**
   * Create tile by type
   */
  static createTile(type: TileType, name: string): Mesh | null {
    switch (type) {
      case TileType.GROUND:
        return this.createGround(name);
      case TileType.ROAD:
        return this.createRoad(name);
      case TileType.BUILDING:
        return this.createBuilding(name);
      case TileType.WATER:
        return this.createWater(name);
      case TileType.FENCE:
        return this.createFence(name);
      case TileType.FLOOR:
        return this.createFloor(name);
      case TileType.WALL:
        return this.createWall(name);
      case TileType.DOOR_BATTLE:
        return this.createDoorIndicator(name, true);
      case TileType.DOOR_PORTFOLIO:
        return this.createDoorIndicator(name, false);
      default:
        return this.createGround(name);
    }
  }

  /**
   * Create instanced tiles for performance
   */
  static createInstancedTiles(
    baseMesh: Mesh,
    positions: Vector3[],
    baseName: string
  ): Mesh[] {
    const instances: Mesh[] = [];

    for (let i = 0; i < positions.length; i++) {
      const instance = baseMesh.createInstance(`${baseName}_instance_${i}`);
      instance.position = positions[i];
      instances.push(instance as unknown as Mesh);
    }

    return instances;
  }
}
