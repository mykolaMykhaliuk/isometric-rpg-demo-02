import { Vector3, Mesh } from '@babylonjs/core';
import { WeaponType } from '../utils/Constants';

/**
 * Weapon interface for the Strategy pattern
 */
export interface IWeapon {
  // Core attack method
  attack(targetPoint: Vector3): boolean;

  // State queries
  canAttack(): boolean;
  isAttacking(): boolean;
  hasAmmo(): boolean;

  // Ammo management
  getAmmoCount(): number;
  getMaxAmmo(): number;
  addAmmo(amount: number): void;
  setAmmo(amount: number): void;

  // Properties
  getDamage(): number;
  getCooldown(): number;
  getRange(): number;
  getWeaponType(): WeaponType;

  // Lifecycle
  update(deltaTime: number): void;
  dispose(): void;

  // Optional: Get active projectiles for collision detection
  getProjectiles?(): Mesh[];
}
