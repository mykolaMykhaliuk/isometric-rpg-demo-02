# Codebase Map

Complete visual map of the entire codebase showing all files and their relationships.

## Complete System Dependency Graph

```mermaid
graph TB
    subgraph "Entry Point"
        Main[main.ts<br/>Phaser.Game config<br/>Scene registration]
    end

    subgraph "Scenes"
        Boot[BootScene.ts<br/>Asset generation<br/>700+ lines]
        City[CityScene.ts<br/>Main gameplay<br/>460+ lines]
        Bldg[BuildingScene.ts<br/>Interior gameplay<br/>340+ lines]
        UI[UIScene.ts<br/>HUD & UI<br/>350+ lines]
    end

    subgraph "Entities"
        Player[Player.ts<br/>Player + Weapon system<br/>290+ lines]
        Enemy[Enemy.ts<br/>AI enemy<br/>195+ lines]
        Ammo[Ammo.ts<br/>Pickup entity<br/>115+ lines]
    end

    subgraph "Weapon System"
        IWeapon[IWeapon.ts<br/>Interface + Enum<br/>25 lines]
        Gun[Gun.ts<br/>Ranged weapon<br/>145+ lines]
        Sword[Sword.ts<br/>Melee weapon<br/>205+ lines]
        WMgr[WeaponManager.ts<br/>Inventory manager<br/>45 lines]
    end

    subgraph "Utilities"
        Utils[IsometricUtils.ts<br/>Coordinate conversion<br/>35 lines]
    end

    Main --> Boot
    Main --> City
    Main --> Bldg
    Main --> UI

    Boot --> City
    Boot --> UI

    City --> Player
    City --> Enemy
    City --> Ammo
    City --> Utils

    Bldg --> Player
    Bldg --> Enemy
    Bldg --> Utils

    Player --> WMgr
    Player --> IWeapon
    WMgr --> IWeapon
    WMgr --> Gun
    WMgr --> Sword
    Gun --> IWeapon
    Sword --> IWeapon

    UI -.events.-> City
    UI -.events.-> Bldg
    City -.events.-> UI
    Bldg -.events.-> UI

    style Main fill:#e1f5fe
    style Boot fill:#fff3e0
    style City fill:#fff9c4
    style Bldg fill:#fff9c4
    style UI fill:#c5e1a5
    style Player fill:#e1bee7
    style IWeapon fill:#ffccbc
```

## File Responsibility Matrix

```mermaid
graph LR
    subgraph "Rendering"
        R1[BootScene<br/>Generate all sprites]
        R2[Scenes<br/>Isometric rendering]
        R3[Utils<br/>Coordinate transforms]
    end

    subgraph "Game Logic"
        L1[Player<br/>Movement + attack]
        L2[Enemy<br/>AI + behavior]
        L3[Weapons<br/>Attack logic]
    end

    subgraph "State Management"
        S1[UIScene<br/>Score + difficulty]
        S2[Scenes<br/>Scene transitions]
        S3[WeaponManager<br/>Weapon inventory]
    end

    subgraph "Physics"
        P1[Player/Enemy<br/>Arcade physics]
        P2[Gun<br/>Bullet pool]
        P3[Sword<br/>Geometry math]
    end

    style R1 fill:#e1f5fe
    style L1 fill:#fff9c4
    style S1 fill:#c5e1a5
    style P1 fill:#ffccbc
```

## Module Import Graph

```mermaid
graph TD
    subgraph "External Dependencies"
        Phaser[phaser<br/>Game engine]
    end

    subgraph "Core Modules"
        Main[main.ts]
        Utils[IsometricUtils.ts]
        IWeapon[IWeapon.ts]
    end

    subgraph "Scene Modules"
        Boot[BootScene.ts]
        City[CityScene.ts]
        Bldg[BuildingScene.ts]
        UI[UIScene.ts]
    end

    subgraph "Entity Modules"
        Player[Player.ts]
        Enemy[Enemy.ts]
        Ammo[Ammo.ts]
    end

    subgraph "Weapon Modules"
        Gun[Gun.ts]
        Sword[Sword.ts]
        WMgr[WeaponManager.ts]
    end

    Phaser --> Main
    Phaser --> Boot
    Phaser --> City
    Phaser --> Bldg
    Phaser --> UI
    Phaser --> Player
    Phaser --> Enemy
    Phaser --> Ammo
    Phaser --> Gun
    Phaser --> Sword

    Main --> Boot
    Main --> City
    Main --> Bldg
    Main --> UI

    Boot --> Utils

    City --> Player
    City --> Enemy
    City --> Ammo
    City --> Utils

    Bldg --> Player
    Bldg --> Enemy
    Bldg --> Utils

    UI --> IWeapon

    Player --> WMgr
    Player --> IWeapon

    WMgr --> Gun
    WMgr --> Sword
    WMgr --> IWeapon

    Gun --> IWeapon
    Gun --> Player

    Sword --> IWeapon
    Sword --> Player
    Sword --> Enemy

    style Phaser fill:#e1f5fe
    style IWeapon fill:#ffccbc
    style Utils fill:#c5e1a5
```

