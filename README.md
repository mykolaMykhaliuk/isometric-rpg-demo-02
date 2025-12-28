# Isometric RPG Shooter

A procedurally generated isometric RPG shooter built with Phaser 3 and TypeScript, featuring dual weapon system, building interiors, dynamic difficulty scaling, and **full mobile support**.

## Features

- 🎮 **Cross-Platform Controls**: Play on desktop (keyboard + mouse) or mobile devices (touch controls)
- 🗺️ Procedurally generated isometric city map (40x40 tiles)
- ⚔️ Dual weapon system: Gun (ranged) and Sword (melee)
- 🏢 Multiple building interiors to explore
- 👾 Dynamic enemy spawning with difficulty scaling
- 📱 **Mobile-Optimized UI** with virtual joystick and touch buttons
- 🌐 Responsive design that works in portrait and landscape modes

## Controls

### Desktop
- **Movement**: WASD or Arrow Keys
- **Aim**: Mouse cursor
- **Attack**: Left Mouse Button (hold for continuous fire)
- **Weapon Switch**: Number keys (1, 2) or Mouse Wheel
- **Interact**: E key (enter/exit buildings)

### Mobile / Touch Devices
- **Movement**: Virtual joystick (bottom-left)
- **Attack**: Fire button (bottom-right, red ⚔️)
- **Aim**: Automatically aims in movement direction during attack
- **Weapon Switch**: Cycle button (right side, blue 🔄)
- **Interact**: E button (appears when near doors, center-bottom, green)

## Mobile Features

The game automatically detects mobile devices and displays touch controls:

1. **Virtual Joystick**: Drag to move your character in any direction
2. **Attack Button**: Tap and hold to fire/slash at enemies
3. **Weapon Switch Button**: Tap to toggle between Gun and Sword
4. **Interact Button**: Appears when you're near building doors or exits
5. **Responsive Layout**: Controls reposition based on screen size and orientation

### Mobile Optimizations
- Multi-touch support (up to 3 simultaneous touches)
- Prevents accidental zoom and text selection
- Full-screen support on iOS and Android
- Optimized for both portrait and landscape orientations
- Touch-friendly UI with large hit areas

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Opens at http://localhost:3000 with hot reload

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Testing on Mobile

### Local Network Testing
1. Start the dev server: `npm run dev`
2. Find your local IP address (e.g., 192.168.1.100)
3. Open `http://[YOUR_IP]:3000` on your mobile device
4. Both devices must be on the same network

### Deploy Testing
Deploy the built files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## Technology Stack

- **Phaser 3**: Game framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Custom Components**: Virtual joystick and touch controls

## Architecture

- **Scene Management**: Multi-scene architecture (Boot, City, Building, UI, Conversation)
- **Event-Driven**: Scenes communicate via Phaser's event system
- **Strategy Pattern**: Weapon system with pluggable behaviors
- **Isometric Rendering**: Custom coordinate conversion utilities
- **Mobile Detection**: Automatic device detection and control adaptation

## Game Mechanics

### Weapons
- **Gun**: 20 damage, 200ms cooldown, 30 max ammo
- **Sword**: 35 damage, 400ms cooldown, unlimited use

### Difficulty Scaling
- Score-based difficulty (every 50 points = 1 level)
- Max enemies: 10 + (level × 2), capped at 30
- Spawn rate increases with difficulty

### Building System
- Portfolio buildings (green doors): Safe exploration zones
- Battle Arena (red door): Intense combat challenges
- Persistent player stats across building transitions

## Browser Compatibility

- Chrome/Edge (desktop & mobile) ✅
- Safari (iOS & macOS) ✅
- Firefox (desktop & mobile) ✅
- Samsung Internet ✅

## License

This project is open source and available under the MIT License.