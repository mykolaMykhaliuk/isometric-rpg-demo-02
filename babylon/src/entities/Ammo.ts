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

/**
 * Ammo pickup - adds bullets to player's gun
 */
export class Ammo extends Pickup {
  private amount: number = GAME_CONFIG.AMMO_PICKUP_AMOUNT;
  private eventBus: EventBus;

  constructor(scene: Scene, position: Vector3) {
    super(scene, position, 'ammo_pickup');
    this.eventBus = EventBus.getInstance();
  }

  protected createMesh(): Mesh {
    const parent = new Mesh('ammoMesh', this.scene);
    const ammoMat = MaterialLibrary.get('ammo');

    // Create bullet box
    const box = MeshBuilder.CreateBox('ammoBox', {
      width: 0.4,
      height: 0.25,
      depth: 0.3,
    }, this.scene);
    box.material = ammoMat;
    box.parent = parent;

    // Create bullets sticking out
    const bulletMat = new StandardMaterial('bulletMat', this.scene);
    bulletMat.diffuseColor = new Color3(0.8, 0.6, 0.2);
    bulletMat.emissiveColor = new Color3(0.2, 0.15, 0.05);

    for (let i = 0; i < 4; i++) {
      const bullet = MeshBuilder.CreateCylinder('bullet' + i, {
        height: 0.2,
        diameterTop: 0.04,
        diameterBottom: 0.06,
      }, this.scene);
      bullet.rotation.z = -Math.PI / 6;
      bullet.position = new Vector3(-0.1 + i * 0.08, 0.18, 0);
      bullet.material = bulletMat;
      bullet.parent = parent;
    }

    // Add glow ring
    const ring = MeshBuilder.CreateTorus('ammoRing', {
      diameter: 0.6,
      thickness: 0.03,
      tessellation: 24,
    }, this.scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.1;
    ring.material = ammoMat;
    ring.parent = parent;

    return parent;
  }

  protected onCollect(player: any): void {
    if (player.weaponManager) {
      player.weaponManager.addAmmo(this.amount);
    } else if (player.addAmmo) {
      player.addAmmo(this.amount);
    }

    this.eventBus.emit(GameEvents.PICKUP_COLLECTED, PickupType.AMMO, this.amount);
  }

  getType(): PickupType {
    return PickupType.AMMO;
  }
}
