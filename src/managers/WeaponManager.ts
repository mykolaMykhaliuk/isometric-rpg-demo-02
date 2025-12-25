import { IWeapon, WeaponType } from '../weapons/IWeapon';
import { Gun } from '../weapons/Gun';
import { Sword } from '../weapons/Sword';
import Phaser from 'phaser';

export class WeaponManager {
  private weapons: Map<WeaponType, IWeapon>;
  private currentWeapon: IWeapon;

  constructor(scene: Phaser.Scene) {
    this.weapons = new Map();

    // Initialize weapons
    const gun = new Gun(scene);
    const sword = new Sword(scene);

    this.weapons.set(WeaponType.GUN, gun);
    this.weapons.set(WeaponType.SWORD, sword);

    // Start with gun equipped
    this.currentWeapon = gun;
  }

  getWeapon(weaponType: WeaponType): IWeapon | undefined {
    return this.weapons.get(weaponType);
  }

  getCurrentWeapon(): IWeapon {
    return this.currentWeapon;
  }

  setCurrentWeapon(weaponType: WeaponType): boolean {
    const weapon = this.weapons.get(weaponType);
    if (weapon) {
      this.currentWeapon = weapon;
      return true;
    }
    return false;
  }

  getAllWeapons(): WeaponType[] {
    return Array.from(this.weapons.keys());
  }
}
