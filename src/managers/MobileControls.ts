import Phaser from 'phaser';
import { WeaponType } from '../weapons/IWeapon';

export interface MobileControlState {
  movementX: number;
  movementY: number;
  aimX: number;
  aimY: number;
  isAttacking: boolean;
  switchWeapon?: WeaponType; // For direct weapon selection (top buttons)
  cycleWeapon: boolean; // For cycling weapons (switch button)
  interact: boolean;
}

export class MobileControls {
  private scene: Phaser.Scene;
  private isMobile: boolean = false;
  private controlState: MobileControlState;
  
  // Movement joystick (left)
  private moveJoystickBase!: Phaser.GameObjects.Arc;
  private moveJoystickHandle!: Phaser.GameObjects.Arc;
  private moveJoystickActive: boolean = false;
  private moveJoystickStartX: number = 0;
  private moveJoystickStartY: number = 0;
  private joystickRadius: number = 60;
  private joystickMaxDistance: number = 50;
  
  // Aim joystick (right)
  private aimJoystickBase!: Phaser.GameObjects.Arc;
  private aimJoystickHandle!: Phaser.GameObjects.Arc;
  private aimJoystickActive: boolean = false;
  private aimJoystickStartX: number = 0;
  private aimJoystickStartY: number = 0;
  private aimJoystickShootThreshold: number = 0.85; // Shoot when moved 85% to edge
  
  // Top weapon buttons
  private topSwordButton!: Phaser.GameObjects.Container;
  private topGunButton!: Phaser.GameObjects.Container;
  
  // Right side buttons (above aim joystick)
  private switchWeaponButton!: Phaser.GameObjects.Container;
  private interactButton!: Phaser.GameObjects.Container;
  
  // Button states
  private interactPressed: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.controlState = {
      movementX: 0,
      movementY: 0,
      aimX: 0,
      aimY: 0,
      isAttacking: false,
      cycleWeapon: false,
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

    // Create movement joystick (left side, bottom)
    this.createMovementJoystick(isLandscape);
    
    // Create aim joystick (right side, bottom)
    this.createAimJoystick(isLandscape);
    
    // Create top weapon buttons (sword and gun)
    this.createTopWeaponButtons(isLandscape);
    
    // Create right side buttons (above aim joystick)
    this.createRightSideButtons(isLandscape);
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Handle orientation changes
    this.scene.scale.on('resize', this.handleResize, this);
  }

  private createMovementJoystick(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const baseX = isLandscape ? 100 : 80;
    const baseY = isLandscape ? height - 100 : height - 100;
    
    // Movement joystick base
    this.moveJoystickBase = this.scene.add.circle(baseX, baseY, this.joystickRadius, 0x333333, 0.6);
    this.moveJoystickBase.setScrollFactor(0);
    this.moveJoystickBase.setDepth(1000);
    this.moveJoystickBase.setInteractive();
    
    // Movement joystick handle
    this.moveJoystickHandle = this.scene.add.circle(baseX, baseY, 25, 0x00ff00, 0.8);
    this.moveJoystickHandle.setScrollFactor(0);
    this.moveJoystickHandle.setDepth(1001);
    
    this.moveJoystickStartX = baseX;
    this.moveJoystickStartY = baseY;
  }

  private createAimJoystick(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const baseX = isLandscape ? width - 100 : width - 80;
    const baseY = isLandscape ? height - 100 : height - 100;
    
    // Aim joystick base
    this.aimJoystickBase = this.scene.add.circle(baseX, baseY, this.joystickRadius, 0x333333, 0.6);
    this.aimJoystickBase.setScrollFactor(0);
    this.aimJoystickBase.setDepth(1000);
    this.aimJoystickBase.setInteractive();
    
    // Aim joystick handle
    this.aimJoystickHandle = this.scene.add.circle(baseX, baseY, 25, 0xff0000, 0.8);
    this.aimJoystickHandle.setScrollFactor(0);
    this.aimJoystickHandle.setDepth(1001);
    
    this.aimJoystickStartX = baseX;
    this.aimJoystickStartY = baseY;
  }

