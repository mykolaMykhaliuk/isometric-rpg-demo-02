import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  TransformNode,
  Color3,
  StandardMaterial,
  Animation,
  ParticleSystem,
  Color4,
  Scalar,
} from '@babylonjs/core';
import { GAME_CONFIG } from '../utils/Constants';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { MathUtils } from '../utils/MathUtils';
import { EventBus, GameEvents } from '../core/EventBus';

enum EnemyState {
  IDLE = 'idle',
  WANDER = 'wander',
  CHASE = 'chase',
  ATTACK = 'attack',
  DYING = 'dying',
}

/**
 * Enemy entity with AI behaviors and detailed 3D model
 */
export class Enemy {
  private scene: Scene;
  private rootNode: TransformNode;
  private bodyParts: Map<string, Mesh> = new Map();

  // Stats
  private health: number = GAME_CONFIG.ENEMY_HEALTH;
  private speed: number = GAME_CONFIG.ENEMY_SPEED;
  private chaseSpeed: number = GAME_CONFIG.ENEMY_CHASE_SPEED;
  private damage: number = GAME_CONFIG.ENEMY_DAMAGE;
  private detectionRange: number = GAME_CONFIG.ENEMY_DETECTION_RANGE;
  private attackRange: number = GAME_CONFIG.ENEMY_ATTACK_RANGE;

  // AI State
  private state: EnemyState = EnemyState.IDLE;
  private target: { position: Vector3 } | null = null;
  private wanderTarget: Vector3 | null = null;
  private wanderTimer: number = 0;

  // Attack
  private attackCooldown: number = 0;
  private attackCooldownTime: number = GAME_CONFIG.ENEMY_ATTACK_COOLDOWN;

  // Flags
  private isDying: boolean = false;
  private _isActive: boolean = true;

  // Animation
  private animationOffset: number = Math.random() * Math.PI * 2;
  private bobOffset: number = 0;

  // Events
  private eventBus: EventBus;

  constructor(scene: Scene, position: Vector3) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    // Create root node
    this.rootNode = new TransformNode('enemy', scene);
    this.rootNode.position = position.clone();

