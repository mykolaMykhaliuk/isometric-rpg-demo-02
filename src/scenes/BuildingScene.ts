import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Ammo } from '../entities/Ammo';
import { Armor } from '../entities/Armor';
import { Health } from '../entities/Health';
import { cartToIso } from '../utils/IsometricUtils';
import { WeaponType } from '../weapons/IWeapon';
import { getPortfolioForBuilding } from '../config/portfolioData';
import { isMobileDevice } from '../utils/DeviceUtils';
import { UIScene } from './UIScene';

interface BuildingData {
  buildingId: number;
  playerHealth: number;
  playerAmmo: number;
  playerArmor?: number;
  currentWeapon?: WeaponType;
  isPortfolio?: boolean;
}

export class BuildingScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private ammoItems!: Phaser.Physics.Arcade.Group;
  private armorItems!: Phaser.Physics.Arcade.Group;
  private healthItems!: Phaser.Physics.Arcade.Group;
  private buildingId: number = 0;
  private isPortfolioBuilding: boolean = false;
  private initialHealth: number = 100;
  private initialAmmo: number = 30;
  private initialArmor: number = 0;
  private initialWeapon: WeaponType = WeaponType.GUN;
  private mapWidth: number = 20;
  private mapHeight: number = 16;
  private offsetX: number = 400;
  private offsetY: number = 100;

  // Battle arena settings
  private enemySpawnTimer: number = 0;
  private enemySpawnDelay: number = 3000;
  private maxEnemies: number = 15;
  private baseSpawnDelay: number = 3000;
  private baseMaxEnemies: number = 15;

  // Event handlers (stored for proper cleanup)
  private enemyKilledHandler?: (points: number) => void;
  private playerDiedHandler?: () => void;
  private scoreUpdatedHandler?: (newScore: number) => void;

  // Interior map: 0 = floor, 1 = wall, 2 = exit door
  private interiorMaps: number[][][] = [
    // Building 0 - About & Skills (Open gallery layout)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 1 - Projects (Gallery with dividers)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 2 - Experience (Office layout)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 3 - Contact (Reception layout)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 4 - Education (Library layout)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    // Building 5 - Battle Arena (HUGE 40x30 combat zone with walls)
    [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  ];

  private exitPosition: { x: number; y: number } = { x: 0, y: 0 };
  private wallBodies: Phaser.Physics.Arcade.StaticGroup | null = null;
  private portfolioTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'BuildingScene' });
  }

  init(data: BuildingData): void {
    this.buildingId = data.buildingId % this.interiorMaps.length;
    this.isPortfolioBuilding = data.isPortfolio ?? false;
    this.initialHealth = data.playerHealth || 100;
    this.initialAmmo = data.playerAmmo || 30;
    this.initialArmor = data.playerArmor || 0;
    this.initialWeapon = data.currentWeapon || WeaponType.GUN;

    // Set map dimensions based on building type
    if (!this.isPortfolioBuilding) {
      // Battle arena is larger
      this.mapWidth = 40;
      this.mapHeight = 30;
      this.offsetX = 300;
      this.offsetY = 50;
    } else {
      // Portfolio buildings are standard size
      this.mapWidth = 20;
      this.mapHeight = 16;
      this.offsetX = 400;
      this.offsetY = 100;
    }
  }

  create(): void {
    this.createInterior();
    this.createPlayer();
    this.createEnemyGroup();
    this.createAmmoGroup();
    this.createArmorGroup();
    this.createHealthGroup();
    this.spawnInteriorEnemies();
    this.spawnAmmoItems();
    this.spawnArmorItems();
    this.spawnHealthItems();
    this.setupCamera();
    this.setupCollisions();
    this.setupEvents();
    this.displayPortfolioInfo();

    // Get current score to maintain difficulty in battle arena
    if (!this.isPortfolioBuilding) {
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene && uiScene.getScore) {
        this.updateDifficultyBasedOnScore(uiScene.getScore());
      }
    }

    // Add building title with descriptive names
    const buildingNames = [
      'About Me & Skills',           // Building 1 (buildingId 0)
      'Featured Projects',            // Building 2 (buildingId 1)
      'Work Experience',              // Building 3 (buildingId 2)
      'Get In Touch',                 // Building 4 (buildingId 3)
      'Education & Certifications',   // Building 5 (buildingId 4)
    ];

    let buildingTitle = '';
    let titleColor = '#ffffff';

    if (this.isPortfolioBuilding) {
      // Portfolio buildings
      buildingTitle = buildingNames[this.buildingId];
      titleColor = '#00ffff';
    } else {
      // Combat buildings
      buildingTitle = 'Battle Arena';
      titleColor = '#ff0000';
    }

    // Get proper center position - centered
    const centerX = this.cameras.main.width / 2;
    const titleY = 30;

    // Add background for better visibility
    const titleBg = this.add.rectangle(centerX, titleY, 500, 40, 0x000000, 0.6);
    titleBg.setScrollFactor(0).setDepth(999);

    this.add.text(centerX, titleY, buildingTitle, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
  }

  private createInterior(): void {
    const currentMap = this.interiorMaps[this.buildingId];
    this.wallBodies = this.physics.add.staticGroup();

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = currentMap[y][x];
        const isoPos = cartToIso(x, y);
        const screenX = isoPos.x + this.offsetX;
        const screenY = isoPos.y + this.offsetY;

        if (tileType === 0 || tileType === 2) {
          // Floor tile
          const floor = this.add.image(screenX, screenY, 'tile_floor');
          floor.setOrigin(0.5, 0.5);
          floor.setDepth(y);

          if (tileType === 2) {
            // Exit door
            this.exitPosition = { x: screenX, y: screenY };

            const exitIndicator = this.add.circle(screenX, screenY, 12, 0x00ff00, 0.8);
            exitIndicator.setDepth(y + 150);

            // Outer glow
            const exitGlow = this.add.circle(screenX, screenY, 14, 0x00ff00, 0.4);
            exitGlow.setDepth(y + 149);
            
            // Pulsing animation
            this.tweens.add({
              targets: [exitIndicator, exitGlow],
              scale: { from: 1, to: 1.2 },
              alpha: { from: 0.8, to: 0.3 },
              duration: 1000,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });

            const exitHint = this.add.text(screenX, screenY - 30, 'E - Exit', {
              fontSize: '14px',
              fontStyle: 'bold',
              color: '#ffffff',
              backgroundColor: '#000000',
              padding: { x: 6, y: 4 },
              stroke: '#00ff00',
              strokeThickness: 2,
            }).setOrigin(0.5);
            exitHint.setDepth(y + 151);
            
            // Hint glow
            this.tweens.add({
              targets: exitHint,
              scale: { from: 1, to: 1.1 },
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          }
        } else if (tileType === 1) {
          // Wall tile
          const wall = this.add.image(screenX, screenY - 20, 'tile_wall');
          wall.setOrigin(0.5, 0.5);
          wall.setDepth(y + 100);

          // Add collision body for wall
          const wallBody = this.add.rectangle(screenX, screenY, 40, 20, 0x000000, 0);
          this.physics.add.existing(wallBody, true);
          this.wallBodies.add(wallBody);
        }
      }
    }
  }

  private createPlayer(): void {
    // Start position depends on building type
    let startX: number, startY: number;

    if (!this.isPortfolioBuilding) {
      // Battle arena - spawn at center
      const startTile = cartToIso(20, 15);
      startX = startTile.x + this.offsetX;
      startY = startTile.y + this.offsetY;
    } else {
      // Portfolio building - standard spawn
      const startTile = cartToIso(10, 8);
      startX = startTile.x + this.offsetX;
      startY = startTile.y + this.offsetY;
    }

    this.player = new Player(this, startX, startY);

    // Restore player stats
    if (this.initialHealth < 100) {
      this.player.takeDamage(100 - this.initialHealth);
    }
    this.player.setAmmo(this.initialAmmo);
    this.player.setArmor(this.initialArmor);

    // Restore weapon state
    this.player.setWeapon(this.initialWeapon);
  }

  private createEnemyGroup(): void {
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
  }

  private createAmmoGroup(): void {
    this.ammoItems = this.physics.add.group({
      classType: Ammo,
      runChildUpdate: true,
    });
  }

  private createArmorGroup(): void {
    this.armorItems = this.physics.add.group({
      classType: Armor,
      runChildUpdate: true,
    });
  }

  private createHealthGroup(): void {
    this.healthItems = this.physics.add.group({
      classType: Health,
      runChildUpdate: true,
    });
  }

  private spawnAmmoItems(): void {
    // Only spawn ammo in battle buildings
    if (this.isPortfolioBuilding) {
      return;
    }

    const currentMap = this.interiorMaps[this.buildingId];
    // Spawn 10-15 ammo pickups across the battle arena
    const numAmmo = Phaser.Math.Between(10, 15);

    for (let i = 0; i < numAmmo; i++) {
      let attempts = 0;
      while (attempts < 30) {
        const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
        const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

        if (currentMap[tileY][tileX] === 0) {
          const isoPos = cartToIso(tileX, tileY);
          const spawnX = isoPos.x + this.offsetX;
          const spawnY = isoPos.y + this.offsetY;

          const ammo = new Ammo(this, spawnX, spawnY);
          ammo.setPlayer(this.player);
          this.ammoItems.add(ammo);
          break;
        }
        attempts++;
      }
    }
  }

  private spawnArmorItems(): void {
    // Only spawn blue armor in Building 0 (Skills)
    if (!this.isPortfolioBuilding || this.buildingId !== 0) {
      return;
    }

    const currentMap = this.interiorMaps[this.buildingId];

    // Find a floor tile near the center of the room
    let attempts = 0;
    const centerX = Math.floor(this.mapWidth / 2);
    const centerY = Math.floor(this.mapHeight / 2);

    while (attempts < 50) {
      // Try to spawn near center with some randomness
      const tileX = Phaser.Math.Between(centerX - 3, centerX + 3);
      const tileY = Phaser.Math.Between(centerY - 2, centerY + 2);

      if (tileX >= 0 && tileX < this.mapWidth && tileY >= 0 && tileY < this.mapHeight) {
        if (currentMap[tileY][tileX] === 0) {
          const isoPos = cartToIso(tileX, tileY);
          const spawnX = isoPos.x + this.offsetX;
          const spawnY = isoPos.y + this.offsetY;

          const armor = new Armor(this, spawnX, spawnY, 'blue');
          armor.setPlayer(this.player);
          this.armorItems.add(armor);
          break;
        }
      }
      attempts++;
    }
  }

  private spawnHealthItems(): void {
    // Only spawn hearts in Contact building (buildingId 3)
    if (this.buildingId !== 3) {
      return;
    }

    const currentMap = this.interiorMaps[this.buildingId];

    // Usually spawn 1 heart, very rarely (10% chance) spawn 2 hearts
    const numHearts = Math.random() < 0.1 ? 2 : 1;

    for (let i = 0; i < numHearts; i++) {
      let attempts = 0;

      while (attempts < 30) {
        const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
        const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

        if (currentMap[tileY][tileX] === 0) {
          const isoPos = cartToIso(tileX, tileY);
          const spawnX = isoPos.x + this.offsetX;
          const spawnY = isoPos.y + this.offsetY;

          const health = new Health(this, spawnX, spawnY);
          health.setPlayer(this.player);
          this.healthItems.add(health);
          break;
        }
        attempts++;
      }
    }
  }

  private spawnInteriorEnemies(): void {
    // Portfolio buildings are enemy-free showcase spaces
    // Battle buildings have normal enemy spawning
    if (this.isPortfolioBuilding) {
      // No enemies in portfolio buildings
      return;
    }

    // Initial enemy spawning for battle buildings
    const numEnemies = Phaser.Math.Between(8, 12);

    for (let i = 0; i < numEnemies; i++) {
      this.spawnSingleEnemy();
    }
  }

  private spawnSingleEnemy(): void {
    // Don't spawn in portfolio buildings or if at max capacity
    if (this.isPortfolioBuilding || this.enemies.getLength() >= this.maxEnemies) {
      return;
    }

    const currentMap = this.interiorMaps[this.buildingId];
    let attempts = 0;

    while (attempts < 30) {
      const tileX = Phaser.Math.Between(2, this.mapWidth - 3);
      const tileY = Phaser.Math.Between(2, this.mapHeight - 3);

      if (currentMap[tileY][tileX] === 0) {
        const isoPos = cartToIso(tileX, tileY);
        const spawnX = isoPos.x + this.offsetX;
        const spawnY = isoPos.y + this.offsetY;

        const distToPlayer = Phaser.Math.Distance.Between(spawnX, spawnY, this.player.x, this.player.y);
        if (distToPlayer > 150) {
          const enemy = new Enemy(this, spawnX, spawnY);
          enemy.setPlayer(this.player);
          this.enemies.add(enemy);
          break;
        }
      }
      attempts++;
    }
  }

  private updateDifficultyBasedOnScore(newScore: number): void {
    if (this.isPortfolioBuilding) return; // Only battle arena

    const difficultyLevel = Math.floor(newScore / 50);
    this.maxEnemies = Math.min(this.baseMaxEnemies + difficultyLevel * 2, 30);
    this.enemySpawnDelay = Math.max(this.baseSpawnDelay - difficultyLevel * 400, 1000);
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.2); // Same zoom for all buildings

    // Set world bounds based on isometric map size
    const mapBounds = this.calculateMapBounds();
    this.physics.world.setBounds(
      mapBounds.minX - 100,
      mapBounds.minY - 100,
      mapBounds.width + 200,
      mapBounds.height + 200
    );
  }

  private calculateMapBounds(): { minX: number; minY: number; width: number; height: number } {
    const topLeft = cartToIso(0, 0);
    const topRight = cartToIso(this.mapWidth, 0);
    const bottomLeft = cartToIso(0, this.mapHeight);
    const bottomRight = cartToIso(this.mapWidth, this.mapHeight);

    const minX = Math.min(topLeft.x, bottomLeft.x) + this.offsetX;
    const maxX = Math.max(topRight.x, bottomRight.x) + this.offsetX;
    const minY = topLeft.y + this.offsetY;
    const maxY = bottomRight.y + this.offsetY + 100;

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private setupCollisions(): void {
    // Bullet vs Enemy
    const bullets = this.player.getBullets();
    if (bullets) {
      this.physics.add.overlap(
        bullets,
        this.enemies,
        this.handleBulletEnemyCollision,
        undefined,
        this
      );
    }

    // Player vs Walls
    if (this.wallBodies) {
      this.physics.add.collider(this.player, this.wallBodies);
      this.physics.add.collider(this.enemies, this.wallBodies);
    }
  }

  getEnemies(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  private handleBulletEnemyCollision(
    bullet: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
    const enemyEntity = enemy as Enemy;

    // Guard against invalid or already processed objects
    if (!bulletSprite || !bulletSprite.active) return;
    if (!enemyEntity || !enemyEntity.active || enemyEntity.isEnemyDying()) return;

    // Disable bullet completely to prevent further collisions
    bulletSprite.setActive(false);
    bulletSprite.setVisible(false);
    bulletSprite.setVelocity(0, 0);
    if (bulletSprite.body) {
      bulletSprite.body.enable = false;
    }

    // Hit particle effect
    const hitEffect = this.add.particles(
      bulletSprite.x,
      bulletSprite.y,
      'bullet',
      {
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0 },
        lifespan: 150,
        quantity: 4,
        tint: [0xffff00, 0xffaa00, 0xff6600],
      }
    );
    hitEffect.setDepth(bulletSprite.y + 10);
    this.time.delayedCall(150, () => hitEffect.destroy());

    enemyEntity.takeDamage(20);
  }

  private setupEvents(): void {
    // Exit building on E key
    const keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    keyE.on('down', () => this.tryExitBuilding());

    // Mobile interact button
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.on('mobileInteract', () => this.tryExitBuilding());
    }

    // Enemy killed event - store handler for cleanup
    this.enemyKilledHandler = (points: number) => {
      const uiScene = this.scene.get('UIScene');
      uiScene.events.emit('addScore', points);
    };
    this.events.on('enemyKilled', this.enemyKilledHandler);

    // Player died event - store handler for cleanup
    this.playerDiedHandler = () => {
      this.scene.pause();
      const uiScene = this.scene.get('UIScene');
      uiScene.events.emit('showGameOver');
    };
    this.events.on('playerDied', this.playerDiedHandler);

    // Listen for score updates for difficulty scaling
    if (!this.isPortfolioBuilding) {
      const uiScene = this.scene.get('UIScene');
      this.scoreUpdatedHandler = (newScore: number) => {
        this.updateDifficultyBasedOnScore(newScore);
      };
      uiScene.events.on('scoreUpdated', this.scoreUpdatedHandler);
    }
  }

  private displayPortfolioInfo(): void {
    // Only display portfolio info in portfolio buildings
    if (!this.isPortfolioBuilding) {
      return;
    }

    const portfolioSection = getPortfolioForBuilding(this.buildingId);

    // Clear any existing text
    this.portfolioTexts.forEach(text => text.destroy());
    this.portfolioTexts = [];

    // Display title with background panel - centered
    const titleX = this.cameras.main.width / 2;
    const titleY = 80;

    const titleBg = this.add.rectangle(titleX, titleY, 600, 45, 0x000000, 0.4);
    titleBg.setScrollFactor(0).setDepth(999);

    const title = this.add.text(titleX, titleY, portfolioSection.title, {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    this.portfolioTexts.push(title);

    // Display content or projects
    let startY = 140;

    if (portfolioSection.projects && portfolioSection.projects.length > 0) {
      // Display projects - centered
      const projectX = this.cameras.main.width / 2;
      portfolioSection.projects.forEach((project, index) => {
        const projectY = startY + (index * 140);

        // Project background
        const projectBg = this.add.rectangle(projectX, projectY + 30, 700, 120, 0x000000, 0.3);
        projectBg.setScrollFactor(0).setDepth(998);

        // Project title
        const projectTitle = this.add.text(projectX, projectY, project.title, {
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        this.portfolioTexts.push(projectTitle);

        // Project description
        const projectDesc = this.add.text(projectX, projectY + 30, project.description, {
          fontSize: '16px',
          color: '#ffffff',
          wordWrap: { width: 650 },
          align: 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        this.portfolioTexts.push(projectDesc);

        // Technologies
        const techText = project.technologies.join(' • ');
        const projectTech = this.add.text(projectX, projectY + 60, techText, {
          fontSize: '14px',
          color: '#00ff00',
          fontStyle: 'italic',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        this.portfolioTexts.push(projectTech);
      });
    } else if (portfolioSection.content && portfolioSection.content.length > 0) {
      // Display regular content - centered
      const contentX = this.cameras.main.width / 2;
      const contentBg = this.add.rectangle(contentX, 310, 700, 400, 0x000000, 0.3);
      contentBg.setScrollFactor(0).setDepth(998);

      const contentText = portfolioSection.content.join('\n');
      const content = this.add.text(contentX - 350, startY, contentText, { // Left-aligned from center
        fontSize: '18px',
        color: '#ffffff',
        lineSpacing: 8,
        fontFamily: 'monospace',
      }).setScrollFactor(0).setDepth(1000);
      this.portfolioTexts.push(content);
    }

    // Add instruction at bottom - centered
    const instruction = this.add.text(this.cameras.main.width / 2, 570, 'Press E at the exit to leave', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontStyle: 'italic',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    this.portfolioTexts.push(instruction);
  }

  private tryExitBuilding(): void {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.exitPosition.x,
      this.exitPosition.y
    );

    if (distance < 40) {
      this.scene.start('CityScene', {
        fromBuildingId: this.buildingId,
        playerHealth: this.player.getHealth(),
        playerAmmo: this.player.getAmmo(),
        playerArmor: this.player.getArmor(),
        currentWeapon: this.player.getCurrentWeaponType(),
      });
    }
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    // Enemy respawning in battle arena
    if (!this.isPortfolioBuilding && time > this.enemySpawnTimer) {
      this.spawnSingleEnemy();
      this.enemySpawnTimer = time + this.enemySpawnDelay;
    }

    // Update mobile interact button visibility
    if (isMobileDevice()) {
      this.updateMobileInteractButton();
    }
  }

  private updateMobileInteractButton(): void {
    const nearExit = this.isPlayerNearExit();
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && uiScene.showInteractButton) {
      uiScene.showInteractButton(nearExit);
    }
  }

  private isPlayerNearExit(): boolean {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.exitPosition.x,
      this.exitPosition.y
    );
    return distance < 40;
  }

  shutdown(): void {
    // Clean up event listeners to prevent accumulation on scene restart
    if (this.enemyKilledHandler) {
      this.events.off('enemyKilled', this.enemyKilledHandler);
      this.enemyKilledHandler = undefined;
    }

    if (this.playerDiedHandler) {
      this.events.off('playerDied', this.playerDiedHandler);
      this.playerDiedHandler = undefined;
    }

    // Clean up score listener (only battle arena)
    if (this.scoreUpdatedHandler) {
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.events) {
        uiScene.events.off('scoreUpdated', this.scoreUpdatedHandler);
      }
      this.scoreUpdatedHandler = undefined;
    }
  }
}
