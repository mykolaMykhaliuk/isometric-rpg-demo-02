import Phaser from 'phaser';

export type ButtonType = 'attack' | 'gun' | 'sword' | 'interact';

export class MobileButton extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private icon: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
  private radius: number;
  private buttonType: ButtonType;
  private isPressed: boolean = false;
  private activePointerId: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number, buttonType: ButtonType) {
    super(scene, x, y);

    this.radius = radius;
    this.buttonType = buttonType;

    // Create background circle
    this.background = scene.add.graphics();
    this.drawBackground(false);
    this.add(this.background);

    // Create icon based on button type
    this.icon = this.createIcon(scene, buttonType);
    this.add(this.icon);

    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(1000);

    // Setup input
    this.setupInput();
  }

  private createIcon(scene: Phaser.Scene, buttonType: ButtonType): Phaser.GameObjects.Text | Phaser.GameObjects.Image {
    let icon: Phaser.GameObjects.Text | Phaser.GameObjects.Image;

    switch (buttonType) {
      case 'attack':
        icon = scene.add.text(0, 0, '\u2694', { // Crossed swords emoji
          fontSize: `${this.radius * 0.8}px`,
          color: '#ffffff',
        }).setOrigin(0.5);
        break;
      case 'gun':
        if (scene.textures.exists('weapon_gun_icon')) {
          icon = scene.add.image(0, 0, 'weapon_gun_icon').setScale(0.8);
        } else {
          icon = scene.add.text(0, 0, '1', {
            fontSize: `${this.radius * 0.6}px`,
            color: '#ffff00',
            fontStyle: 'bold',
          }).setOrigin(0.5);
        }
        break;
      case 'sword':
        if (scene.textures.exists('weapon_sword_icon')) {
          icon = scene.add.image(0, 0, 'weapon_sword_icon').setScale(0.8);
        } else {
          icon = scene.add.text(0, 0, '2', {
            fontSize: `${this.radius * 0.6}px`,
            color: '#cccccc',
            fontStyle: 'bold',
          }).setOrigin(0.5);
        }
        break;
      case 'interact':
        icon = scene.add.text(0, 0, 'E', {
          fontSize: `${this.radius * 0.7}px`,
          color: '#00ff00',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        break;
      default:
        icon = scene.add.text(0, 0, '?', {
          fontSize: `${this.radius * 0.6}px`,
          color: '#ffffff',
        }).setOrigin(0.5);
    }

    return icon;
  }

  private drawBackground(pressed: boolean): void {
    this.background.clear();

    const alpha = pressed ? 0.7 : 0.5;
    const strokeAlpha = pressed ? 1.0 : 0.6;
    let fillColor = 0x000000;
    let strokeColor = 0xffffff;

    // Color coding by button type
    switch (this.buttonType) {
      case 'attack':
        fillColor = pressed ? 0x660000 : 0x330000;
        strokeColor = 0xff4444;
        break;
      case 'gun':
        fillColor = pressed ? 0x666600 : 0x333300;
        strokeColor = 0xffff00;
        break;
      case 'sword':
        fillColor = pressed ? 0x444444 : 0x222222;
        strokeColor = 0xcccccc;
        break;
      case 'interact':
        fillColor = pressed ? 0x006600 : 0x003300;
        strokeColor = 0x00ff00;
        break;
    }

    this.background.fillStyle(fillColor, alpha);
    this.background.fillCircle(0, 0, this.radius);
    this.background.lineStyle(3, strokeColor, strokeAlpha);
    this.background.strokeCircle(0, 0, this.radius);
  }

  private setupInput(): void {
    const hitArea = new Phaser.Geom.Circle(0, 0, this.radius);

    this.setSize(this.radius * 2, this.radius * 2);
    this.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === null) {
        this.activePointerId = pointer.id;
        this.isPressed = true;
        this.drawBackground(true);
        this.emit('pressed');
      }
    });

    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.activePointerId = null;
        this.isPressed = false;
        this.drawBackground(false);
        this.emit('released');
      }
    });

    this.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.activePointerId = null;
        this.isPressed = false;
        this.drawBackground(false);
        this.emit('released');
      }
    });
  }

  getIsPressed(): boolean {
    return this.isPressed;
  }

  setActiveWeapon(isActive: boolean): void {
    // Highlight if this is the active weapon
    if (isActive) {
      this.setScale(1.1);
      this.drawBackground(true);
    } else {
      this.setScale(1.0);
      this.drawBackground(false);
    }
  }

  pulse(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }
}
