import Phaser from 'phaser';
import { WeaponManager } from '../managers/WeaponManager';
import { IWeapon, WeaponType } from '../weapons/IWeapon';
import { ArmorType } from './Armor';
import { MobileControlState } from '../managers/MobileControls';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null = null;
  private speed: number = 150;
  private health: number = 100;
  private maxHealth: number = 100;
  private armor: number = 0;
  private maxArmor: number = 100;
  private currentArmorType: ArmorType | null = null;
  private weaponManager: WeaponManager;
  private currentWeapon: IWeapon;
  private weaponSwitchCooldown: number = 0;
  private weaponSwitchDelay: number = 300;
  private lastAutoSwitch: number = 0;
  private autoSwitchCooldown: number = 1000;
  public lastDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  private mobileControlState: MobileControlState | null = null;
  private virtualPointer: Phaser.Input.Pointer | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_right');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setScale(1.2);
    
    // Ensure we start with the right texture
    this.setTexture('player_right');

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(20, 20);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(6, 10);
    }

    // Only setup keyboard if available (may not be available on mobile)
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
    
    // Create virtual pointer for mobile attack
    this.virtualPointer = scene.input.activePointer;

    // Initialize weapon system
    this.weaponManager = new WeaponManager(scene);
    this.currentWeapon = this.weaponManager.getCurrentWeapon();

    // Setup weapon switching
    this.setupWeaponSwitching();
  }

  private setupWeaponSwitching(): void {
    // Number keys for weapon switching
    const key1 = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const key2 = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    key1.on('down', () => this.switchWeapon(WeaponType.GUN));
    key2.on('down', () => this.switchWeapon(WeaponType.SWORD));

    // Mouse wheel for weapon cycling
    this.scene.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
      if (deltaY > 0) {
        this.cycleWeaponNext();
      } else if (deltaY < 0) {
        this.cycleWeaponPrevious();
      }
    });
  }

  update(time: number, _delta: number): void {
    this.handleMovement();
    this.handleAttack(time);
    this.updateDepth();
  }

  setMobileControlState(state: MobileControlState | null): void {
    this.mobileControlState = state;
  }

  private handleMovement(): void {
    const velocity = new Phaser.Math.Vector2(0, 0);
    let directionForFacing: Phaser.Math.Vector2 | null = null;

    // Check mobile controls first
    if (this.mobileControlState) {
      velocity.x = this.mobileControlState.movementX;
      velocity.y = this.mobileControlState.movementY;
      
      // Use aim direction for facing if aim joystick is active, otherwise use movement
      if (this.mobileControlState.aimX !== 0 || this.mobileControlState.aimY !== 0) {
        directionForFacing = new Phaser.Math.Vector2(
          this.mobileControlState.aimX,
          this.mobileControlState.aimY
        ).normalize();
      } else if (velocity.length() > 0) {
        directionForFacing = velocity.clone().normalize();
      }
    } else {
      // Fall back to keyboard controls
      if (this.cursors && this.wasd) {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
          velocity.x = -1;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
          velocity.x = 1;
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
          velocity.y = -1;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
          velocity.y = 1;
        }
      }
      
      if (velocity.length() > 0) {
        directionForFacing = velocity.clone().normalize();
      }
    }

    velocity.normalize().scale(this.speed);
    this.setVelocity(velocity.x, velocity.y);

    // Update facing direction based on aim or movement
    if (directionForFacing && directionForFacing.length() > 0) {
      this.lastDirection = directionForFacing.clone();
      this.updateDirection(directionForFacing);
    } else if (velocity.length() > 0) {
      // Fallback: use movement direction
      this.lastDirection = velocity.clone().normalize();
      this.updateDirection(velocity);
    } else {
      // When stopped, maintain the last direction visually
      // (don't change texture, keep facing the last movement/aim direction)
    }
  }

  private updateDirection(velocity: Phaser.Math.Vector2): void {
    // Check if velocity has length to avoid division by zero
    if (velocity.length() === 0) {
      return;
    }
    
    // Normalize velocity to get direction
    const normalized = velocity.clone().normalize();
    const angle = Phaser.Math.RadToDeg(Math.atan2(normalized.y, normalized.x));
    
    // Determine direction based on angle
    // Right: -45 to 45 degrees
    // Down-Right: 45 to 90 degrees
    // Down: 90 to 135 degrees
    // Down-Left: 135 to 180 degrees
    // Left: -180 to -135 or 135 to 180 degrees
    // Up-Left: -135 to -90 degrees
    // Up: -90 to -45 degrees
    // Up-Right: -45 to 0 degrees
    
    let textureKey = 'player_right'; // default
    
    if (angle >= -22.5 && angle < 22.5) {
      textureKey = 'player_right';
    } else if (angle >= 22.5 && angle < 67.5) {
      textureKey = 'player_downRight';
    } else if (angle >= 67.5 && angle < 112.5) {
      textureKey = 'player_down';
    } else if (angle >= 112.5 && angle < 157.5) {
      textureKey = 'player_downLeft';
    } else if (angle >= 157.5 || angle < -157.5) {
      textureKey = 'player_left';
    } else if (angle >= -157.5 && angle < -112.5) {
      textureKey = 'player_upLeft';
    } else if (angle >= -112.5 && angle < -67.5) {
      textureKey = 'player_up';
    } else if (angle >= -67.5 && angle < -22.5) {
      textureKey = 'player_upRight';
    }
    
    // Only change texture if it's different to avoid unnecessary updates
    if (this.texture && this.texture.key !== textureKey) {
      // Check if texture exists before setting
      if (this.scene.textures.exists(textureKey)) {
        this.setTexture(textureKey);
        this.setFrame(0); // Reset to first frame
        this.clearTint(); // Clear any tint that might be applied
      }
    }
  }

  private handleAttack(time: number): void {
    // Handle weapon switching from mobile controls
    if (this.mobileControlState?.cycleWeapon) {
      // Cycle to next weapon
      this.cycleWeaponNext();
      this.mobileControlState.cycleWeapon = false;
    } else if (this.mobileControlState?.switchWeapon !== undefined) {
      // Direct weapon selection (from top buttons)
      this.switchWeapon(this.mobileControlState.switchWeapon);
      this.mobileControlState.switchWeapon = undefined;
    }

    // Auto-switch to sword if gun has no ammo
    if (
      this.currentWeapon.getWeaponType() === WeaponType.GUN &&
      !this.currentWeapon.hasAmmo()
    ) {
      const now = this.scene.time.now;
      if (now - this.lastAutoSwitch > this.autoSwitchCooldown) {
        this.switchWeapon(WeaponType.SWORD);
        this.scene.events.emit('weaponAutoSwitch', WeaponType.SWORD);
        this.lastAutoSwitch = now;
      }
    }

    // Determine attack input source
    const pointer = this.scene.input.activePointer;
    let shouldAttack = false;
    let attackPointer: Phaser.Input.Pointer = pointer;

    if (this.mobileControlState?.isAttacking) {
      // Mobile attack - use aim direction from right joystick
      shouldAttack = true;
      
      // Use aim direction from mobile controls
      let aimDir: Phaser.Math.Vector2;
      if (this.mobileControlState.aimX !== 0 || this.mobileControlState.aimY !== 0) {
        // Use aim joystick direction
        aimDir = new Phaser.Math.Vector2(
          this.mobileControlState.aimX,
          this.mobileControlState.aimY
        ).normalize();
      } else {
        // Fallback: use movement direction or last direction
        if (this.mobileControlState.movementX !== 0 || this.mobileControlState.movementY !== 0) {
          aimDir = new Phaser.Math.Vector2(
            this.mobileControlState.movementX,
            this.mobileControlState.movementY
          ).normalize();
        } else if (this.lastDirection.length() > 0) {
          aimDir = this.lastDirection.clone().normalize();
        } else {
          // Default: aim right
          aimDir = new Phaser.Math.Vector2(1, 0);
        }
      }
      
      // Convert player position + aim direction to screen coordinates
      const attackWorldX = this.x + aimDir.x * 100;
      const attackWorldY = this.y + aimDir.y * 100;
      const screenPoint = this.scene.cameras.main.getWorldPoint(attackWorldX, attackWorldY);
      attackPointer = {
        ...pointer,
        x: screenPoint.x,
        y: screenPoint.y,
        isDown: true,
      } as Phaser.Input.Pointer;
    } else if (pointer.isDown) {
      // Desktop attack - use mouse pointer
      shouldAttack = true;
    }

    if (shouldAttack && this.currentWeapon.canAttack(time)) {
      this.currentWeapon.attack(time, attackPointer, this);
    }
  }

  switchWeapon(weaponType: WeaponType): void {
    const currentTime = this.scene.time.now;

    // Prevent switch if on cooldown
    if (currentTime < this.weaponSwitchCooldown) return;

    // Prevent switch if already equipped
    if (this.currentWeapon.getWeaponType() === weaponType) return;

    // Prevent switch during active attack
    if (this.currentWeapon.isAttacking()) return;

    // Perform switch
    const newWeapon = this.weaponManager.getWeapon(weaponType);
    if (newWeapon) {
      this.currentWeapon = newWeapon;
      this.weaponManager.setCurrentWeapon(weaponType);
      this.weaponSwitchCooldown = currentTime + this.weaponSwitchDelay;

      // Emit event for UI update
      this.scene.events.emit('weaponChanged', weaponType, this.currentWeapon);
    }
  }

  private cycleWeaponNext(): void {
    const weapons = [WeaponType.GUN, WeaponType.SWORD];
    const currentIndex = weapons.indexOf(this.currentWeapon.getWeaponType());
    const nextIndex = (currentIndex + 1) % weapons.length;
    this.switchWeapon(weapons[nextIndex]);
  }

  private cycleWeaponPrevious(): void {
    const weapons = [WeaponType.GUN, WeaponType.SWORD];
    const currentIndex = weapons.indexOf(this.currentWeapon.getWeaponType());
    const prevIndex = (currentIndex - 1 + weapons.length) % weapons.length;
    this.switchWeapon(weapons[prevIndex]);
  }

  private updateDepth(): void {
    this.setDepth(this.y + 10);
  }

  getBullets(): Phaser.Physics.Arcade.Group | undefined {
    // Bullets are owned by the gun weapon, but collisions are set up at scene
    // creation time. If the player starts a scene with the sword equipped,
    // `currentWeapon.getBullets()` would be undefined and bullet/enemy overlaps
    // would never be registered, making enemies "unkillable" when switching
    // back to the gun later.
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    return gun?.getBullets?.();
  }

  takeDamage(amount: number): void {
    let actualDamage = amount;

    // Armor absorbs damage first
    if (this.armor > 0) {
      const armorAbsorption = Math.min(this.armor, amount);
      this.armor -= armorAbsorption;
      actualDamage = amount - armorAbsorption;
      this.scene.events.emit('armorChanged', this.armor, this.maxArmor);

      // Remove visual overlay if armor breaks
      if (this.armor <= 0) {
        this.removeArmorOverlay();
      }
    }

    // Apply remaining damage to health
    if (actualDamage > 0) {
      this.health -= actualDamage;
      this.scene.events.emit('healthChanged', this.health, this.maxHealth);
    }

    // Visual feedback (red tint)
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
      // Reapply armor tint if armor is still active
      if (this.armor > 0 && this.currentArmorType) {
        this.addArmorOverlay(this.currentArmorType);
      }
    });

    if (this.health <= 0) {
      this.scene.events.emit('playerDied');
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.scene.events.emit('healthChanged', this.health, this.maxHealth);
  }

  addAmmo(amount: number): void {
    // Always add to gun ammo, even if sword is equipped
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    if (gun) {
      gun.addAmmo(amount);
    }
  }

  setAmmo(amount: number): void {
    // Set gun ammo
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    if (gun) {
      gun.setAmmo(amount);
    }
  }

  addArmor(amount: number, armorType: ArmorType): void {
    // Add armor and update max armor if needed
    this.armor = Math.min(this.armor + amount, this.maxArmor);
    this.currentArmorType = armorType;

    // Set max armor based on type
    if (armorType === 'red' && this.maxArmor < 100) {
      this.maxArmor = 100;
    } else if (armorType === 'blue' && this.maxArmor < 50) {
      this.maxArmor = 50;
    }

    // Add visual overlay
    this.addArmorOverlay(armorType);

    // Emit armor changed event
    this.scene.events.emit('armorChanged', this.armor, this.maxArmor);
  }

  setArmor(amount: number): void {
    this.armor = Math.min(amount, this.maxArmor);
    if (this.armor > 0 && this.currentArmorType) {
      this.addArmorOverlay(this.currentArmorType);
    }
    this.scene.events.emit('armorChanged', this.armor, this.maxArmor);
  }

  private addArmorOverlay(armorType: ArmorType): void {
    // Apply colored tint based on armor type
    const armorColor = armorType === 'blue' ? 0x4488ff : 0xff4444;
    this.setTint(armorColor);
  }

  private removeArmorOverlay(): void {
    // Clear armor tint
    this.clearTint();
    this.currentArmorType = null;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getAmmo(): number {
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    return gun ? gun.getAmmoCount() : 0;
  }

  getMaxAmmo(): number {
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    return gun ? gun.getMaxAmmo() : 30;
  }

  getArmor(): number {
    return this.armor;
  }

  getMaxArmor(): number {
    return this.maxArmor;
  }

  getCurrentWeaponType(): WeaponType {
    return this.currentWeapon.getWeaponType();
  }

  setWeapon(weaponType: WeaponType): void {
    this.switchWeapon(weaponType);
  }

  resetStats(): void {
    this.health = this.maxHealth;
    this.armor = 0;
    this.currentArmorType = null;
    this.removeArmorOverlay();
    const gun = this.weaponManager.getWeapon(WeaponType.GUN);
    if (gun) {
      gun.setAmmo(gun.getMaxAmmo());
    }
    this.scene.events.emit('healthChanged', this.health, this.maxHealth);
    this.scene.events.emit('armorChanged', this.armor, this.maxArmor);
  }
}
