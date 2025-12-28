import Phaser from 'phaser';
import { IWeapon, WeaponType } from './IWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export class Sword implements IWeapon {
  private scene: Phaser.Scene;
  private swingCooldown: number = 0;
  private swingDelay: number = 400;
  private damage: number = 35;
  private range: number = 60;
  private arcAngle: number = 90;
  private currentSwingHitEnemies: Set<Enemy> = new Set();
  private attacking: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  attack(time: number, pointer: Phaser.Input.Pointer, player: Player, explicitDirection?: Phaser.Math.Vector2): void {
    this.attacking = true;
    this.currentSwingHitEnemies.clear();

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

    const aimAngle = Math.atan2(direction.y, direction.x);

    // Create sword swing visual effect
    this.createSwingEffect(player, direction, aimAngle);

    // Detect and damage enemies in arc
    this.detectAndDamageEnemies(player, aimAngle);

    this.swingCooldown = time + this.swingDelay;

    // Reset attacking flag after swing animation
    this.scene.time.delayedCall(200, () => {
      this.attacking = false;
    });
  }

  private createSwingEffect(
    player: Player,
    direction: Phaser.Math.Vector2,
    angle: number
  ): void {
    // Sword gleam particles at player position
    const swordGleam = this.scene.add.particles(
      player.x + direction.x * 15,
      player.y + direction.y * 15,
      'bullet',
      {
        speed: { min: 80, max: 150 },
        scale: { start: 0.5, end: 0 },
        lifespan: 150,
        quantity: 8,
        tint: [0xcccccc, 0xaaaaaa, 0x888888],
        angle: {
          min: Phaser.Math.RadToDeg(angle - Math.PI / 4),
          max: Phaser.Math.RadToDeg(angle + Math.PI / 4),
        },
      }
    );
    swordGleam.setDepth(player.y + 12);
    this.scene.time.delayedCall(150, () => swordGleam.destroy());

    // Slash trail arc
    const slashTrail = this.scene.add.graphics();
    slashTrail.lineStyle(4, 0xcccccc, 0.8);
    slashTrail.beginPath();
    slashTrail.arc(
      player.x,
      player.y,
      this.range * 0.7,
      angle - Phaser.Math.DegToRad(this.arcAngle / 2),
      angle + Phaser.Math.DegToRad(this.arcAngle / 2),
      false
    );
    slashTrail.strokePath();
    slashTrail.setDepth(player.y + 11);

    // Fade out trail
    this.scene.tweens.add({
      targets: slashTrail,
      alpha: 0,
      duration: 200,
      onComplete: () => slashTrail.destroy(),
    });
  }

  private detectAndDamageEnemies(player: Player, aimAngle: number): void {
    // Get enemies from the current scene
    const currentScene = this.scene as any;
    const enemies: Phaser.Physics.Arcade.Group =
      currentScene.enemies || currentScene.getEnemies?.();

    if (!enemies) return;

    const enemiesInArc = this.detectEnemiesInArc(player, aimAngle, enemies);

    enemiesInArc.forEach((enemy) => {
      if (!this.currentSwingHitEnemies.has(enemy)) {
        enemy.takeDamage(this.damage);
        this.currentSwingHitEnemies.add(enemy);

        // Hit effect particles at enemy position
        const hitEffect = this.scene.add.particles(enemy.x, enemy.y, 'bullet', {
          speed: { min: 30, max: 80 },
          scale: { start: 0.3, end: 0 },
          lifespan: 150,
          quantity: 4,
          tint: [0xcccccc, 0xaaaaaa, 0x888888],
        });
        hitEffect.setDepth(enemy.y + 10);
        this.scene.time.delayedCall(150, () => hitEffect.destroy());
      }
    });
  }

  private detectEnemiesInArc(
    player: Player,
    aimAngle: number,
    enemies: Phaser.Physics.Arcade.Group
  ): Enemy[] {
    const hitEnemies: Enemy[] = [];

    enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active || enemy.isEnemyDying()) return;

      // Distance check
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        enemy.x,
        enemy.y
      );
      if (distance > this.range) return;

      // Angle check
      const enemyAngle = Phaser.Math.Angle.Between(
        player.x,
        player.y,
        enemy.x,
        enemy.y
      );
      const angleDiff = Phaser.Math.Angle.Wrap(enemyAngle - aimAngle);

      if (Math.abs(angleDiff) <= Phaser.Math.DegToRad(this.arcAngle / 2)) {
        hitEnemies.push(enemy);
      }
    });

    return hitEnemies;
  }

  canAttack(time: number): boolean {
    return time > this.swingCooldown;
  }

  hasAmmo(): boolean {
    return true; // Sword has unlimited use
  }

  getAmmoCount(): number {
    return -1; // Infinite ammo
  }

  getMaxAmmo(): number {
    return -1; // Infinite ammo
  }

  addAmmo(_amount: number): void {
    // Sword doesn't use ammo
  }

  setAmmo(_amount: number): void {
    // Sword doesn't use ammo
  }

  getCooldown(): number {
    return this.swingDelay;
  }

  getDamage(): number {
    return this.damage;
  }

  getWeaponType(): WeaponType {
    return WeaponType.SWORD;
  }

  isAttacking(): boolean {
    return this.attacking;
  }
}
