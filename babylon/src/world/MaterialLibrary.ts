import {
  Scene,
  StandardMaterial,
  Color3,
  PBRMaterial,
  Material,
} from '@babylonjs/core';
import { COLORS } from '../utils/Constants';

/**
 * Centralized material management for consistent visuals
 */
export class MaterialLibrary {
  private static materials: Map<string, StandardMaterial | PBRMaterial> = new Map();
  private static scene: Scene;
  private static initialized: boolean = false;

  static initialize(scene: Scene): void {
    if (this.initialized) return;
    this.scene = scene;
    this.createAllMaterials();
    this.initialized = true;
  }

  private static createAllMaterials(): void {
    // Environment materials
    this.createGroundMaterial();
    this.createRoadMaterial();
    this.createBuildingMaterial();
    this.createRoofMaterial();
    this.createWaterMaterial();
    this.createFenceMaterial();
    this.createFloorMaterial();
    this.createWallMaterial();

    // Entity materials
    this.createPlayerMaterial();
    this.createPlayerAccentMaterial();
    this.createEnemyMaterial();

    // Pickup materials
    this.createAmmoMaterial();
    this.createHealthMaterial();
    this.createArmorBlueMaterial();
    this.createArmorRedMaterial();

    // Effect materials
    this.createBulletMaterial();
    this.createSwordTrailMaterial();
    this.createDoorBattleMaterial();
    this.createDoorPortfolioMaterial();
  }

  // Environment materials
  private static createGroundMaterial(): void {
    const mat = new PBRMaterial('mat_ground', this.scene);
    mat.albedoColor = new Color3(COLORS.GROUND.r, COLORS.GROUND.g, COLORS.GROUND.b);
    mat.metallic = 0;
    mat.roughness = 0.9;
    mat.freeze();
    this.materials.set('ground', mat);
  }

  private static createRoadMaterial(): void {
    const mat = new PBRMaterial('mat_road', this.scene);
    mat.albedoColor = new Color3(COLORS.ROAD.r, COLORS.ROAD.g, COLORS.ROAD.b);
    mat.metallic = 0.1;
    mat.roughness = 0.7;
    mat.freeze();
    this.materials.set('road', mat);
  }

  private static createBuildingMaterial(): void {
    const mat = new PBRMaterial('mat_building', this.scene);
    mat.albedoColor = new Color3(COLORS.BUILDING.r, COLORS.BUILDING.g, COLORS.BUILDING.b);
    mat.metallic = 0;
    mat.roughness = 0.8;
    this.materials.set('building', mat);
  }

  private static createRoofMaterial(): void {
    const mat = new PBRMaterial('mat_roof', this.scene);
    mat.albedoColor = new Color3(COLORS.BUILDING_ROOF.r, COLORS.BUILDING_ROOF.g, COLORS.BUILDING_ROOF.b);
    mat.metallic = 0.2;
    mat.roughness = 0.6;
    mat.freeze();
    this.materials.set('roof', mat);
  }

  private static createWaterMaterial(): void {
    const mat = new PBRMaterial('mat_water', this.scene);
    mat.albedoColor = new Color3(COLORS.WATER.r, COLORS.WATER.g, COLORS.WATER.b);
    mat.metallic = 0.3;
    mat.roughness = 0.1;
    mat.alpha = 0.8;
    mat.freeze();
    this.materials.set('water', mat);
  }

  private static createFenceMaterial(): void {
    const mat = new PBRMaterial('mat_fence', this.scene);
    mat.albedoColor = new Color3(COLORS.FENCE.r, COLORS.FENCE.g, COLORS.FENCE.b);
    mat.metallic = 0;
    mat.roughness = 0.85;
    mat.freeze();
    this.materials.set('fence', mat);
  }

  private static createFloorMaterial(): void {
    const mat = new PBRMaterial('mat_floor', this.scene);
    mat.albedoColor = new Color3(COLORS.FLOOR.r, COLORS.FLOOR.g, COLORS.FLOOR.b);
    mat.metallic = 0.1;
    mat.roughness = 0.6;
    mat.freeze();
    this.materials.set('floor', mat);
  }

  private static createWallMaterial(): void {
    const mat = new PBRMaterial('mat_wall', this.scene);
    mat.albedoColor = new Color3(COLORS.WALL.r, COLORS.WALL.g, COLORS.WALL.b);
    mat.metallic = 0;
    mat.roughness = 0.8;
    mat.freeze();
    this.materials.set('wall', mat);
  }

  // Entity materials
  private static createPlayerMaterial(): void {
    const mat = new PBRMaterial('mat_player', this.scene);
    mat.albedoColor = new Color3(COLORS.PLAYER.r, COLORS.PLAYER.g, COLORS.PLAYER.b);
    mat.metallic = 0.4;
    mat.roughness = 0.4;
    mat.emissiveColor = new Color3(0.05, 0.1, 0.2);
    this.materials.set('player', mat);
  }

