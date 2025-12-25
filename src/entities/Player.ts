import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private speed: number = 150;
  private health: number = 100;
  private maxHealth: number = 100;
  private ammo: number = 30;
  private maxAmmo: number = 30;
  private shootCooldown: number = 0;
  private shootDelay: number = 200;
  private bullets: Phaser.Physics.Arcade.Group;
  public lastDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setScale(1.2);

    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setSize(20, 20);
      (this.body as Phaser.Physics.Arcade.Body).setOffset(6, 10);
    }

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: true,
    });
  }

  update(time: number, _delta: number): void {
    this.handleMovement();
    this.handleShooting(time);
    this.updateDepth();
  }

  private handleMovement(): void {
    const velocity = new Phaser.Math.Vector2(0, 0);

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

    velocity.normalize().scale(this.speed);
    this.setVelocity(velocity.x, velocity.y);

    if (velocity.length() > 0) {
      this.lastDirection = velocity.clone().normalize();
    }
  }

  private handleShooting(time: number): void {
    const pointer = this.scene.input.activePointer;

    if (pointer.isDown && time > this.shootCooldown && this.ammo > 0) {
      this.shoot(pointer);
      this.shootCooldown = time + this.shootDelay;
      this.ammo--;
      this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo);
    }
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    const bullet = this.bullets.get(this.x, this.y, 'bullet') as Phaser.Physics.Arcade.Sprite;

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      // Set depth based on Y position to ensure bullets appear above tiles
      bullet.setDepth(bullet.y + 10);
      
      // Re-enable physics body (it may have been disabled on collision)
      if (bullet.body) {
        bullet.body.enable = true;
      }

      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const direction = new Phaser.Math.Vector2(worldPoint.x - this.x, worldPoint.y - this.y).normalize();

      bullet.setVelocity(direction.x * 400, direction.y * 400);

      // Update bullet depth continuously as it moves
      const depthUpdateTimer = this.scene.time.addEvent({
        delay: 16, // ~60fps
        callback: () => {
          if (bullet.active && bullet.visible) {
            bullet.setDepth(bullet.y + 10);
          } else {
            depthUpdateTimer.remove();
          }
        },
        loop: true,
      });

      this.scene.time.delayedCall(2000, () => {
        depthUpdateTimer.remove();
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          if (bullet.body) {
            bullet.body.enable = false;
          }
        }
      });
    }
  }

  private updateDepth(): void {
    this.setDepth(this.y + 10);
  }

  getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    this.scene.events.emit('healthChanged', this.health, this.maxHealth);

    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
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
    this.ammo = Math.min(this.ammo + amount, this.maxAmmo);
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo);
  }

  setAmmo(amount: number): void {
    this.ammo = Math.min(Math.max(0, amount), this.maxAmmo);
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo);
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getAmmo(): number {
    return this.ammo;
  }

  getMaxAmmo(): number {
    return this.maxAmmo;
  }

  resetStats(): void {
    this.health = this.maxHealth;
    this.ammo = this.maxAmmo;
    this.scene.events.emit('healthChanged', this.health, this.maxHealth);
    this.scene.events.emit('ammoChanged', this.ammo, this.maxAmmo);
  }
}
