import Phaser from 'phaser';
import { WeaponType } from '../weapons/IWeapon';
import { VirtualJoystick } from '../utils/VirtualJoystick';
import { TouchControls } from '../utils/TouchControls';

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private armorBar!: Phaser.GameObjects.Graphics;
  private armorText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private weaponIcon!: Phaser.GameObjects.Image;
  private weaponText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private gameOverContainer!: Phaser.GameObjects.Container;
  
  // Mobile controls
  private joystick?: VirtualJoystick;
  private touchControls?: TouchControls;
  private isMobile: boolean = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Detect mobile device
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS || 
                    this.sys.game.device.os.iPad || this.sys.game.device.os.iPhone ||
                    'ontouchstart' in window;
    
    this.createHealthBar();
    this.createArmorBar();
    this.createAmmoDisplay();
    this.createWeaponDisplay();
    this.createScoreDisplay();
    
    // Show appropriate controls
    if (this.isMobile) {
      this.createMobileControls();
    } else {
      this.createControls();
    }
    
    this.createGameOverScreen();
    this.setupEvents();
    
    // Handle orientation changes
    this.scale.on('resize', this.handleResize, this);
  }

  private createHealthBar(): void {
    const x = 20;
    const y = 20;

    // Background
    this.add.rectangle(x + 75, y + 10, 160, 24, 0x333333).setOrigin(0, 0.5);

    // Health bar
    this.healthBar = this.add.graphics();
    this.updateHealthBar(100, 100);

    // Label
    this.add.text(x, y, 'HP', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Health text
    this.healthText = this.add.text(x + 155, y, '100/100', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
  }

  private updateHealthBar(current: number, max: number): void {
    const x = 95;
    const y = 14;
    const width = 150;
    const height = 16;
    const percentage = current / max;

    this.healthBar.clear();

    // Background
    this.healthBar.fillStyle(0x222222, 1);
    this.healthBar.fillRect(x, y, width, height);

    // Health fill
    const color = percentage > 0.5 ? 0x00ff00 : percentage > 0.25 ? 0xffff00 : 0xff0000;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x + 2, y + 2, (width - 4) * percentage, height - 4);

    // Border
    this.healthBar.lineStyle(2, 0xffffff, 0.8);
    this.healthBar.strokeRect(x, y, width, height);

    this.healthText?.setText(`${current}/${max}`);
  }

  private createArmorBar(): void {
    const x = 20;
    const y = 40;

    // Background
    this.add.rectangle(x + 75, y + 10, 160, 18, 0x1a1a1a).setOrigin(0, 0.5);

    // Armor bar
    this.armorBar = this.add.graphics();
    this.updateArmorBar(0, 100);

    // Label
    this.add.text(x, y, 'ARMOR', {
      fontSize: '14px',
      color: '#888888',
    });

    // Armor text
    this.armorText = this.add.text(x + 155, y, '0/100', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5, 0);
  }

  private updateArmorBar(current: number, max: number): void {
    const x = 95;
    const y = 44;
    const width = 150;
    const height = 12;
    const percentage = current / max;

    this.armorBar.clear();

    // Background
    this.armorBar.fillStyle(0x1a1a1a, 1);
    this.armorBar.fillRect(x, y, width, height);

    // Armor fill (color based on amount - blue for >50, red otherwise)
    if (current > 0) {
      const armorColor = current > 50 ? 0x4488ff : 0xff5555;
      this.armorBar.fillStyle(armorColor, 1);
      this.armorBar.fillRect(x + 2, y + 2, (width - 4) * percentage, height - 4);
    }

    // Border
    this.armorBar.lineStyle(1, 0x888888, 0.8);
    this.armorBar.strokeRect(x, y, width, height);

    // Update text color based on armor amount
    const textColor = current > 0 ? (current > 50 ? '#4488ff' : '#ff5555') : '#888888';
    this.armorText?.setColor(textColor);
    this.armorText?.setText(`${Math.ceil(current)}/${max}`);
  }

  private createAmmoDisplay(): void {
    const x = 20;
    const y = 60;

    this.add.text(x, y, 'AMMO', {
      fontSize: '14px',
      color: '#aaaaaa',
    });

    this.ammoText = this.add.text(x + 60, y, '30/30', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
  }

  private updateAmmoDisplay(current: number, max: number, weaponType?: WeaponType): void {
    if (weaponType === WeaponType.SWORD) {
      this.ammoText.setText('∞');
      this.ammoText.setColor('#aaaaaa');
    } else {
      this.ammoText.setText(`${current}/${max}`);
      if (current <= 5) {
        this.ammoText.setColor('#ff0000');
      } else {
        this.ammoText.setColor('#ffff00');
      }
    }
  }

  private createWeaponDisplay(): void {
    const x = 20;
    const y = 75;

    this.add.text(x, y, 'WEAPON', {
      fontSize: '14px',
      color: '#aaaaaa',
    });

    this.weaponIcon = this.add.image(x + 70, y + 8, 'weapon_gun_icon');
    this.weaponIcon.setScale(0.8);

    this.weaponText = this.add.text(x + 90, y, 'Gun', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
  }

  private updateWeaponDisplay(weaponType: WeaponType): void {
    if (weaponType === WeaponType.GUN) {
      this.weaponIcon.setTexture('weapon_gun_icon');
      this.weaponText.setText('Gun');
      this.weaponText.setColor('#ffff00');
    } else if (weaponType === WeaponType.SWORD) {
      this.weaponIcon.setTexture('weapon_sword_icon');
      this.weaponText.setText('Sword');
      this.weaponText.setColor('#cccccc');
    }

    // Pulse animation
    this.tweens.add({
      targets: [this.weaponIcon, this.weaponText],
      scale: 1.2,
      duration: 150,
      yoyo: true,
    });
  }

  private showWeaponSwitchMessage(weaponType: WeaponType): void {
    const message = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        weaponType === WeaponType.GUN ? 'Switched to Gun [1]' : 'Switched to Sword [2]',
        {
          fontSize: '18px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 },
        }
      )
      .setOrigin(0.5)
      .setDepth(999);

    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 500,
      delay: 500,
      onComplete: () => message.destroy(),
    });
  }

  private showAutoSwitchMessage(): void {
    const message = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        'Out of ammo! Switched to Sword',
        {
          fontSize: '18px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 },
        }
      )
      .setOrigin(0.5)
      .setDepth(999);

    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 500,
      delay: 1000,
      onComplete: () => message.destroy(),
    });
  }

  private createScoreDisplay(): void {
    const x = this.cameras.main.width - 20;
    const y = 20;

    this.add.text(x, y, 'SCORE', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(1, 0);

    this.scoreText = this.add.text(x, y + 20, '0', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
  }

  private updateScore(points: number): void {
    this.score += points;
    this.scoreText.setText(this.score.toString());

    // Emit score update event for other scenes
    this.events.emit('scoreUpdated', this.score);

    // Score pop effect
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.3,
      duration: 100,
      yoyo: true,
    });
  }

  private createControls(): void {
    const x = 20;
    const y = this.cameras.main.height - 100;

    const controlsText = [
      'Controls:',
      'WASD / Arrows - Move',
      'Mouse - Aim & Shoot',
      'E - Enter/Exit Buildings',
      '1/2 or Mouse Wheel - Switch Weapon',
    ].join('\n');

    this.add.text(x, y, controlsText, {
      fontSize: '12px',
      color: '#888888',
      lineSpacing: 4,
    }).setScrollFactor(0);
  }

  private createMobileControls(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Create virtual joystick (bottom left)
    this.joystick = new VirtualJoystick(this, 100, height - 100);
    
    // Create touch controls (bottom right)
    this.touchControls = new TouchControls(this);
    
    // Attack button (fire/slash)
    this.touchControls.createButton(
      'attack',
      width - 80,
      height - 100,
      70,
      70,
      '⚔️',
      () => {},
      0xff4444
    );
    
    // Weapon switch button
    this.touchControls.createButton(
      'weapon',
      width - 80,
      height - 190,
      60,
      60,
      '🔄',
      () => {},
      0x4488ff
    );
    
    // Building interaction button (shown only near doors)
    this.touchControls.createButton(
      'interact',
      width / 2,
      height - 80,
      80,
      60,
      'E',
      () => {},
      0x44ff44
    );
    
    // Initially hide interact button
    this.touchControls.setButtonVisible('interact', false);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    
    if (this.isMobile && this.joystick && this.touchControls) {
      // Reposition mobile controls
      this.joystick.setPosition(100, height - 100);
      this.touchControls.setButtonPosition('attack', width - 80, height - 100);
      this.touchControls.setButtonPosition('weapon', width - 80, height - 190);
      this.touchControls.setButtonPosition('interact', width / 2, height - 80);
    }
  }

  private createGameOverScreen(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
    bg.setOrigin(0.5);

    const gameOverText = this.add.text(0, -60, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(0, 0, 'Final Score:', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const finalScore = this.add.text(0, 30, '0', {
      fontSize: '36px',
      color: '#ffff00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const restartText = this.add.text(0, 80, 'Press R to Restart', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.gameOverContainer = this.add.container(centerX, centerY, [
      bg,
      gameOverText,
      scoreLabel,
      finalScore,
      restartText,
    ]);

    this.gameOverContainer.setVisible(false);
    this.gameOverContainer.setDepth(1000);
  }

  private showGameOver(): void {
    const finalScoreText = this.gameOverContainer.list[3] as Phaser.GameObjects.Text;
    finalScoreText.setText(this.score.toString());

    this.gameOverContainer.setVisible(true);

    // Setup restart key
    this.input.keyboard!.once('keydown-R', () => {
      this.score = 0;
      this.scoreText.setText('0');
      this.gameOverContainer.setVisible(false);
      this.updateHealthBar(100, 100);
      this.updateAmmoDisplay(30, 30);

      // Restart the game
      this.scene.stop('CityScene');
      this.scene.stop('BuildingScene');
      this.scene.start('CityScene');
    });
  }

  private setupEvents(): void {
    // Listen to game scene events
    const cityScene = this.scene.get('CityScene');
    const buildingScene = this.scene.get('BuildingScene');

    [cityScene, buildingScene].forEach((gameScene) => {
      gameScene.events.on('healthChanged', (current: number, max: number) => {
        this.updateHealthBar(current, max);
      });

      gameScene.events.on('armorChanged', (current: number, max: number) => {
        this.updateArmorBar(current, max);
      });

      gameScene.events.on('ammoChanged', (current: number, max: number, weaponType?: WeaponType) => {
        this.updateAmmoDisplay(current, max, weaponType);
      });

      gameScene.events.on('weaponChanged', (weaponType: WeaponType, weapon: any) => {
        this.updateWeaponDisplay(weaponType);
        this.updateAmmoDisplay(weapon.getAmmoCount(), weapon.getMaxAmmo(), weaponType);
        this.showWeaponSwitchMessage(weaponType);
      });

      gameScene.events.on('weaponAutoSwitch', (_weaponType: WeaponType) => {
        this.showAutoSwitchMessage();
      });
    });

    // UI scene events
    this.events.on('addScore', (points: number) => {
      this.updateScore(points);
    });

    this.events.on('showGameOver', () => {
      this.showGameOver();
    });

    // Provide current score when requested
    this.events.on('getScore', (callback: (score: number) => void) => {
      callback(this.score);
    });
  }

  getScore(): number {
    return this.score;
  }

  update(): void {
    if (!this.isMobile || !this.joystick || !this.touchControls) return;

    // Get the current game scene (CityScene or BuildingScene)
    const cityScene = this.scene.get('CityScene');
    const buildingScene = this.scene.get('BuildingScene');
    const activeScene = this.scene.isActive('CityScene') ? cityScene : 
                       this.scene.isActive('BuildingScene') ? buildingScene : null;
    
    if (!activeScene) return;

    // Get player from active scene
    const player = (activeScene as any).player;
    if (!player) return;

    // Update player with joystick input
    player.setJoystickForce(this.joystick.force);

    // Handle attack button
    const isAttacking = this.touchControls.isButtonPressed('attack');
    player.setTouchAttackActive(isAttacking);

    // Update aim position based on attack button or player direction
    if (isAttacking) {
      // Aim in the direction of player's last movement or use default
      const aimDistance = 150;
      const aimX = player.x + player.lastDirection.x * aimDistance;
      const aimY = player.y + player.lastDirection.y * aimDistance;
      player.setTouchAimPosition(new Phaser.Math.Vector2(aimX, aimY));
    } else {
      player.setTouchAimPosition(null);
    }

    // Handle weapon switch button press (only trigger once per press)
    const weaponButton = this.touchControls.getButton('weapon');
    if (weaponButton && weaponButton.isPressed && !weaponButton.container.getData('wasPressed')) {
      // Toggle weapon
      const currentWeapon = player.getCurrentWeaponType();
      const newWeapon = currentWeapon === WeaponType.GUN ? WeaponType.SWORD : WeaponType.GUN;
      player.switchWeapon(newWeapon);
      weaponButton.container.setData('wasPressed', true);
    } else if (weaponButton && !weaponButton.isPressed) {
      weaponButton.container.setData('wasPressed', false);
    }

    // Handle interact button (building entry/exit)
    const interactButton = this.touchControls.getButton('interact');
    if (interactButton) {
      // Check if player is near a door
      const isNearDoor = (activeScene as any).isPlayerNearDoor?.() || false;
      this.touchControls.setButtonVisible('interact', isNearDoor);

      // Handle interaction
      if (interactButton.isPressed && !interactButton.container.getData('wasPressed')) {
        (activeScene as any).tryEnterBuilding?.();
        (activeScene as any).tryExitBuilding?.();
        interactButton.container.setData('wasPressed', true);
      } else if (!interactButton.isPressed) {
        interactButton.container.setData('wasPressed', false);
      }
    }
  }
}
