# Mobile Browser Controls Implementation Plan

## Overview

Add touch controls for mobile browsers: virtual joystick for movement, attack button, weapon switching, and building interaction.

## Current State

- **Movement**: WASD/Arrow keys only (Player.ts:81-106)
- **Attack**: Mouse click/hold (Player.ts:159-178)
- **Weapon Switch**: Number keys 1/2 or mouse wheel (Player.ts:57-73)
- **Building Entry/Exit**: E key (CityScene.ts:579-633, BuildingScene.ts:657-659)
- **No mobile support exists**

## Implementation Steps

### Step 1: Create Virtual Joystick Component

Create `src/ui/VirtualJoystick.ts`:

```typescript
// Core features:
- Circular base (80px radius) positioned bottom-left
- Draggable thumb stick
- Returns normalized x/y values (-1 to 1)
- Touch tracking with pointer ID
- Visual feedback (opacity changes on touch)
- Only visible on touch devices
```

**Key implementation:**
- Use Phaser Graphics for base circle and thumb
- Track pointer via `pointerdown`, `pointermove`, `pointerup`
- Calculate angle and distance from center
- Clamp to radius and normalize output

### Step 2: Create Mobile Control Buttons

Create `src/ui/MobileControls.ts`:

```typescript
// Button types needed:
1. AttackButton - Right side, large circular button for shooting
2. WeaponSwitchButtons - Two small buttons (Gun/Sword icons)
3. InteractButton - Contextual "E" button, shows near doors
```

**Button specifications:**
- Attack: 70px circle, bottom-right, supports hold for continuous fire
- Weapon 1/2: 50px each, right side above attack, show active state
- Interact: 60px, appears dynamically near interactive elements

### Step 3: Add Mobile & Orientation Detection

In `src/main.ts` or create `src/utils/DeviceUtils.ts`:

```typescript
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window)
    || (navigator.maxTouchPoints > 0);
}

export function isPortraitOrientation(): boolean {
  return window.innerHeight > window.innerWidth;
}
```

Update Phaser config:
```typescript
input: {
  activePointers: 3, // Support multiple simultaneous touches
}
```

**Handle orientation changes in UIScene:**
```typescript
// Listen for resize events to reposition controls
this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
  this.repositionMobileControls(gameSize.width, gameSize.height);
});
```

### Step 4: Integrate Joystick into Player Movement

Modify `src/entities/Player.ts`:

**In constructor (~line 50):**
```typescript
// Store reference to mobile controls (passed from scene or UIScene)
this.mobileControls = scene.registry.get('mobileControls');
```

**In handleMovement() (lines 81-106):**
```typescript
// Check keyboard input (existing code)
let moveX = 0, moveY = 0;

// Add joystick input
if (this.mobileControls?.joystick) {
  const joystickValue = this.mobileControls.joystick.getValue();
  moveX += joystickValue.x;
  moveY += joystickValue.y;
}

// Existing keyboard logic (combine with joystick)
if (cursors.left.isDown || keys.A.isDown) moveX -= 1;
if (cursors.right.isDown || keys.D.isDown) moveX += 1;
// ... etc

// Normalize combined input
const length = Math.sqrt(moveX * moveX + moveY * moveY);
if (length > 1) {
  moveX /= length;
  moveY /= length;
}
```

### Step 5: Integrate Attack Button

Modify `src/entities/Player.ts` handleAttack() (lines 159-178):

```typescript
// Check both mouse AND attack button
const isAttacking = this.scene.input.activePointer.isDown
  || this.mobileControls?.attackButton?.isPressed();

if (isAttacking && this.currentWeapon) {
  // For mobile: use attack button position or player facing direction
  const aimPointer = this.mobileControls?.getAimPosition()
    || this.scene.input.activePointer;
  this.currentWeapon.attack(time, aimPointer, this);
}
```

### Step 6: Add Weapon Switch Buttons to UIScene

Modify `src/scenes/UIScene.ts`:

**In create() method:**
```typescript
if (isMobileDevice()) {
  this.createMobileControls();
}
```

