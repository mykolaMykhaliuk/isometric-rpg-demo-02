import { Scene, Vector2, Vector3, PointerEventTypes, KeyboardEventTypes } from '@babylonjs/core';

/**
 * Centralized input management system
 */
export class InputManager {
  private static instance: InputManager;
  private scene: Scene | null = null;

  // Keyboard state
  private keysDown: Set<string> = new Set();
  private keysPressed: Set<string> = new Set();
  private keysReleased: Set<string> = new Set();

  // Mouse state
  private mousePosition: Vector2 = new Vector2(0, 0);
  private worldMousePosition: Vector3 = new Vector3(0, 0, 0);
  private mouseButtonsDown: Set<number> = new Set();
  private mouseButtonsPressed: Set<number> = new Set();
  private mouseButtonsReleased: Set<number> = new Set();
  private mouseWheelDelta: number = 0;

  // Pointer lock
  private isPointerLocked: boolean = false;

  private constructor() {}

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  initialize(scene: Scene): void {
    this.scene = scene;
    this.setupKeyboardInput();
    this.setupMouseInput();
  }

  private setupKeyboardInput(): void {
    if (!this.scene) return;

    this.scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toUpperCase();

      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          if (!this.keysDown.has(key)) {
            this.keysPressed.add(key);
          }
          this.keysDown.add(key);
          break;
        case KeyboardEventTypes.KEYUP:
          this.keysDown.delete(key);
          this.keysReleased.add(key);
          break;
      }
    });
  }

  private setupMouseInput(): void {
    if (!this.scene) return;

    this.scene.onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          {
            const button = pointerInfo.event.button;
            if (!this.mouseButtonsDown.has(button)) {
              this.mouseButtonsPressed.add(button);
            }
            this.mouseButtonsDown.add(button);
          }
          break;
        case PointerEventTypes.POINTERUP:
          {
            const button = pointerInfo.event.button;
            this.mouseButtonsDown.delete(button);
            this.mouseButtonsReleased.add(button);
          }
          break;
        case PointerEventTypes.POINTERMOVE:
          this.mousePosition.x = pointerInfo.event.clientX;
          this.mousePosition.y = pointerInfo.event.clientY;

          // Calculate world position using picking
          if (pointerInfo.pickInfo?.pickedPoint) {
            this.worldMousePosition = pointerInfo.pickInfo.pickedPoint.clone();
          }
          break;
        case PointerEventTypes.POINTERWHEEL:
          {
            const wheelEvent = pointerInfo.event as WheelEvent;
            this.mouseWheelDelta = wheelEvent.deltaY;
          }
          break;
      }
    });

    // Pointer lock events
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  /**
   * Clear per-frame input states (call at end of update)
   */
  update(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouseButtonsPressed.clear();
    this.mouseButtonsReleased.clear();
    this.mouseWheelDelta = 0;
  }

  // Keyboard queries
  isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toUpperCase());
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toUpperCase());
  }

  isKeyReleased(key: string): boolean {
    return this.keysReleased.has(key.toUpperCase());
  }

  // Movement helpers
  getMovementVector(): Vector3 {
    let x = 0;
    let z = 0;

    if (this.isKeyDown('W') || this.isKeyDown('ARROWUP')) z = 1;
    if (this.isKeyDown('S') || this.isKeyDown('ARROWDOWN')) z = -1;
    if (this.isKeyDown('A') || this.isKeyDown('ARROWLEFT')) x = -1;
    if (this.isKeyDown('D') || this.isKeyDown('ARROWRIGHT')) x = 1;

    const vec = new Vector3(x, 0, z);
    if (vec.length() > 0) {
      vec.normalize();
    }
    return vec;
  }

  // Mouse queries
  isMouseButtonDown(button: number = 0): boolean {
    return this.mouseButtonsDown.has(button);
  }

  isMouseButtonPressed(button: number = 0): boolean {
    return this.mouseButtonsPressed.has(button);
  }

  isMouseButtonReleased(button: number = 0): boolean {
    return this.mouseButtonsReleased.has(button);
  }

  getMousePosition(): Vector2 {
    return this.mousePosition.clone();
  }

  getWorldMousePosition(): Vector3 {
    return this.worldMousePosition.clone();
  }

  getMouseWheelDelta(): number {
    return this.mouseWheelDelta;
  }

  // Pointer lock
  requestPointerLock(): void {
    const canvas = this.scene?.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.requestPointerLock();
    }
  }

  exitPointerLock(): void {
    document.exitPointerLock();
  }

  getIsPointerLocked(): boolean {
    return this.isPointerLocked;
  }

  // Cleanup
  dispose(): void {
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouseButtonsDown.clear();
    this.mouseButtonsPressed.clear();
    this.mouseButtonsReleased.clear();
  }
}
