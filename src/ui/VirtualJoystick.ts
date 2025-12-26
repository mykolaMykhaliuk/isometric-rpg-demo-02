import Phaser from 'phaser';

export class VirtualJoystick extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Graphics;
  private thumb: Phaser.GameObjects.Graphics;
  private radius: number;
  private activePointerId: number | null = null;
  private value: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number = 80) {
    super(scene, x, y);

    this.radius = radius;

    // Create base circle
    this.base = scene.add.graphics();
    this.base.fillStyle(0x000000, 0.4);
    this.base.fillCircle(0, 0, radius);
    this.base.lineStyle(3, 0xffffff, 0.5);
    this.base.strokeCircle(0, 0, radius);
    this.add(this.base);

    // Create thumb/stick
    this.thumb = scene.add.graphics();
    this.thumb.fillStyle(0xffffff, 0.6);
    this.thumb.fillCircle(0, 0, radius * 0.4);
    this.add(this.thumb);

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(1000);

    // Setup input
    this.setupInput();
  }

  private setupInput(): void {
    // Create an invisible interactive zone for the joystick area
    const hitArea = new Phaser.Geom.Circle(0, 0, this.radius * 1.5);

    this.setSize(this.radius * 3, this.radius * 3);
    this.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === null) {
        this.activePointerId = pointer.id;
        this.updateThumbPosition(pointer);
        this.setActiveState(true);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.updateThumbPosition(pointer);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.resetThumb();
        this.activePointerId = null;
        this.setActiveState(false);
      }
    });
  }

  private updateThumbPosition(pointer: Phaser.Input.Pointer): void {
    // Calculate position relative to joystick center
    const dx = pointer.x - this.x;
    const dy = pointer.y - this.y;

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to radius
    const clampedDistance = Math.min(distance, this.radius);

    // Normalize direction
    if (distance > 0) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;

      // Set thumb position (clamped to radius)
      this.thumb.x = normalizedX * clampedDistance;
      this.thumb.y = normalizedY * clampedDistance;

      // Set value (normalized -1 to 1)
      this.value.x = normalizedX * (clampedDistance / this.radius);
      this.value.y = normalizedY * (clampedDistance / this.radius);
    }
  }

  private resetThumb(): void {
    this.thumb.x = 0;
    this.thumb.y = 0;
    this.value.set(0, 0);
  }

  private setActiveState(active: boolean): void {
    if (active) {
      this.base.clear();
      this.base.fillStyle(0x000000, 0.5);
      this.base.fillCircle(0, 0, this.radius);
      this.base.lineStyle(3, 0xffffff, 0.8);
      this.base.strokeCircle(0, 0, this.radius);

      this.thumb.clear();
      this.thumb.fillStyle(0xffffff, 0.9);
      this.thumb.fillCircle(0, 0, this.radius * 0.4);
    } else {
      this.base.clear();
      this.base.fillStyle(0x000000, 0.4);
      this.base.fillCircle(0, 0, this.radius);
      this.base.lineStyle(3, 0xffffff, 0.5);
      this.base.strokeCircle(0, 0, this.radius);

      this.thumb.clear();
      this.thumb.fillStyle(0xffffff, 0.6);
      this.thumb.fillCircle(0, 0, this.radius * 0.4);
    }
  }

  getValue(): Phaser.Math.Vector2 {
    return this.value.clone();
  }

  isActive(): boolean {
    return this.activePointerId !== null;
  }
}
