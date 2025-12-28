# Mobile Controls Guide

This game now fully supports mobile devices with an intuitive touch control system that automatically activates when playing on smartphones or tablets.

## Features

✅ **Virtual Joystick** - Smooth 360° movement control
✅ **Touch Buttons** - Large, responsive buttons for actions
✅ **Auto-Detection** - Automatically switches between desktop and mobile controls
✅ **Multi-Touch** - Supports up to 3 simultaneous touches
✅ **Responsive Layout** - Adapts to screen size and orientation changes
✅ **Full-Screen Ready** - Works great in portrait and landscape modes

## Control Layout

### Bottom-Left: Virtual Joystick
- **Appearance**: Semi-transparent white circle with movable thumb
- **Function**: Move your character in any direction
- **Usage**: 
  - Touch and drag within the circle
  - The further you drag, the faster you move
  - Release to stop moving

### Bottom-Right Area: Action Buttons

#### Attack Button (Red ⚔️)
- **Position**: Bottom-right corner
- **Size**: 70x70 pixels
- **Function**: Fire gun or swing sword
- **Usage**: 
  - Tap and hold to attack continuously
  - Automatically aims in your last movement direction
  - Works with both Gun and Sword weapons

#### Weapon Switch Button (Blue 🔄)
- **Position**: Above attack button
- **Size**: 60x60 pixels
- **Function**: Toggle between Gun and Sword
- **Usage**: 
  - Tap once to switch weapons
  - Visual feedback shows current weapon
  - Cannot switch during active attack

### Center-Bottom: Interact Button (Green E)
- **Visibility**: Only appears when near interactive objects
- **Size**: 80x60 pixels
- **Function**: Enter/exit buildings
- **Usage**: 
  - Appears automatically when near doors
  - Tap to interact
  - Hides when not near interactive objects

## How It Works

### Movement System
1. **Desktop**: WASD/Arrow keys + mouse for aiming
2. **Mobile**: Virtual joystick for movement + automatic aiming during attack

### Aiming System
- **Desktop**: Mouse cursor position determines aim direction
- **Mobile**: Automatically aims in the direction of your last movement
  - If standing still, aims in the direction you were last facing
  - Smooth and intuitive for touch-based gameplay

### Weapon Switching
- **Desktop**: Number keys (1, 2) or mouse wheel
- **Mobile**: Touch the weapon switch button
- Visual feedback in UI shows current weapon and ammo count

### Building Interaction
- **Desktop**: Press E key when near doors
- **Mobile**: Green E button appears automatically when near doors

## Technical Details

### Mobile Detection
The game detects mobile devices using:
- Android OS detection
- iOS/iPhone/iPad detection
- Touch event support detection

### Touch Input Handling
- Uses Phaser's multi-pointer system
- Each control (joystick, buttons) tracks its own pointer ID
- Prevents touch event conflicts
- No accidental zoom or text selection

### Performance Optimizations
- Efficient rendering with scroll-free UI elements
- Minimal touch event processing overhead
- Responsive button states with visual feedback
- Smooth animations at 60 FPS

## Screen Orientation Support

### Portrait Mode
- Controls remain at bottom of screen
- Joystick: bottom-left
- Buttons: bottom-right
- Interact button: center-bottom

### Landscape Mode
- Same layout, optimized for wider screens
- Better visibility of game world
- Comfortable thumb reach for all controls

### Dynamic Resizing
The game automatically repositions controls when:
- Device orientation changes
- Browser window resizes
- Full-screen mode is toggled

## Compatibility

### Tested Browsers
- ✅ Chrome Mobile (Android)
- ✅ Safari (iOS)
- ✅ Firefox Mobile
- ✅ Samsung Internet
- ✅ Edge Mobile

### Tested Devices
- ✅ iPhone (iOS 13+)
- ✅ iPad (iOS 13+)
- ✅ Android phones (Android 8+)
- ✅ Android tablets (Android 8+)

## Tips for Mobile Players

1. **Use Two Thumbs**: One for joystick, one for attack button
2. **Movement + Attack**: You can move and attack simultaneously
3. **Weapon Selection**: Switch weapons before engaging different enemy types
4. **Full-Screen**: Enable full-screen mode for immersive gameplay
5. **Stable Surface**: Play on a stable surface for best control precision

## Troubleshooting

### Controls Not Appearing
- Ensure you're on a touch-enabled device
- Refresh the page
- Try in a different browser

### Joystick Not Responsive
- Touch directly on the joystick circle
- Make sure you're not touching multiple controls at once
- Check if other apps are interfering with touch input

### Buttons Not Working
- Ensure your touch is within the button area
- Try tapping more firmly
- Close other apps to free up system resources

### Performance Issues
- Close background apps
- Reduce browser tabs
- Ensure good network connection (if hosted remotely)
- Try in a different browser

## Future Enhancements

Potential improvements for mobile controls:
- Customizable button positions
- Button size adjustment
- Haptic feedback (vibration)
- Gesture controls (swipe to dash)
- On-screen joystick opacity settings

## Feedback

If you encounter any issues with mobile controls or have suggestions for improvements, please open an issue on the project repository.
