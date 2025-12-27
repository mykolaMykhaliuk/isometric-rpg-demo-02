import Phaser from 'phaser';
import { WeaponType } from '../weapons/IWeapon';
import { NetworkManager } from '../network/NetworkManager';

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

  // Multiplayer UI
  private playerCountText!: Phaser.GameObjects.Text;

  // Settings UI
  private settingsContainer!: Phaser.GameObjects.Container;
  private settingsOpen: boolean = false;
  private statusDot!: Phaser.GameObjects.Arc;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.createHealthBar();
    this.createArmorBar();
    this.createAmmoDisplay();
    this.createWeaponDisplay();
    this.createScoreDisplay();
    this.createControls();
    this.createGameOverScreen();
    this.createMultiplayerIndicator();
    this.createSettingsButton();
    this.createSettingsModal();
    this.setupEvents();
  }

  private createMultiplayerIndicator(): void {
    const isOffline = (window as any).__OFFLINE_MODE__ === true;

    const x = this.cameras.main.width - 20;
    const y = 70;

    // Connection status indicator
    this.statusDot = this.add.circle(0, 0, 5, isOffline ? 0x888888 : 0x00ff00);
    this.statusText = this.add.text(10, -7, isOffline ? 'SINGLE PLAYER' : 'MULTIPLAYER', {
      fontSize: '12px',
      color: isOffline ? '#888888' : '#00ff00',
    });

    // Player count
    this.playerCountText = this.add.text(10, 8, isOffline ? '' : 'Players: 1', {
      fontSize: '11px',
      color: '#aaaaaa',
    });

    this.add.container(x - 90, y, [
      this.statusDot,
      this.statusText,
      this.playerCountText
    ]);

    // Pulse animation for online indicator
    if (!isOffline) {
      this.tweens.add({
        targets: this.statusDot,
        alpha: { from: 1, to: 0.5 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }
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
    ].join('\n');

    this.add.text(x, y, controlsText, {
      fontSize: '12px',
      color: '#888888',
      lineSpacing: 4,
    });
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

  // Multiplayer methods
  updatePlayerCount(count: number): void {
    if (this.playerCountText) {
      this.playerCountText.setText(`Players: ${count}`);
    }
  }

  setNetworkScore(score: number): void {
    this.score = score;
    this.scoreText.setText(this.score.toString());

    // Score pop effect
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.3,
      duration: 100,
      yoyo: true,
    });
  }

  // Settings UI methods
  private createSettingsButton(): void {
    const x = this.cameras.main.width - 40;
    const y = 20;

    // Gear icon button
    const button = this.add.graphics();
    button.fillStyle(0x444444, 0.8);
    button.fillRoundedRect(x - 15, y - 15, 30, 30, 5);
    button.lineStyle(2, 0x888888, 1);
    button.strokeRoundedRect(x - 15, y - 15, 30, 30, 5);

    // Gear icon (simple representation)
    this.add.text(x, y, '⚙', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Make interactive
    const hitArea = this.add.rectangle(x, y, 30, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      button.clear();
      button.fillStyle(0x555555, 0.9);
      button.fillRoundedRect(x - 15, y - 15, 30, 30, 5);
      button.lineStyle(2, 0xaaaaaa, 1);
      button.strokeRoundedRect(x - 15, y - 15, 30, 30, 5);
    });

    hitArea.on('pointerout', () => {
      button.clear();
      button.fillStyle(0x444444, 0.8);
      button.fillRoundedRect(x - 15, y - 15, 30, 30, 5);
      button.lineStyle(2, 0x888888, 1);
      button.strokeRoundedRect(x - 15, y - 15, 30, 30, 5);
    });

    hitArea.on('pointerdown', () => {
      this.toggleSettings();
    });

    // Also close on ESC key
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.settingsOpen) {
        this.toggleSettings();
      }
    });
  }

  private createSettingsModal(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const modalWidth = 300;
    const modalHeight = 200;

    // Background overlay
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );

    // Modal background
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x2d2d44, 1);
    modalBg.fillRoundedRect(centerX - modalWidth / 2, centerY - modalHeight / 2, modalWidth, modalHeight, 10);
    modalBg.lineStyle(3, 0x666666, 1);
    modalBg.strokeRoundedRect(centerX - modalWidth / 2, centerY - modalHeight / 2, modalWidth, modalHeight, 10);

    // Title
    const title = this.add.text(centerX, centerY - 70, 'SETTINGS', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Game mode label
    const modeLabel = this.add.text(centerX, centerY - 25, 'Game Mode:', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Current mode indicator
    const isOffline = (window as any).__OFFLINE_MODE__ === true;

    // Single Player button
    const singleBtn = this.createModeButton(
      centerX - 70,
      centerY + 20,
      'Single Player',
      isOffline,
      () => this.switchToSinglePlayer()
    );

    // Multiplayer button
    const multiBtn = this.createModeButton(
      centerX + 70,
      centerY + 20,
      'Multiplayer',
      !isOffline,
      () => this.switchToMultiplayer()
    );

    // Close button
    const closeBtn = this.add.text(centerX, centerY + 70, 'Close [ESC]', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
    closeBtn.on('pointerdown', () => this.toggleSettings());

    // Store reference for mode buttons to update selection
    (this as any)._singleBtn = singleBtn;
    (this as any)._multiBtn = multiBtn;

    // Create container
    this.settingsContainer = this.add.container(0, 0, [
      overlay,
      modalBg,
      title,
      modeLabel,
      ...singleBtn,
      ...multiBtn,
      closeBtn,
    ]);

    this.settingsContainer.setDepth(2000);
    this.settingsContainer.setVisible(false);
  }

  private createModeButton(
    x: number,
    y: number,
    label: string,
    selected: boolean,
    onClick: () => void
  ): Phaser.GameObjects.GameObject[] {
    const width = 110;
    const height = 40;

    const bg = this.add.graphics();
    const fillColor = selected ? 0x446644 : 0x333333;
    const borderColor = selected ? 0x88ff88 : 0x666666;

    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 5);
    bg.lineStyle(2, borderColor, 1);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 5);

    const text = this.add.text(x, y, label, {
      fontSize: '12px',
      color: selected ? '#88ff88' : '#aaaaaa',
      fontStyle: selected ? 'bold' : 'normal',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      if (!selected) {
        bg.clear();
        bg.fillStyle(0x444444, 1);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 5);
        bg.lineStyle(2, 0x888888, 1);
        bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 5);
      }
    });

    hitArea.on('pointerout', () => {
      const currentFillColor = selected ? 0x446644 : 0x333333;
      const currentBorderColor = selected ? 0x88ff88 : 0x666666;
      bg.clear();
      bg.fillStyle(currentFillColor, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 5);
      bg.lineStyle(2, currentBorderColor, 1);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 5);
    });

    hitArea.on('pointerdown', onClick);

    // Store references for updating selection state
    (hitArea as any)._bg = bg;
    (hitArea as any)._text = text;
    (hitArea as any)._x = x;
    (hitArea as any)._y = y;
    (hitArea as any)._width = width;
    (hitArea as any)._height = height;

    return [bg, text, hitArea];
  }

  private toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
    this.settingsContainer.setVisible(this.settingsOpen);

    // Pause/resume game scenes
    const cityScene = this.scene.get('CityScene');
    const buildingScene = this.scene.get('BuildingScene');

    if (this.settingsOpen) {
      if (cityScene.scene.isActive()) cityScene.scene.pause();
      if (buildingScene.scene.isActive()) buildingScene.scene.pause();
    } else {
      if (cityScene.scene.isPaused()) cityScene.scene.resume();
      if (buildingScene.scene.isPaused()) buildingScene.scene.resume();
    }
  }

  private switchToSinglePlayer(): void {
    const isCurrentlyOffline = (window as any).__OFFLINE_MODE__ === true;
    if (isCurrentlyOffline) return; // Already in single player

    // Disconnect from server
    const networkManager = NetworkManager.getInstance();
    networkManager.disconnect();

    // Update global state
    (window as any).__OFFLINE_MODE__ = true;
    (window as any).__GAME_MODE__ = 'single';

    // Update UI indicators
    this.updateModeIndicator(true);

    // Close settings and restart game
    this.toggleSettings();
    this.restartGame();
  }

  private switchToMultiplayer(): void {
    const isCurrentlyOffline = (window as any).__OFFLINE_MODE__ === true;
    if (!isCurrentlyOffline) return; // Already in multiplayer

    // Update global state
    (window as any).__OFFLINE_MODE__ = false;
    (window as any).__GAME_MODE__ = 'multiplayer';

    // Connect to server
    const serverUrl = (window as any).__SERVER_URL__ || 'http://localhost:3001';
    const networkManager = NetworkManager.getInstance();

    networkManager.connect(serverUrl).then(() => {
      // Update UI indicators
      this.updateModeIndicator(false);

      // Close settings and restart game
      this.toggleSettings();
      this.restartGame();
    }).catch((error) => {
      console.error('Failed to connect to server:', error);
      // Revert to single player
      (window as any).__OFFLINE_MODE__ = true;
      (window as any).__GAME_MODE__ = 'single';

      // Show error message
      this.showConnectionError();
    });
  }

  private updateModeIndicator(isOffline: boolean): void {
    // Update status dot and text
    if (this.statusDot) {
      this.statusDot.fillColor = isOffline ? 0x888888 : 0x00ff00;
    }
    if (this.statusText) {
      this.statusText.setText(isOffline ? 'SINGLE PLAYER' : 'MULTIPLAYER');
      this.statusText.setColor(isOffline ? '#888888' : '#00ff00');
    }
    if (this.playerCountText) {
      this.playerCountText.setText(isOffline ? '' : 'Players: 1');
    }

    // Update or remove pulse animation
    this.tweens.killTweensOf(this.statusDot);
    if (!isOffline) {
      this.tweens.add({
        targets: this.statusDot,
        alpha: { from: 1, to: 0.5 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.statusDot.setAlpha(1);
    }

    // Recreate settings modal to update button states
    this.settingsContainer.destroy();
    this.createSettingsModal();
  }

  private restartGame(): void {
    // Reset score
    this.score = 0;
    this.scoreText.setText('0');
    this.updateHealthBar(100, 100);
    this.updateArmorBar(0, 100);
    this.updateAmmoDisplay(30, 30);

    // Restart game scenes
    this.scene.stop('CityScene');
    this.scene.stop('BuildingScene');
    this.scene.start('CityScene');
  }

  private showConnectionError(): void {
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      'Failed to connect to server.\nMake sure the server is running.',
      {
        fontSize: '16px',
        color: '#ff6666',
        backgroundColor: '#000000',
        padding: { x: 15, y: 10 },
        align: 'center',
      }
    ).setOrigin(0.5).setDepth(2001);

    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 500,
      delay: 3000,
      onComplete: () => message.destroy(),
    });
  }
}
