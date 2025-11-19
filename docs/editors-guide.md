# Somnium Visual Editors Guide

Complete guide to using Somnium's visual content creation tools for building custom adventures.

## Table of Contents

1. [Overview](#overview)
2. [World Editor](#world-editor)
3. [Puzzle Builder](#puzzle-builder)
4. [Dialogue Tree Editor](#dialogue-tree-editor)
5. [Asset Library Integration](#asset-library-integration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

Somnium v2.1 includes three professional visual editors for creating custom game content:

- **World Editor**: Design room layouts and connections
- **Puzzle Builder**: Create puzzles with visual dependency graphs
- **Dialogue Tree Editor**: Build branching NPC conversations

All editors export to game-ready JSON format and integrate with the Asset Library system.

## World Editor

**Location**: `editors/world-editor.html`

### Getting Started

1. **Open the Editor**: Navigate to `/editors/world-editor.html` in your browser
2. **Create or Load**: Choose "New World" or "Load World" from the toolbar
3. **Design Your World**: Add rooms, set properties, create connections
4. **Validate & Export**: Use the validation tools, then export to JSON

### Interface Overview

#### Toolbar (Top)

- **📄 New**: Create a new world from scratch
- **📂 Load**: Load an existing world JSON file
- **💾 Save**: Save current world to browser storage
- **📤 Export**: Export world to downloadable JSON file
- **➕ Add Room**: Create a new room node
- **🗑️ Delete**: Remove selected room
- **✓ Validate**: Check world for errors

#### Canvas Controls

- **Zoom In/Out**: Use toolbar buttons or mouse wheel (25%-200%)
- **Pan**: Click and drag on empty canvas space
- **Grid**: Toggle grid overlay with "Show Grid" checkbox
- **Auto-Layout**: Automatically arrange rooms using force-directed algorithm

#### Sidebars

**Left Sidebar - World Properties**:
- World name and description
- Theme selection
- Global settings

**Right Sidebar - Room Properties** (when room selected):
- Room name and description
- Graphics configuration
- Exit connections
- Object/item placement

### Creating Rooms

1. Click "Add Room" in the toolbar
2. Room appears on canvas (drag to reposition)
3. Click room to select and edit properties
4. Set room name, description, and graphics in right sidebar

### Connecting Rooms

1. Select a room
2. In "Room Exits" section, click "Add Exit"
3. Choose direction (north, south, east, west, up, down)
4. Select target room from dropdown
5. Visual arrow shows connection on canvas

### Graphics Configuration

Each room can have custom vector graphics:

```javascript
{
  "primitives": [
    {
      "type": "rect",
      "x": 10, "y": 50,
      "width": 100, "height": 80,
      "color": 3,  // EGA color index (0-15)
      "filled": true,
      "dither": 0  // Dithering pattern (0-8)
    },
    {
      "type": "polygon",
      "points": [[50, 10], [100, 40], [75, 70]],
      "color": 11,
      "filled": true
    }
  ]
}
```

**Supported Primitive Types**:
- `rect`: Rectangles with width/height
- `polygon`: Multi-point shapes
- `circle`: Circles with radius
- `line`: Straight lines
- `path`: Complex paths with multiple segments

### Validation

Click "Validate" to check for:
- ✅ Unreachable rooms (rooms with no path from starting room)
- ✅ Missing exits (dead ends)
- ✅ Broken connections (exits pointing to non-existent rooms)
- ✅ Duplicate IDs
- ✅ Missing required properties

### Export Format

Exported JSON structure:

```json
{
  "name": "My Adventure",
  "theme": "fantasy",
  "startingRoom": "room_1",
  "rooms": [
    {
      "id": "room_1",
      "name": "Entrance Hall",
      "description": "A grand entrance...",
      "graphics": { /* ... */ },
      "exits": [
        { "direction": "north", "targetRoom": "room_2" }
      ],
      "objects": [],
      "items": []
    }
  ]
}
```

### Keyboard Shortcuts

- **Delete**: Remove selected room
- **Ctrl+S**: Save world
- **Ctrl+E**: Export world
- **Ctrl+Z**: Undo (when supported)
- **Arrow Keys**: Navigate selected room

## Puzzle Builder

**Location**: `editors/puzzle-builder.html`

### Getting Started

1. **Open the Editor**: Navigate to `/editors/puzzle-builder.html`
2. **Create Puzzle**: Click "New Puzzle" or load existing
3. **Add Nodes**: Use node type buttons to add puzzle steps
4. **Connect Dependencies**: Draw connections between nodes
5. **Test**: Use testing mode to verify puzzle solvability

### Node Types

#### 1. Item Node (📦)

Represents a required inventory item:

```javascript
{
  "type": "item",
  "itemId": "golden_key",
  "itemName": "Golden Key",
  "required": true
}
```

**Use Case**: Player must have specific item to progress

#### 2. Action Node (⚡)

Player action requirement:

```javascript
{
  "type": "action",
  "actionVerb": "unlock",
  "targetObject": "treasure_chest",
  "required": true
}
```

**Use Case**: Player must perform specific action

#### 3. Sequence Node (🔢)

Multi-step sequence:

```javascript
{
  "type": "sequence",
  "steps": [
    "Pull left lever",
    "Pull right lever",
    "Press red button"
  ],
  "orderMatters": true
}
```

**Use Case**: Steps must be completed in order

#### 4. Condition Node (❓)

State-based requirement:

```javascript
{
  "type": "condition",
  "stateKey": "gate_open",
  "stateValue": true,
  "comparison": "equals"
}
```

**Use Case**: Game state must meet condition

#### 5. Combine Node (➕)

Item combination:

```javascript
{
  "type": "combine",
  "items": ["item_a", "item_b"],
  "resultItem": "item_c"
}
```

**Use Case**: Combine multiple items to create new item

#### 6. Trigger Node (🎯)

Event trigger:

```javascript
{
  "type": "trigger",
  "eventId": "dragon_appears",
  "triggerOnComplete": true
}
```

**Use Case**: Completing step triggers event

### Creating Dependencies

1. **Click source node** (puzzle step requirement)
2. **Drag to target node** (step that depends on it)
3. **Arrow shows dependency** direction
4. **Multiple dependencies** can point to same node

### Visual Layout

- **Auto-Layout**: Uses Dagre hierarchical layout algorithm
- **Manual Positioning**: Drag nodes to custom positions
- **Zoom/Pan**: Same controls as World Editor

### Testing Mode

1. Click "Test Puzzle" button
2. Follow step-by-step simulation
3. Check if puzzle is solvable
4. View solution path

**Testing Features**:
- Step-by-step progression
- Visual highlighting of current step
- Dependency validation
- Solution path calculation

### Validation

Checks for:
- ✅ Orphaned nodes (no connections)
- ✅ Circular dependencies
- ✅ Missing required items
- ✅ Unreachable steps
- ✅ Invalid item/object references

### Export Format

```json
{
  "puzzleId": "main_puzzle",
  "name": "Unlock the Vault",
  "description": "Find keys and solve mechanism",
  "nodes": [
    {
      "id": "node_1",
      "type": "item",
      "itemId": "golden_key"
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2"
    }
  ],
  "rewards": {
    "points": 50,
    "items": ["treasure"]
  }
}
```

## Dialogue Tree Editor

**Location**: `editors/dialogue-editor.html`

### Getting Started

1. **Open the Editor**: Navigate to `/editors/dialogue-editor.html`
2. **Set NPC Properties**: Configure NPC name, personality, initial greeting
3. **Add Dialogue Nodes**: Build conversation tree
4. **Add Player Responses**: Create branching choices
5. **Test with Playthrough**: Interactive conversation simulation

### Interface Layout

#### Left Sidebar - Dialogue Properties

- **NPC ID**: Unique identifier
- **NPC Name**: Display name
- **Personality**: Character trait (friendly, hostile, neutral, mysterious, jovial)
- **Initial Greeting**: First thing NPC says

#### Node Templates

Quick-add buttons for common node types:
- **👋 Greeting**: Opening dialogue
- **❓ Question**: NPC asks player
- **💬 Response**: NPC responds to player
- **🌳 Branch**: Conditional split
- **💰 Trade**: Item trading
- **🏁 End**: Conversation conclusion

#### Right Sidebar - Node Properties

Selected node editing:
- Node text (what NPC says)
- Emotion selection
- Player response options
- Conditions for displaying node

### Node Types

#### 1. Greeting Node

Initial conversation starter:

```javascript
{
  "type": "greeting",
  "text": "Hello, traveler! Welcome to my shop.",
  "emotion": "happy",
  "nextNode": "question_1"
}
```

#### 2. Question Node

NPC asks question:

```javascript
{
  "type": "question",
  "text": "What brings you to our village?",
  "emotion": "neutral",
  "responses": [
    {
      "text": "I'm looking for adventure",
      "nextNode": "response_adventure"
    },
    {
      "text": "Just passing through",
      "nextNode": "response_passing"
    }
  ]
}
```

#### 3. Response Node

NPC responds to player:

```javascript
{
  "type": "response",
  "text": "Ah, an adventurer! You've come to the right place.",
  "emotion": "excited",
  "nextNode": "trade_1"
}
```

#### 4. Branch Node

Conditional dialogue path:

```javascript
{
  "type": "branch",
  "conditions": [
    {
      "type": "hasItem",
      "itemId": "royal_seal",
      "nextNode": "response_royalty"
    },
    {
      "type": "default",
      "nextNode": "response_commoner"
    }
  ]
}
```

#### 5. Trade Node

Item trading interface:

```javascript
{
  "type": "trade",
  "text": "I can sell you these items:",
  "offers": [
    {
      "itemId": "health_potion",
      "price": 10,
      "currency": "gold"
    }
  ],
  "nextNode": "end_1"
}
```

#### 6. End Node

Conversation conclusion:

```javascript
{
  "type": "end",
  "text": "Farewell, and good luck!",
  "emotion": "happy"
}
```

### Emotion System

Available emotions (affects NPC portrait display):
- **😐 Neutral**: Default expression
- **😊 Happy**: Pleased, friendly
- **😢 Sad**: Disappointed, melancholic
- **😠 Angry**: Upset, hostile
- **😲 Surprised**: Shocked, amazed
- **😨 Fearful**: Scared, worried

### Adding Player Responses

1. Select NPC question or response node
2. Click "Add Response" in right sidebar
3. Enter player's dialogue text
4. Select target node (where conversation goes next)
5. Optional: Add conditions for response availability

### Conditions

Responses can have conditions:

```javascript
{
  "text": "I have the artifact you seek",
  "conditions": [
    {
      "type": "hasItem",
      "itemId": "ancient_artifact"
    }
  ],
  "nextNode": "response_artifact"
}
```

**Condition Types**:
- `hasItem`: Player has specific item
- `completedQuest`: Quest completed
- `relationship`: NPC relationship level
- `gameState`: Game state variable check

### Preview & Playthrough

#### Preview Mode (Bottom Panel)

Shows real-time preview of selected node:
- NPC portrait with emotion
- Dialogue text
- Available player responses

#### Playthrough Mode (Modal)

Full interactive conversation:
1. Click "Play Dialogue" button
2. Read NPC greeting
3. Select player responses
4. Follow conversation to end
5. Test all branching paths

**Testing Features**:
- Full conversation flow
- Typing indicators
- Emotion changes
- Condition checking
- Response validation

### Validation

Checks for:
- ✅ Orphaned nodes (unreachable dialogue)
- ✅ Missing player responses
- ✅ Dead ends (no path to end node)
- ✅ Invalid item/quest references
- ✅ Circular loops (infinite conversations)

### Export Format

```json
{
  "npcId": "merchant_1",
  "npcName": "Marcus the Merchant",
  "personality": "friendly",
  "initialGreeting": "greeting_1",
  "nodes": [
    {
      "id": "greeting_1",
      "type": "greeting",
      "text": "Hello, traveler!",
      "emotion": "happy",
      "responses": [
        {
          "text": "Show me your wares",
          "nextNode": "trade_1"
        }
      ]
    }
  ]
}
```

## Asset Library Integration

All three editors integrate with the Asset Library system.

### Saving to Asset Library

1. **Export from Editor**: Use export button in any editor
2. **Auto-Save to Library**: Assets automatically added to appropriate category
3. **Add Tags**: Organize with custom tags
4. **Track Usage**: System tracks when assets are used

### Loading from Asset Library

1. **Browse Assets**: Filter by category (worlds, puzzles, dialogues)
2. **Search**: Use keyword search
3. **Load**: Double-click or click "Load" button
4. **Edit**: Opens in appropriate editor

### Asset Categories

- **Worlds**: Complete world JSON files from World Editor
- **Puzzles**: Puzzle definitions from Puzzle Builder
- **Dialogues**: NPC conversation trees from Dialogue Editor
- **Graphics**: Saved graphic primitive collections
- **Audio**: Sound and music configurations

## Best Practices

### World Design

1. **Start with Layout**: Sketch room connections on paper first
2. **Logical Flow**: Ensure rooms connect logically (castle → courtyard → gardens)
3. **Clear Exits**: Name exits clearly (north, south, east, west)
4. **Validate Often**: Check for unreachable rooms frequently
5. **Test Playthrough**: Walk through your world before export

### Puzzle Design

1. **Clear Objectives**: Make puzzle goals obvious to player
2. **Provide Hints**: Use hint system for complex puzzles
3. **Test Solvability**: Always test in testing mode
4. **Avoid Circular Dependencies**: Check for loops
5. **Balance Difficulty**: Mix easy and hard steps

### Dialogue Design

1. **Natural Conversation**: Write dialogue as people actually speak
2. **Personality Consistency**: Keep NPC personality consistent
3. **Meaningful Choices**: Player responses should matter
4. **Avoid Dead Ends**: Always provide path to conversation end
5. **Use Emotions**: Emotions make characters feel alive

### General Tips

1. **Save Frequently**: Use browser storage save often
2. **Export Backups**: Download JSON backups regularly
3. **Use Validation**: Run validation before export
4. **Test Integration**: Load exports in main game to test
5. **Organize Assets**: Tag and categorize in Asset Library

## Troubleshooting

### Common Issues

#### World Editor

**Problem**: Rooms overlap on canvas
**Solution**: Use auto-layout or manually drag to reposition

**Problem**: Exit connection not showing
**Solution**: Check that target room exists and IDs match

**Problem**: Validation fails on export
**Solution**: Review validation errors, fix issues, re-validate

#### Puzzle Builder

**Problem**: Circular dependency detected
**Solution**: Review dependency arrows, remove circular path

**Problem**: Puzzle shows as unsolvable
**Solution**: Check that all required items are obtainable in world

**Problem**: Node won't delete
**Solution**: Remove all connections to node first, then delete

#### Dialogue Tree Editor

**Problem**: Playthrough gets stuck
**Solution**: Ensure all paths lead to end node

**Problem**: Response not showing in playthrough
**Solution**: Check response conditions, ensure they're met

**Problem**: Emotion not displaying
**Solution**: Verify emotion value is valid (neutral, happy, sad, angry, surprised, fearful)

### Browser Compatibility

**Supported Browsers**:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Known Issues**:
- Safari may have canvas rendering delays (use Chrome/Firefox for best performance)
- Internet Explorer not supported (use modern browser)

### Performance Tips

1. **Limit Room Count**: Keep worlds under 50 rooms for best performance
2. **Optimize Graphics**: Use simple primitives when possible
3. **Reduce Node Count**: Keep puzzles under 30 nodes
4. **Limit Dialogue Branches**: Keep under 50 nodes per NPC

### Getting Help

1. **Check Documentation**: Review this guide and v2.1-features.md
2. **Validation Messages**: Read validation error details carefully
3. **Test in Game**: Load exports in main game to verify
4. **GitHub Issues**: Report bugs at [github.com/doublegate/Somnium/issues](https://github.com/doublegate/Somnium/issues)
5. **GitHub Discussions**: Ask questions at [github.com/doublegate/Somnium/discussions](https://github.com/doublegate/Somnium/discussions)

## Advanced Techniques

### World Editor

**Creating Multi-Level Worlds**:
Use `up` and `down` exits to create vertical navigation (dungeons, towers, caves).

**Dynamic Objects**:
Objects can have state changes triggered by puzzles:
```javascript
{
  "id": "gate",
  "states": {
    "locked": { "description": "A locked gate" },
    "open": { "description": "An open gate" }
  }
}
```

### Puzzle Builder

**Multi-Stage Puzzles**:
Create complex puzzles by chaining multiple puzzle definitions together.

**Conditional Rewards**:
Different rewards based on how puzzle is solved (time, hints used, etc.).

### Dialogue Tree Editor

**Dynamic Dialogue**:
Use game state conditions to change dialogue based on player actions:
```javascript
{
  "conditions": [
    { "type": "gameState", "key": "dragon_defeated", "value": true }
  ],
  "text": "I heard you slayed the dragon! Incredible!"
}
```

**Trading with Conditions**:
NPCs can offer different trades based on player relationships or quest status.

---

**Version**: 2.1.0
**Last Updated**: November 19, 2025
**See Also**: [v2.1 Features Documentation](v2.1-features.md), [Implementation Roadmap](implementation-roadmap.md)
