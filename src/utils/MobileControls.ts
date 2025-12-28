import Phaser from 'phaser';

export interface MobileInputState {
  moveX: number;      // -1 to 1 (left/right)
  moveY: number;      // -1 to 1 (up/down)
  isAttacking: boolean;
  weaponSwitch: boolean;
  interact: boolean;
  aimAngle: number;   // Radians, for auto-aim or joystick-based aiming
}

export class MobileControls {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  
  // Joystick components
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickRadius: number = 50;
  private joystickBaseX: number = 0;
  private joystickBaseY: number = 0;
  
  // Buttons
  private attackButton!: Phaser.GameObjects.Arc;
  private attackButtonInner!: Phaser.GameObjects.Arc;
  private weaponButton!: Phaser.GameObjects.Arc;
  private weaponButtonIcon!: Phaser.GameObjects.Text;
  private interactButton!: Phaser.GameObjects.Arc;
  private interactButtonText!: Phaser.GameObjects.Text;
  
  // State
  private inputState: MobileInputState = {
    moveX: 0,
    moveY: 0,
    isAttacking: false,
    weaponSwitch: false,
    interact: false,
    aimAngle: 0,
  };
  
  // Track if mobile
  private _isMobile: boolean = false;
  private _isEnabled: boolean = false;
  
