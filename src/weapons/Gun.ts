import Phaser from 'phaser';
import { IWeapon, WeaponType } from './IWeapon';
import { Player } from '../entities/Player';

export class Gun implements IWeapon {
  private scene: Phaser.Scene;
  private bullets: Phaser.Physics.Arcade.Group;
  private ammo: number = 30;
  private maxAmmo: number = 30;
  private shootCooldown: number = 0;
  private shootDelay: number = 200;
  private damage: number = 20;
  private attacking: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: true,
    });
  }

  attack(time: number, pointer: Phaser.Input.Pointer, player: Player, direction?: Phaser.Math.Vector2): void {
    this.attacking = true;
    this.shoot(pointer, player, direction);
    this.shootCooldown = time + this.shootDelay;
    this.ammo--;
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo, WeaponType.GUN);

    // Reset attacking flag after a short delay
    this.scene.time.delayedCall(50, () => {
      this.attacking = false;
    });
  }

  private shoot(pointer: Phaser.Input.Pointer, player: Player, explicitDirection?: Phaser.Math.Vector2): void {
    const bullet = this.bullets.get(player.x, player.y, 'bullet') as Phaser.Physics.Arcade.Sprite;

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setDepth(bullet.y + 10);

      if (bullet.body) {
        bullet.body.enable = true;
      }

      let direction: Phaser.Math.Vector2;
      if (explicitDirection) {
        direction = explicitDirection.clone().normalize();
      } else {
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        direction = new Phaser.Math.Vector2(
          worldPoint.x - player.x,
          worldPoint.y - player.y
        ).normalize();
      }

      bullet.setVelocity(direction.x * 400, direction.y * 400);

      // Muzzle flash particle effect
      const muzzleFlash = this.scene.add.particles(
        player.x + direction.x * 12,
        player.y + direction.y * 12,
        'bullet',
        {
          speed: { min: 50, max: 150 },
          scale: { start: 0.3, end: 0 },
          lifespan: 100,
          quantity: 3,
          tint: [0xffff00, 0xffaa00, 0xff6600],
        }
      );
      muzzleFlash.setDepth(player.y + 11);
      this.scene.time.delayedCall(100, () => muzzleFlash.destroy());

      // Update bullet depth continuously as it moves
      const depthUpdateTimer = this.scene.time.addEvent({
        delay: 16,
        callback: () => {
          if (bullet.active && bullet.visible) {
            bullet.setDepth(bullet.y + 10);
          } else {
            depthUpdateTimer.remove();
          }
        },
        loop: true,
      });

      this.scene.time.delayedCall(2000, () => {
        depthUpdateTimer.remove();
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          if (bullet.body) {
            bullet.body.enable = false;
          }
        }
      });
    }
  }

  canAttack(time: number): boolean {
    return time > this.shootCooldown && this.ammo > 0;
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
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo, WeaponType.GUN);
  }

  setAmmo(amount: number): void {
    this.ammo = Math.min(Math.max(0, amount), this.maxAmmo);
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo, WeaponType.GUN);
  }

  getCooldown(): number {
    return this.shootDelay;
  }

  getDamage(): number {
    return this.damage;
  }

  getWeaponType(): WeaponType {
    return WeaponType.GUN;
  }

  isAttacking(): boolean {
    return this.attacking;
  }

  getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
}
