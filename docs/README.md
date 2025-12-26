# Documentation Index

Welcome to the isometric RPG shooter documentation. This folder contains comprehensive technical documentation with Mermaid diagrams visualizing the game architecture.

## Documentation Files

### [architecture.md](./architecture.md)
Global system architecture and high-level design patterns.

**Contains:**
- System Overview diagram
- Scene Flow state machine
- Scene Communication sequence diagrams
- Weapon System class diagram
- Entity Relationships
- Difficulty Scaling flowchart
- Isometric Coordinate System
- Player Input state machine
- Game Loop sequence
- Collision Detection flow

**Use this for:** Understanding how all systems fit together, scene management, and core game loops.

---

### [data-flow.md](./data-flow.md)
Data flow patterns and state management across scenes and systems.

**Contains:**
- Scene State Management (enter/exit buildings)
- Score & Difficulty propagation
- Weapon Switching data flow
- Auto-Weapon Switch logic
- Ammo System flow
- Event Propagation map
- Critical State Transitions

**Use this for:** Understanding how data moves through the system, state persistence, and event-driven updates.

---

### [technical-reference.md](./technical-reference.md)
Low-level implementation details, APIs, and performance considerations.

**Contains:**
- Weapon System API reference
- Coordinate System formulas and math
- Depth Sorting algorithm
- Collision System architecture
- Enemy AI state machine
- Event System reference table
- Difficulty Scaling formulas
- Performance patterns (object pooling)
- Critical implementation notes with code examples

**Use this for:** Implementation details, debugging, performance optimization, and understanding critical patterns.

---

## Quick Navigation

### Understanding the Game Architecture
1. Start with [architecture.md](./architecture.md) - System Overview
2. Review Scene Flow diagram
3. Study Weapon System class diagram

### Implementing Features
1. Check [technical-reference.md](./technical-reference.md) for API reference
2. Review relevant diagrams in [architecture.md](./architecture.md)
3. Follow data flow patterns in [data-flow.md](./data-flow.md)

### Debugging Issues
1. Check [data-flow.md](./data-flow.md) for state transitions
2. Review Event Propagation map
3. Read Critical Implementation Notes in [technical-reference.md](./technical-reference.md)

### Adding Weapons/Entities
1. Study Weapon System API in [technical-reference.md](./technical-reference.md)
2. Review Weapon System class diagram in [architecture.md](./architecture.md)
3. Follow Weapon Switching data flow in [data-flow.md](./data-flow.md)

## Viewing Mermaid Diagrams

All diagrams use Mermaid syntax and can be viewed in:
- **GitHub/GitLab:** Renders automatically in markdown preview
- **VS Code:** Install "Markdown Preview Mermaid Support" extension
- **Online:** Copy code blocks to [mermaid.live](https://mermaid.live)

## Key Architectural Patterns

### Strategy Pattern (Weapons)
Weapons implement `IWeapon` interface, allowing runtime switching without changing Player code.

### Event-Driven Architecture
Scenes communicate via Phaser events, maintaining loose coupling:
- Game scenes emit player/enemy events
- UIScene consumes and displays
- UIScene broadcasts difficulty updates back

### Object Pooling (Gun Bullets)
Bullets are pooled for performance (max 50), recycled on deactivation.

### State Preservation Pattern
Scene transitions use data passing for state (entering buildings) but reset on exits.

## Common Workflows

### Adding a New Weapon
1. Create class implementing `IWeapon`
2. Add to `WeaponManager` constructor
3. Create weapon icon in `BootScene`
4. Add to `WeaponType` enum
5. Update UI switch cases

### Adding a New Scene
1. Extend `Phaser.Scene`
2. Add to scene array in `main.ts`
3. Expose `enemies` group via getter (if enemies present)
4. Set up event listeners for player/weapon events
5. Handle scene transitions with data passing

### Modifying Difficulty Scaling
1. Update formulas in `CityScene.updateDifficultyBasedOnScore()`
2. Update formulas in `BuildingScene.spawnInteriorEnemies()`
3. Score threshold is `floor(score / 50)` - change denominator to adjust

### Adding New Enemy Types
1. Create class extending `Enemy` or create new class
2. Update spawn methods in scenes
3. Add sprite generation in `BootScene`
4. Ensure `isEnemyDying()` flag pattern is implemented

## Architecture Principles

1. **Loose Coupling:** Scenes communicate via events, not direct references
2. **Single Responsibility:** Each class has one clear purpose
3. **Isometric Consistency:** All entities use Y-based depth sorting
4. **State Immutability:** Scene data is passed, not shared
5. **Guard Clauses:** All collision/damage handlers check validity first

## Performance Guidelines

- Use object pooling for frequently created/destroyed objects
- Update depths only when necessary (bullets move, static entities don't)
- Use event listeners for cross-scene communication (avoid polling)
- Limit particle effects to short lifespans (100-300ms typical)
- Cap enemy counts (max 30 in city, 10 in buildings)

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main development guide for Claude Code instances
- [package.json](../package.json) - Build commands and dependencies
- [tsconfig.json](../tsconfig.json) - TypeScript configuration
