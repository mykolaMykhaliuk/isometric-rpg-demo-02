# Data Flow Documentation

## Scene State Management

```mermaid
graph TD
    subgraph "Initial State"
        Boot[BootScene Creates Assets] --> InitCity[CityScene: NEW Player<br/>Health: 100<br/>Ammo: 30<br/>Weapon: Gun]
        Boot --> InitUI[UIScene: Score = 0]
    end

    subgraph "Enter Building Flow"
        Playing[Playing in City] --> CheckDoor{Near Door?}
        CheckDoor -->|No| Playing
        CheckDoor -->|Yes, Press E| Capture[Capture State:<br/>health = player.getHealth<br/>ammo = player.getAmmo<br/>weapon = player.getCurrentWeapon]
        Capture --> Transfer[scene.start 'BuildingScene'<br/>Pass: buildingId, health, ammo, weapon]
        Transfer --> BuildingInit[BuildingScene.init<br/>Store: initialHealth, initialAmmo, initialWeapon]
        BuildingInit --> BuildingCreate[BuildingScene.create<br/>Create Player]
        BuildingCreate --> RestoreHP{Health < 100?}
        RestoreHP -->|Yes| DamagePlayer[player.takeDamage 100 - health]
        RestoreHP -->|No| SetAmmo[player.setAmmo initialAmmo]
        DamagePlayer --> SetAmmo
        SetAmmo --> SetWeapon[player.setWeapon initialWeapon]
        SetWeapon --> BuildingReady[Player Ready in Building]
    end

    subgraph "Exit Building Flow"
        BuildingPlay[Playing in Building] --> CheckExit{Near Exit?}
        CheckExit -->|No| BuildingPlay
        CheckExit -->|Yes, Press E| ExitStart[scene.start 'CityScene'<br/>NO STATE PASSED]
        ExitStart --> CityReset[CityScene creates<br/>NEW Player instance<br/>RESET to defaults]
        CityReset --> LostState[STATE LOST:<br/>Health: 100<br/>Ammo: 30<br/>Weapon: Gun]
    end

    style Capture fill:#fff3e0
    style Transfer fill:#e1f5fe
    style RestoreHP fill:#f3e5f5
    style ExitStart fill:#ffcdd2
    style LostState fill:#ffcdd2
```

## Score & Difficulty Flow

```mermaid
sequenceDiagram
    participant Enemy as Enemy
    participant Scene as CityScene/BuildingScene
    participant UI as UIScene
    participant Difficulty as Difficulty System

    Enemy->>Enemy: takeDamage(20 or 35)
    Enemy->>Enemy: health <= 0

    Enemy->>Scene: emit('enemyKilled', 10)
    Scene->>UI: Forward: emit('enemyKilled', 10)

    UI->>UI: score += 10
    UI->>UI: Update score display

    UI->>Scene: emit('scoreUpdated', newScore)
    Scene->>Difficulty: updateDifficultyBasedOnScore(newScore)

    alt CityScene
        Difficulty->>Difficulty: level = floor(score / 50)
        Difficulty->>Difficulty: maxEnemies = min(10 + level*2, 30)
        Difficulty->>Difficulty: spawnDelay = max(5000 - level*400, 1000)
    else BuildingScene
        Difficulty->>Difficulty: level = floor(score / 50)
        Difficulty->>Difficulty: Store for next building entry
    end

    Note over Difficulty: Score Examples:<br/>0-49: Level 0 (10 enemies, 5s spawn)<br/>50-99: Level 1 (12 enemies, 4.6s spawn)<br/>100-149: Level 2 (14 enemies, 4.2s spawn)
```

## Weapon Switching Data Flow

```mermaid
flowchart TD
    Input[Input Event<br/>Key 1/2 or Mouse Wheel] --> CheckCooldown{time >= switchCooldown?}
    CheckCooldown -->|No| Ignore[Ignore - Too soon]
    CheckCooldown -->|Yes| CheckSame{Already equipped?}

    CheckSame -->|Yes| Ignore2[Ignore - Same weapon]
    CheckSame -->|No| CheckAttacking{isAttacking?}

    CheckAttacking -->|Yes| Ignore3[Ignore - Mid-attack]
    CheckAttacking -->|No| GetWeapon[weaponManager.getWeapon type]

    GetWeapon --> Switch[currentWeapon = newWeapon<br/>weaponManager.setCurrentWeapon type]
    Switch --> SetCooldown[switchCooldown = now + 300ms]

    SetCooldown --> EmitEvent[emit 'weaponChanged'<br/>weaponType, weapon]

    EmitEvent --> UIUpdate[UIScene receives event]
    UIUpdate --> UpdateIcon[Update weapon icon]
    UIUpdate --> UpdateText[Update weapon name/color]
    UIUpdate --> UpdateAmmo{Weapon is Sword?}

    UpdateAmmo -->|Yes| ShowInfinity[Show ∞ for ammo]
    UpdateAmmo -->|No| ShowCount[Show ammo count/max]

    ShowInfinity --> ShowMessage[Show switch message<br/>Fade out after 1s]
    ShowCount --> ShowMessage

    style CheckAttacking fill:#ffccbc
    style Switch fill:#c5e1a5
    style UIUpdate fill:#fff9c4
```

## Auto-Weapon Switch Flow

