# SCI Patterns Applied to Somnium

Specific implementation patterns from Sierra games that can enhance Somnium's parser, graphics, and sound systems.

## Parser Enhancements

### 1. Advanced Said Patterns

From the SCI games, we can extract these parser patterns to implement in Somnium:

```javascript
// Current Somnium pattern
parseCommand(input) {
    const tokens = this.tokenize(input);
    const command = this.identifyCommand(tokens);
    // ...
}

// Enhanced with SCI patterns
parseCommand(input) {
    const tokens = this.tokenize(input);
    
    // SCI-style Said patterns
    const saidPatterns = {
        // Basic patterns
        'look': /^look$/,
        'look at [object]': /^look\s+(at\s+)?(.+)$/,
        'look around': /^look\s+(around|about)$/,
        
        // Complex multi-word patterns from SQ3
        'sit in chair': /^(sit|go|get)\s*(down|in)?\s*(chair|seat|cockpit)$/,
        'use [item] on [target]': /^(use|put|place|insert)\s+(.+)\s+(on|in|with)\s+(.+)$/,
        
        // Optional words with brackets
        'get [up]': /^(get\s+up|stand(\s+up)?|rise)$/,
        'pick [up] [object]': /^(pick\s*(up)?|get|take|grab)\s+(.+)$/,
        
        // Alternative syntax with slashes
        'order/buy/get drink': /^(order|buy|get)\s+(a\s+)?drink$/,
        
        // Nested optionals from KQ4
        '[look] [at] [the] room': /^(look\s*)?(at\s*)?(the\s*)?room$/
    };
}
```

### 2. Context-Sensitive Command Handling

From QFG1's tavern scene:

```javascript
// Add state checks before allowing commands
handleSitCommand() {
    if (this.gameState.isPlayerSitting) {
        return "You're already sitting down.";
    }
    if (!this.gameState.nearBarstool) {
        return "You're not close enough to a barstool.";
    }
    if (this.gameState.isInCombat) {
        return "Not while you're fighting!";
    }
    
    // Execute sit action
    this.executeAction('sit');
}
```

### 3. Synonym Expansion System

Based on KQ4's synonym system:

```javascript
class SynonymDictionary {
    constructor() {
        this.synonyms = {
            // Nouns
            'lake': ['pond', 'water', 'pool'],
            'bird': ['parrot', 'cockatoo', 'gull'],
            'drink': ['ale', 'beer', 'beverage'],
            
            // Verbs
            'talk': ['speak', 'converse', 'chat', 'say'],
            'get': ['take', 'grab', 'pick', 'obtain'],
            'look': ['examine', 'inspect', 'view', 'see'],
            
            // Adjectives
            'small': ['little', 'tiny', 'miniature'],
            'large': ['big', 'huge', 'enormous']
        };
    }
    
    expandWord(word) {
        // Return all synonyms for a word
        for (let [key, synonymList] of Object.entries(this.synonyms)) {
            if (key === word || synonymList.includes(word)) {
                return [key, ...synonymList];
            }
        }
        return [word];
    }
}
```

### 4. Procedural Command Patterns

From Iceman's military procedures:

```javascript
class ProceduralCommands {
    constructor() {
        this.procedures = {
            'use_binoculars': [
                { action: 'checkState', condition: 'hasBinoculars' },
                { action: 'animate', sequence: 'raiseBinoculars' },
                { action: 'changeView', view: 'binocularView' },
                { action: 'wait', duration: 5000 },
                { action: 'animate', sequence: 'lowerBinoculars' },
                { action: 'changeView', view: 'normalView' }
            ]
        };
    }
}
```

## Graphics Enhancements

### 1. Day/Night System

Based on KQ4's overlay system:

```javascript
class DayNightSystem {
    constructor(sceneRenderer) {
        this.sceneRenderer = sceneRenderer;
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
    }
    
    applyTimeOfDay(isNight) {
        if (isNight) {
            // Apply night overlay - darken scene
            this.overlayCtx.fillStyle = 'rgba(0, 0, 64, 0.5)';
            this.overlayCtx.fillRect(0, 0, 320, 200);
            
            // Add moon/stars
            this.drawNightElements();
        } else {
            // Clear overlay for day
            this.overlayCtx.clearRect(0, 0, 320, 200);
        }
        
        // Composite onto main canvas
        this.sceneRenderer.ctx.drawImage(this.overlayCanvas, 0, 0);
    }
}
```

### 2. Animation Cycles for Environmental Effects

From various SCI games:

```javascript
class EnvironmentalEffects {
    constructor() {
        this.effects = {
            'waves': {
                frames: [0, 1, 2, 3, 2, 1],
                speed: 300,
                positions: [
                    { x: 203, y: 75 },
                    { x: 191, y: 115 },
                    { x: 191, y: 188 }
                ]
            },
            'smoke': {
                frames: [0, 1, 2, 3, 4],
                speed: 200,
                loop: 'forward',
                priority: 4
            },
            'fire': {
                frames: [0, 1, 2, 1],
                speed: 150,
                loop: 'forward',
                lightRadius: 50
            }
        };
    }
}
```

