# Architecture Documentation

## System Overview

```mermaid
graph TB
    subgraph "Game Engine"
        Phaser[Phaser 3 Game Engine]
    end

    subgraph "Scene Management"
        Boot[BootScene<br/>Asset Generation]
        City[CityScene<br/>Main Overworld]
        Building[BuildingScene<br/>Building Interiors]
        UI[UIScene<br/>Persistent HUD]
    end

    subgraph "Core Systems"
        Player[Player Entity]
        WeaponMgr[WeaponManager]
        Weapons[Weapons<br/>Gun/Sword]
        Enemies[Enemy Entities]
        Difficulty[Difficulty Scaling]
    end

    Phaser --> Boot
    Boot --> City
    Boot --> UI
    City <--> Building
    City --> Player
    Building --> Player
    Player --> WeaponMgr
    WeaponMgr --> Weapons
    City --> Enemies
    Building --> Enemies
    UI --> Difficulty
    Difficulty --> City
    Difficulty --> Building

    style Boot fill:#e1f5ff
    style City fill:#fff4e1
    style Building fill:#fff4e1
    style UI fill:#e8f5e9
    style Player fill:#f3e5f5
    style WeaponMgr fill:#fce4ec
    style Weapons fill:#fce4ec
```

## Scene Flow Diagram

```mermaid
stateDiagram-v2
    [*] --> BootScene
    BootScene --> CityScene: scene.start()
    BootScene --> UIScene: scene.launch()

    state CityScene {
        [*] --> Exploring
        Exploring --> NearDoor: Player near door
        NearDoor --> Exploring: Move away
        NearDoor --> BuildingScene: Press E
    }

    state BuildingScene {
        [*] --> Fighting
        Fighting --> NearExit: Player near exit
        NearExit --> Fighting: Move away
        NearExit --> CityScene: Press E
    }

    state UIScene {
        [*] --> Displaying
        Displaying --> Displaying: Listen to events
        Displaying --> GameOver: Player dies
        GameOver --> CityScene: Press R
    }

    CityScene --> BuildingScene: Pass state:\n- health\n- ammo\n- weapon
    BuildingScene --> CityScene: Reset state

    note right of UIScene
        Runs in parallel
        Never stops
        Manages score & difficulty
    end note
```

## Scene Communication & Events

```mermaid
sequenceDiagram
    participant City as CityScene
    participant Building as BuildingScene
    participant UI as UIScene
    participant Player as Player

    Note over City,UI: Game Start
    City->>UI: Launch UIScene
    City->>Player: Create Player

    Note over City,UI: Gameplay Loop
    Player->>City: enemyKilled(10 points)
    City->>UI: emit('enemyKilled', 10)
    UI->>UI: addScore(10)
    UI->>City: emit('scoreUpdated', 10)
    UI->>Building: emit('scoreUpdated', 10)
    City->>City: updateDifficulty()

    Note over City,UI: Weapon System
    Player->>City: emit('weaponChanged', SWORD, weapon)
    City->>UI: forward event
    UI->>UI: updateWeaponDisplay()
    UI->>UI: updateAmmoDisplay()

    Note over City,Building: Scene Transition
    Player->>City: Enter building (E key)
    City->>Building: scene.start(buildingId, health, ammo, weapon)
    Building->>Player: Create Player with saved state
    Building->>UI: emit('healthChanged')
    Building->>UI: emit('ammoChanged')

    Note over Building,City: Exit Building
    Player->>Building: Exit (E key)
    Building->>City: scene.start()
    City->>Player: Create NEW Player (reset state)
```

## Weapon System Architecture

```mermaid
classDiagram
    class IWeapon {
        <<interface>>
        +attack(time, pointer, player)
        +canAttack(time) bool
        +hasAmmo() bool
        +getAmmoCount() int
        +getDamage() int
        +getWeaponType() WeaponType
        +isAttacking() bool
    }

    class Gun {
        -bullets: Group
        -ammo: 30
        -damage: 20
        -shootDelay: 200ms
        +attack()
        +getBullets() Group
    }

    class Sword {
        -damage: 35
        -range: 60px
        -arcAngle: 90°
        -swingDelay: 400ms
        +attack()
        -detectEnemiesInArc()
        -createSwingEffect()
    }

    class WeaponManager {
        -weapons: Map~WeaponType, IWeapon~
        -currentWeapon: IWeapon
        +getWeapon(type) IWeapon
        +setCurrentWeapon(type)
    }

    class Player {
        -weaponManager: WeaponManager
        -currentWeapon: IWeapon
        +switchWeapon(type)
        +handleAttack(time)
    }

    IWeapon <|.. Gun
    IWeapon <|.. Sword
    WeaponManager --> IWeapon
    WeaponManager --> Gun
    WeaponManager --> Sword
    Player --> WeaponManager
    Player --> IWeapon

    note for Gun "Ranged\nAmmo-based\nBullet pool system"
    note for Sword "Melee arc\nUnlimited use\nGeometry-based hits"
```