## Event Communication Map

```mermaid
graph TB
    subgraph "Event Emitters"
        P[Player]
        E[Enemy]
        G[Gun]
        S[Sword]
    end

    subgraph "Event Relays"
        C[CityScene]
        B[BuildingScene]
    end

    subgraph "Event Consumers & Broadcasters"
        U[UIScene]
    end

    P -->|healthChanged| C
    P -->|healthChanged| B
    P -->|weaponChanged| C
    P -->|weaponChanged| B
    P -->|weaponAutoSwitch| C
    P -->|weaponAutoSwitch| B
    P -->|playerDied| C
    P -->|playerDied| B

    G -->|ammoChanged| C
    G -->|ammoChanged| B

    E -->|enemyKilled| C
    E -->|enemyKilled| B

    C -->|forward all| U
    B -->|forward all| U

    U -->|scoreUpdated| C
    U -->|scoreUpdated| B

    style P fill:#e1bee7
    style E fill:#ffccbc
    style U fill:#c5e1a5
```

## Data Flow Layers

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[UIScene<br/>Display only<br/>No game logic]
    end

    subgraph "Game Logic Layer"
        City[CityScene]
        Bldg[BuildingScene]
        Player[Player]
        Enemy[Enemy]
        Weapons[Gun/Sword]
    end

    subgraph "System Layer"
        WMgr[WeaponManager<br/>Weapon switching]
        Difficulty[Difficulty Scaling<br/>In scenes]
    end

    subgraph "Utility Layer"
        Utils[IsometricUtils<br/>Pure functions]
        Physics[Phaser Physics<br/>Engine]
    end

    UI -.listens.-> City
    UI -.listens.-> Bldg
    UI -.broadcasts.-> City
    UI -.broadcasts.-> Bldg

    City --> Player
    City --> Enemy
    Bldg --> Player
    Bldg --> Enemy

    Player --> WMgr
    WMgr --> Weapons
    Weapons --> Enemy

    City --> Difficulty
    Bldg --> Difficulty

    City --> Utils
    Bldg --> Utils
    Player --> Physics
    Enemy --> Physics
    Weapons --> Physics

    style UI fill:#c5e1a5
    style WMgr fill:#ffccbc
    style Utils fill:#e1f5fe
```

## Scene Ownership & Lifecycle

```mermaid
graph TD
    subgraph "BootScene Lifecycle"
        B1[preload] --> B2[create]
        B2 --> B3[Generate all sprites]
        B3 --> B4[scene.start CityScene]
        B4 --> B5[scene.launch UIScene]
        B5 --> B6[BootScene ends]
    end

    subgraph "CityScene Ownership"
        C1[Owns: player, enemies, ammo, doors]
        C1 --> C2[Creates: buildings, roads, water]
        C2 --> C3[Manages: enemy spawning, difficulty]
        C3 --> C4[Transitions: to BuildingScene with state]
    end

    subgraph "BuildingScene Ownership"
        BL1[Owns: player, enemies, walls]
        BL1 --> BL2[Creates: interior layout]
        BL2 --> BL3[Restores: player state from data]
        BL3 --> BL4[Transitions: to CityScene without state]
    end

    subgraph "UIScene Ownership"
        U1[Owns: score, UI elements]
        U1 --> U2[Manages: difficulty broadcasting]
        U2 --> U3[Persists: across all scenes]
        U3 --> U4[Never stops until game over]
    end

    B6 --> C1
    B6 --> U1
    C4 --> BL1
    BL4 --> C1

    style B6 fill:#e1f5fe
    style C4 fill:#fff3e0
    style BL4 fill:#ffcdd2
