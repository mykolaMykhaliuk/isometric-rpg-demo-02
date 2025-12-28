import Phaser from 'phaser';

export interface TouchButton {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  isPressed: boolean;
  pointerId: number;
  callback: () => void;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private buttons: Map<string, TouchButton> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createButton(
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    callback: () => void,
    color: number = 0x4488ff
  ): TouchButton {
    const container = this.scene.add.container(x, y);
    container.setDepth(10000);
    container.setScrollFactor(0);

    const graphics = this.scene.add.graphics();
    
    // Button background with rounded corners
    graphics.fillStyle(color, 0.5);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.scene.add.text(0, 0, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([graphics, text]);

    const button: TouchButton = {
      container,
      graphics,
      text,
      isPressed: false,
      pointerId: -1,
      callback,
    };

    // Add interactive area
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (button.pointerId === -1) {
        button.isPressed = true;
        button.pointerId = pointer.id;
        this.updateButtonState(button, color, true);
      }
    });

    container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === button.pointerId) {
        button.isPressed = false;
        button.pointerId = -1;
        this.updateButtonState(button, color, false);
      }
    });

    container.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === button.pointerId) {
        button.isPressed = false;
        button.pointerId = -1;
        this.updateButtonState(button, color, false);
      }
    });

    this.buttons.set(key, button);
    return button;
  }

  private updateButtonState(button: TouchButton, color: number, pressed: boolean): void {
    button.graphics.clear();
    
    const width = button.container.getBounds().width;
    const height = button.container.getBounds().height;
    
    if (pressed) {
      button.graphics.fillStyle(color, 0.8);
      button.graphics.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 8);
      button.graphics.lineStyle(3, 0xffff00, 1);
      button.graphics.strokeRoundedRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 8);
      button.text.setScale(0.95);
    } else {
      button.graphics.fillStyle(color, 0.5);
      button.graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      button.graphics.lineStyle(2, 0xffffff, 0.8);
      button.graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
      button.text.setScale(1);
    }
  }

  getButton(key: string): TouchButton | undefined {
    return this.buttons.get(key);
  }

  setButtonPosition(key: string, x: number, y: number): void {
    const button = this.buttons.get(key);
    if (button) {
      button.container.setPosition(x, y);
    }
  }

  setButtonVisible(key: string, visible: boolean): void {
    const button = this.buttons.get(key);
    if (button) {
      button.container.setVisible(visible);
    }
  }

  isButtonPressed(key: string): boolean {
    const button = this.buttons.get(key);
    return button ? button.isPressed : false;
  }

  destroy(): void {
    this.buttons.forEach(button => {
      button.container.destroy();
    });
    this.buttons.clear();
  }
}
