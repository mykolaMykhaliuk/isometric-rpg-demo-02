import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base!: Phaser.GameObjects.Graphics;
  private thumb!: Phaser.GameObjects.Graphics;
  private container!: Phaser.GameObjects.Container;
  private x: number;
  private y: number;
  private radius: number = 60;
  private thumbRadius: number = 30;
  private isActive: boolean = false;
  private pointerId: number = -1;
  
  public force: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    
    this.create();
    this.setupInput();
  }

  private create(): void {
    // Create container
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(10000);
    this.container.setScrollFactor(0);
    
    // Create base
    this.base = this.scene.add.graphics();
    this.base.fillStyle(0xffffff, 0.2);
    this.base.fillCircle(0, 0, this.radius);
    this.base.lineStyle(3, 0xffffff, 0.4);
    this.base.strokeCircle(0, 0, this.radius);
    
    // Create thumb
    this.thumb = this.scene.add.graphics();
    this.thumb.fillStyle(0xffffff, 0.5);
    this.thumb.fillCircle(0, 0, this.thumbRadius);
    this.thumb.lineStyle(2, 0xffffff, 0.8);
    this.thumb.strokeCircle(0, 0, this.thumbRadius);
    
    this.container.add([this.base, this.thumb]);
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Check if pointer is within joystick area
    const distance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.x,
      this.y
    );
    
    if (distance < this.radius + 20 && this.pointerId === -1) {
      this.isActive = true;
      this.pointerId = pointer.id;
      this.updateThumb(pointer);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isActive && pointer.id === this.pointerId) {
      this.updateThumb(pointer);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) {
      this.isActive = false;
      this.pointerId = -1;
      this.thumb.setPosition(0, 0);
      this.force.set(0, 0);
    }
  }

  private updateThumb(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.x;
    const deltaY = pointer.y - this.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate force (-1 to 1)
    const maxDistance = this.radius - this.thumbRadius;
    const forceMagnitude = Math.min(distance / maxDistance, 1);
    
    this.force.set(
      (deltaX / distance) * forceMagnitude,
      (deltaY / distance) * forceMagnitude
    );
    
    // Limit thumb movement
    const limitedDistance = Math.min(distance, maxDistance);
    const thumbX = (deltaX / distance) * limitedDistance;
    const thumbY = (deltaY / distance) * limitedDistance;
    
    this.thumb.setPosition(thumbX, thumbY);
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.container.destroy();
  }
}