  private createTopWeaponButtons(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const buttonY = isLandscape ? 60 : 50;
    const buttonSize = 55;
    const spacing = 70;
    const startX = width / 2 - spacing / 2; // Center the buttons
    
    // Sword button (first/left)
    const swordX = startX;
    const swordBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x444444, 0.7);
    swordBg.setStrokeStyle(2, 0xcccccc, 1);
    const swordIcon = this.scene.add.text(0, 0, '⚔', {
      fontSize: '24px',
    }).setOrigin(0.5);
    this.topSwordButton = this.scene.add.container(swordX, buttonY, [swordBg, swordIcon]);
    this.topSwordButton.setScrollFactor(0);
    this.topSwordButton.setDepth(1000);
    this.topSwordButton.setSize(buttonSize, buttonSize);
    this.topSwordButton.setInteractive();
    
    // Gun button (second/right)
    const gunX = startX + spacing;
    const gunBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x444444, 0.7);
    gunBg.setStrokeStyle(2, 0xffff00, 1);
    const gunIcon = this.scene.add.text(0, 0, '🔫', {
      fontSize: '24px',
    }).setOrigin(0.5);
    this.topGunButton = this.scene.add.container(gunX, buttonY, [gunBg, gunIcon]);
    this.topGunButton.setScrollFactor(0);
    this.topGunButton.setDepth(1000);
    this.topGunButton.setSize(buttonSize, buttonSize);
    this.topGunButton.setInteractive();
  }

  private createRightSideButtons(isLandscape: boolean): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const buttonY = isLandscape ? height - 200 : height - 180;
    const buttonSize = 55;
    const spacing = 70;
    const baseX = isLandscape ? width - 100 : width - 80;
    
    // Switch weapon button (left)
    const switchX = baseX - spacing;
    const switchBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x4444ff, 0.7);
    switchBg.setStrokeStyle(2, 0xffffff, 1);
    const switchIcon = this.scene.add.text(0, 0, '⇄', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.switchWeaponButton = this.scene.add.container(switchX, buttonY, [switchBg, switchIcon]);
    this.switchWeaponButton.setScrollFactor(0);
    this.switchWeaponButton.setDepth(1000);
    this.switchWeaponButton.setSize(buttonSize, buttonSize);
    this.switchWeaponButton.setInteractive();
    
    // Interact button (right)
    const interactX = baseX;
    const interactBg = this.scene.add.circle(0, 0, buttonSize / 2, 0x00ff00, 0.7);
    interactBg.setStrokeStyle(2, 0xffffff, 1);
    const interactIcon = this.scene.add.text(0, 0, 'E', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.interactButton = this.scene.add.container(interactX, buttonY, [interactBg, interactIcon]);
    this.interactButton.setScrollFactor(0);
    this.interactButton.setDepth(1000);
    this.interactButton.setSize(buttonSize, buttonSize);
    this.interactButton.setInteractive();
  }

  private setupInputHandlers(): void {
    // Movement joystick handlers
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldX = pointer.x;
      const worldY = pointer.y;
      
      // Check movement joystick
      const moveDistance = Phaser.Math.Distance.Between(
        worldX,
        worldY,
        this.moveJoystickStartX,
        this.moveJoystickStartY
      );
      
      if (moveDistance < this.joystickRadius + 20) {
        this.moveJoystickActive = true;
        this.updateMovementJoystick(worldX, worldY);
        return;
      }
      
      // Check aim joystick
      const aimDistance = Phaser.Math.Distance.Between(
        worldX,
        worldY,
        this.aimJoystickStartX,
        this.aimJoystickStartY
      );
      
      if (aimDistance < this.joystickRadius + 20) {
        this.aimJoystickActive = true;
        this.updateAimJoystick(worldX, worldY);
      }
    });
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.moveJoystickActive) {
        this.updateMovementJoystick(pointer.x, pointer.y);
      }
      
      if (this.aimJoystickActive) {
        this.updateAimJoystick(pointer.x, pointer.y);
      }
    });
    
    this.scene.input.on('pointerup', () => {
      if (this.moveJoystickActive) {
        this.moveJoystickActive = false;
        this.resetMovementJoystick();
      }
      
      if (this.aimJoystickActive) {
        this.aimJoystickActive = false;
        this.resetAimJoystick();
      }
    });
    
    // Top weapon buttons
    this.topSwordButton.on('pointerdown', () => {
      this.controlState.switchWeapon = WeaponType.SWORD;
      this.updateTopWeaponButtonVisual(this.topSwordButton, true);
      this.scene.time.delayedCall(100, () => {
        this.updateTopWeaponButtonVisual(this.topSwordButton, false);
        this.controlState.switchWeapon = undefined;
      });
    });
    
    this.topGunButton.on('pointerdown', () => {
      this.controlState.switchWeapon = WeaponType.GUN;
      this.updateTopWeaponButtonVisual(this.topGunButton, true);
      this.scene.time.delayedCall(100, () => {
        this.updateTopWeaponButtonVisual(this.topGunButton, false);
        this.controlState.switchWeapon = undefined;
      });
    });
    
    // Switch weapon button - cycles weapons
    this.switchWeaponButton.on('pointerdown', () => {
      // Set flag to cycle weapons
      this.controlState.cycleWeapon = true;
      this.updateSwitchWeaponButtonVisual(true);
      this.scene.time.delayedCall(100, () => {
        this.updateSwitchWeaponButtonVisual(false);
        this.controlState.cycleWeapon = false;
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

  private updateMovementJoystick(x: number, y: number): void {
    const dx = x - this.moveJoystickStartX;
    const dy = y - this.moveJoystickStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > this.joystickMaxDistance) {
      const angle = Math.atan2(dy, dx);
      const clampedX = this.moveJoystickStartX + Math.cos(angle) * this.joystickMaxDistance;
      const clampedY = this.moveJoystickStartY + Math.sin(angle) * this.joystickMaxDistance;
      this.moveJoystickHandle.setPosition(clampedX, clampedY);
      
      // Normalize movement
      this.controlState.movementX = Math.cos(angle);
      this.controlState.movementY = Math.sin(angle);
    } else {
      this.moveJoystickHandle.setPosition(x, y);
      
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

  private resetMovementJoystick(): void {
    this.moveJoystickHandle.setPosition(this.moveJoystickStartX, this.moveJoystickStartY);
    this.controlState.movementX = 0;
    this.controlState.movementY = 0;
  }

  private updateAimJoystick(x: number, y: number): void {
    const dx = x - this.aimJoystickStartX;
    const dy = y - this.aimJoystickStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDistance = distance / this.joystickMaxDistance;
    
    if (distance > this.joystickMaxDistance) {
      const angle = Math.atan2(dy, dx);
      const clampedX = this.aimJoystickStartX + Math.cos(angle) * this.joystickMaxDistance;
      const clampedY = this.aimJoystickStartY + Math.sin(angle) * this.joystickMaxDistance;
      this.aimJoystickHandle.setPosition(clampedX, clampedY);
      
      // Normalize aim direction
      this.controlState.aimX = Math.cos(angle);
      this.controlState.aimY = Math.sin(angle);
      
      // Auto-shoot when moved to edge/corner
      if (normalizedDistance >= this.aimJoystickShootThreshold) {
        this.controlState.isAttacking = true;
        // Visual feedback: change color when shooting
        this.aimJoystickHandle.setFillStyle(0xff4444, 1.0);
        this.aimJoystickBase.setFillStyle(0x663333, 0.8);
      } else {
        this.controlState.isAttacking = false;
        this.aimJoystickHandle.setFillStyle(0xff0000, 0.8);
        this.aimJoystickBase.setFillStyle(0x333333, 0.6);
      }
    } else {
      this.aimJoystickHandle.setPosition(x, y);
      
      // Normalize aim direction
      if (distance > 0) {
        this.controlState.aimX = dx / this.joystickMaxDistance;
        this.controlState.aimY = dy / this.joystickMaxDistance;
        
        // Auto-shoot when moved to edge/corner
        if (normalizedDistance >= this.aimJoystickShootThreshold) {
          this.controlState.isAttacking = true;
          // Visual feedback: change color when shooting
          this.aimJoystickHandle.setFillStyle(0xff4444, 1.0);
          this.aimJoystickBase.setFillStyle(0x663333, 0.8);
        } else {
          this.controlState.isAttacking = false;
          this.aimJoystickHandle.setFillStyle(0xff0000, 0.8);
          this.aimJoystickBase.setFillStyle(0x333333, 0.6);
        }
      } else {
        this.controlState.aimX = 0;
        this.controlState.aimY = 0;
        this.controlState.isAttacking = false;
        this.aimJoystickHandle.setFillStyle(0xff0000, 0.8);
        this.aimJoystickBase.setFillStyle(0x333333, 0.6);
      }
    }
  }

  private resetAimJoystick(): void {
    this.aimJoystickHandle.setPosition(this.aimJoystickStartX, this.aimJoystickStartY);
    this.aimJoystickHandle.setFillStyle(0xff0000, 0.8);
    this.aimJoystickBase.setFillStyle(0x333333, 0.6);
    this.controlState.aimX = 0;
    this.controlState.aimY = 0;
    this.controlState.isAttacking = false;
  }

  private resetAimJoystick(): void {
    this.aimJoystickHandle.setPosition(this.aimJoystickStartX, this.aimJoystickStartY);
    this.controlState.aimX = 0;
    this.controlState.aimY = 0;
    this.controlState.isAttacking = false;
  }

  private updateTopWeaponButtonVisual(button: Phaser.GameObjects.Container, pressed: boolean): void {
    const bg = button.list[0] as Phaser.GameObjects.Arc;
    if (pressed) {
      bg.setScale(0.85);
      bg.setFillStyle(0x666666, 0.9);
    } else {
      bg.setScale(1.0);
      bg.setFillStyle(0x444444, 0.7);
    }
  }

  private updateSwitchWeaponButtonVisual(pressed: boolean): void {
    const bg = this.switchWeaponButton.list[0] as Phaser.GameObjects.Arc;
    if (pressed) {
      bg.setScale(0.85);
      bg.setFillStyle(0x6666ff, 0.9);
    } else {
      bg.setScale(1.0);
      bg.setFillStyle(0x4444ff, 0.7);
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
    
    // Update movement joystick position
    const moveBaseX = isLandscape ? 100 : 80;
    const moveBaseY = isLandscape ? height - 100 : height - 100;
    this.moveJoystickBase.setPosition(moveBaseX, moveBaseY);
    this.moveJoystickHandle.setPosition(moveBaseX, moveBaseY);
    this.moveJoystickStartX = moveBaseX;
    this.moveJoystickStartY = moveBaseY;
    
    // Update aim joystick position
    const aimBaseX = isLandscape ? width - 100 : width - 80;
    const aimBaseY = isLandscape ? height - 100 : height - 100;
    this.aimJoystickBase.setPosition(aimBaseX, aimBaseY);
    this.aimJoystickHandle.setPosition(aimBaseX, aimBaseY);
    this.aimJoystickStartX = aimBaseX;
    this.aimJoystickStartY = aimBaseY;
    
    // Update top weapon buttons
    const topButtonY = isLandscape ? 60 : 50;
    const spacing = 70;
    const startX = width / 2 - spacing / 2;
    this.topSwordButton.setPosition(startX, topButtonY);
    this.topGunButton.setPosition(startX + spacing, topButtonY);
    
    // Update right side buttons
    const rightButtonY = isLandscape ? height - 200 : height - 180;
    const buttonSpacing = 70;
    const baseX = isLandscape ? width - 100 : width - 80;
    this.switchWeaponButton.setPosition(baseX - buttonSpacing, rightButtonY);
    this.interactButton.setPosition(baseX, rightButtonY);
  }

  getControlState(): MobileControlState {
    return { ...this.controlState };
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  destroy(): void {
    if (this.moveJoystickBase) this.moveJoystickBase.destroy();
    if (this.moveJoystickHandle) this.moveJoystickHandle.destroy();
    if (this.aimJoystickBase) this.aimJoystickBase.destroy();
    if (this.aimJoystickHandle) this.aimJoystickHandle.destroy();
    if (this.topSwordButton) this.topSwordButton.destroy();
    if (this.topGunButton) this.topGunButton.destroy();
    if (this.switchWeaponButton) this.switchWeaponButton.destroy();
    if (this.interactButton) this.interactButton.destroy();
    
    this.scene.scale.off('resize', this.handleResize, this);
  }
}
