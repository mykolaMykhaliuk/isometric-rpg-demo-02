import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  ParticleSystem,
  Color4,
  Texture,
  Animation,
} from '@babylonjs/core';
import { IWeapon } from './IWeapon';
import { WeaponType, GAME_CONFIG } from '../utils/Constants';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { EventBus, GameEvents } from '../core/EventBus';
import { MathUtils } from '../utils/MathUtils';

interface Bullet {
  mesh: Mesh;
  velocity: Vector3;
  lifetime: number;
  active: boolean;
}

/**
 * Ranged weapon with projectile bullets
 */
export class Gun implements IWeapon {
  private scene: Scene;
  private playerPosition: () => Vector3;
  private playerRotation: () => number;

  // Stats
  private ammo: number = GAME_CONFIG.GUN_MAX_AMMO;
  private maxAmmo: number = GAME_CONFIG.GUN_MAX_AMMO;
  private damage: number = GAME_CONFIG.GUN_DAMAGE;
  private cooldown: number = 0;
  private cooldownTime: number = GAME_CONFIG.GUN_COOLDOWN;
  private bulletSpeed: number = GAME_CONFIG.GUN_BULLET_SPEED;
  private bulletLifetime: number = GAME_CONFIG.GUN_BULLET_LIFETIME;

  // Bullet pool
  private bulletPool: Bullet[] = [];
  private readonly poolSize: number = 50;

  // State
  private attacking: boolean = false;

  // Events
  private eventBus: EventBus;

  constructor(
    scene: Scene,
    getPosition: () => Vector3,
    getRotation: () => number
  ) {
    this.scene = scene;
    this.playerPosition = getPosition;
    this.playerRotation = getRotation;
    this.eventBus = EventBus.getInstance();

    this.createBulletPool();
    this.emitAmmoChanged();
  }

  private createBulletPool(): void {
    const bulletMat = MaterialLibrary.get('bullet');

    for (let i = 0; i < this.poolSize; i++) {
      const bullet = MeshBuilder.CreateSphere(
        `bullet_${i}`,
        { diameter: 0.15, segments: 8 },
        this.scene
      );
      bullet.material = bulletMat;
      bullet.setEnabled(false);

      // Add glow effect using scaling
      bullet.scaling = new Vector3(1, 1, 1.5);

      this.bulletPool.push({
        mesh: bullet,
        velocity: Vector3.Zero(),
        lifetime: 0,
        active: false,
      });
    }
  }

  private getPooledBullet(): Bullet | null {
    for (const bullet of this.bulletPool) {
      if (!bullet.active) {
        return bullet;
      }
    }
    return null;
  }

  attack(targetPoint: Vector3): boolean {
    if (!this.canAttack()) return false;

    const bullet = this.getPooledBullet();
    if (!bullet) return false;

    // Get player position and calculate direction
    const playerPos = this.playerPosition();
    const spawnPos = playerPos.clone();
    spawnPos.y = 1.0; // Gun height

    // Calculate direction to target
    const direction = targetPoint.subtract(spawnPos);
    direction.y = 0;
    direction.normalize();

    // Offset spawn position forward
    spawnPos.addInPlace(direction.scale(0.5));

    // Setup bullet
    bullet.mesh.position = spawnPos;
    bullet.mesh.setEnabled(true);
    bullet.velocity = direction.scale(this.bulletSpeed);
    bullet.lifetime = this.bulletLifetime;
    bullet.active = true;

    // Rotate bullet to face direction
    bullet.mesh.rotation.y = Math.atan2(direction.x, direction.z);

    // Create muzzle flash
    this.createMuzzleFlash(spawnPos, direction);

    // Update state
    this.ammo--;
    this.cooldown = this.cooldownTime;
    this.attacking = true;

    setTimeout(() => {
      this.attacking = false;
    }, 50);

    this.emitAmmoChanged();
    this.eventBus.emit(GameEvents.WEAPON_FIRED, WeaponType.GUN);

    return true;
  }

