import Phaser from 'phaser';
import { Player } from './Player';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health: number = 30;
  private speed: number = 60;
  private damage: number = 10;
  private attackCooldown: number = 0;
  private attackDelay: number = 1000;
  private detectionRange: number = 300;
  private attackRange: number = 30;
  private wanderTarget: Phaser.Math.Vector2 | null = null;
  private wanderTimer: number = 0;
  private player: Player | null = null;
  private isDying: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_bug');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(1.2);

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(24, 20);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(4, 8);
    }
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  update(time: number, _delta: number): void {
    if (!this.player || !this.active || this.isDying) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y
    );

    if (distanceToPlayer < this.detectionRange) {
      this.chasePlayer(distanceToPlayer, time);
    } else {
      this.wander(time);
    }

    this.updateDepth();
    this.updateAnimation();
  }

  private chasePlayer(distance: number, time: number): void {
    if (!this.player) return;

    if (distance > this.attackRange) {
      const direction = new Phaser.Math.Vector2(
        this.player.x - this.x,
        this.player.y - this.y
      ).normalize();

      this.setVelocity(direction.x * this.speed * 1.5, direction.y * this.speed * 1.5);
    } else {
      this.setVelocity(0, 0);
      this.attack(time);
    }
  }

  private attack(time: number): void {
    if (!this.player || time < this.attackCooldown) return;

    this.player.takeDamage(this.damage);
    this.attackCooldown = time + this.attackDelay;

    // Visual feedback
    this.setTint(0xff6666);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });
  }

  private wander(time: number): void {
    if (time > this.wanderTimer || !this.wanderTarget) {
      this.wanderTarget = new Phaser.Math.Vector2(
        this.x + Phaser.Math.Between(-100, 100),
        this.y + Phaser.Math.Between(-100, 100)
      );
      this.wanderTimer = time + Phaser.Math.Between(2000, 4000);
    }

    const distanceToTarget = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.wanderTarget.x,
      this.wanderTarget.y
    );

    if (distanceToTarget > 10) {
      const direction = new Phaser.Math.Vector2(
        this.wanderTarget.x - this.x,
        this.wanderTarget.y - this.y
      ).normalize();

      this.setVelocity(direction.x * this.speed, direction.y * this.speed);
    } else {
      this.setVelocity(0, 0);
    }
  }

  private updateDepth(): void {
    this.setDepth(this.y);
  }

  private updateAnimation(): void {
    const vel = this.body?.velocity;
    if (vel && vel.x !== 0) {
      this.setFlipX(vel.x < 0);
    }
  }

  takeDamage(amount: number): boolean {
    // Prevent damage if already dying
    if (this.isDying || !this.active) return false;

    this.health -= amount;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    // Prevent multiple die() calls
    if (this.isDying) return;
    this.isDying = true;

    // Stop all movement and disable physics body immediately
    this.setVelocity(0, 0);
    if (this.body) {
      this.body.enable = false;
    }
    
    // Mark as inactive immediately to prevent collision callbacks
    this.setActive(false);

    this.scene.events.emit('enemyKilled', 10);

    // Explosion particle effect
    const explosion = this.scene.add.particles(
      this.x,
      this.y,
      'bullet',
      {
        speed: { min: 80, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 8,
        tint: [0x44aa44, 0x66cc66, 0x88ff88, 0xffff00],
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 8), quantity: 8 },
      }
    );
    explosion.setDepth(this.y + 5);
    this.scene.time.delayedCall(300, () => explosion.destroy());

    // Death animation with rotation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      angle: 360,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  getHealth(): number {
    return this.health;
  }

  isEnemyDying(): boolean {
    return this.isDying;
  }
}
