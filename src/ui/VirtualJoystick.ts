import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private radius: number;
  private base!: Phaser.GameObjects.Arc;
  private stick!: Phaser.GameObjects.Arc;
  private pointer: Phaser.Input.Pointer | null = null;
  private vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private isDown: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number = 60) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.create();
    this.registerEvents();
  }

  private create(): void {
    // Base
    this.base = this.scene.add.arc(this.x, this.y, this.radius, 0, 360, false, 0x888888, 0.5);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);

    // Stick
    this.stick = this.scene.add.arc(this.x, this.y, this.radius / 2, 0, 360, false, 0xcccccc, 0.8);
    this.stick.setScrollFactor(0);
    this.stick.setDepth(1001);
  }

  private registerEvents(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.x, this.y);
    
    // Check if touch is within a reasonable area around the joystick base
    // Allow a bit of leeway outside the visual base
    if (distance <= this.radius * 1.5) {
      this.pointer = pointer;
      this.isDown = true;
      this.updateStick(pointer.x, pointer.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointer === pointer) {
      this.updateStick(pointer.x, pointer.y);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pointer === pointer) {
      this.pointer = null;
      this.isDown = false;
      this.resetStick();
    }
  }

  private updateStick(x: number, y: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, x, y);
    const distance = Math.min(Phaser.Math.Distance.Between(this.x, this.y, x, y), this.radius);

    this.stick.x = this.x + Math.cos(angle) * distance;
    this.stick.y = this.y + Math.sin(angle) * distance;

    // Update vector (normalized -1 to 1)
    this.vector.set(
      (this.stick.x - this.x) / this.radius,
      (this.stick.y - this.y) / this.radius
    );
  }

  private resetStick(): void {
    this.stick.x = this.x;
    this.stick.y = this.y;
    this.vector.set(0, 0);
  }

  public getVector(): Phaser.Math.Vector2 {
    return this.vector;
  }
  
  public isStickDown(): boolean {
      return this.isDown;
  }
  
  public getForce(): number {
      return this.vector.length();
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.base.setPosition(x, y);
    this.resetStick();
  }

  public setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.stick.setVisible(visible);
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.base.destroy();
    this.stick.destroy();
  }
}
