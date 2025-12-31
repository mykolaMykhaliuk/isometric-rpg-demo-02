import {
  Scene,
  ArcRotateCamera,
  Vector3,
  TransformNode,
  Animation,
  EasingFunction,
  QuadraticEase,
  Scalar,
} from '@babylonjs/core';
import { GAME_CONFIG } from '../utils/Constants';

/**
 * Isometric-style 3D camera with smooth following
 */
export class GameCamera {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private target: TransformNode | null = null;
  private targetPosition: Vector3 = Vector3.Zero();
  private followSpeed: number = GAME_CONFIG.CAMERA_FOLLOW_SPEED;

  constructor(scene: Scene) {
    this.scene = scene;
    this.camera = this.createCamera();
    this.setupZoomControls();
  }

  private createCamera(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'gameCamera',
      GAME_CONFIG.CAMERA_ALPHA,
      GAME_CONFIG.CAMERA_BETA,
      GAME_CONFIG.CAMERA_DISTANCE,
      Vector3.Zero(),
      this.scene
    );

    // Lock rotation for isometric view
    camera.lowerAlphaLimit = GAME_CONFIG.CAMERA_ALPHA;
    camera.upperAlphaLimit = GAME_CONFIG.CAMERA_ALPHA;
    camera.lowerBetaLimit = GAME_CONFIG.CAMERA_BETA;
    camera.upperBetaLimit = GAME_CONFIG.CAMERA_BETA;

    // Zoom limits
    camera.lowerRadiusLimit = GAME_CONFIG.CAMERA_MIN_ZOOM;
    camera.upperRadiusLimit = GAME_CONFIG.CAMERA_MAX_ZOOM;
    camera.wheelPrecision = 20;

    // Disable default controls except zoom
    camera.panningSensibility = 0;
    camera.angularSensibilityX = 0;
    camera.angularSensibilityY = 0;

    // Attach to canvas but with limited controls
    camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);

    return camera;
  }

  private setupZoomControls(): void {
    // Zoom is handled by the camera's wheel controls
    // Additional zoom with +/- keys
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === 1) {
        // KEYDOWN
        const key = kbInfo.event.key;
        if (key === '+' || key === '=') {
          this.zoom(-2);
        } else if (key === '-' || key === '_') {
          this.zoom(2);
        }
      }
    });
  }

  setTarget(target: TransformNode): void {
    this.target = target;
    this.targetPosition = target.position.clone();
    this.camera.setTarget(this.targetPosition);
  }

  update(_deltaTime: number): void {
    if (!this.target) return;

    // Smooth follow
    const targetPos = this.target.position;
    this.targetPosition = Vector3.Lerp(
      this.targetPosition,
      targetPos,
      this.followSpeed
    );

    this.camera.setTarget(this.targetPosition);
  }

  zoom(amount: number): void {
    const newRadius = Scalar.Clamp(
      this.camera.radius + amount,
      GAME_CONFIG.CAMERA_MIN_ZOOM,
      GAME_CONFIG.CAMERA_MAX_ZOOM
    );

    // Animate zoom
    const animation = new Animation(
      'zoomAnim',
      'radius',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const ease = new QuadraticEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(ease);

    animation.setKeys([
      { frame: 0, value: this.camera.radius },
      { frame: 15, value: newRadius },
    ]);

    this.camera.animations = [animation];
    this.scene.beginAnimation(this.camera, 0, 15, false);
  }

  zoomTo(distance: number, duration: number = 500): void {
    const targetRadius = Scalar.Clamp(
      distance,
      GAME_CONFIG.CAMERA_MIN_ZOOM,
      GAME_CONFIG.CAMERA_MAX_ZOOM
    );

    const animation = new Animation(
      'zoomToAnim',
      'radius',
      60,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const ease = new QuadraticEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
    animation.setEasingFunction(ease);

    const frames = Math.round((duration / 1000) * 60);
    animation.setKeys([
      { frame: 0, value: this.camera.radius },
      { frame: frames, value: targetRadius },
    ]);

    this.camera.animations = [animation];
    this.scene.beginAnimation(this.camera, 0, frames, false);
  }

  setFollowSpeed(speed: number): void {
    this.followSpeed = Scalar.Clamp(speed, 0.01, 1);
  }

  getCamera(): ArcRotateCamera {
    return this.camera;
  }

  getPosition(): Vector3 {
    return this.camera.position.clone();
  }

  getTarget(): Vector3 {
    return this.targetPosition.clone();
  }

  screenToWorld(screenX: number, screenY: number): Vector3 | null {
    const pickResult = this.scene.pick(screenX, screenY);
    if (pickResult?.hit && pickResult.pickedPoint) {
      return pickResult.pickedPoint;
    }
    return null;
  }

  dispose(): void {
    this.camera.dispose();
  }
}
