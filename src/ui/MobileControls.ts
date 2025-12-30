import Phaser from 'phaser';

export interface MobileControlsState {
  joystick: {
    active: boolean;
    direction: Phaser.Math.Vector2;
    angle: number;
  };
  shooting: boolean;
  shootingPointer: Phaser.Input.Pointer | null;
}

export class MobileControls {
  private scene: Phaser.Scene;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickBasePosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private joystickRadius: number = 50;
  private thumbRadius: number = 25;

  private eButton!: Phaser.GameObjects.Container;
  private weaponButton!: Phaser.GameObjects.Container;

  private state: MobileControlsState = {
    joystick: {
      active: false,
      direction: new Phaser.Math.Vector2(0, 0),
      angle: 0,
    },
    shooting: false,
    shootingPointer: null,
  };

  // Track which pointers are on controls
  private controlPointers: Set<number> = new Set();

  // Callbacks
  private onEButtonPress?: () => void;
  private onWeaponSwitch?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    // Only create controls on touch devices
    if (!this.scene.sys.game.device.input.touch) {
      return;
    }

    this.createJoystick();
    this.createButtons();
    this.setupTouchHandling();
    this.setupResizeHandler();

    // Initial positioning
    this.updatePositions();
  }

  private createJoystick(): void {
    // Create joystick base (outer ring)
    this.joystickBase = this.scene.add.arc(0, 0, this.joystickRadius, 0, 360, false, 0x333333, 0.6);
    this.joystickBase.setStrokeStyle(3, 0x666666, 0.8);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(900);

    // Create joystick thumb (inner circle)
    this.joystickThumb = this.scene.add.arc(0, 0, this.thumbRadius, 0, 360, false, 0x888888, 0.8);
    this.joystickThumb.setStrokeStyle(2, 0xaaaaaa, 1);
    this.joystickThumb.setScrollFactor(0);
    this.joystickThumb.setDepth(901);
  }

  private createButtons(): void {
    const buttonRadius = 35;

    // E Button (for entering/exiting buildings)
    this.eButton = this.createButton('E', buttonRadius, 0x228822);
    this.eButton.setScrollFactor(0);
    this.eButton.setDepth(900);

    // Weapon switch button
    this.weaponButton = this.createButton('W', buttonRadius, 0x882222);
    this.weaponButton.setScrollFactor(0);
    this.weaponButton.setDepth(900);
  }

  private createButton(label: string, radius: number, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // Button background
    const bg = this.scene.add.arc(0, 0, radius, 0, 360, false, color, 0.7);
    bg.setStrokeStyle(3, 0xffffff, 0.5);

    // Button label
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Store radius for hit detection
    container.setData('radius', radius);

    return container;
  }

  private setupTouchHandling(): void {
    // Enable multi-touch
    this.scene.input.addPointer(2);

    // Handle pointer down
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    // Handle pointer move
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerMove(pointer);
    });

    // Handle pointer up
    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    });

    // Handle pointer out
    this.scene.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerUp(pointer);
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const screenWidth = this.scene.cameras.main.width;

    // Check if touching joystick area (left side of screen)
    if (pointer.x < screenWidth * 0.4 && !this.joystickPointer) {
      const distToBase = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.joystickBase.x,
        this.joystickBase.y
      );

      // Allow joystick activation within expanded area (150px radius)
      if (distToBase < 150) {
        this.joystickPointer = pointer;
        this.controlPointers.add(pointer.id);
        this.state.joystick.active = true;
        this.updateJoystickPosition(pointer);
        return;
      }
    }

    // Check if touching E button
    if (this.isPointerOnButton(pointer, this.eButton)) {
      this.controlPointers.add(pointer.id);
      this.onEButtonPress?.();
      this.flashButton(this.eButton);
      return;
    }

    // Check if touching weapon button
    if (this.isPointerOnButton(pointer, this.weaponButton)) {
      this.controlPointers.add(pointer.id);
      this.onWeaponSwitch?.();
      this.flashButton(this.weaponButton);
      return;
    }

    // If not on any control, it's a shooting touch
    if (!this.controlPointers.has(pointer.id)) {
      this.state.shooting = true;
      this.state.shootingPointer = pointer;
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Update joystick if this is the joystick pointer
    if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
      this.updateJoystickPosition(pointer);
    }

    // Update shooting pointer position
    if (this.state.shootingPointer && pointer.id === this.state.shootingPointer.id) {
      // Pointer position is automatically updated by Phaser
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    // Reset joystick if this was the joystick pointer
    if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
      this.joystickPointer = null;
      this.state.joystick.active = false;
      this.state.joystick.direction.set(0, 0);
      this.resetJoystickThumb();
    }

    // Stop shooting if this was the shooting pointer
    if (this.state.shootingPointer && pointer.id === this.state.shootingPointer.id) {
      this.state.shooting = false;
      this.state.shootingPointer = null;
    }

    this.controlPointers.delete(pointer.id);
  }

  private updateJoystickPosition(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystickBase.x;
    const dy = pointer.y - this.joystickBase.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = this.joystickRadius;

    // Clamp the thumb position within the base
    let thumbX: number, thumbY: number;
    if (distance > maxDistance) {
      const scale = maxDistance / distance;
      thumbX = this.joystickBase.x + dx * scale;
      thumbY = this.joystickBase.y + dy * scale;
    } else {
      thumbX = pointer.x;
      thumbY = pointer.y;
    }

    this.joystickThumb.setPosition(thumbX, thumbY);

    // Calculate normalized direction
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    if (distance > 5) { // Dead zone
      this.state.joystick.direction.set(dx / distance, dy / distance);
      this.state.joystick.direction.scale(normalizedDistance);
      this.state.joystick.angle = Math.atan2(dy, dx);
    } else {
      this.state.joystick.direction.set(0, 0);
    }
  }

  private resetJoystickThumb(): void {
    this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
  }

  private isPointerOnButton(pointer: Phaser.Input.Pointer, button: Phaser.GameObjects.Container): boolean {
    const radius = button.getData('radius') as number;
    const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, button.x, button.y);
    return distance <= radius;
  }

  private flashButton(button: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({
      targets: button,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
    });
  }

  private setupResizeHandler(): void {
    this.scene.scale.on('resize', () => {
      this.updatePositions();
    });
  }

  private updatePositions(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const padding = 30;
    const buttonRadius = 35;

    // Calculate if we're in portrait or landscape
    const isPortrait = height > width;

    // Joystick position - bottom left with padding
    const joystickX = padding + this.joystickRadius + 20;
    const joystickY = height - padding - this.joystickRadius - 20;

    this.joystickBase.setPosition(joystickX, joystickY);
    this.joystickThumb.setPosition(joystickX, joystickY);
    this.joystickBasePosition.set(joystickX, joystickY);

    // Buttons position - bottom right with padding
    const buttonsX = width - padding - buttonRadius - 20;

    if (isPortrait) {
      // In portrait, stack buttons vertically with more spacing
      this.eButton.setPosition(buttonsX, height - padding - buttonRadius - 100);
      this.weaponButton.setPosition(buttonsX, height - padding - buttonRadius - 20);
    } else {
      // In landscape, buttons can be closer together
      this.eButton.setPosition(buttonsX, height - padding - buttonRadius - 90);
      this.weaponButton.setPosition(buttonsX, height - padding - buttonRadius - 10);
    }
  }

  public getState(): MobileControlsState {
    return this.state;
  }

  public setOnEButtonPress(callback: () => void): void {
    this.onEButtonPress = callback;
  }

  public setOnWeaponSwitch(callback: () => void): void {
    this.onWeaponSwitch = callback;
  }

  public isActive(): boolean {
    return this.scene.sys.game.device.input.touch;
  }

  public getJoystickDirection(): Phaser.Math.Vector2 {
    return this.state.joystick.direction;
  }

  public isShooting(): boolean {
    return this.state.shooting;
  }

  public getShootingPointer(): Phaser.Input.Pointer | null {
    return this.state.shootingPointer;
  }

  public destroy(): void {
    this.joystickBase?.destroy();
    this.joystickThumb?.destroy();
    this.eButton?.destroy();
    this.weaponButton?.destroy();
  }
}
