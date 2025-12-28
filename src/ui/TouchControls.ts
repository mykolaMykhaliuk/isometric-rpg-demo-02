import Phaser from 'phaser';
import { WeaponType } from '../weapons/IWeapon';

interface JoystickState {
  isActive: boolean;
  x: number;
  y: number;
  angle: number;
  force: number;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private enabled: boolean = false;

  // Joystick containers
  private leftJoystickBase!: Phaser.GameObjects.Arc;
  private leftJoystickThumb!: Phaser.GameObjects.Arc;
  private rightJoystickBase!: Phaser.GameObjects.Arc;
  private rightJoystickThumb!: Phaser.GameObjects.Arc;

  // Joystick state
  private leftJoystick: JoystickState = { isActive: false, x: 0, y: 0, angle: 0, force: 0 };
  private rightJoystick: JoystickState = { isActive: false, x: 0, y: 0, angle: 0, force: 0 };

  // Joystick positions and sizes
  private joystickRadius: number = 60;
  private thumbRadius: number = 25;
  private leftJoystickPos = { x: 0, y: 0 };
  private rightJoystickPos = { x: 0, y: 0 };

  // Touch tracking
  private leftPointerId: number = -1;
  private rightPointerId: number = -1;

  // Action buttons
  private enterBuildingBtn!: Phaser.GameObjects.Container;
  private switchWeaponBtn!: Phaser.GameObjects.Container;
  private swordBtn!: Phaser.GameObjects.Container;
  private gunBtn!: Phaser.GameObjects.Container;

  // Shooting state
  private isShooting: boolean = false;
  private shootThreshold: number = 0.7; // 70% of joystick radius triggers shooting

  // Callbacks
  private onMovementChange?: (x: number, y: number) => void;
  private onAimChange?: (x: number, y: number, angle: number) => void;
  private onShootStart?: () => void;
  private onShootEnd?: () => void;
  private onEnterBuilding?: () => void;
  private onSwitchWeapon?: () => void;
  private onSelectWeapon?: (weaponType: WeaponType) => void;

  // Current weapon for UI highlighting
  private currentWeapon: WeaponType = WeaponType.GUN;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.checkMobileDevice();