  private createMuzzleFlash(position: Vector3, direction: Vector3): void {
    const particleSystem = new ParticleSystem('muzzleFlash', 20, this.scene);

    // Particle texture (using a simple sphere mesh as emitter)
    const emitter = position.add(direction.scale(0.3));
    particleSystem.emitter = emitter;

    // Particle properties
    particleSystem.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
    particleSystem.maxEmitBox = new Vector3(0.05, 0.05, 0.05);

    particleSystem.color1 = new Color4(1, 1, 0.3, 1);
    particleSystem.color2 = new Color4(1, 0.5, 0, 1);
    particleSystem.colorDead = new Color4(1, 0.2, 0, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    particleSystem.minLifeTime = 0.05;
    particleSystem.maxLifeTime = 0.1;

    particleSystem.emitRate = 200;
    particleSystem.manualEmitCount = 20;

    particleSystem.direction1 = direction.scale(5).add(new Vector3(-1, -1, -1));
    particleSystem.direction2 = direction.scale(8).add(new Vector3(1, 1, 1));

    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 4;

    particleSystem.gravity = new Vector3(0, -2, 0);

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    // Start and auto-dispose
    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 100);
  }

  update(deltaTime: number): void {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }

    // Update bullets
    for (const bullet of this.bulletPool) {
      if (!bullet.active) continue;

      // Move bullet
      bullet.mesh.position.addInPlace(bullet.velocity.scale(deltaTime));

      // Update lifetime
      bullet.lifetime -= deltaTime;

      // Deactivate if expired
      if (bullet.lifetime <= 0) {
        this.deactivateBullet(bullet);
      }
    }
  }

  deactivateBullet(bullet: Bullet): void {
    bullet.active = false;
    bullet.mesh.setEnabled(false);
  }

  // Get active bullets for collision detection
  getProjectiles(): Mesh[] {
    return this.bulletPool
      .filter((b) => b.active)
      .map((b) => b.mesh);
  }

  getActiveBullets(): Bullet[] {
    return this.bulletPool.filter((b) => b.active);
  }

  handleBulletHit(bullet: Bullet, hitPoint: Vector3): void {
    this.deactivateBullet(bullet);
    this.createHitEffect(hitPoint);
  }

  private createHitEffect(position: Vector3): void {
    const particleSystem = new ParticleSystem('bulletHit', 15, this.scene);
    particleSystem.emitter = position;

    particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1);

    particleSystem.color1 = new Color4(1, 0.8, 0.2, 1);
    particleSystem.color2 = new Color4(1, 0.4, 0, 1);
    particleSystem.colorDead = new Color4(0.5, 0.2, 0, 0);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.2;

    particleSystem.emitRate = 100;
    particleSystem.manualEmitCount = 15;

    particleSystem.direction1 = new Vector3(-2, -2, -2);
    particleSystem.direction2 = new Vector3(2, 2, 2);

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 200);
  }

  private emitAmmoChanged(): void {
    this.eventBus.emit(
      GameEvents.PLAYER_AMMO_CHANGED,
      this.ammo,
      this.maxAmmo,
      WeaponType.GUN
    );
  }

  // IWeapon interface implementation
  canAttack(): boolean {
    return this.cooldown <= 0 && this.ammo > 0;
  }

  isAttacking(): boolean {
    return this.attacking;
  }

  hasAmmo(): boolean {
    return this.ammo > 0;
  }

  getAmmoCount(): number {
    return this.ammo;
  }

  getMaxAmmo(): number {
    return this.maxAmmo;
  }

  addAmmo(amount: number): void {
    this.ammo = Math.min(this.ammo + amount, this.maxAmmo);
    this.emitAmmoChanged();
  }

  setAmmo(amount: number): void {
    this.ammo = Math.max(0, Math.min(amount, this.maxAmmo));
    this.emitAmmoChanged();
  }

  getDamage(): number {
    return this.damage;
  }

  getCooldown(): number {
    return this.cooldownTime;
  }

  getRange(): number {
    return this.bulletSpeed * this.bulletLifetime;
  }

  getWeaponType(): WeaponType {
    return WeaponType.GUN;
  }

  dispose(): void {
    for (const bullet of this.bulletPool) {
      bullet.mesh.dispose();
    }
    this.bulletPool = [];
  }
}