  // Touch tracking
  private attackPointer: Phaser.Input.Pointer | null = null;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this._isMobile = this.detectMobile();
  }
  
  private detectMobile(): boolean {
    // Check for touch support and mobile user agents
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Also check for small screens which likely need touch controls
    const isSmallScreen = window.innerWidth <= 1024;
    return hasTouch && (isMobileUA || isSmallScreen);
  }
  
  isMobile(): boolean {
    return this._isMobile;
  }
  
  isEnabled(): boolean {
    return this._isEnabled;
  }
  
  create(): void {
    if (!this._isMobile) return;
    
    this._isEnabled = true;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create container for all mobile UI (fixed to camera)
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(2000);
    
    // Calculate positions based on screen size (works in both portrait and landscape)
    const padding = Math.min(width, height) * 0.05;
    const buttonSize = Math.min(width, height) * 0.08;
    this.joystickRadius = Math.min(width, height) * 0.08;
    
    // Joystick position (bottom-left)
    this.joystickBaseX = padding + this.joystickRadius * 1.5;
    this.joystickBaseY = height - padding - this.joystickRadius * 1.5;
    
    // Create joystick
    this.createJoystick();
    
    // Button positions (bottom-right area)
    const buttonAreaX = width - padding - buttonSize * 1.5;
    const buttonAreaY = height - padding - buttonSize * 1.5;
    
    // Create buttons
    this.createAttackButton(buttonAreaX, buttonAreaY, buttonSize);
    this.createWeaponButton(buttonAreaX - buttonSize * 2.2, buttonAreaY, buttonSize * 0.7);
    this.createInteractButton(buttonAreaX, buttonAreaY - buttonSize * 2.2, buttonSize * 0.7);
    
    // Setup touch input
    this.setupTouchInput();
    
    // Handle resize
    this.scene.scale.on('resize', this.handleResize, this);
  }
  
  private createJoystick(): void {
    // Base (outer circle)
    this.joystickBase = this.scene.add.circle(
      this.joystickBaseX,
      this.joystickBaseY,
      this.joystickRadius * 1.5,
      0x333333,
      0.5
    );
    this.joystickBase.setStrokeStyle(3, 0x666666, 0.8);
    
    // Thumb (inner movable circle)
    this.joystickThumb = this.scene.add.circle(
      this.joystickBaseX,
      this.joystickBaseY,
      this.joystickRadius * 0.6,
      0x4488ff,
      0.8
    );
    this.joystickThumb.setStrokeStyle(2, 0xffffff, 0.5);
    
    this.container.add([this.joystickBase, this.joystickThumb]);
  }
  
  private createAttackButton(x: number, y: number, size: number): void {
    // Outer ring
    this.attackButton = this.scene.add.circle(x, y, size, 0x333333, 0.5);
    this.attackButton.setStrokeStyle(3, 0xff4444, 0.8);
    
    // Inner filled area
    this.attackButtonInner = this.scene.add.circle(x, y, size * 0.7, 0xff4444, 0.6);
    
    // Label
    const attackLabel = this.scene.add.text(x, y, '⚔', {
      fontSize: `${size * 0.8}px`,
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.container.add([this.attackButton, this.attackButtonInner, attackLabel]);
  }
  
  private createWeaponButton(x: number, y: number, size: number): void {
    this.weaponButton = this.scene.add.circle(x, y, size, 0x333333, 0.5);
    this.weaponButton.setStrokeStyle(2, 0x44ff44, 0.8);
    
    this.weaponButtonIcon = this.scene.add.text(x, y, '🔫', {
      fontSize: `${size * 0.9}px`,
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.container.add([this.weaponButton, this.weaponButtonIcon]);
  }
  
  private createInteractButton(x: number, y: number, size: number): void {
    this.interactButton = this.scene.add.circle(x, y, size, 0x333333, 0.5);
    this.interactButton.setStrokeStyle(2, 0xffff44, 0.8);
    
    this.interactButtonText = this.scene.add.text(x, y, 'E', {
      fontSize: `${size * 0.8}px`,
      fontStyle: 'bold',
      color: '#ffff44',
    }).setOrigin(0.5);
    
    this.container.add([this.interactButton, this.interactButtonText]);
  }
  
  private setupTouchInput(): void {
    // Enable multi-touch
    this.scene.input.addPointer(2);
    
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }
  
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;
    
    // Check if touching joystick area (left side of screen)
    const distToJoystick = Phaser.Math.Distance.Between(x, y, this.joystickBaseX, this.joystickBaseY);
    if (distToJoystick < this.joystickRadius * 2 && !this.joystickPointer) {
      this.joystickPointer = pointer;
      this.updateJoystick(pointer);
      return;
    }
    
    // Check attack button
    const attackX = this.attackButton.x;
    const attackY = this.attackButton.y;
    const distToAttack = Phaser.Math.Distance.Between(x, y, attackX, attackY);
    if (distToAttack < this.attackButton.radius * 1.5) {
      this.inputState.isAttacking = true;
      this.attackPointer = pointer;
      this.attackButtonInner.setFillStyle(0xff0000, 0.9);
      return;
    }
    
    // Check weapon switch button
    const weaponX = this.weaponButton.x;
    const weaponY = this.weaponButton.y;
    const distToWeapon = Phaser.Math.Distance.Between(x, y, weaponX, weaponY);
    if (distToWeapon < this.weaponButton.radius * 1.5) {
      this.inputState.weaponSwitch = true;
      this.weaponButton.setFillStyle(0x44ff44, 0.7);
      return;
    }
    
    // Check interact button
    const interactX = this.interactButton.x;
    const interactY = this.interactButton.y;
    const distToInteract = Phaser.Math.Distance.Between(x, y, interactX, interactY);
    if (distToInteract < this.interactButton.radius * 1.5) {
      this.inputState.interact = true;
      this.interactButton.setFillStyle(0xffff44, 0.7);
      return;
    }
  }
  
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Update joystick if this is the joystick pointer
    if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
      this.updateJoystick(pointer);
    }
  }
  
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    // Release joystick
    if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
      this.joystickPointer = null;
      this.joystickThumb.setPosition(this.joystickBaseX, this.joystickBaseY);
      this.inputState.moveX = 0;
      this.inputState.moveY = 0;
    }
    
    // Release attack button
    if (this.attackPointer && pointer.id === this.attackPointer.id) {
      this.inputState.isAttacking = false;
      this.attackPointer = null;
      this.attackButtonInner.setFillStyle(0xff4444, 0.6);
    }
    
    // Reset weapon switch (one-shot)
    this.inputState.weaponSwitch = false;
    this.weaponButton.setFillStyle(0x333333, 0.5);
    
    // Reset interact (one-shot)
    this.inputState.interact = false;
    this.interactButton.setFillStyle(0x333333, 0.5);
  }
  
  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystickBaseX;
    const dy = pointer.y - this.joystickBaseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = this.joystickRadius;
    
    // Clamp to max distance
    let thumbX = dx;
    let thumbY = dy;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      thumbX = Math.cos(angle) * maxDistance;
      thumbY = Math.sin(angle) * maxDistance;
    }
    
    // Update thumb position
    this.joystickThumb.setPosition(
      this.joystickBaseX + thumbX,
      this.joystickBaseY + thumbY
    );
    
    // Update input state (-1 to 1)
    this.inputState.moveX = thumbX / maxDistance;
    this.inputState.moveY = thumbY / maxDistance;
    
    // Calculate aim angle from joystick direction
    if (distance > maxDistance * 0.2) {
      this.inputState.aimAngle = Math.atan2(dy, dx);
    }
  }
  
  private handleResize(gameSize: Phaser.Structs.Size): void {
    if (!this._isEnabled) return;
    
    const width = gameSize.width;
    const height = gameSize.height;
    const padding = Math.min(width, height) * 0.05;
    const buttonSize = Math.min(width, height) * 0.08;
    this.joystickRadius = Math.min(width, height) * 0.08;
    
    // Update joystick position
    this.joystickBaseX = padding + this.joystickRadius * 1.5;
    this.joystickBaseY = height - padding - this.joystickRadius * 1.5;
    
    this.joystickBase.setPosition(this.joystickBaseX, this.joystickBaseY);
    this.joystickBase.setRadius(this.joystickRadius * 1.5);
    this.joystickThumb.setPosition(this.joystickBaseX, this.joystickBaseY);
    this.joystickThumb.setRadius(this.joystickRadius * 0.6);
    
    // Update button positions
    const buttonAreaX = width - padding - buttonSize * 1.5;
    const buttonAreaY = height - padding - buttonSize * 1.5;
    
    this.attackButton.setPosition(buttonAreaX, buttonAreaY);
    this.attackButton.setRadius(buttonSize);
    this.attackButtonInner.setPosition(buttonAreaX, buttonAreaY);
    this.attackButtonInner.setRadius(buttonSize * 0.7);
    
    // Update all children positions
    const attackLabel = this.container.list.find(
      (obj) => obj instanceof Phaser.GameObjects.Text && (obj as Phaser.GameObjects.Text).text === '⚔'
    ) as Phaser.GameObjects.Text;
    if (attackLabel) {
      attackLabel.setPosition(buttonAreaX, buttonAreaY);
      attackLabel.setFontSize(buttonSize * 0.8);
    }
    
    const weaponX = buttonAreaX - buttonSize * 2.2;
    const weaponSize = buttonSize * 0.7;
    this.weaponButton.setPosition(weaponX, buttonAreaY);
    this.weaponButton.setRadius(weaponSize);
    this.weaponButtonIcon.setPosition(weaponX, buttonAreaY);
    this.weaponButtonIcon.setFontSize(weaponSize * 0.9);
    
    const interactY = buttonAreaY - buttonSize * 2.2;
    const interactSize = buttonSize * 0.7;
    this.interactButton.setPosition(buttonAreaX, interactY);
    this.interactButton.setRadius(interactSize);
    this.interactButtonText.setPosition(buttonAreaX, interactY);
    this.interactButtonText.setFontSize(interactSize * 0.8);
  }
  
  getInputState(): MobileInputState {
    return this.inputState;
  }
  
  // Reset one-shot inputs (call after processing)
  resetOneShot(): void {
    this.inputState.weaponSwitch = false;
    this.inputState.interact = false;
  }
  
  // Update weapon icon based on current weapon
  setWeaponIcon(isGun: boolean): void {
    if (this.weaponButtonIcon) {
      this.weaponButtonIcon.setText(isGun ? '🔫' : '⚔️');
    }
  }
  
  // Show/hide controls
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.setVisible(visible);
    }
  }
  
  destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    
    if (this.container) {
      this.container.destroy();
    }
  }
}