```mermaid
sequenceDiagram
    participant Input as Mouse Input
    participant Player as Player
    participant Gun as Gun Weapon
    participant UI as UIScene

    loop Every Frame
        Input->>Player: Mouse button down
        Player->>Player: handleAttack(time)

        alt Current weapon is Gun
            Player->>Gun: hasAmmo()
            Gun->>Player: false (ammo = 0)

            Player->>Player: Check: now - lastAutoSwitch > 1000ms?

            alt Cooldown expired
                Player->>Player: switchWeapon(SWORD)
                Player->>Player: lastAutoSwitch = now
                Player->>UI: emit('weaponAutoSwitch', SWORD)

                UI->>UI: Show red message:<br/>"Out of ammo! Switched to Sword"
                UI->>UI: Fade out after 1.5s

                Note over Player: Weapon now: Sword<br/>Can attack immediately
            else Cooldown active
                Note over Player: Ignore input<br/>Prevent spam switching
            end
        end
    end

    Note over Player,UI: Auto-switch only happens:<br/>1. Gun has no ammo<br/>2. Player tries to attack<br/>3. 1 second since last auto-switch
```

## Ammo System Data Flow

```mermaid
graph TD
    subgraph "Ammo Sources"
        Spawn[Ammo Spawns on Map<br/>Fixed positions in CityScene]
        Pickup[Player collides<br/>distance < 30px]
    end

    subgraph "Ammo Storage"
        Pickup --> AddAmmo[player.addAmmo 30]
        AddAmmo --> GetGun[weaponManager.getWeapon GUN]
        GetGun --> GunAmmo[gun.addAmmo 30]
        GunAmmo --> Clamp[ammo = min ammo + 30, 30]
    end

    subgraph "Ammo Consumption"
        Shoot[Player shoots Gun] --> CanShoot{ammo > 0?}
        CanShoot -->|Yes| Fire[gun.attack]
        Fire --> Decrease[ammo--]
        Decrease --> EmitAmmo[emit 'ammoChanged'<br/>ammo, maxAmmo, GUN]
        CanShoot -->|No| AutoSwitch[Auto-switch to Sword]
    end

    subgraph "UI Display"
        EmitAmmo --> UIReceive[UIScene receives event]
        UIReceive --> CheckWeapon{Current weapon?}
        CheckWeapon -->|Gun| ShowGun[Display: '15/30'<br/>Color: Yellow or Red if <= 5]
        CheckWeapon -->|Sword| ShowSword[Display: '∞'<br/>Color: Grey]
    end

    Clamp --> EmitPickup[emit 'ammoChanged'<br/>ammo, maxAmmo, GUN]
    EmitPickup --> UIReceive

    style Pickup fill:#c5e1a5
    style GunAmmo fill:#fff9c4
    style AutoSwitch fill:#ffccbc
    style ShowSword fill:#e1bee7
```

## Event Propagation Map

```mermaid
graph LR
    subgraph "Event Sources"
        P[Player]
        E[Enemy]
        W[Weapon]
        A[Ammo]
    end

    subgraph "Event Relays"
        C[CityScene]
        B[BuildingScene]
    end

    subgraph "Event Consumers"
        UI[UIScene]
    end

    subgraph "Event Types"
        H[healthChanged]
        AM[ammoChanged]
        WC[weaponChanged]
        WA[weaponAutoSwitch]
        EK[enemyKilled]
        PD[playerDied]
        SU[scoreUpdated]
    end

    P -->|takeDamage| H
    P -->|addAmmo/setAmmo| AM
    P -->|switchWeapon| WC
    P -->|auto-switch| WA
    E -->|die| EK
    P -->|health <= 0| PD

    H --> C
    H --> B
    AM --> C
    AM --> B
    WC --> C
    WC --> B
    WA --> C
    WA --> B
    EK --> C
    EK --> B
    PD --> C
    PD --> B

    C --> UI
    B --> UI

    UI -->|broadcasts| SU
    SU --> C
    SU --> B

    style P fill:#e1bee7
    style E fill:#ffccbc
    style UI fill:#c5e1a5
```

## Critical State Transitions

```mermaid
stateDiagram-v2
    [*] --> GameStart
    GameStart --> CityNewPlayer: BootScene complete

    state CityNewPlayer {
        [*] --> CityDefaults
        CityDefaults --> health100: health = 100
        health100 --> ammo30: ammo = 30
        ammo30 --> weaponGun: weapon = Gun
    }

    CityNewPlayer --> CityPlaying

    state CityPlaying {
        [*] --> Exploring
        Exploring --> Combat: Enemies nearby
        Combat --> Exploring: Enemies dead
        Exploring --> NearDoor: At door position
    }

    NearDoor --> BuildingEntry: Press E

    state BuildingEntry {
        [*] --> CaptureState
        CaptureState --> healthX: health = current
        healthX --> ammoY: ammo = current
        ammoY --> weaponZ: weapon = current
    }

    BuildingEntry --> BuildingPlaying

    state BuildingPlaying {
        [*] --> Fighting
        Fighting --> NearExit: At exit door
    }

    NearExit --> BuildingExit: Press E

    state BuildingExit {
        [*] --> DiscardState
        note right of DiscardState
            NO STATE TRANSFER
            State is lost
        end note
    }

    BuildingExit --> CityNewPlayer

    note right of CityNewPlayer
        WARNING: Exiting building
        resets player to defaults
    end note

    note left of BuildingEntry
        State preserved when
        entering building
    end note
```