  private static createPlayerAccentMaterial(): void {
    const mat = new PBRMaterial('mat_player_accent', this.scene);
    mat.albedoColor = new Color3(COLORS.PLAYER_ACCENT.r, COLORS.PLAYER_ACCENT.g, COLORS.PLAYER_ACCENT.b);
    mat.metallic = 0.6;
    mat.roughness = 0.3;
    mat.emissiveColor = new Color3(0.2, 0.15, 0.05);
    this.materials.set('player_accent', mat);
  }

  private static createEnemyMaterial(): void {
    const mat = new PBRMaterial('mat_enemy', this.scene);
    mat.albedoColor = new Color3(COLORS.ENEMY.r, COLORS.ENEMY.g, COLORS.ENEMY.b);
    mat.metallic = 0.2;
    mat.roughness = 0.5;
    mat.emissiveColor = new Color3(COLORS.ENEMY_GLOW.r, COLORS.ENEMY_GLOW.g, COLORS.ENEMY_GLOW.b);
    this.materials.set('enemy', mat);
  }

  // Pickup materials
  private static createAmmoMaterial(): void {
    const mat = new PBRMaterial('mat_ammo', this.scene);
    mat.albedoColor = new Color3(COLORS.AMMO.r, COLORS.AMMO.g, COLORS.AMMO.b);
    mat.metallic = 0.8;
    mat.roughness = 0.2;
    mat.emissiveColor = new Color3(0.3, 0.25, 0);
    this.materials.set('ammo', mat);
  }

  private static createHealthMaterial(): void {
    const mat = new PBRMaterial('mat_health', this.scene);
    mat.albedoColor = new Color3(COLORS.HEALTH.r, COLORS.HEALTH.g, COLORS.HEALTH.b);
    mat.metallic = 0.3;
    mat.roughness = 0.4;
    mat.emissiveColor = new Color3(0.3, 0.05, 0.05);
    this.materials.set('health', mat);
  }

  private static createArmorBlueMaterial(): void {
    const mat = new PBRMaterial('mat_armor_blue', this.scene);
    mat.albedoColor = new Color3(COLORS.ARMOR_BLUE.r, COLORS.ARMOR_BLUE.g, COLORS.ARMOR_BLUE.b);
    mat.metallic = 0.7;
    mat.roughness = 0.2;
    mat.emissiveColor = new Color3(0.05, 0.1, 0.3);
    this.materials.set('armor_blue', mat);
  }

  private static createArmorRedMaterial(): void {
    const mat = new PBRMaterial('mat_armor_red', this.scene);
    mat.albedoColor = new Color3(COLORS.ARMOR_RED.r, COLORS.ARMOR_RED.g, COLORS.ARMOR_RED.b);
    mat.metallic = 0.7;
    mat.roughness = 0.2;
    mat.emissiveColor = new Color3(0.3, 0.05, 0.05);
    this.materials.set('armor_red', mat);
  }

  // Effect materials
  private static createBulletMaterial(): void {
    const mat = new StandardMaterial('mat_bullet', this.scene);
    mat.diffuseColor = new Color3(COLORS.BULLET.r, COLORS.BULLET.g, COLORS.BULLET.b);
    mat.emissiveColor = new Color3(1, 0.6, 0);
    mat.disableLighting = true;
    this.materials.set('bullet', mat);
  }

  private static createSwordTrailMaterial(): void {
    const mat = new StandardMaterial('mat_sword_trail', this.scene);
    mat.diffuseColor = new Color3(COLORS.SWORD_TRAIL.r, COLORS.SWORD_TRAIL.g, COLORS.SWORD_TRAIL.b);
    mat.emissiveColor = new Color3(0.5, 0.55, 0.6);
    mat.alpha = 0.7;
    mat.disableLighting = true;
    this.materials.set('sword_trail', mat);
  }

  private static createDoorBattleMaterial(): void {
    const mat = new StandardMaterial('mat_door_battle', this.scene);
    mat.diffuseColor = new Color3(COLORS.DOOR_BATTLE.r, COLORS.DOOR_BATTLE.g, COLORS.DOOR_BATTLE.b);
    mat.emissiveColor = new Color3(0.5, 0, 0);
    mat.alpha = 0.7;
    this.materials.set('door_battle', mat);
  }

  private static createDoorPortfolioMaterial(): void {
    const mat = new StandardMaterial('mat_door_portfolio', this.scene);
    mat.diffuseColor = new Color3(COLORS.DOOR_PORTFOLIO.r, COLORS.DOOR_PORTFOLIO.g, COLORS.DOOR_PORTFOLIO.b);
    mat.emissiveColor = new Color3(0, 0.5, 0);
    mat.alpha = 0.7;
    this.materials.set('door_portfolio', mat);
  }

  // Getters
  static get(name: string): Material | null {
    return this.materials.get(name) ?? null;
  }

  static getClone(name: string): StandardMaterial | PBRMaterial | undefined {
    const original = this.materials.get(name);
    if (original) {
      return original.clone(name + '_clone') as StandardMaterial | PBRMaterial;
    }
    return undefined;
  }

  static dispose(): void {
    this.materials.forEach((mat) => mat.dispose());
    this.materials.clear();
    this.initialized = false;
  }
}