    if (this.enabled) {
      this.createJoysticks();
      this.createActionButtons();
      this.setupTouchListeners();
      this.setupResizeListener();
    }
  }

  private checkMobileDevice(): void {
    // Check if device supports touch or is a mobile device
    const isTouchDevice = 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - checking for legacy msMaxTouchPoints
      navigator.msMaxTouchPoints > 0;

    // Also check if it's a mobile user agent
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.enabled = isTouchDevice || isMobileUA;
  }

  private createJoysticks(): void {
    this.updateJoystickPositions();

    // Left joystick (movement)
    this.leftJoystickBase = this.scene.add.circle(
      this.leftJoystickPos.x,
      this.leftJoystickPos.y,
      this.joystickRadius,
      0x333333,
      0.5
    );
    this.leftJoystickBase.setScrollFactor(0).setDepth(2000);
    this.leftJoystickBase.setStrokeStyle(3, 0x666666, 0.8);

    this.leftJoystickThumb = this.scene.add.circle(
      this.leftJoystickPos.x,
      this.leftJoystickPos.y,
      this.thumbRadius,
      0x4488ff,
      0.8
    );
    this.leftJoystickThumb.setScrollFactor(0).setDepth(2001);

    // Right joystick (aiming)
    this.rightJoystickBase = this.scene.add.circle(
      this.rightJoystickPos.x,
      this.rightJoystickPos.y,
      this.joystickRadius,
      0x333333,
      0.5
    );
    this.rightJoystickBase.setScrollFactor(0).setDepth(2000);
    this.rightJoystickBase.setStrokeStyle(3, 0x666666, 0.8);

    // Add shooting zone indicator
    const shootZone = this.scene.add.circle(
      this.rightJoystickPos.x,
      this.rightJoystickPos.y,
      this.joystickRadius * this.shootThreshold,
      0xff4444,
      0.1
    );
    shootZone.setScrollFactor(0).setDepth(1999);
    shootZone.setStrokeStyle(2, 0xff4444, 0.3);

    this.rightJoystickThumb = this.scene.add.circle(
      this.rightJoystickPos.x,
      this.rightJoystickPos.y,
      this.thumbRadius,
      0xff4444,
      0.8
    );
    this.rightJoystickThumb.setScrollFactor(0).setDepth(2001);
  }

  private createActionButtons(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const buttonSize = 50;
    const padding = 15;

    // Enter building button (right side, above aim joystick)
    const enterBtnX = gameWidth - 90;
    const enterBtnY = gameHeight - this.joystickRadius * 2 - 80;

    this.enterBuildingBtn = this.createButton(
      enterBtnX, enterBtnY, buttonSize,
      'E', 0x00ff00, 0.7
    );
    this.enterBuildingBtn.setData('type', 'enter');

    // Switch weapon button (right side, above enter button)
    const switchBtnX = gameWidth - 90;
    const switchBtnY = enterBtnY - buttonSize - padding;

    this.switchWeaponBtn = this.createButton(
      switchBtnX, switchBtnY, buttonSize,
      '⟳', 0xffaa00, 0.7
    );
    this.switchWeaponBtn.setData('type', 'switch');

    // Weapon selection buttons at top
    const topButtonY = 80;
    const topButtonSpacing = 70;
    const topCenterX = gameWidth / 2;

    // Sword button (left)
    this.swordBtn = this.createWeaponButton(
      topCenterX - topButtonSpacing / 2, topButtonY,
      'weapon_sword_icon', WeaponType.SWORD
    );

    // Gun button (right)
    this.gunBtn = this.createWeaponButton(
      topCenterX + topButtonSpacing / 2, topButtonY,
      'weapon_gun_icon', WeaponType.GUN
    );

    this.updateWeaponButtonHighlight();
  }

  private createButton(x: number, y: number, size: number, label: string, color: number, alpha: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0).setDepth(2000);

    // Background circle
    const bg = this.scene.add.circle(0, 0, size / 2, color, alpha);
    bg.setStrokeStyle(3, 0xffffff, 0.5);

    // Label
    const text = this.scene.add.text(0, 0, label, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });

    // Touch feedback
    container.on('pointerdown', () => {
      bg.setFillStyle(color, 1);
      this.handleButtonPress(container.getData('type') as string);
    });

    container.on('pointerup', () => {
      bg.setFillStyle(color, alpha);
    });

    container.on('pointerout', () => {
      bg.setFillStyle(color, alpha);
    });

    return container;
  }

  private createWeaponButton(x: number, y: number, iconKey: string, weaponType: WeaponType): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setScrollFactor(0).setDepth(2000);

    const size = 55;
    const color = weaponType === WeaponType.SWORD ? 0x888888 : 0xffff00;

    // Background
    const bg = this.scene.add.circle(0, 0, size / 2, 0x222222, 0.8);
    bg.setStrokeStyle(3, color, 0.8);
    container.setData('bg', bg);
    container.setData('color', color);

    // Icon
    const icon = this.scene.add.image(0, 0, iconKey);
    icon.setScale(1.5);

    container.add([bg, icon]);
    container.setSize(size, size);
    container.setInteractive({ useHandCursor: true });
    container.setData('weaponType', weaponType);

    container.on('pointerdown', () => {
      this.handleWeaponSelect(weaponType);
    });

    return container;
  }

  private handleButtonPress(buttonType: string): void {
    switch (buttonType) {
      case 'enter':
        if (this.onEnterBuilding) {
          this.onEnterBuilding();
        }
        break;
      case 'switch':
        if (this.onSwitchWeapon) {
          this.onSwitchWeapon();
        }
        break;
    }
  }

  private handleWeaponSelect(weaponType: WeaponType): void {
    if (this.onSelectWeapon) {
      this.onSelectWeapon(weaponType);
    }
    this.currentWeapon = weaponType;
    this.updateWeaponButtonHighlight();
  }

  private updateWeaponButtonHighlight(): void {
    // Update sword button
    const swordBg = this.swordBtn.getData('bg') as Phaser.GameObjects.Arc;
    const swordColor = this.swordBtn.getData('color') as number;
    if (this.currentWeapon === WeaponType.SWORD) {
      swordBg.setFillStyle(swordColor, 0.4);
      swordBg.setStrokeStyle(4, 0xffffff, 1);
    } else {
      swordBg.setFillStyle(0x222222, 0.8);
      swordBg.setStrokeStyle(3, swordColor, 0.5);
    }

    // Update gun button
    const gunBg = this.gunBtn.getData('bg') as Phaser.GameObjects.Arc;
    const gunColor = this.gunBtn.getData('color') as number;
    if (this.currentWeapon === WeaponType.GUN) {
      gunBg.setFillStyle(gunColor, 0.4);
      gunBg.setStrokeStyle(4, 0xffffff, 1);
    } else {
      gunBg.setFillStyle(0x222222, 0.8);
      gunBg.setStrokeStyle(3, gunColor, 0.5);
    }
  }

  private setupTouchListeners(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const gameWidth = this.scene.cameras.main.width;

    // Check if touch is on left half (movement joystick)
    if (pointer.x < gameWidth / 2 && this.leftPointerId === -1) {
      // Check if near joystick area
      const distToLeft = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.leftJoystickPos.x, this.leftJoystickPos.y
      );

      if (distToLeft < this.joystickRadius * 2) {
        this.leftPointerId = pointer.id;
        this.updateLeftJoystick(pointer.x, pointer.y);
      }
    }

    // Check if touch is on right half (aiming joystick)
    if (pointer.x >= gameWidth / 2 && this.rightPointerId === -1) {
      // Check if near joystick area
      const distToRight = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.rightJoystickPos.x, this.rightJoystickPos.y
      );

      if (distToRight < this.joystickRadius * 2) {
        this.rightPointerId = pointer.id;
        this.updateRightJoystick(pointer.x, pointer.y);
      }
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.leftPointerId) {
      this.updateLeftJoystick(pointer.x, pointer.y);
    }

    if (pointer.id === this.rightPointerId) {
      this.updateRightJoystick(pointer.x, pointer.y);
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.leftPointerId) {
      this.resetLeftJoystick();
      this.leftPointerId = -1;
    }

    if (pointer.id === this.rightPointerId) {
      this.resetRightJoystick();
      this.rightPointerId = -1;
    }
  }

  private updateLeftJoystick(pointerX: number, pointerY: number): void {
    const dx = pointerX - this.leftJoystickPos.x;
    const dy = pointerY - this.leftJoystickPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to joystick radius
    const clampedDistance = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    // Calculate thumb position
    const thumbX = this.leftJoystickPos.x + Math.cos(angle) * clampedDistance;
    const thumbY = this.leftJoystickPos.y + Math.sin(angle) * clampedDistance;

    this.leftJoystickThumb.setPosition(thumbX, thumbY);

    // Update state
    this.leftJoystick.isActive = true;
    this.leftJoystick.x = (clampedDistance / this.joystickRadius) * Math.cos(angle);
    this.leftJoystick.y = (clampedDistance / this.joystickRadius) * Math.sin(angle);
    this.leftJoystick.angle = angle;
    this.leftJoystick.force = clampedDistance / this.joystickRadius;

    if (this.onMovementChange) {
      this.onMovementChange(this.leftJoystick.x, this.leftJoystick.y);
    }
  }

  private updateRightJoystick(pointerX: number, pointerY: number): void {
    const dx = pointerX - this.rightJoystickPos.x;
    const dy = pointerY - this.rightJoystickPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp to joystick radius
    const clampedDistance = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    // Calculate thumb position
    const thumbX = this.rightJoystickPos.x + Math.cos(angle) * clampedDistance;
    const thumbY = this.rightJoystickPos.y + Math.sin(angle) * clampedDistance;

    this.rightJoystickThumb.setPosition(thumbX, thumbY);

    // Update state
    this.rightJoystick.isActive = true;
    this.rightJoystick.x = (clampedDistance / this.joystickRadius) * Math.cos(angle);
    this.rightJoystick.y = (clampedDistance / this.joystickRadius) * Math.sin(angle);
    this.rightJoystick.angle = angle;
    this.rightJoystick.force = clampedDistance / this.joystickRadius;

    // Update thumb color based on shooting state
    const shouldShoot = this.rightJoystick.force >= this.shootThreshold;

    if (shouldShoot && !this.isShooting) {
      this.isShooting = true;
      this.rightJoystickThumb.setFillStyle(0xff0000, 1);
      if (this.onShootStart) {
        this.onShootStart();
      }
    } else if (!shouldShoot && this.isShooting) {
      this.isShooting = false;
      this.rightJoystickThumb.setFillStyle(0xff4444, 0.8);
      if (this.onShootEnd) {
        this.onShootEnd();
      }
    }

    if (this.onAimChange) {
      this.onAimChange(this.rightJoystick.x, this.rightJoystick.y, angle);
    }
  }

  private resetLeftJoystick(): void {
    this.leftJoystickThumb.setPosition(this.leftJoystickPos.x, this.leftJoystickPos.y);
    this.leftJoystick.isActive = false;
    this.leftJoystick.x = 0;
    this.leftJoystick.y = 0;
    this.leftJoystick.force = 0;

    if (this.onMovementChange) {
      this.onMovementChange(0, 0);
    }
  }

  private resetRightJoystick(): void {
    this.rightJoystickThumb.setPosition(this.rightJoystickPos.x, this.rightJoystickPos.y);
    this.rightJoystick.isActive = false;
    this.rightJoystick.x = 0;
    this.rightJoystick.y = 0;
    this.rightJoystick.force = 0;

    if (this.isShooting) {
      this.isShooting = false;
      this.rightJoystickThumb.setFillStyle(0xff4444, 0.8);
      if (this.onShootEnd) {
        this.onShootEnd();
      }
    }
  }

  private updateJoystickPositions(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const padding = 30;

    // Left joystick - bottom left corner
    this.leftJoystickPos.x = this.joystickRadius + padding + 20;
    this.leftJoystickPos.y = gameHeight - this.joystickRadius - padding - 20;

    // Right joystick - bottom right corner
    this.rightJoystickPos.x = gameWidth - this.joystickRadius - padding - 20;
    this.rightJoystickPos.y = gameHeight - this.joystickRadius - padding - 20;
  }

  private setupResizeListener(): void {
    this.scene.scale.on('resize', this.handleResize, this);
  }

  private handleResize(): void {
    if (!this.enabled) return;

    this.updateJoystickPositions();

    // Update joystick positions
    if (this.leftJoystickBase) {
      this.leftJoystickBase.setPosition(this.leftJoystickPos.x, this.leftJoystickPos.y);
      this.leftJoystickThumb.setPosition(this.leftJoystickPos.x, this.leftJoystickPos.y);
    }

    if (this.rightJoystickBase) {
      this.rightJoystickBase.setPosition(this.rightJoystickPos.x, this.rightJoystickPos.y);
      this.rightJoystickThumb.setPosition(this.rightJoystickPos.x, this.rightJoystickPos.y);
    }

    // Update button positions
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;

    if (this.enterBuildingBtn) {
      this.enterBuildingBtn.setPosition(gameWidth - 90, gameHeight - this.joystickRadius * 2 - 80);
    }

    if (this.switchWeaponBtn) {
      this.switchWeaponBtn.setPosition(gameWidth - 90, gameHeight - this.joystickRadius * 2 - 145);
    }

    // Update weapon buttons
    const topCenterX = gameWidth / 2;
    if (this.swordBtn) {
      this.swordBtn.setPosition(topCenterX - 35, 80);
    }
    if (this.gunBtn) {
      this.gunBtn.setPosition(topCenterX + 35, 80);
    }
  }

  // Public API for setting callbacks
  setOnMovementChange(callback: (x: number, y: number) => void): void {
    this.onMovementChange = callback;
  }

  setOnAimChange(callback: (x: number, y: number, angle: number) => void): void {
    this.onAimChange = callback;
  }

  setOnShootStart(callback: () => void): void {
    this.onShootStart = callback;
  }

  setOnShootEnd(callback: () => void): void {
    this.onShootEnd = callback;
  }

  setOnEnterBuilding(callback: () => void): void {
    this.onEnterBuilding = callback;
  }

  setOnSwitchWeapon(callback: () => void): void {
    this.onSwitchWeapon = callback;
  }

  setOnSelectWeapon(callback: (weaponType: WeaponType) => void): void {
    this.onSelectWeapon = callback;
  }

  // Update current weapon display
  setCurrentWeapon(weaponType: WeaponType): void {
    this.currentWeapon = weaponType;
    if (this.enabled) {
      this.updateWeaponButtonHighlight();
    }
  }

  // Get joystick states
  getLeftJoystick(): JoystickState {
    return { ...this.leftJoystick };
  }

  getRightJoystick(): JoystickState {
    return { ...this.rightJoystick };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isTouchShooting(): boolean {
    return this.isShooting;
  }

  // Get aim direction for weapons
  getAimDirection(): { x: number; y: number } | null {
    if (!this.rightJoystick.isActive || this.rightJoystick.force < 0.1) {
      return null;
    }
    return {
      x: this.rightJoystick.x,
      y: this.rightJoystick.y
    };
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.scale.off('resize', this.handleResize, this);

    if (this.leftJoystickBase) this.leftJoystickBase.destroy();
    if (this.leftJoystickThumb) this.leftJoystickThumb.destroy();
    if (this.rightJoystickBase) this.rightJoystickBase.destroy();
    if (this.rightJoystickThumb) this.rightJoystickThumb.destroy();
    if (this.enterBuildingBtn) this.enterBuildingBtn.destroy();
    if (this.switchWeaponBtn) this.switchWeaponBtn.destroy();
    if (this.swordBtn) this.swordBtn.destroy();
    if (this.gunBtn) this.gunBtn.destroy();
  }
}