## Entity Relationships

```mermaid
graph LR
    subgraph "Player System"
        P[Player]
        WM[WeaponManager]
        G[Gun]
        S[Sword]
        Bullets[Bullet Pool]
    end

    subgraph "Enemy System"
        E[Enemy]
        EG[Enemy Group]
    end

    subgraph "Pickup System"
        A[Ammo Pickup]
    end

    subgraph "Scenes"
        City[CityScene]
        Bldg[BuildingScene]
    end

    P --> WM
    WM --> G
    WM --> S
    G --> Bullets
    S -.arc detection.-> EG
    Bullets -.collision.-> EG
    EG --> E

    City --> P
    City --> EG
    City --> A

    Bldg --> P
    Bldg --> EG

    A -.pickup.-> P
    E -.damage.-> P

    style P fill:#e1bee7
    style E fill:#ffccbc
    style A fill:#c5e1a5
```

## Difficulty Scaling System

```mermaid
graph TD
    Start[Game Start<br/>Score: 0] --> Kill[Kill Enemy<br/>+10 points]
    Kill --> UI[UIScene receives<br/>enemyKilled event]
    UI --> Update[Update Score Display]
    Update --> Broadcast[Broadcast scoreUpdated<br/>to all scenes]

    Broadcast --> City[CityScene receives<br/>scoreUpdated]
    Broadcast --> Building[BuildingScene receives<br/>scoreUpdated]

    City --> CalcCity[Calculate Difficulty Level<br/>level = floor score / 50]
    CalcCity --> UpdateCity[Update City Spawning:<br/>maxEnemies = 10 + level*2 max 30<br/>spawnDelay = 5000 - level*400 min 1000]

    Building --> CalcBldg[Calculate Difficulty Level<br/>level = floor score / 50]
    CalcBldg --> UpdateBldg[Update Building Spawning:<br/>minEnemies = 2 + level max 8<br/>maxEnemies = 4 + level max 10]

    UpdateCity --> Kill
    UpdateBldg --> Kill

    style Start fill:#e8f5e9
    style UI fill:#fff3e0
    style City fill:#e1f5fe
    style Building fill:#f3e5f5
```

## Isometric Coordinate System

```mermaid
graph LR
    subgraph "Cartesian Space (Tile Grid)"
        Cart["Cartesian (x, y)<br/>Tile: (5, 3)"]
    end

    subgraph "Isometric Projection"
        ISO["Isometric Screen (x, y)<br/>Pixel: (64, 128)"]
    end

    subgraph "Transformations"
        C2I["cartToIso()<br/>x = cartX - cartY * 32<br/>y = cartX + cartY * 16"]
        I2C["isoToCart()<br/>Inverse calculation"]
    end

    Cart -->|"Forward"| C2I
    C2I --> ISO
    ISO -->|"Reverse"| I2C
    I2C --> Cart

    subgraph "Depth Sorting"
        Depth["All entities use<br/>setDepth y + offset<br/>Higher Y = In front"]
    end

    ISO --> Depth

    style Cart fill:#e1f5fe
    style ISO fill:#f3e5f5
    style C2I fill:#fff9c4
    style I2C fill:#fff9c4
```

## Player Input & Weapon Switching

