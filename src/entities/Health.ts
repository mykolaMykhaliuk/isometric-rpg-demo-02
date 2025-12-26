import Phaser from 'phaser';
import { Player } from './Player';

export class Health extends Phaser.Physics.Arcade.Sprite {
  private healAmount: number = 50;
  private pickupRange: number = 35;
  private player: Player | null = null;
  private isPickedUp: boolean = false;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.003;
  private baseY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'heart_red');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setScale(1.0);
    this.setDepth(y + 5);
    this.baseY = y;

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(20, 20);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(0, 0);
    }

    // Initial float offset
    this.floatOffset = Phaser.Math.Between(0, Math.PI * 2);
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  update(_time: number, _delta: number): void {
    if (!this.active || this.isPickedUp) return;

    // Floating animation with gentle pulsing
    this.floatOffset += this.floatSpeed;
    const floatAmount = Math.sin(this.floatOffset) * 3;
    this.y = this.baseY + floatAmount;

    // Gentle rotation for visual appeal
    this.angle = Math.sin(this.floatOffset * 0.5) * 5;

    // Scale pulsing for extra visibility
    const scalePulse = 1 + Math.sin(this.floatOffset * 2) * 0.1;
    this.setScale(scalePulse);

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

    // Heal player
    this.player.heal(this.healAmount);

    // Pickup particle effect
    const pickupEffect = this.scene.add.particles(
      this.x,
      this.y,
      'heart_red',
      {
        speed: { min: 40, max: 90 },
        scale: { start: 0.6, end: 0 },
        lifespan: 300,
        quantity: 10,
        tint: [0xff0044, 0xff4466, 0xff6688],
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 10), quantity: 10 },
      }
    );
    pickupEffect.setDepth(this.y + 6);
    this.scene.time.delayedCall(300, () => pickupEffect.destroy());

    // Visual feedback with rotation and scale
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.2,
      y: this.y - 50,
      angle: 360,
      duration: 400,
      ease: 'Back.easeIn',
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

  getHealAmount(): number {
    return this.healAmount;
  }
}