```

## Class Hierarchy

```mermaid
classDiagram
    class PhaserScene {
        <<Phaser>>
        +events
        +physics
        +add
        +time
    }

    class PhaserSprite {
        <<Phaser>>
        +x, y
        +setDepth()
        +setVelocity()
    }

    class BootScene {
        +create()
        -createIsometricTiles()
        -createPlayerSprite()
        -createEnemySprite()
        -createWeaponIcons()
    }

    class CityScene {
        -player: Player
        -enemies: Group
        -doors: DoorData[]
        +create()
        +update()
        -spawnEnemy()
        -updateDifficulty()
        +getEnemies()
    }

    class BuildingScene {
        -player: Player
        -enemies: Group
        -wallBodies: Group
        +init()
        +create()
        -spawnInteriorEnemies()
        +getEnemies()
    }

    class UIScene {
        -score: number
        -weaponIcon: Image
        +create()
        -updateScore()
        -updateWeaponDisplay()
        +getScore()
    }

    class Player {
        -weaponManager: WeaponManager
        -currentWeapon: IWeapon
        +update()
        +switchWeapon()
        -handleAttack()
        -handleMovement()
    }

    class Enemy {
        -health: number
        -isDying: boolean
        +update()
        +takeDamage()
        -die()
        -chasePlayer()
        -wander()
    }

    class Ammo {
        -ammoAmount: number
        +update()
        -pickup()
    }

    class IWeapon {
        <<interface>>
        +attack()
        +canAttack()
        +hasAmmo()
    }

    class Gun {
        -bullets: Group
        -ammo: number
        +attack()
        +getBullets()
    }

    class Sword {
        -range: number
        -arcAngle: number
        +attack()
        -detectEnemiesInArc()
    }

    class WeaponManager {
        -weapons: Map
        -currentWeapon: IWeapon
        +getWeapon()
        +setCurrentWeapon()
    }

    PhaserScene <|-- BootScene
    PhaserScene <|-- CityScene
    PhaserScene <|-- BuildingScene
    PhaserScene <|-- UIScene

    PhaserSprite <|-- Player
    PhaserSprite <|-- Enemy
    PhaserSprite <|-- Ammo

    IWeapon <|.. Gun
    IWeapon <|.. Sword

    Player --> WeaponManager
    Player --> IWeapon
    WeaponManager --> IWeapon
    WeaponManager --> Gun
    WeaponManager --> Sword

    CityScene --> Player
    CityScene --> Enemy
    CityScene --> Ammo

    BuildingScene --> Player
    BuildingScene --> Enemy
```

## File Size & Complexity

```mermaid
graph LR
    subgraph "Large Files >200 lines"
        L1[BootScene: 768 lines<br/>Asset generation]
        L2[CityScene: 460 lines<br/>Main game logic]
        L3[BuildingScene: 340 lines<br/>Interior logic]
        L4[UIScene: 350 lines<br/>UI management]
        L5[Player: 290 lines<br/>Player logic]
        L6[Sword: 205 lines<br/>Melee weapon]
        L7[Enemy: 195 lines<br/>AI logic]
        L8[Gun: 145 lines<br/>Ranged weapon]
    end

    subgraph "Medium Files 50-200 lines"
        M1[Ammo: 115 lines]
    end

    subgraph "Small Files <50 lines"
        S1[WeaponManager: 45 lines]
        S2[IsometricUtils: 35 lines]
        S3[IWeapon: 25 lines]
        S4[main.ts: 25 lines]
    end

    style L1 fill:#ffcdd2
    style M1 fill:#fff9c4
    style S1 fill:#c5e1a5
```

## Testing Points

```mermaid
mindmap
  root((Codebase))
    Scenes
      Boot asset generation
      City spawning
      Building enemy count
      UI score tracking
    Weapons
      Gun ammo consumption
      Sword arc detection
      Weapon switching
      Auto-switch logic
    Entities
      Player movement
      Player weapon use
      Enemy AI states
      Ammo pickup
    Systems
      Event propagation
      Difficulty scaling
      State persistence
      Collision detection
    Utilities
      Coordinate conversion
      Depth sorting
```

## Critical Dependencies

```
TypeScript → Compilation
Phaser 3 → Game engine
  ├── Arcade Physics → Collision
  ├── Scene Management → Lifecycle
  ├── Events → Communication
  └── Graphics → Sprite generation

Vite → Build system
  └── Dev server → Hot reload
```
