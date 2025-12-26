import Phaser from 'phaser';
import { Player } from './Player';

export type ArmorType = 'blue' | 'red';

export class Armor extends Phaser.Physics.Arcade.Sprite {
  private armorAmount: number;
  private armorType: ArmorType;
  private pickupRange: number = 35;
  private player: Player | null = null;
  private isPickedUp: boolean = false;
  private floatOffset: number = 0;
  private floatSpeed: number = 0.003;
  private baseY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, armorType: ArmorType = 'blue') {
    const textureName = `armor_${armorType}`;
    super(scene, x, y, textureName);

    this.armorType = armorType;
    this.armorAmount = armorType === 'blue' ? 50 : 100;

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

    // Floating animation
    this.floatOffset += this.floatSpeed;
    const floatAmount = Math.sin(this.floatOffset) * 3;
    this.y = this.baseY + floatAmount;

    // Subtle rotation animation
    this.angle = Math.sin(this.floatOffset * 0.5) * 8;

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

    // Add armor to player
    this.player.addArmor(this.armorAmount, this.armorType);

    // Determine particle color based on armor type
    const particleColors = this.armorType === 'blue'
      ? [0x4488ff, 0x5599ff, 0x66aaff]
      : [0xff4444, 0xff5555, 0xff6666];

    // Pickup particle effect
    const pickupEffect = this.scene.add.particles(
      this.x,
      this.y,
      this.armorType === 'blue' ? 'armor_blue' : 'armor_red',
      {
        speed: { min: 30, max: 80 },
        scale: { start: 0.5, end: 0 },
        lifespan: 250,
        quantity: 8,
        tint: particleColors,
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 8), quantity: 8 },
      }
    );
    pickupEffect.setDepth(this.y + 6);
    this.scene.time.delayedCall(250, () => pickupEffect.destroy());

    // Visual feedback with rotation and scale
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      y: this.y - 40,
      angle: 360,
      duration: 350,
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

  getArmorAmount(): number {
    return this.armorAmount;
  }

  getArmorType(): ArmorType {
    return this.armorType;
  }
}
