import {
  Scene,
  Mesh,
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Rectangle,
  TextBlock,
  StackPanel,
  Control,
  Image,
  Container,
} from '@babylonjs/gui';
import { GAME_CONFIG, WeaponType } from '../utils/Constants';
import { EventBus, GameEvents } from '../core/EventBus';

/**
 * Game HUD using Babylon.GUI
 */
export class HUD {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private eventBus: EventBus;

  // UI Elements
  private healthBar: Rectangle;
  private healthFill!: Rectangle;
  private healthText: TextBlock;

  private armorBar: Rectangle;
  private armorFill!: Rectangle;

  private ammoText: TextBlock;
  private scoreText: TextBlock;
  private weaponText: TextBlock;

  private controlsPanel: StackPanel;

  // State
  private score: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    // Create fullscreen UI
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Build UI components
    this.healthBar = this.createHealthBar();
    this.armorBar = this.createArmorBar();
    this.ammoText = this.createAmmoCounter();
    this.scoreText = this.createScoreDisplay();
    this.weaponText = this.createWeaponIndicator();
    this.controlsPanel = this.createControlsHint();
    this.healthText = this.createHealthText();

    // Subscribe to events
    this.setupEventListeners();
  }

  private createHealthBar(): Rectangle {
    // Container
    const container = new Rectangle('healthBarContainer');
    container.width = '220px';
    container.height = '30px';
    container.cornerRadius = 5;
    container.color = 'white';
    container.thickness = 2;
    container.background = 'rgba(0, 0, 0, 0.5)';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.left = '20px';
    container.top = '20px';
    this.advancedTexture.addControl(container);

    // Background
    const background = new Rectangle('healthBg');
    background.width = '200px';
    background.height = '20px';
    background.cornerRadius = 3;
    background.color = 'transparent';
    background.background = '#333333';
    container.addControl(background);

    // Fill
    this.healthFill = new Rectangle('healthFill');
    this.healthFill.width = '100%';
    this.healthFill.height = '100%';
    this.healthFill.cornerRadius = 3;
    this.healthFill.color = 'transparent';
    this.healthFill.background = '#44ff44';
    this.healthFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    background.addControl(this.healthFill);

    // Label
    const label = new TextBlock('healthLabel', 'HP');
    label.color = 'white';
    label.fontSize = 12;
    label.fontFamily = 'Arial';
    label.fontWeight = 'bold';
    label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.left = '-95px';
    container.addControl(label);

    return container;
  }

  private createHealthText(): TextBlock {
    const text = new TextBlock('healthValue', '100/100');
    text.color = 'white';
    text.fontSize = 11;
    text.fontFamily = 'Arial';
    text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    text.left = '125px';
    text.top = '25px';
    this.advancedTexture.addControl(text);
    return text;
  }

  private createArmorBar(): Rectangle {
    // Container
    const container = new Rectangle('armorBarContainer');
    container.width = '220px';
    container.height = '25px';
    container.cornerRadius = 5;
    container.color = 'white';
    container.thickness = 2;
    container.background = 'rgba(0, 0, 0, 0.5)';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.left = '20px';
    container.top = '55px';
    container.isVisible = false; // Hidden when no armor
    this.advancedTexture.addControl(container);

    // Background
    const background = new Rectangle('armorBg');
    background.width = '200px';
    background.height = '15px';
    background.cornerRadius = 3;
    background.color = 'transparent';
    background.background = '#333333';
    container.addControl(background);

    // Fill
    this.armorFill = new Rectangle('armorFill');
    this.armorFill.width = '0%';
    this.armorFill.height = '100%';
    this.armorFill.cornerRadius = 3;
    this.armorFill.color = 'transparent';
    this.armorFill.background = '#4488ff';
    this.armorFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    background.addControl(this.armorFill);

    // Label
    const label = new TextBlock('armorLabel', 'ARMOR');
    label.color = '#88bbff';
    label.fontSize = 10;
    label.fontFamily = 'Arial';
    label.fontWeight = 'bold';
    label.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.left = '-78px';
    container.addControl(label);

    return container;
  }

  private createAmmoCounter(): TextBlock {
    const panel = new StackPanel('ammoPanel');
    panel.isVertical = false;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.left = '-20px';
    panel.top = '-20px';
    this.advancedTexture.addControl(panel);

    // Ammo icon/label
    const label = new TextBlock('ammoLabel', 'AMMO ');
    label.color = '#aaaaaa';
    label.fontSize = 16;
    label.fontFamily = 'Arial';
    label.width = '60px';
    panel.addControl(label);

    // Ammo count
    const text = new TextBlock('ammoCount', '30/30');
    text.color = 'white';
    text.fontSize = 24;
    text.fontFamily = 'monospace';
    text.fontWeight = 'bold';
    text.width = '100px';
    text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.addControl(text);

    return text;
  }

  private createScoreDisplay(): TextBlock {
    const text = new TextBlock('scoreText', 'SCORE: 0');
    text.color = 'white';
    text.fontSize = 28;
    text.fontFamily = 'Arial Black';
    text.fontWeight = 'bold';
    text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    text.top = '20px';
    text.outlineWidth = 2;
    text.outlineColor = 'black';
    this.advancedTexture.addControl(text);

    return text;
  }

  private createWeaponIndicator(): TextBlock {
    const container = new Rectangle('weaponContainer');
    container.width = '120px';
    container.height = '40px';
    container.cornerRadius = 5;
    container.color = 'white';
    container.thickness = 2;
    container.background = 'rgba(0, 0, 0, 0.6)';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    container.left = '-20px';
    container.top = '-70px';
    this.advancedTexture.addControl(container);

    const text = new TextBlock('weaponText', 'GUN');
    text.color = '#ffcc00';
    text.fontSize = 18;
    text.fontFamily = 'Arial';
    text.fontWeight = 'bold';
    container.addControl(text);

    return text;
  }

  private createControlsHint(): StackPanel {
    const panel = new StackPanel('controlsPanel');
    panel.isVertical = true;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.left = '20px';
    panel.top = '-20px';
    panel.width = '200px';
    this.advancedTexture.addControl(panel);

    const controls = [
      'WASD - Move',
      'Mouse - Aim',
      'Click - Attack',
      '1/2 - Switch Weapon',
      'Scroll - Cycle Weapon',
      'E - Enter Building',
    ];

    for (const control of controls) {
      const text = new TextBlock();
      text.text = control;
      text.color = 'rgba(255, 255, 255, 0.6)';
      text.fontSize = 12;
      text.fontFamily = 'Arial';
      text.height = '18px';
      text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      panel.addControl(text);
    }

    return panel;
  }

  private setupEventListeners(): void {
    // Health changed
    this.eventBus.on(GameEvents.PLAYER_HEALTH_CHANGED, (current: number, max: number) => {
      this.updateHealth(current, max);
    });

    // Armor changed
    this.eventBus.on(GameEvents.PLAYER_ARMOR_CHANGED, (current: number, max: number) => {
      this.updateArmor(current, max);
    });

    // Ammo changed
    this.eventBus.on(GameEvents.PLAYER_AMMO_CHANGED, (current: number, max: number, _weaponType: WeaponType) => {
      this.updateAmmo(current, max);
    });

    // Weapon changed
    this.eventBus.on(GameEvents.PLAYER_WEAPON_CHANGED, (weaponType: WeaponType) => {
      this.updateWeapon(weaponType);
    });

    // Enemy killed
    this.eventBus.on(GameEvents.ENEMY_KILLED, (points: number) => {
      this.addScore(points);
    });

    // Score changed
    this.eventBus.on(GameEvents.SCORE_CHANGED, (newScore: number) => {
      this.score = newScore;
      this.scoreText.text = `SCORE: ${this.score}`;
    });
  }

  updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100;
    this.healthFill.width = `${percent}%`;
    this.healthText.text = `${Math.ceil(current)}/${max}`;

    // Color gradient based on health
    if (percent > 60) {
      this.healthFill.background = '#44ff44';
    } else if (percent > 30) {
      this.healthFill.background = '#ffff44';
    } else {
      this.healthFill.background = '#ff4444';
    }
  }

  updateArmor(current: number, max: number): void {
    if (current <= 0) {
      this.armorBar.isVisible = false;
      return;
    }

    this.armorBar.isVisible = true;
    const percent = (current / max) * 100;
    this.armorFill.width = `${percent}%`;
  }

  updateAmmo(current: number, max: number): void {
    if (current < 0) {
      // Sword equipped (infinite ammo)
      this.ammoText.text = '∞';
      this.ammoText.color = 'white';
    } else {
      this.ammoText.text = `${current}/${max}`;

      if (current <= 0) {
        this.ammoText.color = '#ff4444';
      } else if (current <= 10) {
        this.ammoText.color = '#ffff44';
      } else {
        this.ammoText.color = 'white';
      }
    }
  }

  updateWeapon(weaponType: WeaponType): void {
    if (weaponType === WeaponType.GUN) {
      this.weaponText.text = 'GUN';
      this.weaponText.color = '#ffcc00';
    } else {
      this.weaponText.text = 'SWORD';
      this.weaponText.color = '#88ccff';
    }
  }

  addScore(points: number): void {
    this.score += points;
    this.scoreText.text = `SCORE: ${this.score}`;
    this.eventBus.emit(GameEvents.SCORE_CHANGED, this.score);

    // Flash effect
    this.scoreText.color = '#ffff00';
    setTimeout(() => {
      this.scoreText.color = 'white';
    }, 100);
  }

  getScore(): number {
    return this.score;
  }

  setScore(score: number): void {
    this.score = score;
    this.scoreText.text = `SCORE: ${this.score}`;
  }

  hideControls(): void {
    this.controlsPanel.isVisible = false;
  }

  showControls(): void {
    this.controlsPanel.isVisible = true;
  }

  getAdvancedTexture(): AdvancedDynamicTexture {
    return this.advancedTexture;
  }

  dispose(): void {
    this.advancedTexture.dispose();
  }
}
