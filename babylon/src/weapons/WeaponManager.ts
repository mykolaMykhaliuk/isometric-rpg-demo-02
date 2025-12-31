import { Scene, Vector3 } from '@babylonjs/core';
import { IWeapon } from './IWeapon';
import { Gun } from './Gun';
import { Sword } from './Sword';
import { WeaponType, GAME_CONFIG } from '../utils/Constants';
import { EventBus, GameEvents } from '../core/EventBus';

/**
 * Manages player weapon inventory and switching
 */
export class WeaponManager {
  private scene: Scene;
  private weapons: Map<WeaponType, IWeapon> = new Map();
  private currentWeapon: IWeapon;
  private currentType: WeaponType = WeaponType.GUN;

  // Switch cooldown
  private switchCooldown: number = 0;
  private switchCooldownTime: number = 0.3;

  // Auto-switch
  private lastAutoSwitch: number = 0;
  private autoSwitchCooldown: number = 1;

  // Player reference
  private getPlayerPosition: () => Vector3;
  private getPlayerRotation: () => number;
  private getEnemies: () => any[] = () => [];

  // Events
  private eventBus: EventBus;

  constructor(
    scene: Scene,
    player: { position: Vector3; rotation: number }
  ) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    // Setup getters
    this.getPlayerPosition = () => player.position;
    this.getPlayerRotation = () => player.rotation;

    // Create weapons
    this.createWeapons();

    // Set default weapon
    this.currentWeapon = this.weapons.get(WeaponType.GUN)!;

    // Emit initial state
    this.emitWeaponChanged();
  }

  private createWeapons(): void {
    // Create Gun
    const gun = new Gun(
      this.scene,
      this.getPlayerPosition,
      this.getPlayerRotation
    );
    this.weapons.set(WeaponType.GUN, gun);

    // Create Sword
    const sword = new Sword(
      this.scene,
      this.getPlayerPosition,
      this.getPlayerRotation,
      this.getEnemies
    );
    this.weapons.set(WeaponType.SWORD, sword);
  }

  /**
   * Set the enemies getter for sword hit detection
   */
  setEnemiesGetter(getEnemies: () => any[]): void {
    this.getEnemies = getEnemies;

    // Update sword reference
    const sword = this.weapons.get(WeaponType.SWORD) as Sword;
    if (sword) {
      // Recreate sword with proper enemies getter
      sword.dispose();
      const newSword = new Sword(
        this.scene,
        this.getPlayerPosition,
        this.getPlayerRotation,
        getEnemies
      );
      this.weapons.set(WeaponType.SWORD, newSword);

      if (this.currentType === WeaponType.SWORD) {
        this.currentWeapon = newSword;
      }
    }
  }

  update(deltaTime: number): void {
    // Update switch cooldown
    if (this.switchCooldown > 0) {
      this.switchCooldown -= deltaTime;
    }

    // Update all weapons
    this.weapons.forEach((weapon) => weapon.update(deltaTime));

    // Auto-switch to sword if gun is out of ammo
    const gun = this.weapons.get(WeaponType.GUN);
    if (
      this.currentType === WeaponType.GUN &&
      gun &&
      !gun.hasAmmo()
    ) {
      const now = this.scene.getEngine().getDeltaTime() / 1000;
      if (now - this.lastAutoSwitch > this.autoSwitchCooldown) {
        this.switchTo(WeaponType.SWORD);
        this.eventBus.emit(GameEvents.WEAPON_SWITCHED, WeaponType.SWORD, 'auto');
        this.lastAutoSwitch = now;
      }
    }
  }

  attack(targetPoint: Vector3): boolean {
    return this.currentWeapon.attack(targetPoint);
  }

  switchTo(weaponType: WeaponType): boolean {
    // Check cooldown
    if (this.switchCooldown > 0) return false;

    // Check if already equipped
    if (this.currentType === weaponType) return false;

    // Check if current weapon is attacking
    if (this.currentWeapon.isAttacking()) return false;

    // Get new weapon
    const newWeapon = this.weapons.get(weaponType);
    if (!newWeapon) return false;

    // Switch
    this.currentWeapon = newWeapon;
    this.currentType = weaponType;
    this.switchCooldown = this.switchCooldownTime;

    this.emitWeaponChanged();

    return true;
  }

  cycleNext(): void {
    const types = [WeaponType.GUN, WeaponType.SWORD];
    const currentIndex = types.indexOf(this.currentType);
    const nextIndex = (currentIndex + 1) % types.length;
    this.switchTo(types[nextIndex]);
  }

  cyclePrevious(): void {
    const types = [WeaponType.GUN, WeaponType.SWORD];
    const currentIndex = types.indexOf(this.currentType);
    const prevIndex = (currentIndex - 1 + types.length) % types.length;
    this.switchTo(types[prevIndex]);
  }

  private emitWeaponChanged(): void {
    this.eventBus.emit(
      GameEvents.PLAYER_WEAPON_CHANGED,
      this.currentType,
      this.currentWeapon
    );
  }

  // Getters
  getCurrentWeapon(): IWeapon {
    return this.currentWeapon;
  }

  getCurrentType(): WeaponType {
    return this.currentType;
  }

  getWeapon(type: WeaponType): IWeapon | undefined {
    return this.weapons.get(type);
  }

  getGun(): Gun | undefined {
    return this.weapons.get(WeaponType.GUN) as Gun | undefined;
  }

  getSword(): Sword | undefined {
    return this.weapons.get(WeaponType.SWORD) as Sword | undefined;
  }

  // Ammo management (for gun)
  addAmmo(amount: number): void {
    const gun = this.weapons.get(WeaponType.GUN);
    if (gun) {
      gun.addAmmo(amount);
    }
  }

  getAmmo(): number {
    const gun = this.weapons.get(WeaponType.GUN);
    return gun ? gun.getAmmoCount() : 0;
  }

  getMaxAmmo(): number {
    const gun = this.weapons.get(WeaponType.GUN);
    return gun ? gun.getMaxAmmo() : GAME_CONFIG.GUN_MAX_AMMO;
  }

  setAmmo(amount: number): void {
    const gun = this.weapons.get(WeaponType.GUN);
    if (gun) {
      gun.setAmmo(amount);
    }
  }

  resetAmmo(): void {
    const gun = this.weapons.get(WeaponType.GUN);
    if (gun) {
      gun.setAmmo(gun.getMaxAmmo());
    }
  }

  dispose(): void {
    this.weapons.forEach((weapon) => weapon.dispose());
    this.weapons.clear();
  }
}
