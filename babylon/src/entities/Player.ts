import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  TransformNode,
  Color3,
  StandardMaterial,
  Animation,
  Scalar,
} from '@babylonjs/core';
import { GAME_CONFIG, WeaponType } from '../utils/Constants';
import { InputManager } from '../systems/InputManager';
import { MaterialLibrary } from '../world/MaterialLibrary';
import { MathUtils } from '../utils/MathUtils';
import { EventBus, GameEvents } from '../core/EventBus';
import { WeaponManager } from '../weapons/WeaponManager';

/**
 * Player entity with detailed 3D model and controls
 */
export class Player {
  private scene: Scene;
  private rootNode: TransformNode;
  private bodyMesh: Mesh;
  private characterParts: Map<string, Mesh> = new Map();

  // Stats
  private health: number = GAME_CONFIG.PLAYER_MAX_HEALTH;
  private maxHealth: number = GAME_CONFIG.PLAYER_MAX_HEALTH;
  private armor: number = 0;
  private maxArmor: number = GAME_CONFIG.PLAYER_MAX_ARMOR;

  // Movement
  private speed: number = GAME_CONFIG.PLAYER_SPEED;
  private velocity: Vector3 = Vector3.Zero();
  private targetRotation: number = 0;
  private currentRotation: number = 0;

  // Weapons
  private weaponManager: WeaponManager;

  // Animation
  private isMoving: boolean = false;
  private bobOffset: number = 0;

  // Events
  private eventBus: EventBus;

  constructor(scene: Scene, position: Vector3) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();

    // Create root node
    this.rootNode = new TransformNode('player', scene);
    this.rootNode.position = position.clone();

    // Build character model
    this.bodyMesh = this.buildCharacterModel();

    // Initialize weapons
    this.weaponManager = new WeaponManager(scene, this);

    // Setup input handlers
    this.setupInputHandlers();

