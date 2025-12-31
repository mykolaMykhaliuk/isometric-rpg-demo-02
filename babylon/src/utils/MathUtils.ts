import { Vector3, Scalar } from '@babylonjs/core';

/**
 * Math utility functions
 */
export class MathUtils {
  /**
   * Convert tile coordinates to world position
   */
  static tileToWorld(tileX: number, tileY: number, tileSize: number = 2): Vector3 {
    return new Vector3(tileX * tileSize, 0, tileY * tileSize);
  }

  /**
   * Convert world position to tile coordinates
   */
  static worldToTile(worldPos: Vector3, tileSize: number = 2): { x: number; y: number } {
    return {
      x: Math.floor(worldPos.x / tileSize),
      y: Math.floor(worldPos.z / tileSize),
    };
  }

  /**
   * Calculate distance between two points on XZ plane
   */
  static distanceXZ(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Get direction from point A to point B on XZ plane
   */
  static directionXZ(from: Vector3, to: Vector3): Vector3 {
    const direction = new Vector3(to.x - from.x, 0, to.z - from.z);
    if (direction.length() > 0) {
      direction.normalize();
    }
    return direction;
  }

  /**
   * Calculate angle between two points (radians)
   */
  static angleBetweenXZ(from: Vector3, to: Vector3): number {
    return Math.atan2(to.z - from.z, to.x - from.x);
  }

  /**
   * Check if angle is within arc
   */
  static isWithinArc(
    angle: number,
    centerAngle: number,
    arcWidth: number
  ): boolean {
    let diff = angle - centerAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= arcWidth / 2;
  }

  /**
   * Random point within radius
   */
  static randomPointInRadius(center: Vector3, radius: number): Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    return new Vector3(
      center.x + Math.cos(angle) * distance,
      center.y,
      center.z + Math.sin(angle) * distance
    );
  }

  /**
   * Random point in ring (between minRadius and maxRadius)
   */
  static randomPointInRing(
    center: Vector3,
    minRadius: number,
    maxRadius: number
  ): Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const distance = minRadius + Math.random() * (maxRadius - minRadius);
    return new Vector3(
      center.x + Math.cos(angle) * distance,
      center.y,
      center.z + Math.sin(angle) * distance
    );
  }

  /**
   * Lerp value with delta time
   */
  static lerpDelta(current: number, target: number, speed: number, deltaTime: number): number {
    return Scalar.Lerp(current, target, 1 - Math.pow(1 - speed, deltaTime * 60));
  }

  /**
   * Smooth damp (for smooth camera following)
   */
  static smoothDamp(
    current: number,
    target: number,
    velocity: { value: number },
    smoothTime: number,
    deltaTime: number,
    maxSpeed: number = Infinity
  ): number {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTo = target;

    const maxChange = maxSpeed * smoothTime;
    change = Scalar.Clamp(change, -maxChange, maxChange);
    const targetClamped = current - change;

    const temp = (velocity.value + omega * change) * deltaTime;
    velocity.value = (velocity.value - omega * temp) * exp;
    let output = targetClamped + (change + temp) * exp;

    if (originalTo - current > 0 === output > originalTo) {
      output = originalTo;
      velocity.value = (output - originalTo) / deltaTime;
    }

    return output;
  }

  /**
   * Wrap angle to -PI to PI
   */
  static wrapAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  /**
   * Ease functions
   */
  static easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}
