import Phaser from 'phaser';
import { WeaponType } from '../weapons/IWeapon';

export interface MobileControlState {
  movementX: number;
  movementY: number;
  isAttacking: boolean;
  attackScreenX?: number;
  attackScreenY?: number;
  switchWeapon?: WeaponType;
  interact: boolean;
}

export class MobileControls {
  private scene: Phaser.Scene;
  private isMobile: boolean = false;
  private controlState: MobileControlState;
  
  // Joystick elements
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickHandle!: Phaser.GameObjects.Arc;
  private joystickActive: boolean = false;
  private joystickStartX: number = 0;
  private joystickStartY: number = 0;
  private joystickRadius: number = 60;
  private joystickMaxDistance: number = 50;
  
  // Buttons
  private attackButton!: Phaser.GameObjects.Container;
  private gunButton!: Phaser.GameObjects.Container;
  private swordButton!: Phaser.GameObjects.Container;
  private interactButton!: Phaser.GameObjects.Container;
  
  // Button states
  private attackPressed: boolean = false;
  private interactPressed: boolean = false;
  
  // Touch tracking for attack direction
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;
  private touchActive: boolean = false;
  private attackScreenX: number = 0;
  private attackScreenY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.controlState = {
      movementX: 0,
      movementY: 0,
      isAttacking: false,
      interact: false,
    };
    
