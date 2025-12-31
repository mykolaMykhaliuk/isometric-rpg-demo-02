import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  ParticleSystem,
  Color4,
  Animation,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { IWeapon } from './IWeapon';
import { WeaponType, GAME_CONFIG } from '../utils/Constants';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { EventBus, GameEvents } from '../core/EventBus';
import { MathUtils } from '../utils/MathUtils';

/**
 * Melee weapon with arc-based attack
 */
export class Sword implements IWeapon {
  private scene: Scene;
  private playerPosition: () => Vector3;
  private playerRotation: () => number;
  private getEnemies: () => any[];

  // Stats
  private damage: number = GAME_CONFIG.SWORD_DAMAGE;
  private cooldown: number = 0;
  private cooldownTime: number = GAME_CONFIG.SWORD_COOLDOWN;
  private range: number = GAME_CONFIG.SWORD_RANGE;
  private arcAngle: number = GAME_CONFIG.SWORD_ARC_ANGLE;

  // State
  private attacking: boolean = false;
  private currentSwingHitEnemies: Set<any> = new Set();

  // Visual
  private trailMesh: Mesh | null = null;

  // Events
  private eventBus: EventBus;

  constructor(
    scene: Scene,
    getPosition: () => Vector3,
    getRotation: () => number,
    getEnemies: () => any[]
  ) {
    this.scene = scene;
    this.playerPosition = getPosition;
    this.playerRotation = getRotation;
    this.getEnemies = getEnemies;
    this.eventBus = EventBus.getInstance();
  }

  attack(targetPoint: Vector3): boolean {
    if (!this.canAttack()) return false;

    this.attacking = true;
    this.currentSwingHitEnemies.clear();

    const playerPos = this.playerPosition();
    const direction = targetPoint.subtract(playerPos);
    direction.y = 0;
    direction.normalize();

    const aimAngle = Math.atan2(direction.x, direction.z);

    // Create visual swing effect
    this.createSwingEffect(playerPos, aimAngle);

    // Create swing particles
    this.createSwingParticles(playerPos, direction);

    // Detect and damage enemies in arc
    this.detectAndDamageEnemies(playerPos, aimAngle);

    // Update state
    this.cooldown = this.cooldownTime;

    setTimeout(() => {
      this.attacking = false;
    }, 200);

    this.eventBus.emit(GameEvents.WEAPON_FIRED, WeaponType.SWORD);

    return true;
  }

