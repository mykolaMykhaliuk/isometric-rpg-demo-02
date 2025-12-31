import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  TransformNode,
  Animation,
  ParticleSystem,
  Color4,
} from '@babylonjs/core';
import { MathUtils } from '../utils/MathUtils';

export enum PickupType {
  AMMO = 'ammo',
  HEALTH = 'health',
  ARMOR = 'armor',
}

/**
 * Base class for all pickups
 */
export abstract class Pickup {
  protected scene: Scene;
  protected rootNode: TransformNode;
  protected mesh: Mesh;
  protected pickupRange: number = 1.5;
  protected bobOffset: number = 0;
  protected rotationSpeed: number = 2;
  private _isActive: boolean = true;

  constructor(scene: Scene, position: Vector3, name: string) {
    this.scene = scene;
    this.rootNode = new TransformNode(name, scene);
    this.rootNode.position = position.clone();
    this.rootNode.position.y = 0.5;

    this.mesh = this.createMesh();
    this.mesh.parent = this.rootNode;

    // Random initial rotation
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  protected abstract createMesh(): Mesh;
  protected abstract onCollect(player: any): void;
  abstract getType(): PickupType;

  update(deltaTime: number, player: { position: Vector3 }): boolean {
    if (!this._isActive) return false;

    // Animate
    this.bobOffset += deltaTime * 3;
    this.mesh.position.y = Math.sin(this.bobOffset) * 0.1;
    this.rootNode.rotation.y += deltaTime * this.rotationSpeed;

    // Check collision with player
    const distance = MathUtils.distanceXZ(this.rootNode.position, player.position);
    if (distance < this.pickupRange) {
      this.collect(player);
      return true;
    }

    return false;
  }

  private collect(player: any): void {
    if (!this._isActive) return;

    this._isActive = false;

    // Apply effect
    this.onCollect(player);

    // Collect animation
    this.createCollectEffect();

    // Scale down and dispose
    const scaleAnim = new Animation(
      'collectScale',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    scaleAnim.setKeys([
      { frame: 0, value: this.rootNode.scaling.clone() },
      { frame: 10, value: new Vector3(1.3, 1.3, 1.3) },
      { frame: 15, value: new Vector3(0, 0, 0) },
    ]);

    this.rootNode.animations = [scaleAnim];
    this.scene.beginAnimation(this.rootNode, 0, 15, false, 1, () => {
      this.dispose();
    });
  }

  protected createCollectEffect(): void {
    const particleSystem = new ParticleSystem('collectEffect', 20, this.scene);
    particleSystem.emitter = this.rootNode.position.clone();

    particleSystem.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
    particleSystem.maxEmitBox = new Vector3(0.2, 0.2, 0.2);

    particleSystem.color1 = new Color4(1, 1, 1, 1);
    particleSystem.color2 = new Color4(1, 1, 0.5, 1);
    particleSystem.colorDead = new Color4(1, 1, 1, 0);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.15;

    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;

    particleSystem.emitRate = 100;
    particleSystem.manualEmitCount = 20;

    particleSystem.direction1 = new Vector3(-2, 1, -2);
    particleSystem.direction2 = new Vector3(2, 4, 2);

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.start();
    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 400);
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get position(): Vector3 {
    return this.rootNode.position;
  }

  dispose(): void {
    this.mesh.dispose();
    this.rootNode.dispose();
    this._isActive = false;
  }
}