**New method createMobileControls():**
```typescript
private createMobileControls(): void {
  const { width, height } = this.cameras.main;

  // Create controls (initial positions will be set by repositionMobileControls)
  this.joystick = new VirtualJoystick(this, 0, 0, 80);
  this.attackButton = new MobileButton(this, 0, 0, 70, 'attack');
  this.gunButton = new MobileButton(this, 0, 0, 50, 'gun');
  this.swordButton = new MobileButton(this, 0, 0, 50, 'sword');
  this.interactButton = new MobileButton(this, 0, 0, 60, 'interact');
  this.interactButton.setVisible(false);

  // Position controls based on current orientation
  this.repositionMobileControls(width, height);

  // Store in registry for Player access
  this.registry.set('mobileControls', {
    joystick: this.joystick,
    attackButton: this.attackButton,
    interactButton: this.interactButton
  });

  // Button event handlers
  this.gunButton.on('pressed', () => this.emitWeaponSwitch(WeaponType.GUN));
  this.swordButton.on('pressed', () => this.emitWeaponSwitch(WeaponType.SWORD));
  this.interactButton.on('pressed', () => this.emitInteract());
}

private repositionMobileControls(width: number, height: number): void {
  const isPortrait = height > width;

  if (isPortrait) {
    // PORTRAIT: Both controls centered at bottom
    const centerX = width / 2;
    const controlSpacing = 100; // Space between joystick and attack button

    // Joystick - bottom center-left
    this.joystick.setPosition(centerX - controlSpacing, height - 120);

    // Attack button - bottom center-right
    this.attackButton.setPosition(centerX + controlSpacing, height - 120);

    // Weapon buttons - centered above controls
    this.gunButton.setPosition(centerX - 40, height - 220);
    this.swordButton.setPosition(centerX + 40, height - 220);

    // Interact button - centered above joystick/attack
    this.interactButton.setPosition(centerX, height - 300);
  } else {
    // LANDSCAPE: Controls in corners (original layout)
    // Joystick - bottom left
    this.joystick.setPosition(120, height - 120);

    // Attack button - bottom right
    this.attackButton.setPosition(width - 100, height - 120);

    // Weapon buttons - right side above attack
    this.gunButton.setPosition(width - 140, height - 220);
    this.swordButton.setPosition(width - 60, height - 220);

    // Interact button - center
    this.interactButton.setPosition(width / 2, height - 100);
  }
}
```

### Step 7: Add Contextual Interact Button

Modify `src/scenes/CityScene.ts` and `src/scenes/BuildingScene.ts`:

**In update() method, add door proximity check:**
```typescript
// Check if near door
const nearDoor = this.isPlayerNearDoor();
if (nearDoor && isMobileDevice()) {
  this.events.emit('showInteractButton', true);
} else {
  this.events.emit('showInteractButton', false);
}
```

**UIScene listens for this event:**
```typescript
gameScene.events.on('showInteractButton', (show: boolean) => {
  this.interactButton?.setVisible(show);
});
```

### Step 8: Handle Multi-touch

Ensure controls don't interfere:
- Joystick uses its own pointer ID
- Attack button uses separate pointer
- Track `pointerId` in each control component

### Step 9: Visual Polish

- Semi-transparent controls (alpha: 0.6)
- Increase opacity on press (alpha: 0.9)
- Add subtle pulsing animation on interact button
- Safe area padding for notched devices (CSS env variables or Phaser margins)

## File Changes Summary

| File | Changes |
|------|---------|
| `src/ui/VirtualJoystick.ts` | **New file** - Joystick component |
| `src/ui/MobileButton.ts` | **New file** - Reusable button component |
| `src/ui/MobileControls.ts` | **New file** - Control container/manager |
| `src/utils/DeviceUtils.ts` | **New file** - Mobile detection |
| `src/entities/Player.ts` | Add joystick + button input handling |
| `src/scenes/UIScene.ts` | Create and manage mobile controls |
| `src/scenes/CityScene.ts` | Emit door proximity events |
| `src/scenes/BuildingScene.ts` | Emit exit proximity events |
| `src/main.ts` | Update input config for multi-touch |

## Control Layout Diagrams

### Landscape Mode (width > height)

```
┌─────────────────────────────────────┐
│  [HP Bar]              [Score: 0]   │
│  [Armor]                            │
│  [Ammo]              [Gun][Sword]   │
│  [Weapon]                           │
│                                     │
│                                     │
│                    [E]              │  ← Interact (when near door)
│   ┌───┐                    ┌───┐   │
│   │ ○ │                    │ ⚔ │   │  ← Joystick / Attack
│   └───┘                    └───┘   │
└─────────────────────────────────────┘
```

### Portrait Mode (height > width)

```
┌───────────────────┐
│ [HP]    [Score]   │
│ [Armor]           │
│ [Ammo] [Weapon]   │
│                   │
│                   │
│                   │
│                   │
│        [E]        │  ← Interact
│    [Gun][Sword]   │  ← Weapon buttons centered
│   ┌───┐  ┌───┐    │
│   │ ○ │  │ ⚔ │    │  ← Joystick + Attack centered
│   └───┘  └───┘    │
└───────────────────┘
```

Both joystick and attack button are positioned in the bottom center area for comfortable thumb access in portrait orientation.

## Testing Checklist

- [ ] Movement with joystick works in 8 directions
- [ ] Attack button fires weapon
- [ ] Can move AND attack simultaneously
- [ ] Weapon switch buttons work
- [ ] Interact button appears near doors
- [ ] Interact button enters/exits buildings
- [ ] Controls hidden on desktop
- [ ] Controls visible on mobile/touch devices
- [ ] Multi-touch doesn't cause conflicts
- [ ] Controls don't overlap with HUD elements
- [ ] Portrait mode: controls centered at bottom
- [ ] Landscape mode: controls in corners
- [ ] Controls reposition on orientation change