### 3. Priority-based Rendering

SCI's priority system for depth:

```javascript
class PriorityRenderer {
    constructor() {
        this.priorityBands = [
            { minY: 0,   maxY: 50,  priority: 0 },  // Sky
            { minY: 50,  maxY: 100, priority: 3 },  // Background
            { minY: 100, maxY: 150, priority: 7 },  // Midground
            { minY: 150, maxY: 200, priority: 12 }  // Foreground
        ];
    }
    
    calculatePriority(sprite) {
        // Auto-calculate based on Y position
        for (let band of this.priorityBands) {
            if (sprite.y >= band.minY && sprite.y < band.maxY) {
                return band.priority;
            }
        }
        return sprite.y; // Fallback to Y-sorting
    }
}
```

## Sound System Enhancements

### 1. Priority-based Sound Management

From SCI's Sound class:

```javascript
class SoundManager {
    constructor() {
        this.sounds = [];
        this.maxSimultaneous = 4;
    }
    
    playSound(sound) {
        // Check priority
        if (this.sounds.length >= this.maxSimultaneous) {
            // Find lowest priority sound
            const lowestPriority = this.sounds.reduce((min, s) => 
                s.priority < min.priority ? s : min
            );
            
            if (sound.priority > lowestPriority.priority) {
                this.stopSound(lowestPriority);
                this.sounds.push(sound);
                sound.play();
            }
        } else {
            this.sounds.push(sound);
            sound.play();
        }
    }
}
```

### 2. Music Transition System

From SQ3's room transitions:

```javascript
class MusicTransitions {
    async transitionMusic(fromTrack, toTrack, fadeTime = 2000) {
        // Fade out current music
        await this.fadeOut(fromTrack, fadeTime);
        
        // Optional silence gap
        await this.wait(500);
        
        // Fade in new music
        await this.fadeIn(toTrack, fadeTime);
    }
    
    async fadeOut(track, duration) {
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = track.volume / steps;
        
        for (let i = 0; i < steps; i++) {
            track.volume -= volumeStep;
            await this.wait(stepTime);
        }
        track.stop();
    }
}
```

### 3. Ambient Sound Layers

Based on Iceman's ocean scenes:

```javascript
class AmbientSoundscape {
    constructor() {
        this.layers = {
            'ocean': {
                base: 'waves.ogg',
                volume: 0.3,
                loop: true,
                variations: ['waves_calm.ogg', 'waves_rough.ogg']
            },
            'wildlife': {
                sounds: ['seagull1.ogg', 'seagull2.ogg'],
                probability: 0.1,  // 10% chance per second
                volume: 0.5,
                randomDelay: [5000, 20000]
            },
            'wind': {
                base: 'wind_light.ogg',
                volume: 0.2,
                loop: true,
                volumeVariation: 0.1  // ±10% volume fluctuation
            }
        };
    }
}
```

## Integration Examples

### Complete Parser Enhancement

```javascript
// Somnium Parser.js enhancement
class EnhancedParser extends Parser {
    constructor() {
        super();
        this.synonymDict = new SynonymDictionary();
        this.abbreviations = {
            'n': 'go north',
            's': 'go south',
            'e': 'go east',
            'w': 'go west',
            'x': 'examine',
            'l': 'look',
            'i': 'inventory',
            'g': 'again'  // Repeat last command
        };
    }
    
    parseCommand(input) {
        // Handle abbreviations
        if (this.abbreviations[input.toLowerCase()]) {
            input = this.abbreviations[input.toLowerCase()];
        }
        
        // Tokenize with synonym expansion
        const tokens = this.tokenize(input);
        const expandedTokens = tokens.map(token => ({
            original: token,
            synonyms: this.synonymDict.expandWord(token.toLowerCase())
        }));
        
        // Match against Said patterns
        return this.matchSaidPattern(expandedTokens);
    }
}
```

### Scene Renderer Enhancement

```javascript
// Enhance SceneRenderer.js
class EnhancedSceneRenderer extends SceneRenderer {
    constructor(canvas) {
        super(canvas);
        this.dayNightSystem = new DayNightSystem(this);
        this.environmentalEffects = new EnvironmentalEffects();
        this.priorityRenderer = new PriorityRenderer();
    }
    
    renderScene(scene) {
        // Base scene rendering
        super.renderScene(scene);
        
        // Apply time of day
        this.dayNightSystem.applyTimeOfDay(scene.isNight);
        
        // Render environmental effects
        for (let effect of scene.effects) {
            this.renderEffect(effect);
        }
        
        // Sort and render sprites by priority
        const sortedSprites = this.priorityRenderer.sortSprites(scene.sprites);
        sortedSprites.forEach(sprite => this.renderSprite(sprite));
    }
}
```

These patterns from Sierra's SCI engine provide proven solutions for common adventure game challenges and can significantly enhance Somnium's capabilities.