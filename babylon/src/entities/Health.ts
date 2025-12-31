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
 * Health pickup - restores player health
 */
export class Health extends Pickup {
  private amount: number = GAME_CONFIG.HEALTH_PICKUP_AMOUNT;
  private eventBus: EventBus;

  constructor(scene: Scene, position: Vector3) {
    super(scene, position, 'health_pickup');
    this.eventBus = EventBus.getInstance();
    this.rotationSpeed = 1.5;
  }

  protected createMesh(): Mesh {
    const parent = new Mesh('healthMesh', this.scene);
    const healthMat = MaterialLibrary.get('health');

    // Create cross shape
    const verticalBar = MeshBuilder.CreateBox('healthVertical', {
      width: 0.15,
      height: 0.4,
      depth: 0.15,
    }, this.scene);
    verticalBar.material = healthMat;
    verticalBar.parent = parent;

    const horizontalBar = MeshBuilder.CreateBox('healthHorizontal', {
      width: 0.4,
      height: 0.15,
      depth: 0.15,
    }, this.scene);
    horizontalBar.material = healthMat;
    horizontalBar.parent = parent;

    // Add white center
    const centerMat = new StandardMaterial('centerMat', this.scene);
    centerMat.diffuseColor = new Color3(1, 1, 1);
    centerMat.emissiveColor = new Color3(0.3, 0.3, 0.3);

    const centerVertical = MeshBuilder.CreateBox('centerV', {
      width: 0.08,
      height: 0.3,
      depth: 0.16,
    }, this.scene);
    centerVertical.material = centerMat;
    centerVertical.parent = parent;

    const centerHorizontal = MeshBuilder.CreateBox('centerH', {
      width: 0.3,
      height: 0.08,
      depth: 0.16,
    }, this.scene);
    centerHorizontal.material = centerMat;
    centerHorizontal.parent = parent;

    // Add glow ring
    const ring = MeshBuilder.CreateTorus('healthRing', {
      diameter: 0.6,
      thickness: 0.03,
      tessellation: 24,
    }, this.scene);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.15;
    ring.material = healthMat;
    ring.parent = parent;

    return parent;
  }

  protected onCollect(player: any): void {
    if (player.heal) {
      player.heal(this.amount);
    }

    this.eventBus.emit(GameEvents.PICKUP_COLLECTED, PickupType.HEALTH, this.amount);
  }

  getType(): PickupType {
    return PickupType.HEALTH;
  }
}
