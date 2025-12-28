import Phaser from 'phaser';
import { Player } from '../entities/Player';

export enum WeaponType {
  GUN = 'gun',
  SWORD = 'sword',
}

export interface IWeapon {
  attack(time: number, pointer: Phaser.Input.Pointer, player: Player, direction?: Phaser.Math.Vector2): void;
  canAttack(time: number): boolean;
  hasAmmo(): boolean;
  getAmmoCount(): number;
  getMaxAmmo(): number;
  addAmmo(amount: number): void;
  setAmmo(amount: number): void;
  getCooldown(): number;
  getDamage(): number;
  getWeaponType(): WeaponType;
  isAttacking(): boolean;
  getBullets?(): Phaser.Physics.Arcade.Group;
}
