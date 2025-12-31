import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
} from '@babylonjs/core';
import { Pickup, PickupType } from './Pickup';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { GAME_CONFIG } from '../utils/Constants';
import { EventBus, GameEvents } from '../core/EventBus';

export type ArmorTier = 'blue' | 'red';

/**
 * Armor pickup - adds armor to player
 */
export class Armor extends Pickup {
  private amount: number;
  private tier: ArmorTier;
  private eventBus: EventBus;

  constructor(scene: Scene, position: Vector3, tier: ArmorTier = 'blue') {
    super(scene, position, 'armor_pickup');
    this.tier = tier;
    this.amount = tier === 'red' ? GAME_CONFIG.ARMOR_PICKUP_AMOUNT : GAME_CONFIG.ARMOR_PICKUP_AMOUNT / 2;
    this.eventBus = EventBus.getInstance();
    this.rotationSpeed = 2.5;
  }

  protected createMesh(): Mesh {
    const parent = new Mesh('armorMesh', this.scene);
    const armorMat = MaterialLibrary.get(
      this.tier === 'blue' ? 'armor_blue' : 'armor_red'
    );

    // Create shield shape
    // Main shield body
    const shield = MeshBuilder.CreateCylinder('shieldBody', {
      height: 0.1,
      diameterTop: 0.35,
      diameterBottom: 0.4,
      tessellation: 6,
    }, this.scene);
    shield.rotation.x = Math.PI / 2;
    shield.material = armorMat;
    shield.parent = parent;

    // Shield center emblem
    const emblemMat = new StandardMaterial('emblemMat', this.scene);
    emblemMat.diffuseColor = new Color3(1, 1, 1);
    emblemMat.emissiveColor = this.tier === 'blue'
      ? new Color3(0.1, 0.2, 0.4)
      : new Color3(0.4, 0.1, 0.1);

    const emblem = MeshBuilder.CreateCylinder('emblem', {
      height: 0.12,
      diameter: 0.15,
      tessellation: 6,
    }, this.scene);
    emblem.rotation.x = Math.PI / 2;
    emblem.material = emblemMat;
    emblem.parent = parent;

    // Add star or cross emblem
    if (this.tier === 'red') {
      // Red armor gets a star
      const star = this.createStar();
      star.position.z = 0.06;
      star.parent = parent;
    } else {
      // Blue armor gets a simple circle
      const circle = MeshBuilder.CreateTorus('circle', {
        diameter: 0.1,
        thickness: 0.02,
        tessellation: 16,
      }, this.scene);
      circle.rotation.x = Math.PI / 2;
      circle.position.z = 0.06;
      circle.material = emblemMat;
      circle.parent = parent;
    }

    // Add glow ring
    const ring = MeshBuilder.CreateTorus('armorRing', {
      diameter: 0.6,
      thickness: 0.03,
      tessellation: 24,
    }, this.scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.15;
    ring.material = armorMat;
    ring.parent = parent;

    return parent;
  }

  private createStar(): Mesh {
    const starMat = new StandardMaterial('starMat', this.scene);
    starMat.diffuseColor = new Color3(1, 0.9, 0.3);
    starMat.emissiveColor = new Color3(0.3, 0.25, 0.1);

    const star = new Mesh('star', this.scene);

    // Create 5-pointed star using boxes
    for (let i = 0; i < 5; i++) {
      const point = MeshBuilder.CreateBox('starPoint' + i, {
        width: 0.03,
        height: 0.08,
        depth: 0.02,
      }, this.scene);
      point.rotation.z = (i * Math.PI * 2) / 5;
      point.position.y = 0.03;
      point.material = starMat;
      point.parent = star;
    }

    return star;
  }

  protected onCollect(player: any): void {
    if (player.addArmor) {
      player.addArmor(this.amount);
    }

    this.eventBus.emit(GameEvents.PICKUP_COLLECTED, PickupType.ARMOR, this.amount);
  }

  getType(): PickupType {
    return PickupType.ARMOR;
  }

  getTier(): ArmorTier {
    return this.tier;
  }
}