    // Build enemy model
    this.buildEnemyModel();
  }

  /**
   * Build detailed bug-like enemy model
   */
  private buildEnemyModel(): void {
    const enemyMat = MaterialLibrary.get('enemy');

    // Create glowing material for eyes and details
    const glowMat = new StandardMaterial('enemyGlow', this.scene);
    glowMat.diffuseColor = new Color3(0.4, 1, 0.4);
    glowMat.emissiveColor = new Color3(0.2, 0.5, 0.2);

    // --- BODY ---
    // Main body (elongated ellipsoid)
    const body = MeshBuilder.CreateSphere('enemyBody', {
      diameterX: 0.8,
      diameterY: 0.5,
      diameterZ: 1.2,
      segments: 12,
    }, this.scene);
    body.position.y = 0.4;
    body.material = enemyMat;
    body.parent = this.rootNode;
    this.bodyParts.set('body', body);

    // Abdomen (larger back segment)
    const abdomen = MeshBuilder.CreateSphere('abdomen', {
      diameterX: 0.7,
      diameterY: 0.45,
      diameterZ: 0.9,
      segments: 10,
    }, this.scene);
    abdomen.position = new Vector3(0, 0.35, -0.6);
    abdomen.material = enemyMat;
    abdomen.parent = this.rootNode;
    this.bodyParts.set('abdomen', abdomen);

    // Stripes on abdomen
    for (let i = 0; i < 3; i++) {
      const stripe = MeshBuilder.CreateTorus('stripe' + i, {
        diameter: 0.5 - i * 0.1,
        thickness: 0.03,
        tessellation: 16,
      }, this.scene);
      stripe.rotation.x = Math.PI / 2;
      stripe.position = new Vector3(0, 0.35, -0.4 - i * 0.15);
      stripe.material = glowMat;
      stripe.parent = this.rootNode;
      this.bodyParts.set('stripe' + i, stripe);
    }

    // --- HEAD ---
    const head = MeshBuilder.CreateSphere('head', {
      diameterX: 0.5,
      diameterY: 0.4,
      diameterZ: 0.45,
      segments: 10,
    }, this.scene);
    head.position = new Vector3(0, 0.45, 0.5);
    head.material = enemyMat;
    head.parent = this.rootNode;
    this.bodyParts.set('head', head);

    // Eyes (compound eyes)
    const leftEye = MeshBuilder.CreateSphere('leftEye', {
      diameter: 0.18,
      segments: 8,
    }, this.scene);
    leftEye.position = new Vector3(-0.15, 0.5, 0.6);
    leftEye.material = glowMat;
    leftEye.parent = this.rootNode;
    this.bodyParts.set('leftEye', leftEye);

    const rightEye = MeshBuilder.CreateSphere('rightEye', {
      diameter: 0.18,
      segments: 8,
    }, this.scene);
    rightEye.position = new Vector3(0.15, 0.5, 0.6);
    rightEye.material = glowMat;
    rightEye.parent = this.rootNode;
    this.bodyParts.set('rightEye', rightEye);

    // Antennae
    const leftAntenna = MeshBuilder.CreateCylinder('leftAntenna', {
      height: 0.4,
      diameter: 0.03,
    }, this.scene);
    leftAntenna.rotation.x = -0.5;
    leftAntenna.rotation.z = -0.3;
    leftAntenna.position = new Vector3(-0.1, 0.65, 0.55);
    leftAntenna.material = enemyMat;
    leftAntenna.parent = this.rootNode;
    this.bodyParts.set('leftAntenna', leftAntenna);

    const rightAntenna = MeshBuilder.CreateCylinder('rightAntenna', {
      height: 0.4,
      diameter: 0.03,
    }, this.scene);
    rightAntenna.rotation.x = -0.5;
    rightAntenna.rotation.z = 0.3;
    rightAntenna.position = new Vector3(0.1, 0.65, 0.55);
    rightAntenna.material = enemyMat;
    rightAntenna.parent = this.rootNode;
    this.bodyParts.set('rightAntenna', rightAntenna);

    // Antenna tips
    const leftAntennaTip = MeshBuilder.CreateSphere('leftAntennaTip', {
      diameter: 0.06,
    }, this.scene);
    leftAntennaTip.position = new Vector3(-0.2, 0.85, 0.65);
    leftAntennaTip.material = glowMat;
    leftAntennaTip.parent = this.rootNode;
    this.bodyParts.set('leftAntennaTip', leftAntennaTip);

    const rightAntennaTip = MeshBuilder.CreateSphere('rightAntennaTip', {
      diameter: 0.06,
    }, this.scene);
    rightAntennaTip.position = new Vector3(0.2, 0.85, 0.65);
    rightAntennaTip.material = glowMat;
    rightAntennaTip.parent = this.rootNode;
    this.bodyParts.set('rightAntennaTip', rightAntennaTip);

    // Mandibles
    const leftMandible = MeshBuilder.CreateBox('leftMandible', {
      width: 0.08,
      height: 0.04,
      depth: 0.15,
    }, this.scene);
    leftMandible.rotation.y = -0.3;
    leftMandible.position = new Vector3(-0.12, 0.35, 0.7);
    leftMandible.material = enemyMat;
    leftMandible.parent = this.rootNode;
    this.bodyParts.set('leftMandible', leftMandible);

    const rightMandible = MeshBuilder.CreateBox('rightMandible', {
      width: 0.08,
      height: 0.04,
      depth: 0.15,
    }, this.scene);
    rightMandible.rotation.y = 0.3;
    rightMandible.position = new Vector3(0.12, 0.35, 0.7);
    rightMandible.material = enemyMat;
    rightMandible.parent = this.rootNode;
    this.bodyParts.set('rightMandible', rightMandible);

    // --- LEGS ---
    // 6 legs (3 pairs)
    this.createLegPair(0, -0.15, 0.3);
    this.createLegPair(1, -0.2, 0);
    this.createLegPair(2, -0.15, -0.3);
  }

  private createLegPair(index: number, yOffset: number, zOffset: number): void {
    const legMat = MaterialLibrary.get('enemy');
    const angle = 0.6 + index * 0.1;

    // Left leg
    const leftLeg = this.createLeg(`leftLeg${index}`, legMat!);
    leftLeg.rotation.z = angle;
    leftLeg.rotation.y = -0.2 - index * 0.1;
    leftLeg.position = new Vector3(-0.35, yOffset + 0.4, zOffset);
    leftLeg.parent = this.rootNode;
    this.bodyParts.set(`leftLeg${index}`, leftLeg);

    // Right leg
    const rightLeg = this.createLeg(`rightLeg${index}`, legMat!);
    rightLeg.rotation.z = -angle;
    rightLeg.rotation.y = 0.2 + index * 0.1;
    rightLeg.position = new Vector3(0.35, yOffset + 0.4, zOffset);
    rightLeg.parent = this.rootNode;
    this.bodyParts.set(`rightLeg${index}`, rightLeg);
  }

  private createLeg(name: string, material: any): Mesh {
    const leg = MeshBuilder.CreateCylinder(name, {
      height: 0.5,
      diameterTop: 0.04,
      diameterBottom: 0.02,
    }, this.scene);
    leg.material = material;
    return leg;
  }

  setTarget(target: { position: Vector3 }): void {
    this.target = target;
  }

  update(deltaTime: number): void {
    if (!this._isActive || this.isDying) return;

    this.updateAI(deltaTime);
    this.updateAnimation(deltaTime);
  }

  private updateAI(deltaTime: number): void {
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (!this.target) {
      this.wander(deltaTime);
      return;
    }

    const distanceToTarget = MathUtils.distanceXZ(
      this.rootNode.position,
      this.target.position
    );

    if (distanceToTarget < this.detectionRange) {
      if (distanceToTarget <= this.attackRange) {
        this.attack();
      } else {
        this.chase(deltaTime);
      }
    } else {
      this.wander(deltaTime);
    }
  }

  private chase(deltaTime: number): void {
    this.state = EnemyState.CHASE;

    if (!this.target) return;

    const direction = MathUtils.directionXZ(
      this.rootNode.position,
      this.target.position
    );

    // Move towards target
    const movement = direction.scale(this.chaseSpeed * deltaTime);
    this.rootNode.position.addInPlace(movement);

    // Rotate to face target
    this.rootNode.rotation.y = Math.atan2(direction.x, direction.z);
  }

  private wander(deltaTime: number): void {
    this.state = EnemyState.WANDER;

    this.wanderTimer -= deltaTime;

    // Get new wander target
    if (this.wanderTimer <= 0 || !this.wanderTarget) {
      this.wanderTarget = MathUtils.randomPointInRadius(
        this.rootNode.position,
        GAME_CONFIG.ENEMY_WANDER_RANGE
      );
      this.wanderTimer = 2 + Math.random() * 2;
    }

    // Move towards wander target
    const distanceToTarget = MathUtils.distanceXZ(
      this.rootNode.position,
      this.wanderTarget
    );

    if (distanceToTarget > 0.5) {
      const direction = MathUtils.directionXZ(
        this.rootNode.position,
        this.wanderTarget
      );

      const movement = direction.scale(this.speed * deltaTime);
      this.rootNode.position.addInPlace(movement);

      // Rotate to face direction
      this.rootNode.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  private attack(): void {
    this.state = EnemyState.ATTACK;

    if (this.attackCooldown > 0 || !this.target) return;

    // Deal damage to player
    const player = this.target as any;
    if (player.takeDamage) {
      player.takeDamage(this.damage);
    }

    this.attackCooldown = this.attackCooldownTime;

    // Visual feedback - red flash
    this.flashColor(new Color3(1, 0.4, 0.4));
  }

  private updateAnimation(deltaTime: number): void {
    this.bobOffset += deltaTime * 8;

    // Idle/Walking bob animation
    const bobAmount = Math.sin(this.bobOffset + this.animationOffset) * 0.03;
    this.rootNode.position.y = bobAmount;

    // Animate legs when moving
    if (this.state === EnemyState.CHASE || this.state === EnemyState.WANDER) {
      for (let i = 0; i < 3; i++) {
        const leftLeg = this.bodyParts.get(`leftLeg${i}`);
        const rightLeg = this.bodyParts.get(`rightLeg${i}`);

        if (leftLeg && rightLeg) {
          const offset = i * (Math.PI / 3);
          leftLeg.rotation.x = Math.sin(this.bobOffset * 2 + offset) * 0.3;
          rightLeg.rotation.x = -Math.sin(this.bobOffset * 2 + offset) * 0.3;
        }
      }
    }

    // Antenna sway
    const leftAntenna = this.bodyParts.get('leftAntenna');
    const rightAntenna = this.bodyParts.get('rightAntenna');

    if (leftAntenna && rightAntenna) {
      leftAntenna.rotation.x = -0.5 + Math.sin(this.bobOffset * 1.5) * 0.1;
      rightAntenna.rotation.x = -0.5 + Math.sin(this.bobOffset * 1.5 + 0.5) * 0.1;
    }

    // Mandible animation when attacking
    if (this.state === EnemyState.ATTACK) {
      const leftMandible = this.bodyParts.get('leftMandible');
      const rightMandible = this.bodyParts.get('rightMandible');

      if (leftMandible && rightMandible) {
        const mandibleAngle = Math.sin(this.bobOffset * 10) * 0.2;
        leftMandible.rotation.y = -0.3 - mandibleAngle;
        rightMandible.rotation.y = 0.3 + mandibleAngle;
      }
    }
  }

  takeDamage(amount: number): boolean {
    if (this.isDying || !this._isActive) return false;

    this.health -= amount;

    // Visual feedback - white flash
    this.flashColor(new Color3(1, 1, 1));

    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private flashColor(color: Color3): void {
    const flashMat = new StandardMaterial('flashMat', this.scene);
    flashMat.diffuseColor = color;
    flashMat.emissiveColor = color.scale(0.5);

    const body = this.bodyParts.get('body');
    const originalMat = body?.material;

    this.bodyParts.forEach((part) => {
      part.material = flashMat;
    });

    setTimeout(() => {
      const enemyMat = MaterialLibrary.get('enemy');
      this.bodyParts.forEach((part, name) => {
        if (name.includes('Eye') || name.includes('Tip') || name.includes('stripe')) {
          // Keep glow material
        } else {
          part.material = enemyMat!;
        }
      });
      flashMat.dispose();
    }, 50);
  }

  private die(): void {
    if (this.isDying) return;

    this.isDying = true;
    this._isActive = false;
    this.state = EnemyState.DYING;

    // Emit event
    this.eventBus.emit(GameEvents.ENEMY_KILLED, GAME_CONFIG.ENEMY_KILL_POINTS);

    // Create death particles
    this.createDeathEffect();

    // Death animation
    const scaleAnim = new Animation(
      'deathScale',
      'scaling',
      60,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    scaleAnim.setKeys([
      { frame: 0, value: this.rootNode.scaling.clone() },
      { frame: 20, value: new Vector3(0.2, 0.2, 0.2) },
    ]);

    const rotateAnim = new Animation(
      'deathRotate',
      'rotation.y',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    rotateAnim.setKeys([
      { frame: 0, value: this.rootNode.rotation.y },
      { frame: 20, value: this.rootNode.rotation.y + Math.PI * 2 },
    ]);

    this.rootNode.animations = [scaleAnim, rotateAnim];

    this.scene.beginAnimation(this.rootNode, 0, 20, false, 1, () => {
      this.dispose();
    });
  }

  private createDeathEffect(): void {
    const particleSystem = new ParticleSystem('deathEffect', 50, this.scene);
    particleSystem.emitter = this.rootNode.position.clone();

    particleSystem.minEmitBox = new Vector3(-0.3, -0.2, -0.3);
    particleSystem.maxEmitBox = new Vector3(0.3, 0.5, 0.3);

    particleSystem.color1 = new Color4(0.3, 0.8, 0.3, 1);
    particleSystem.color2 = new Color4(0.5, 1, 0.5, 1);
    particleSystem.colorDead = new Color4(0.2, 0.5, 0.2, 0);

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.25;

    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.4;

    particleSystem.emitRate = 200;
    particleSystem.manualEmitCount = 50;

    particleSystem.direction1 = new Vector3(-3, 1, -3);
    particleSystem.direction2 = new Vector3(3, 5, 3);

    particleSystem.minEmitPower = 2;
    particleSystem.maxEmitPower = 5;

    particleSystem.gravity = new Vector3(0, -5, 0);

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.start();

    setTimeout(() => {
      particleSystem.stop();
      particleSystem.dispose();
    }, 400);
  }

  // Getters
  get position(): Vector3 {
    return this.rootNode.position;
  }

  get isActive(): boolean {
    return this._isActive && !this.isDying;
  }

  getHealth(): number {
    return this.health;
  }

  isEnemyDying(): boolean {
    return this.isDying;
  }

  getMesh(): TransformNode {
    return this.rootNode;
  }

  dispose(): void {
    this.bodyParts.forEach((mesh) => mesh.dispose());
    this.rootNode.dispose();
    this._isActive = false;
  }
}