    this.detectMobile();
  }

  private detectMobile(): void {
    // Detect mobile devices
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.isMobile = isMobileDevice || hasTouchScreen;
  }

  create(): void {
    if (!this.isMobile) {
      return; // Don't create controls on desktop
    }

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const isLandscape = width > height;

    // Create joystick (left side, bottom)
    this.createJoystick(isLandscape);
    
    // Create attack button (right side, bottom)
    this.createAttackButton(isLandscape);
    
    // Create weapon buttons (right side, above attack)
    this.createWeaponButtons(isLandscape);
    
    // Create interact button (center-right)
    this.createInteractButton(isLandscape);
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Handle orientation changes
    this.scene.scale.on('resize', this.handleResize, this);
  }

  private createJoystick(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const baseX = isLandscape ? 100 : 80;
    const baseY = isLandscape ? height - 100 : height - 100;
    
    // Joystick base
    this.joystickBase = this.scene.add.circle(baseX, baseY, this.joystickRadius, 0x333333, 0.6);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(1000);
    this.joystickBase.setInteractive();
    
    // Joystick handle
    this.joystickHandle = this.scene.add.circle(baseX, baseY, 25, 0x888888, 0.8);
    this.joystickHandle.setScrollFactor(0);
    this.joystickHandle.setDepth(1001);
    
    this.joystickStartX = baseX;
    this.joystickStartY = baseY;
  }

  private createAttackButton(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const buttonX = isLandscape ? width - 100 : width - 80;
    const buttonY = isLandscape ? height - 100 : height - 100;
    const buttonSize = 70;
    
    // Button background
    const bg = this.scene.add.circle(0, 0, buttonSize / 2, 0xff0000, 0.7);
    bg.setStrokeStyle(3, 0xffffff, 1);
    
    // Button icon (crosshair/target)
    const icon = this.scene.add.text(0, 0, '⚔', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.attackButton = this.scene.add.container(buttonX, buttonY, [bg, icon]);
    this.attackButton.setScrollFactor(0);
    this.attackButton.setDepth(1000);
    this.attackButton.setSize(buttonSize, buttonSize);
    this.attackButton.setInteractive();
  }

  private createWeaponButtons(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const buttonY = isLandscape ? height - 200 : height - 180;
    const buttonSize = 55;
    const spacing = 70;
    
    // Gun button (left)
    const gunX = isLandscape ? width - 100 - spacing : width - 80 - spacing;
    const gunBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x444444, 0.7);
    gunBg.setStrokeStyle(2, 0xffff00, 1);
    const gunIcon = this.scene.add.text(0, 0, '🔫', {
      fontSize: '24px',
    }).setOrigin(0.5);
    this.gunButton = this.scene.add.container(gunX, buttonY, [gunBg, gunIcon]);
    this.gunButton.setScrollFactor(0);
    this.gunButton.setDepth(1000);
    this.gunButton.setSize(buttonSize, buttonSize);
    this.gunButton.setInteractive();
    
    // Sword button (right)
    const swordX = isLandscape ? width - 100 : width - 80;
    const swordBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x444444, 0.7);
    swordBg.setStrokeStyle(2, 0xcccccc, 1);
    const swordIcon = this.scene.add.text(0, 0, '⚔', {
      fontSize: '24px',
    }).setOrigin(0.5);
    this.swordButton = this.scene.add.container(swordX, buttonY, [swordBg, swordIcon]);
    this.swordButton.setScrollFactor(0);
    this.swordButton.setDepth(1000);
    this.swordButton.setSize(buttonSize, buttonSize);
    this.swordButton.setInteractive();
  }

  private createInteractButton(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const buttonX = isLandscape ? width - 200 : width - 160;
    const buttonY = isLandscape ? height - 100 : height - 100;
    const buttonSize = 60;
    
    // Button background
    const bg = this.scene.add.circle(0, 0, buttonSize / 2, 0x00ff00, 0.7);
    bg.setStrokeStyle(3, 0xffffff, 1);
    
    // Button icon (E)
    const icon = this.scene.add.text(0, 0, 'E', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.interactButton = this.scene.add.container(buttonX, buttonY, [bg, icon]);
    this.interactButton.setScrollFactor(0);
    this.interactButton.setDepth(1000);
    this.interactButton.setSize(buttonSize, buttonSize);
    this.interactButton.setInteractive();
  }

  private setupInputHandlers(): void {
    // Joystick handlers
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldX = pointer.x;
      const worldY = pointer.y;
      const distance = Phaser.Math.Distance.Between(
        worldX,
        worldY,
        this.joystickStartX,
        this.joystickStartY
      );
      
      if (distance < this.joystickRadius + 20) {
        this.joystickActive = true;
        this.updateJoystick(worldX, worldY);
      }
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickActive) {
        this.updateJoystick(pointer.x, pointer.y);
      }
      
      // Track touch position for attack direction
      if (pointer.isDown) {
        this.lastTouchX = pointer.x;
        this.lastTouchY = pointer.y;
        this.touchActive = true;
        // Store screen coordinates for attack
        this.attackScreenX = pointer.x;
        this.attackScreenY = pointer.y;
      }
    });
    
    this.scene.input.on('pointerup', () => {
      this.joystickActive = false;
      this.resetJoystick();
      this.touchActive = false;
    });
    
    // Attack button
    this.attackButton.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.attackPressed = true;
      this.controlState.isAttacking = true;
      this.updateAttackButtonVisual(true);
      // For attack button, we'll use the player's facing direction
      // The attack direction will be set based on movement direction in getControlState
    });
    
    this.attackButton.on('pointerup', () => {
      this.attackPressed = false;
      this.controlState.isAttacking = false;
      this.updateAttackButtonVisual(false);
    });
    
    // Weapon buttons
    this.gunButton.on('pointerdown', () => {
      this.controlState.switchWeapon = WeaponType.GUN;
      this.updateWeaponButtonVisual(this.gunButton, true);
      this.scene.time.delayedCall(100, () => {
        this.updateWeaponButtonVisual(this.gunButton, false);
        this.controlState.switchWeapon = undefined;
      });
    });
    
    this.swordButton.on('pointerdown', () => {
      this.controlState.switchWeapon = WeaponType.SWORD;
      this.updateWeaponButtonVisual(this.swordButton, true);
      this.scene.time.delayedCall(100, () => {
        this.updateWeaponButtonVisual(this.swordButton, false);
        this.controlState.switchWeapon = undefined;
      });
    });
    
    // Interact button
    this.interactButton.on('pointerdown', () => {
      this.interactPressed = true;
      this.controlState.interact = true;
      this.updateInteractButtonVisual(true);
    });
    
    this.interactButton.on('pointerup', () => {
      this.interactPressed = false;
      this.controlState.interact = false;
      this.updateInteractButtonVisual(false);
    });
  }

  private updateJoystick(x: number, y: number): void {
    const dx = x - this.joystickStartX;
    const dy = y - this.joystickStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > this.joystickMaxDistance) {
      const angle = Math.atan2(dy, dx);
      const clampedX = this.joystickStartX + Math.cos(angle) * this.joystickMaxDistance;
      const clampedY = this.joystickStartY + Math.sin(angle) * this.joystickMaxDistance;
      this.joystickHandle.setPosition(clampedX, clampedY);
      
      // Normalize movement
      this.controlState.movementX = Math.cos(angle);
      this.controlState.movementY = Math.sin(angle);
    } else {
      this.joystickHandle.setPosition(x, y);
      
      // Normalize movement
      if (distance > 0) {
        this.controlState.movementX = dx / this.joystickMaxDistance;
        this.controlState.movementY = dy / this.joystickMaxDistance;
      } else {
        this.controlState.movementX = 0;
        this.controlState.movementY = 0;
      }
    }
  }

  private resetJoystick(): void {
    this.joystickHandle.setPosition(this.joystickStartX, this.joystickStartY);
    this.controlState.movementX = 0;
    this.controlState.movementY = 0;
  }

  private updateAttackButtonVisual(pressed: boolean): void {
    const bg = this.attackButton.list[0] as Phaser.GameObjects.Arc;
    if (pressed) {
      bg.setFillStyle(0xff4444, 0.9);
      bg.setScale(0.9);
    } else {
      bg.setFillStyle(0xff0000, 0.7);
      bg.setScale(1.0);
    }
  }

  private updateWeaponButtonVisual(button: Phaser.GameObjects.Container, pressed: boolean): void {
    const bg = button.list[0] as Phaser.GameObjects.Arc;
    if (pressed) {
      bg.setScale(0.85);
    } else {
      bg.setScale(1.0);
    }
  }

  private updateInteractButtonVisual(pressed: boolean): void {
    const bg = this.interactButton.list[0] as Phaser.GameObjects.Arc;
    if (pressed) {
      bg.setFillStyle(0x00ff44, 0.9);
      bg.setScale(0.9);
    } else {
      bg.setFillStyle(0x00ff00, 0.7);
      bg.setScale(1.0);
    }
  }

  private handleResize(): void {
    if (!this.isMobile) return;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const isLandscape = width > height;
    
    // Update joystick position
    const baseX = isLandscape ? 100 : 80;
    const baseY = isLandscape ? height - 100 : height - 100;
    this.joystickBase.setPosition(baseX, baseY);
    this.joystickHandle.setPosition(baseX, baseY);
    this.joystickStartX = baseX;
    this.joystickStartY = baseY;
    
    // Update attack button
    const attackX = isLandscape ? width - 100 : width - 80;
    const attackY = isLandscape ? height - 100 : height - 100;
    this.attackButton.setPosition(attackX, attackY);
    
    // Update weapon buttons
    const weaponY = isLandscape ? height - 200 : height - 180;
    const spacing = 70;
    const gunX = isLandscape ? width - 100 - spacing : width - 80 - spacing;
    const swordX = isLandscape ? width - 100 : width - 80;
    this.gunButton.setPosition(gunX, weaponY);
    this.swordButton.setPosition(swordX, weaponY);
    
    // Update interact button
    const interactX = isLandscape ? width - 200 : width - 160;
    const interactY = isLandscape ? height - 100 : height - 100;
    this.interactButton.setPosition(interactX, interactY);
  }

  getControlState(): MobileControlState {
    // Update attack screen coordinates
    if (this.controlState.isAttacking) {
      // If there's active touch movement, use that direction
      // Otherwise, attack in the direction of movement (joystick)
      if (this.touchActive && this.lastTouchX > 0 && this.lastTouchY > 0) {
        this.controlState.attackScreenX = this.lastTouchX;
        this.controlState.attackScreenY = this.lastTouchY;
      } else if (this.controlState.movementX !== 0 || this.controlState.movementY !== 0) {
        // Attack in movement direction - convert movement vector to screen position
        // We'll let the Player class handle this by not setting attackScreenX/Y
        // and it will use the movement direction
        this.controlState.attackScreenX = undefined;
        this.controlState.attackScreenY = undefined;
      } else {
        // No movement or touch - use last known touch or center of screen
        if (this.attackScreenX > 0 && this.attackScreenY > 0) {
          this.controlState.attackScreenX = this.attackScreenX;
          this.controlState.attackScreenY = this.attackScreenY;
        } else {
          // Default: attack forward (right)
          const width = this.scene.cameras.main.width;
          const height = this.scene.cameras.main.height;
          this.controlState.attackScreenX = width * 0.75;
          this.controlState.attackScreenY = height * 0.5;
        }
      }
    } else {
      this.controlState.attackScreenX = undefined;
      this.controlState.attackScreenY = undefined;
    }
    
    return { ...this.controlState };
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  destroy(): void {
    if (this.joystickBase) this.joystickBase.destroy();
    if (this.joystickHandle) this.joystickHandle.destroy();
    if (this.attackButton) this.attackButton.destroy();
    if (this.gunButton) this.gunButton.destroy();
    if (this.swordButton) this.swordButton.destroy();
    if (this.interactButton) this.interactButton.destroy();
    
    this.scene.scale.off('resize', this.handleResize, this);
  }
}
