# Sierra SCI Game Engine Patterns Analysis

Based on analysis of decompiled source code from King's Quest 4, Space Quest 3, Quest for Glory 1 EGA, and Police Quest 2: The Iceman.

## Parser Implementation Patterns

### 1. Basic Parser Structure (KQ4, SQ3, QFG1)

```sciScript
(method (handleEvent event)
    (if (== (event type?) saidEvent)
        (cond 
            ((Said 'look>')
                (cond 
                    ((Said '/grass')
                        (Print 1 0))
                    ((Said '/brook')
                        (Print 1 1))
                    ((Said '[<around][/room]')
                        (Print 1 2))
                )
            )
            ((Said 'get,capture/bird,parrot')
                (Print 36 0))
            ((Said 'converse/bird,parrot')
                (Print 36 21))
        )
    )
)
```

### 2. Complex Multi-word Commands (SQ3)

```sciScript
;; Space Quest 3 - Complex sci-fi commands
((Said 'enter,go,(sit[<down,in]),get/chair<passenger')
    (cond 
        ((== sittingInCockpit TRUE) (Print 14 10))
        (twoGuysOnBoard (Print 14 11))
        (else (Print 14 12))
    )
)

((Said 'replace,use,fix,place,insert,drop,afix,cable/[/cavity,compartment,deck,console,generator,cable]>')
    (cond 
        ((Said '/generator')
            (cond 
                ((InRoom iReactor) (Print 14 73))
                ((not (ego has: iReactor)) (DontHave))
                ((== sittingInCockpit FALSE) (self setScript: reactorScript))
                (else (Print 14 74))
            )
        )
    )
)
```

### 3. Synonym Handling (KQ4)

```sciScript
(synonyms
    (lake pool lake)  ; All three words map to "lake"
)
```

### 4. RPG/Combat Commands (QFG1)

```sciScript
;; Quest for Glory - RPG-specific parsing
((or (Said 'order,buy,get/drink') (Said 'ask//drink'))
    (if bartenderAttention
        (if (not (Btst fEgoSitting))
            (HighPrint 331 14) ; "Sit down first!"
        else
            (HighPrint 331 15) ; "OK. What'll you have?"
        )
    else
        (HighPrint 331 13) ; You'll have to get attention first
    )
)

((Said 'display,made/sign[<thief]')
    (if bartenderAttention
        (HighPrint 331 12) ; "You'd better talk to Crusher."
    else
        (HighPrint 331 13)
    )
)
```

### 5. Procedural Commands (Iceman)

```sciScript
;; Police Quest 2 - Military/procedural commands
((or 
    (Said 'exit,exit')
    (Said 'go<below')
    (Said 'climb<down/ladder'))
    (Print 28 4)
)

((Said 'address[/man,captain]')
    (client setScript: binocularScript)
)

((or 
    (Said 'get,(look[<at])/binoculars')
    (Said 'binoculars<use'))
    (self setScript: lookBinocsScript self seconds: 0)
)
```

## Graphics Techniques

### 1. Day/Night Cycle (KQ4)

```sciScript
;; Simple overlay system for night graphics
(method (init)
    (super init:)
    (if isNightTime
        (curRoom overlay: 101)  ; Each room has a night overlay +100
    )
)
```

### 2. Animation and Effects

```sciScript
;; Wave animation from KQ4
(wave1
    isExtra: TRUE
    view: 665
    loop: 0
    cel: 0
    posn: 203 75
    setPri: 0
    ignoreActors:
    cycleSpeed: 3
    init:
)

;; Cycling properties for continuous animation
(instance water1CP of CyclingProp
    (properties
        y 142
        x 259
        view: 28
        loop 2
    )
)
```

### 3. Priority System for Depth

```sciScript
;; Setting priorities for layering
(smoke init: setPri: 4 setCycle: Forward startUpd:)
(ooze init: setPri: 7 setScript: oozeScript)
(trap init: setPri: 5 ignoreActors: stopUpd:)
```

## Sound Design Patterns

### 1. Sound Object Structure

```sciScript
(instance bridgeSound of Sound
    (properties
        number 90
        priority 15
        loop -1  ; Continuous loop
    )
)
```

### 2. Music Transitions (SQ3)

```sciScript
;; Fade out music before room change
(bridgeSound fade:)
(= seconds 10)
;; Later...
(bridgeSound dispose:)
(curRoom newRoom: 25)
```

### 3. Sound Effects Synchronization

```sciScript
;; Play sound on specific action
(method (changeState newState)
    (switch (= state newState)
        (0
            (powerDown play:)
            (ShakeScreen 10 3)
            (Print (Format @str 14 2 thePlanet))
        )
    )
)
```

### 4. Ambient Sounds (Implied)

While not explicitly shown in these examples, the Sound class supports:
- Priority-based sound management
- Looping for ambient sounds
- Multiple simultaneous sounds
- Cue points for synchronization

## Implementation Recommendations for Somnium

### Parser Enhancements

1. **Multi-word Verb Support**: Implement compound verbs like "pick up", "look at", "turn on"
2. **Synonym Dictionary**: Create comprehensive synonym mappings for common variations
3. **Context-Sensitive Parsing**: Check game state before allowing certain commands
4. **Abbreviation Support**: Common shortcuts (x=examine, l=look, i=inventory)
5. **Partial Matching**: Allow "get flow" to match "get flower" if unambiguous

### Graphics Improvements

1. **Overlay System**: Implement day/night or weather overlays using separate canvases
2. **Priority Rendering**: Use z-index or manual sorting for proper depth
3. **Animation Cycles**: Create reusable animation patterns for environmental effects
4. **State-based Graphics**: Different graphics based on game state (doors open/closed)

### Sound System Enhancements

1. **Priority Queue**: Implement sound priority system like SCI
2. **Smooth Transitions**: Add fade in/out for music changes between scenes
3. **Ambient Layers**: Support multiple ambient sound layers (ocean + birds + wind)
4. **Dynamic Music**: Change music based on game state or player actions
5. **Sound Cues**: Implement cue points for animation synchronization

### Code Organization

1. **Room-based Structure**: Each location as a separate module with its own parser rules
2. **Region System**: Shared behavior for groups of related rooms
3. **Script Attachments**: Temporary scripts for complex sequences
4. **State Machines**: Use changeState pattern for multi-step actions

These patterns show how Sierra achieved complex interactions with relatively simple building blocks, perfect for Somnium's JavaScript implementation.