  private createSwingEffect(origin: Vector3, aimAngle: number): void {
    // Create arc mesh for visual feedback
    const arcMesh = this.createArcMesh(origin, aimAngle);

    if (arcMesh) {
      // Fade out animation
      const fadeAnim = new Animation(
        'swordFade',
        'visibility',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      fadeAnim.setKeys([
        { frame: 0, value: 0.8 },
        { frame: 12, value: 0 },
      ]);

      // Scale animation
      const scaleAnim = new Animation(
        'swordScale',
        'scaling',
        60,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      scaleAnim.setKeys([
        { frame: 0, value: new Vector3(0.8, 1, 0.8) },
        { frame: 12, value: new Vector3(1.2, 1, 1.2) },
      ]);

      arcMesh.animations = [fadeAnim, scaleAnim];

      this.scene.beginAnimation(arcMesh, 0, 12, false, 1, () => {
        arcMesh.dispose();
      });
    }
  }

  private createArcMesh(origin: Vector3, aimAngle: number): Mesh | null {
    // Create a torus segment for the sword trail
    // Use type assertion to allow 'arc' parameter which exists at runtime
    const arc = MeshBuilder.CreateTorus(
      'swordArc',
      {
        diameter: this.range * 2,
        thickness: 0.1,
        tessellation: 32,
        arc: this.arcAngle / (Math.PI * 2),
      } as any,
      this.scene
    );

    arc.position = origin.clone();
    arc.position.y = 1.0;
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = aimAngle - this.arcAngle / 2;

    const trailMat = MaterialLibrary.get('sword_trail');
    arc.material = trailMat;

    return arc;
  }

  private createSwingParticles(origin: Vector3, direction: Vector3): void {
    const particlePos = origin.clone();
    particlePos.y = 1.0;
    particlePos.addInPlace(direction.scale(this.range * 0.5));

    const particleSystem = new ParticleSystem('swordSwing', 30, this.scene);
    particleSystem.emitter = particlePos;

    particleSystem.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
    particleSystem.maxEmitBox = new Vector3(0.2, 0.2, 0.2);

    particleSystem.color1 = new Color4(0.8, 0.85, 0.9, 1);
    particleSystem.color2 = new Color4(0.6, 0.65, 0.7, 1);
    particleSystem.colorDead = new Color4(0.5, 0.55, 0.6, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.15;

    particleSystem.emitRate = 200;
    particleSystem.manualEmitCount = 30;

    // Direction based on swing arc
    const perpendicular = new Vector3(-direction.z, 0, direction.x);
    particleSystem.direction1 = perpendicular.scale(3).add(direction.scale(2));
    particleSystem.direction2 = perpendicular.scale(-3).add(direction.scale(4));

    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 5;

    particleSystem.gravity = new Vector3(0, -1, 0);

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 150);
  }

  private detectAndDamageEnemies(origin: Vector3, aimAngle: number): void {
    const enemies = this.getEnemies();

    for (const enemy of enemies) {
      if (!enemy || !enemy.isActive || this.currentSwingHitEnemies.has(enemy)) {
        continue;
      }

      const enemyPos = enemy.position;
      if (!enemyPos) continue;

      // Distance check
      const distance = MathUtils.distanceXZ(origin, enemyPos);
      if (distance > this.range) continue;

      // Angle check
      const toEnemy = enemyPos.subtract(origin);
      toEnemy.y = 0;
      const enemyAngle = Math.atan2(toEnemy.x, toEnemy.z);

      if (MathUtils.isWithinArc(enemyAngle, aimAngle, this.arcAngle)) {
        // Hit!
        enemy.takeDamage(this.damage);
        this.currentSwingHitEnemies.add(enemy);

        // Create hit effect
        this.createHitEffect(enemyPos);
      }
    }
  }

  private createHitEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('swordHit', 20, this.scene);
    particleSystem.emitter = position.clone();

    particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1);

    particleSystem.color1 = new Color4(0.9, 0.9, 0.9, 1);
    particleSystem.color2 = new Color4(0.7, 0.7, 0.8, 1);
    particleSystem.colorDead = new Color4(0.5, 0.5, 0.6, 0);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.15;

    particleSystem.emitRate = 150;
    particleSystem.manualEmitCount = 20;

    particleSystem.direction1 = new Vector3(-2, -1, -2);
    particleSystem.direction2 = new Vector3(2, 3, 2);

    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 150);
  }

  update(deltaTime: number): void {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }
  }

  // IWeapon interface implementation
  canAttack(): boolean {
    return this.cooldown <= 0;
  }

  isAttacking(): boolean {
    return this.attacking;
  }

  hasAmmo(): boolean {
    return true; // Sword has unlimited use
  }

  getAmmoCount(): number {
    return -1; // Infinite
  }

  getMaxAmmo(): number {
    return -1; // Infinite
  }

  addAmmo(_amount: number): void {
    // Sword doesn't use ammo
  }

  setAmmo(_amount: number): void {
    // Sword doesn't use ammo
  }

  getDamage(): number {
    return this.damage;
  }

  getCooldown(): number {
    return this.cooldownTime;
  }

  getRange(): number {
    return this.range;
  }

  getWeaponType(): WeaponType {
    return WeaponType.SWORD;
  }

  dispose(): void {
    if (this.trailMesh) {
      this.trailMesh.dispose();
    }
  }
}
