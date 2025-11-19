# Video Walkthrough Scripts

Comprehensive scripts for creating video content about Somnium v2.0.

## Table of Contents

1. [Quick Start - Getting Started (5 min)](#video-1-quick-start)
2. [Creating Your First World (15 min)](#video-2-creating-your-first-world)
3. [Multiplayer Tutorial (10 min)](#video-3-multiplayer-tutorial)
4. [Advanced World Building (20 min)](#video-4-advanced-world-building)
5. [Server Deployment Guide (15 min)](#video-5-server-deployment)

---

## Video 1: Quick Start - Getting Started (5 min)

**Target Audience**: New players
**Goal**: Get them playing their first adventure in 5 minutes

### Script

**[0:00-0:30] Introduction**

> "Welcome to Somnium, an AI-driven text adventure game inspired by Sierra On-Line classics like King's Quest and Quest for Glory. Every time you play, the AI generates a completely unique adventure.
>
> In this quick tutorial, I'll show you how to start playing in less than 5 minutes."

**[0:30-1:00] Opening the Game**

> "First, visit the Somnium website at doublegate.github.io/Somnium.
>
> [Show: Browser opening https://doublegate.github.io/Somnium/]
>
> The game runs entirely in your browser - no installation needed!"

**[1:00-2:00] Starting a New Game**

> "Click 'New Adventure' to begin. You can optionally enter a theme like 'haunted mansion' or 'space station', or leave it blank for a random adventure.
>
> [Show: Clicking 'New Adventure', entering 'mysterious castle']
>
> The AI is now generating your unique world - this takes about 10-15 seconds. Notice the retro EGA graphics loading...
>
> [Show: Loading screen, then game starting]"

**[2:00-3:30] Basic Commands**

> "Let's learn the basic commands. The game uses a text parser - you type what you want to do.
>
> Try 'look' to examine your surroundings.
>
> [Type: look]
>
> Great! We're in a castle courtyard. Let's try moving north.
>
> [Type: north]
>
> You can use shortcuts: 'n' for north, 's' for south, 'e' for east, 'w' for west.
>
> To interact with objects, use commands like:
> - 'examine fountain' to look closely
> - 'take key' to pick up items
> - 'use key on door' to use items
> - 'talk to guard' to speak with NPCs
>
> Check your inventory anytime with 'inventory' or just 'i'."

**[3:30-4:30] Quick Tips**

> "Here are some quick tips:
>
> 1. Save often! Press F5 or type 'save' - you have 10 save slots
> 2. Read descriptions carefully - they contain clues for puzzles
> 3. Talk to everyone - NPCs give important hints
> 4. If stuck, type 'hint' for help
> 5. The parser understands many synonyms: 'get' and 'take' both work
>
> [Show: Demonstrating save, examining objects, talking to NPC]"

**[4:30-5:00] Wrap Up**

> "And that's it! You're ready to explore.
>
> For a guided tutorial, try the 'Learning to Adventure' world from the demos menu.
>
> Want to play with friends? Check out our multiplayer tutorial!
>
> Happy adventuring! Every playthrough is unique - enjoy your journey!"

**[End Card]**
- Links to multiplayer tutorial
- Links to world creation tutorial
- Discord/community links

---

## Video 2: Creating Your First World (15 min)

**Target Audience**: Players who want to create custom worlds
**Goal**: Build a simple 3-room adventure from scratch

### Script

**[0:00-0:45] Introduction**

> "Welcome back! Today we're going to create a custom world from scratch using Somnium's world editor.
>
> By the end of this tutorial, you'll have a 3-room mystery adventure complete with puzzles, items, and an NPC.
>
> Let's get started!"

**[0:45-2:00] Opening the Editor & Templates**

> "First, open the world editor at /editor.html.
>
> [Show: Opening editor]
>
> The editor has four world templates to choose from:
> - Empty (blank canvas)
> - Medieval Castle
> - Mysterious Dungeon
> - Space Station
>
> We'll start with the Empty template to build from scratch.
>
> [Show: Selecting 'Empty' template]
>
> This gives us a basic starting room. Let's name our world 'The Detective's Office'."

**[2:00-5:00] Creating Rooms**

> "Our mystery will have three rooms:
> 1. Detective's Office (starting room)
> 2. Crime Scene
> 3. Evidence Locker
>
> Let's rename the first room and add graphics.
>
> [Show: Renaming room to 'office', adding room description]
>
> For the graphics, we'll draw a simple office using vector primitives.
>
> [Show: Using editor to add:
> - Rectangle for desk
> - Circle for lamp
> - Polygons for file cabinets]
>
> Now let's add two more rooms by clicking 'Add Room'.
>
> [Show: Creating 'crime_scene' and 'evidence_locker' rooms]
>
> Connect them with exits:
> - Office → north → Crime Scene
> - Crime Scene → east → Evidence Locker
>
> [Show: Adding bidirectional exits]"

**[5:00-8:00] Adding Objects and Items**

> "Now the fun part - adding interactive elements!
>
> In the office, let's add:
> 1. A desk (object) that can be examined
> 2. A notebook (item) that can be taken
> 3. A safe (locked object) that requires a key
>
> [Show: Adding each element with properties:
> - Desk: examinable, description
> - Notebook: takeable, contains clues
> - Safe: locked, requires 'brass_key']
>
> In the crime scene, add:
> - Magnifying glass (item, takeable)
> - Footprints (object, examinable)
> - Hidden brass key (revealed by examining footprints)
>
> [Show: Setting up reveal mechanism]"

**[8:00-11:00] Creating an NPC**

> "Let's add a police officer NPC in the crime scene.
>
> [Show: Adding NPC named 'Officer Walsh']
>
> Configure the dialogue tree:
> - Greeting: 'Good morning, detective!'
> - Topics:
>   - 'case' → tells about the mystery
>   - 'victim' → provides clues
>   - 'suspects' → lists potential suspects
>
> [Show: Building dialogue tree in editor]
>
> The officer can also trade items - let's make them willing to trade evidence for the notebook.
>
> [Show: Setting up trade system]"

**[11:00-13:00] Adding a Puzzle**

> "For the puzzle, players must:
> 1. Examine footprints to find the hidden key
> 2. Take the key
> 3. Use the key on the safe in the office
> 4. Inside the safe is the final evidence
>
> [Show: Configuring puzzle steps in editor]
>
> Set up rewards:
> - Finding key: +10 points
> - Opening safe: +25 points
> - Completing investigation: +50 points
>
> [Show: Setting point values]"

**[13:00-14:30] Testing & Saving**

> "Always test your world before sharing!
>
> Click 'Test World' to play through it.
>
> [Show: Playing through the created world]
>
> Check that:
> - All exits work both ways
> - Items can be taken
> - Puzzles are solvable
> - NPC dialogue makes sense
>
> Once satisfied, click 'Export World' to save your JSON file.
>
> [Show: Exporting world]
>
> You can now share this with friends or upload it to the community!"

**[14:30-15:00] Wrap Up**

> "Congratulations! You've created your first custom world.
>
> This is just the beginning - you can add:
> - More complex puzzles
> - Multiple endings based on choices
> - Ambient sounds and music
> - Advanced NPC relationships
>
> For advanced techniques, check out our Advanced World Building tutorial!
>
> Happy creating!"

**[End Card]**
- Link to advanced tutorial
- Link to template showcase
- Community showcase link

---

## Video 3: Multiplayer Tutorial (10 min)

**Target Audience**: Players wanting to play co-op
**Goal**: Join or host a multiplayer session

### Script

**[0:00-0:30] Introduction**

> "Somnium v2.0 introduces multiplayer! You can now play adventures together with up to 8 friends in real-time.
>
> In this tutorial, I'll show you how to create a session, invite friends, and play together. Let's jump in!"

**[0:30-2:00] Accessing the Lobby**

> "First, navigate to the multiplayer lobby at /multiplayer.html.
>
> [Show: Opening multiplayer lobby]
>
> Enter your player name - this is what other players will see.
>
> The default server is ws://localhost:8080 for local servers, but if you're playing on a hosted instance, use that URL instead.
>
> [Show: Entering name, clicking 'Connect']
>
> Great! We're now in the lobby."

**[2:00-4:00] Creating a Session**

> "Let's create a new session. Click 'Create Session'.
>
> [Show: Opening create session modal]
>
> Fill in the details:
> - Session Name: 'Mystery Mansion' (players will see this)
> - Max Players: 4 (2-8 supported)
> - Game Mode: Choose from:
>   - Co-op: Work together, shared victory
>   - Competitive: Race to finish
>   - Shared World: Persistent world
>
> For this example, let's choose Co-op.
>
> [Show: Selecting Co-op mode]
>
> Choose a world - either use a template or upload your custom world JSON.
>
> [Show: Selecting 'Medieval Castle' template]
>
> Privacy options:
> - Public: Anyone can join
> - Private: Requires password
>
> Let's make it private with password 'adventure123'.
>
> [Show: Setting password, clicking 'Create']
>
> Perfect! Your session is created. Share the Session ID with friends!"

**[4:00-6:00] Inviting & Joining**

> "To invite friends, share two things:
> 1. The Session ID (shown at the top)
> 2. The password (if private)
>
> [Show: Session ID display]
>
> Friends click 'Join Session', enter the ID and password, and they're in!
>
> [Show: Second browser window joining]
>
> Notice how players appear in the player list instantly. The host has a gold crown icon.
>
> Players can mark themselves ready when they're set to begin.
>
> [Show: Players clicking 'Ready' button]"

**[6:00-8:00] Playing Together**

> "Once everyone's ready, the host starts the game.
>
> [Show: Host clicking 'Start Game']
>
> Now you're in the shared world! Here's how it works:
>
> - Everyone sees the same room descriptions
> - When someone moves, everyone sees it
> - Items taken by one player disappear for all
> - Puzzles are shared - anyone can solve them
> - Use the chat to coordinate!
>
> [Show: Demonstrating movement, item interaction, chat]
>
> Chat commands:
> - Just type normally and press enter
> - Messages appear for all players
> - Use it to strategize!
>
> Pro tip: Assign roles! One person talks to NPCs while another searches for items."

**[8:00-9:30] Game Modes Explained**

> "Quick breakdown of the three modes:
>
> **Co-op Mode**:
> - Shared inventory
> - Shared scoring
> - Team victory condition
> - Best for collaborative puzzles
>
> **Competitive Mode**:
> - Separate inventories
> - Individual scoring
> - First to finish wins
> - Race to solve puzzles!
>
> **Shared World Mode**:
> - Persistent world
> - Players can join/leave anytime
> - Asynchronous play possible
> - Great for long campaigns"

**[9:30-10:00] Wrap Up**

> "And that's multiplayer in Somnium!
>
> Tips for a great experience:
> - Use voice chat (Discord/etc.) alongside in-game chat
> - Save frequently (host can save for everyone)
> - Communicate before making big decisions
> - Have fun and experiment!
>
> Ready to host? See our server setup guide for running your own multiplayer server.
>
> Happy adventuring together!"

**[End Card]**
- Server setup tutorial link
- Community Discord link
- Multiplayer tips & tricks doc

---

## Video 4: Advanced World Building (20 min)

**Target Audience**: Experienced world creators
**Goal**: Advanced techniques for complex worlds

### Script

*(Detailed script covering: complex puzzles, branching storylines, custom scripts, optimization techniques, professional graphics design, advanced NPC behaviors)*

**Key Topics**:
- Multi-step puzzle chains
- Conditional events and triggers
- Dynamic NPC schedules
- Custom sound design
- Performance optimization
- Beta testing workflow

---

## Video 5: Server Deployment Guide (15 min)

**Target Audience**: Technical users, server administrators
**Goal**: Deploy Somnium servers to production

### Script

*(Detailed script covering: server setup, environment configuration, PM2 deployment, Nginx reverse proxy, SSL setup, security hardening)*

**Key Topics**:
- Installing Node.js and dependencies
- Environment variable configuration
- PM2 process management
- Nginx as reverse proxy
- SSL certificates with Let's Encrypt
- Monitoring and logging
- Troubleshooting common issues

---

## Production Notes

### Equipment Recommendations

- **Microphone**: Blue Yeti or similar USB mic
- **Screen Recording**: OBS Studio (free, cross-platform)
- **Video Editing**: DaVinci Resolve (free) or Adobe Premiere
- **Resolution**: 1920×1080 minimum
- **Frame Rate**: 30 FPS minimum (60 FPS preferred for game footage)

### Recording Settings

```
OBS Studio Settings:
- Base Resolution: 1920x1080
- Output Resolution: 1920x1080
- FPS: 60
- Encoder: x264
- Rate Control: CBR
- Bitrate: 6000 Kbps
- Keyframe Interval: 2
- Preset: veryfast (while recording), slow (for final render)
```

### Editing Guidelines

1. **Pacing**: Keep it moving, no dead air > 2 seconds
2. **Zoom**: Zoom in on important UI elements (200% for text)
3. **Annotations**: Add text overlays for key points
4. **Chapters**: Use YouTube chapters for easy navigation
5. **B-Roll**: Show examples while narrating
6. **Music**: Low-volume background music (royalty-free)
7. **Intro/Outro**: Keep under 5 seconds each

### YouTube Optimization

**Title Format**: `Somnium v2.0 - [Topic] Tutorial | [Duration]`

**Tags**: somnium, text adventure, sierra games, retro gaming, game development, multiplayer adventure, world building, interactive fiction

**Description Template**:
```
Learn [topic] in Somnium v2.0!

⏱️ Timestamps:
0:00 - Introduction
X:XX - Topic 1
X:XX - Topic 2

🔗 Links:
- Play Somnium: https://doublegate.github.io/Somnium/
- Documentation: https://github.com/doublegate/Somnium
- Discord Community: [link]

📚 Related Videos:
- [Previous tutorial]
- [Next tutorial]

#somnium #textadventure #retrogaming
```

### Thumbnail Design

- **Size**: 1280×720 pixels
- **Text**: Large, readable font (60+ pt)
- **Contrast**: High contrast for visibility
- **Brand**: Include Somnium logo
- **Screenshot**: Show key feature being taught

---

## Script Templates

### Opening Template

> "Hey everyone, [Your Name] here! Today we're going to [topic]. By the end of this tutorial, you'll be able to [goal]. Let's get started!"

### Transition Template

> "Now that we've covered [previous topic], let's move on to [next topic]."

### Wrap Up Template

> "And that's it for [topic]! To recap, we covered [point 1], [point 2], and [point 3]. If you found this helpful, please like and subscribe. Drop any questions in the comments below. Thanks for watching, and happy adventuring!"

---

**Last Updated**: June 18, 2025
**Version**: 2.0.0