    // Emit initial stats
    this.emitStats();
  }

  /**
   * Build detailed procedural character model
   */
  private buildCharacterModel(): Mesh {
    const playerMat = MaterialLibrary.get('player');
    const accentMat = MaterialLibrary.get('player_accent');

    // --- BODY ---
    // Torso (slightly tapered box)
    const torso = MeshBuilder.CreateBox('torso', {
      width: 0.5,
      height: 0.7,
      depth: 0.35,
    }, this.scene);
    torso.position.y = 1.0;
    torso.material = playerMat;
    torso.parent = this.rootNode;
    this.characterParts.set('torso', torso);

    // Chest plate (armor detail)
    const chestPlate = MeshBuilder.CreateBox('chestPlate', {
      width: 0.45,
      height: 0.35,
      depth: 0.1,
    }, this.scene);
    chestPlate.position = new Vector3(0, 1.1, 0.18);
    chestPlate.material = accentMat;
    chestPlate.parent = this.rootNode;
    this.characterParts.set('chestPlate', chestPlate);

    // --- HEAD ---
    // Neck
    const neck = MeshBuilder.CreateCylinder('neck', {
      height: 0.12,
      diameter: 0.15,
    }, this.scene);
    neck.position.y = 1.4;
    neck.material = playerMat;
    neck.parent = this.rootNode;
    this.characterParts.set('neck', neck);

    // Head (sphere with flattening)
    const head = MeshBuilder.CreateSphere('head', {
      diameter: 0.35,
      segments: 16,
    }, this.scene);
    head.scaling = new Vector3(1, 1.1, 0.95);
    head.position.y = 1.6;
    head.material = playerMat;
    head.parent = this.rootNode;
    this.characterParts.set('head', head);

    // Visor/helmet
    const visor = MeshBuilder.CreateBox('visor', {
      width: 0.3,
      height: 0.1,
      depth: 0.1,
    }, this.scene);
    visor.position = new Vector3(0, 1.62, 0.14);
    const visorMat = new StandardMaterial('visorMat', this.scene);
    visorMat.diffuseColor = new Color3(0.1, 0.8, 0.9);
    visorMat.emissiveColor = new Color3(0.05, 0.4, 0.45);
    visorMat.alpha = 0.8;
    visor.material = visorMat;
    visor.parent = this.rootNode;
    this.characterParts.set('visor', visor);

    // --- ARMS ---
    // Shoulders (spheres)
    const leftShoulder = MeshBuilder.CreateSphere('leftShoulder', {
      diameter: 0.18,
    }, this.scene);
    leftShoulder.position = new Vector3(-0.32, 1.25, 0);
    leftShoulder.material = accentMat;
    leftShoulder.parent = this.rootNode;
    this.characterParts.set('leftShoulder', leftShoulder);

    const rightShoulder = MeshBuilder.CreateSphere('rightShoulder', {
      diameter: 0.18,
    }, this.scene);
    rightShoulder.position = new Vector3(0.32, 1.25, 0);
    rightShoulder.material = accentMat;
    rightShoulder.parent = this.rootNode;
    this.characterParts.set('rightShoulder', rightShoulder);

    // Upper arms
    const leftUpperArm = MeshBuilder.CreateCylinder('leftUpperArm', {
      height: 0.3,
      diameter: 0.12,
    }, this.scene);
    leftUpperArm.position = new Vector3(-0.35, 1.05, 0);
    leftUpperArm.material = playerMat;
    leftUpperArm.parent = this.rootNode;
    this.characterParts.set('leftUpperArm', leftUpperArm);

    const rightUpperArm = MeshBuilder.CreateCylinder('rightUpperArm', {
      height: 0.3,
      diameter: 0.12,
    }, this.scene);
    rightUpperArm.position = new Vector3(0.35, 1.05, 0);
    rightUpperArm.material = playerMat;
    rightUpperArm.parent = this.rootNode;
    this.characterParts.set('rightUpperArm', rightUpperArm);

    // Elbows
    const leftElbow = MeshBuilder.CreateSphere('leftElbow', {
      diameter: 0.1,
    }, this.scene);
    leftElbow.position = new Vector3(-0.35, 0.88, 0);
    leftElbow.material = accentMat;
    leftElbow.parent = this.rootNode;
    this.characterParts.set('leftElbow', leftElbow);

    const rightElbow = MeshBuilder.CreateSphere('rightElbow', {
      diameter: 0.1,
    }, this.scene);
    rightElbow.position = new Vector3(0.35, 0.88, 0);
    rightElbow.material = accentMat;
    rightElbow.parent = this.rootNode;
    this.characterParts.set('rightElbow', rightElbow);

    // Lower arms
    const leftLowerArm = MeshBuilder.CreateCylinder('leftLowerArm', {
      height: 0.28,
      diameter: 0.1,
    }, this.scene);
    leftLowerArm.position = new Vector3(-0.35, 0.72, 0.05);
    leftLowerArm.rotation.x = 0.3;
    leftLowerArm.material = playerMat;
    leftLowerArm.parent = this.rootNode;
    this.characterParts.set('leftLowerArm', leftLowerArm);

    const rightLowerArm = MeshBuilder.CreateCylinder('rightLowerArm', {
      height: 0.28,
      diameter: 0.1,
    }, this.scene);
    rightLowerArm.position = new Vector3(0.35, 0.72, 0.05);
    rightLowerArm.rotation.x = 0.3;
    rightLowerArm.material = playerMat;
    rightLowerArm.parent = this.rootNode;
    this.characterParts.set('rightLowerArm', rightLowerArm);

    // Hands
    const leftHand = MeshBuilder.CreateBox('leftHand', {
      width: 0.1,
      height: 0.12,
      depth: 0.08,
    }, this.scene);
    leftHand.position = new Vector3(-0.35, 0.55, 0.1);
    leftHand.material = playerMat;
    leftHand.parent = this.rootNode;
    this.characterParts.set('leftHand', leftHand);

    const rightHand = MeshBuilder.CreateBox('rightHand', {
      width: 0.1,
      height: 0.12,
      depth: 0.08,
    }, this.scene);
    rightHand.position = new Vector3(0.35, 0.55, 0.1);
    rightHand.material = playerMat;
    rightHand.parent = this.rootNode;
    this.characterParts.set('rightHand', rightHand);

    // --- LEGS ---
    // Hips/Belt
    const belt = MeshBuilder.CreateBox('belt', {
      width: 0.5,
      height: 0.12,
      depth: 0.32,
    }, this.scene);
    belt.position.y = 0.62;
    belt.material = accentMat;
    belt.parent = this.rootNode;
    this.characterParts.set('belt', belt);

    // Upper legs
    const leftUpperLeg = MeshBuilder.CreateCylinder('leftUpperLeg', {
      height: 0.35,
      diameter: 0.16,
    }, this.scene);
    leftUpperLeg.position = new Vector3(-0.15, 0.4, 0);
    leftUpperLeg.material = playerMat;
    leftUpperLeg.parent = this.rootNode;
    this.characterParts.set('leftUpperLeg', leftUpperLeg);

    const rightUpperLeg = MeshBuilder.CreateCylinder('rightUpperLeg', {
      height: 0.35,
      diameter: 0.16,
    }, this.scene);
    rightUpperLeg.position = new Vector3(0.15, 0.4, 0);
    rightUpperLeg.material = playerMat;
    rightUpperLeg.parent = this.rootNode;
    this.characterParts.set('rightUpperLeg', rightUpperLeg);

    // Knees
    const leftKnee = MeshBuilder.CreateSphere('leftKnee', {
      diameter: 0.12,
    }, this.scene);
    leftKnee.position = new Vector3(-0.15, 0.2, 0);
    leftKnee.material = accentMat;
    leftKnee.parent = this.rootNode;
    this.characterParts.set('leftKnee', leftKnee);

    const rightKnee = MeshBuilder.CreateSphere('rightKnee', {
      diameter: 0.12,
    }, this.scene);
    rightKnee.position = new Vector3(0.15, 0.2, 0);
    rightKnee.material = accentMat;
    rightKnee.parent = this.rootNode;
    this.characterParts.set('rightKnee', rightKnee);

    // Lower legs
    const leftLowerLeg = MeshBuilder.CreateCylinder('leftLowerLeg', {
      height: 0.3,
      diameter: 0.12,
    }, this.scene);
    leftLowerLeg.position = new Vector3(-0.15, 0.05, 0);
    leftLowerLeg.material = playerMat;
    leftLowerLeg.parent = this.rootNode;
    this.characterParts.set('leftLowerLeg', leftLowerLeg);

    const rightLowerLeg = MeshBuilder.CreateCylinder('rightLowerLeg', {
      height: 0.3,
      diameter: 0.12,
    }, this.scene);
    rightLowerLeg.position = new Vector3(0.15, 0.05, 0);
    rightLowerLeg.material = playerMat;
    rightLowerLeg.parent = this.rootNode;
    this.characterParts.set('rightLowerLeg', rightLowerLeg);

    // Feet/Boots
    const leftFoot = MeshBuilder.CreateBox('leftFoot', {
      width: 0.12,
      height: 0.08,
      depth: 0.2,
    }, this.scene);
    leftFoot.position = new Vector3(-0.15, -0.1, 0.03);
    leftFoot.material = accentMat;
    leftFoot.parent = this.rootNode;
    this.characterParts.set('leftFoot', leftFoot);

    const rightFoot = MeshBuilder.CreateBox('rightFoot', {
      width: 0.12,
      height: 0.08,
      depth: 0.2,
    }, this.scene);
    rightFoot.position = new Vector3(0.15, -0.1, 0.03);
    rightFoot.material = accentMat;
    rightFoot.parent = this.rootNode;
    this.characterParts.set('rightFoot', rightFoot);

    // --- BACKPACK ---
    const backpack = MeshBuilder.CreateBox('backpack', {
      width: 0.35,
      height: 0.4,
      depth: 0.15,
    }, this.scene);
    backpack.position = new Vector3(0, 1.0, -0.22);
    backpack.material = accentMat;
    backpack.parent = this.rootNode;
    this.characterParts.set('backpack', backpack);

    return torso;
  }

  private setupInputHandlers(): void {
    // Weapon switching
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === 1) { // KEYDOWN
        const key = kbInfo.event.key;
        if (key === '1') {
          this.weaponManager.switchTo(WeaponType.GUN);
        } else if (key === '2') {
          this.weaponManager.switchTo(WeaponType.SWORD);
        }
      }
    });

    // Mouse wheel weapon cycling
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === 8) { // POINTERWHEEL
        const wheelEvent = pointerInfo.event as WheelEvent;
        if (wheelEvent.deltaY > 0) {
          this.weaponManager.cycleNext();
        } else if (wheelEvent.deltaY < 0) {
          this.weaponManager.cyclePrevious();
        }
      }
    });
  }

  update(deltaTime: number): void {
    this.handleMovement(deltaTime);
    this.handleRotation(deltaTime);
    this.handleAttack(deltaTime);
    this.updateAnimation(deltaTime);
    this.weaponManager.update(deltaTime);
  }

  private handleMovement(deltaTime: number): void {
    const input = InputManager.getInstance();
    const moveDir = input.getMovementVector();

    if (moveDir.length() > 0) {
      this.isMoving = true;
      this.velocity = moveDir.scale(this.speed);

      // Update target rotation based on movement direction
      this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
    } else {
      this.isMoving = false;
      this.velocity = Vector3.Zero();
    }

    // Apply movement
    const movement = this.velocity.scale(deltaTime);
    this.rootNode.position.addInPlace(movement);
  }

  private handleRotation(deltaTime: number): void {
    const input = InputManager.getInstance();
    const worldMousePos = input.getWorldMousePosition();

    // Rotate towards mouse position when aiming
    if (worldMousePos.length() > 0) {
      const direction = worldMousePos.subtract(this.rootNode.position);
      direction.y = 0;
      if (direction.length() > 0.1) {
        this.targetRotation = Math.atan2(direction.x, direction.z);
      }
    }

    // Smooth rotation
    let rotDiff = MathUtils.wrapAngle(this.targetRotation - this.currentRotation);
    this.currentRotation += rotDiff * Math.min(1, deltaTime * 10);
    this.rootNode.rotation.y = this.currentRotation;
  }

  private handleAttack(deltaTime: number): void {
    const input = InputManager.getInstance();

    if (input.isMouseButtonDown(0)) {
      const worldMousePos = input.getWorldMousePosition();
      this.weaponManager.attack(worldMousePos);
    }
  }

  private updateAnimation(deltaTime: number): void {
    if (this.isMoving) {
      // Walking bob animation
      this.bobOffset += deltaTime * 10;
      const bobAmount = Math.sin(this.bobOffset) * 0.05;

      // Animate legs
      const leftUpperLeg = this.characterParts.get('leftUpperLeg');
      const rightUpperLeg = this.characterParts.get('rightUpperLeg');
      const leftLowerLeg = this.characterParts.get('leftLowerLeg');
      const rightLowerLeg = this.characterParts.get('rightLowerLeg');

      if (leftUpperLeg && rightUpperLeg) {
        leftUpperLeg.rotation.x = Math.sin(this.bobOffset) * 0.4;
        rightUpperLeg.rotation.x = -Math.sin(this.bobOffset) * 0.4;
      }

      if (leftLowerLeg && rightLowerLeg) {
        leftLowerLeg.position.y = 0.05 + Math.max(0, Math.sin(this.bobOffset)) * 0.05;
        rightLowerLeg.position.y = 0.05 + Math.max(0, -Math.sin(this.bobOffset)) * 0.05;
      }

      // Animate arms (opposite to legs)
      const leftUpperArm = this.characterParts.get('leftUpperArm');
      const rightUpperArm = this.characterParts.get('rightUpperArm');

      if (leftUpperArm && rightUpperArm) {
        leftUpperArm.rotation.x = -Math.sin(this.bobOffset) * 0.3;
        rightUpperArm.rotation.x = Math.sin(this.bobOffset) * 0.3;
      }

      // Body bob
      this.rootNode.position.y = bobAmount;
    } else {
      // Reset to idle
      this.bobOffset = 0;
      this.rootNode.position.y = 0;

      // Reset limb rotations smoothly
      this.characterParts.forEach((part) => {
        if (part.rotation.x !== 0) {
          part.rotation.x = Scalar.Lerp(part.rotation.x, 0, 0.1);
        }
      });
    }
  }

  // Combat methods
  takeDamage(amount: number): void {
    let actualDamage = amount;

    // Armor absorbs damage first
    if (this.armor > 0) {
      const armorAbsorption = Math.min(this.armor, amount);
      this.armor -= armorAbsorption;
      actualDamage = amount - armorAbsorption;
      this.eventBus.emit(GameEvents.PLAYER_ARMOR_CHANGED, this.armor, this.maxArmor);
    }

    // Apply remaining damage to health
    if (actualDamage > 0) {
      this.health -= actualDamage;
      this.eventBus.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
    }

    // Visual feedback - red flash
    this.flashColor(new Color3(1, 0.2, 0.2));

    this.eventBus.emit(GameEvents.PLAYER_DAMAGED, actualDamage);

    if (this.health <= 0) {
      this.eventBus.emit(GameEvents.PLAYER_DIED);
    }
  }

  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
    this.eventBus.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
    this.flashColor(new Color3(0.2, 1, 0.2));
  }

  addArmor(amount: number): void {
    this.armor = Math.min(this.armor + amount, this.maxArmor);
    this.eventBus.emit(GameEvents.PLAYER_ARMOR_CHANGED, this.armor, this.maxArmor);
    this.flashColor(new Color3(0.2, 0.5, 1));
  }

  private flashColor(color: Color3): void {
    const originalMat = MaterialLibrary.get('player');
    const flashMat = new StandardMaterial('flashMat', this.scene);
    flashMat.diffuseColor = color;
    flashMat.emissiveColor = color.scale(0.5);

    // Apply flash to main body parts
    ['torso', 'head', 'leftUpperArm', 'rightUpperArm'].forEach((name) => {
      const part = this.characterParts.get(name);
      if (part) {
        part.material = flashMat;
      }
    });

    // Revert after delay
    setTimeout(() => {
      ['torso', 'head', 'leftUpperArm', 'rightUpperArm'].forEach((name) => {
        const part = this.characterParts.get(name);
        if (part) {
          part.material = originalMat!;
        }
      });
      flashMat.dispose();
    }, 100);
  }

  private emitStats(): void {
    this.eventBus.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
    this.eventBus.emit(GameEvents.PLAYER_ARMOR_CHANGED, this.armor, this.maxArmor);
  }

  // Getters
  get position(): Vector3 {
    return this.rootNode.position;
  }

  get rotation(): number {
    return this.currentRotation;
  }

  get mesh(): TransformNode {
    return this.rootNode;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getArmor(): number {
    return this.armor;
  }

  getMaxArmor(): number {
    return this.maxArmor;
  }

  getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

  getCurrentWeaponType(): WeaponType {
    return this.weaponManager.getCurrentType();
  }

  // Setters for scene transitions
  setPosition(position: Vector3): void {
    this.rootNode.position = position.clone();
  }

  setHealth(health: number): void {
    this.health = Scalar.Clamp(health, 0, this.maxHealth);
    this.eventBus.emit(GameEvents.PLAYER_HEALTH_CHANGED, this.health, this.maxHealth);
  }

  setArmor(armor: number): void {
    this.armor = Scalar.Clamp(armor, 0, this.maxArmor);
    this.eventBus.emit(GameEvents.PLAYER_ARMOR_CHANGED, this.armor, this.maxArmor);
  }

  resetStats(): void {
    this.health = this.maxHealth;
    this.armor = 0;
    this.weaponManager.resetAmmo();
    this.emitStats();
  }

  dispose(): void {
    this.characterParts.forEach((mesh) => mesh.dispose());
    this.rootNode.dispose();
    this.weaponManager.dispose();
  }
}
