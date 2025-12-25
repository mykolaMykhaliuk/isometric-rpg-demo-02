import Phaser from 'phaser';
import { Player } from './Player';

export class Ammo extends Phaser.Physics.Arcade.Sprite {
  private ammoAmount: number = 15;
  private pickupRange: number = 30;
  private player: Player | null = null;
  private isPickedUp: boolean = false;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.003;
  private baseY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ammo');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setScale(1.0);
    this.setDepth(y + 5);
    this.baseY = y;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(16, 16);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(0, 0);
    }

    // Initial float offset
    this.floatOffset = Phaser.Math.Between(0, Math.PI * 2);
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  update(time: number, _delta: number): void {
    if (!this.active || this.isPickedUp) return;

    // Floating animation
    this.floatOffset += this.floatSpeed;
    const floatAmount = Math.sin(this.floatOffset) * 2;
    this.y = this.baseY + floatAmount;
    
    // Subtle rotation animation
    this.angle = Math.sin(this.floatOffset * 0.5) * 5;

    // Check for player pickup
    if (this.player) {
      const distanceToPlayer = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.player.x,
        this.player.y
      );

      if (distanceToPlayer < this.pickupRange) {
        this.pickup();
      }
    }

    this.updateDepth();
  }

  private updateDepth(): void {
    this.setDepth(this.y + 5);
  }

  private pickup(): void {
    if (this.isPickedUp || !this.player) return;
    this.isPickedUp = true;

    // Add ammo to player
    this.player.addAmmo(this.ammoAmount);

    // Pickup particle effect
    const pickupEffect = this.scene.add.particles(
      this.x,
      this.y,
      'bullet',
      {
        speed: { min: 20, max: 60 },
        scale: { start: 0.4, end: 0 },
        lifespan: 200,
        quantity: 6,
        tint: [0xffd700, 0xffaa00, 0xffff00],
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 6), quantity: 6 },
      }
    );
    pickupEffect.setDepth(this.y + 6);
    this.scene.time.delayedCall(200, () => pickupEffect.destroy());

    // Visual feedback with rotation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.2,
      y: this.y - 30,
      angle: 360,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        if (this.body) {
          this.body.enable = false;
        }
        this.destroy();
      },
    });
  }

  getAmmoAmount(): number {
    return this.ammoAmount;
  }
}