```mermaid
stateDiagram-v2
    [*] --> GunEquipped

    state GunEquipped {
        [*] --> Idle
        Idle --> Shooting: Mouse Down + Ammo > 0
        Shooting --> Idle: Mouse Up / Cooldown
        Shooting --> OutOfAmmo: Ammo = 0
        OutOfAmmo --> SwordEquipped: Auto-switch (1s cooldown)
    }

    state SwordEquipped {
        [*] --> Ready
        Ready --> Swinging: Mouse Down
        Swinging --> Ready: Cooldown (400ms)
    }

    GunEquipped --> SwordEquipped: Press 2 / Scroll Wheel
    SwordEquipped --> GunEquipped: Press 1 / Scroll Wheel

    note right of GunEquipped
        Manual switch:
        - Number key (300ms cooldown)
        - Mouse wheel
        - Cannot switch during attack
    end note

    note left of OutOfAmmo
        Auto-switch prevents spam:
        - 1 second cooldown
        - Shows red warning message
    end note
```

## Game Loop & Update Cycle

```mermaid
sequenceDiagram
    participant Game as Phaser Game Loop
    participant City as CityScene
    participant Player as Player
    participant Enemy as Enemy (x N)
    participant Weapon as Current Weapon
    participant UI as UIScene

    loop Every Frame (60 FPS)
        Game->>City: update(time, delta)
        City->>Player: update(time, delta)

        Player->>Player: handleMovement()
        Player->>Player: handleAttack(time)

        alt Gun Ammo = 0
            Player->>Player: Auto-switch to Sword
            Player->>UI: emit('weaponAutoSwitch')
        end

        alt Mouse Down & Can Attack
            Player->>Weapon: attack(time, pointer, player)

            alt Weapon is Gun
                Weapon->>Weapon: Spawn bullet from pool
                Weapon->>Weapon: Set velocity toward mouse
                Weapon->>UI: emit('ammoChanged')
            else Weapon is Sword
                Weapon->>Weapon: Calculate arc angle
                Weapon->>City: Get enemies group
                Weapon->>Weapon: detectEnemiesInArc()
                Weapon->>Enemy: takeDamage(35) for each in arc
            end
        end

        Player->>Player: updateDepth()

        City->>Enemy: update(time, delta) for each

        alt Enemy in Detection Range
            Enemy->>Player: Chase & Attack
        else
            Enemy->>Enemy: Wander randomly
        end

        alt Time > spawnTimer
            City->>City: spawnEnemy()
            City->>City: spawnTimer = time + spawnDelay
        end
    end
```

## Collision Detection Flow

```mermaid
flowchart TD
    Start[Frame Update] --> CheckGun{Current Weapon<br/>is Gun?}

    CheckGun -->|Yes| BulletCheck[Check Bullet Collisions]
    BulletCheck --> BulletOverlap{Bullet overlaps<br/>Enemy?}
    BulletOverlap -->|Yes| BulletHit[handleBulletEnemyCollision]
    BulletHit --> DisableBullet[Disable bullet<br/>Show hit effect]
    DisableBullet --> DamageEnemy[enemy.takeDamage 20]

    CheckGun -->|No| SwordCheck[Sword Attack]
    SwordCheck --> MouseDown{Mouse Down &<br/>Can Attack?}
    MouseDown -->|Yes| CalcArc[Calculate arc angle<br/>from player to mouse]
    CalcArc --> GetEnemies[Get all enemies<br/>from scene]
    GetEnemies --> ArcDetect[For each enemy:<br/>Check distance ≤ 60px<br/>Check angle within ±45°]
    ArcDetect --> InArc{Enemy in arc?}
    InArc -->|Yes| TrackHit{Already hit<br/>this swing?}
    TrackHit -->|No| SwordDamage[enemy.takeDamage 35<br/>Add to hit Set]
    TrackHit -->|Yes| Skip[Skip to prevent<br/>double-damage]

    DamageEnemy --> CheckDeath{Health ≤ 0?}
    SwordDamage --> CheckDeath

    CheckDeath -->|Yes| SetDying[Set isDying = true<br/>Disable physics body]
    SetDying --> DeathAnim[Play death animation]
    DeathAnim --> EmitKilled[emit 'enemyKilled' 10]
    EmitKilled --> UIScore[UIScene adds score]
    UIScore --> EndFrame[Continue]

    CheckDeath -->|No| EndFrame
    BulletOverlap -->|No| EndFrame
    MouseDown -->|No| EndFrame
    InArc -->|No| EndFrame
    Skip --> EndFrame

    style BulletHit fill:#ffccbc
    style SwordDamage fill:#c5e1a5
    style SetDying fill:#ffcdd2
    style UIScore fill:#fff9c4
```
