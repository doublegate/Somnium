# Engine Extensibility Guide

The Somnium engine is built with modularity and future expansion in mind, much like the original SCI was designed to handle multiple games. This guide outlines how developers can extend or modify various aspects of the engine without breaking existing functionality. We also discuss possible future enhancements (like moving to SCI1-style VGA graphics or adding new interaction modes) and how the current design would accommodate them.

## Design for Modularity

From the outset, our engine separates **content** from **logic**. This means:

- Adding new content types or features often means extending the JSON specification and adding corresponding handling in the engine, rather than rewriting core logic.
- Each major system (Rendering, Sound, AI, Parser, etc.) is in its own module with clear API methods. This encapsulation allows swapping or upgrading one system with minimal impact on others.

General tips for extension:

- **Follow the existing patterns:** e.g., adding a new type of game action? See how current actions are implemented in EventManager and mimic that structure.
- **Maintain backward compatibility:** If you change the JSON format (say, add a new optional field), ensure older JSON (without it) still works. Use sensible defaults in code when a new field is missing.
- **Versioning:** If a change is significant, bump the `version` field in GameState or saves so that the engine can know how to handle old vs new.

## Extending Graphics Capabilities

**New Primitive Shapes:** If you want to support more drawing commands in the `graphics.primitives`:

- Define a new `shape` name and decide what parameters it needs. For example, you might want an `ellipse` or `text` (to draw text on the canvas as part of background).
- Update SceneRenderer’s `drawScene` switch-case to handle that shape. For ellipse, you could use `ctx.ellipse` or `arc`. For text, use `ctx.fillText` with a chosen pixel font (though text as part of background might not be needed).
- Ensure the LLM knows about it. This might mean updating the prompt documentation we give it. If it's just for developer-made content, LLM might not need it, but if we want AI to use it, we must include example usage in prompt.
- Test the new shape thoroughly (maybe add one to a test room manually and see it renders right).

**Higher Res or Color Modes:** Suppose we want to support SCI1-style VGA (320x200, 256 colors) or even higher:

- The engine core can actually handle it: canvas can do 256 colors easily, and higher resolution. We’d need to:

  - Expand the palette if we still restrict colors (SCI1 could use custom palettes up to 256 colors).
  - Possibly allow the JSON to specify either an EGA mode or VGA mode. You’d add maybe a global setting or per-room palette definitions.
  - SceneRenderer would need to handle more complex backgrounds (in SCI1, backgrounds could be bitmaps or still drawn vectors but with many more colors).
  - We might allow the LLM to output raw pixel data or a URL to an image for backgrounds if going VGA – but that’s heavy. Alternatively, keep vector approach but allow a bigger color set.

- If going beyond 320x200, numerous things change: sprite sizes, movement scaling, UI layout. Not trivial but possible. The engine code uses canvas width/height from config, so if we set canvas to 640x400 for example, it could work, but the art style would shift (pixel size smaller). We likely stick to 320x200 for now for authenticity.

**Dynamic Lighting or Effects:** If someone wants to add, say, a flicker effect or a flashlight:

- Perhaps implement a post-processing overlay on the canvas (like drawing a semi-transparent black layer with a hole for light).
- The engine currently doesn’t have a concept of dynamic lighting, but one could code it by adding a new layer canvas on top.
- Or simpler: add an action type that tints the screen or switches backgrounds (like simulate lights on/off by having two sets of primitives).
- Extending in this direction might involve coupling the scene with some state (like `room.dark = true` triggers drawing an extra dark overlay).
- The engine’s modular design means you might create a new Manager (e.g., `EffectManager`) that handles such overlays and ties into EventManager or GameState flags.

**Character Sprites Extensibility:**

- If you want to add more complex animation features, like pathfinding around obstacles or smoother movement:

  - Could integrate a pathfinding algorithm (A\* on an internal walkmap). The control screen concept could be revived by having an array of blocked pixels. One could generate that from primitives labeled as obstacles or from a special `walkmap` in JSON.
  - The ViewManager can then take a path and incrementally move the sprite each tick.
  - The pieces are there: we have coordinates and a loop for movement.

- Adding more animation loops (like diagonal movement loops, or a special “death” animation) is straightforward: just include them in view definition and ensure code can trigger them (like an `actions: {type: "SET_VIEW_LOOP", view:"ego", loop:"dead"}` when needed).
- If we integrate a point-and-click interface later (SCI1 style), we’d have to add support for more animations like talk/mouth moving or custom interactions. But that's more UI than engine logic; engine can already handle events, it's just how player triggers them changes.

**Scaling and Rotation:** Currently, everything is drawn axis-aligned, no scaling of sprites. If we wanted to scale sprites when moving in depth (for pseudo-perspective):

- Could add a scale factor property to views or state. Then ViewManager’s draw could use `ctx.drawImage` with width/height scale.
- We might instruct LLM to provide a `scale` for a view at certain y, or just do a linear scaling: e.g., set scale = 1 at bottom of screen, 0.5 at top. This could make the world more 3D looking.
- That’s an extension that doesn’t break existing stuff if default scale = 1 for all.
- Rotation (not typical in these games) could be done similarly with canvas rotate, but likely unnecessary.

## Extending Audio and Sound

**More Instruments or Music Complexity:**

- Tone.js allows synthesizing a lot. If we want more authentic MT-32, maybe find a library of MIDI instrument samples.
- Could integrate a MIDI player and have the AI output a simple MIDI-like script. That would be complex to prompt, but possible. Alternatively, allow AI to pick from pre-composed tracks. If so, one could have a library of midi files and map mood keywords to those.
- Extending SoundManager to support digital sound effects (SCI1.1 allowed VOC sound digitized):

  - We could allow the JSON to reference a sound file URL or resource for certain effects. Then SoundManager would fetch and play that audio. For example, if we eventually allow embedding a short WAV for a scream or a crash.
  - That’s straightforward: if `soundEffect.file` exists, use an `<audio>` or audio buffer to play it. The caution is file size and user-provided content.

**Speech and Voice Acting:**

- Later SCI (like CD-ROM versions) had voice. If we wanted, we could integrate text-to-speech to narrate or voice characters. That would be a big extension:

  - Possibly add a `voice` field to dialogue lines or description, then use Web Speech API or a TTS engine to speak it.
  - The engine design can allow this as an optional layer. We would coordinate SoundManager or a new VoiceManager to play voice along with showing text (maybe even allow toggling voice on/off).
  - Training AI to generate voices is outside scope, likely use existing TTS.

**Dynamic Audio Effects:**

- If we want environmental audio changes (like volume of ocean waves based on distance), could extend SoundManager to adjust volume depending on room or flag. For e.g., if outdoors vs indoors, lower outdoor sound.
- Tone.js could do panning or 3D audio if we had coordinates; not needed for 2D game but possible to simulate left-right with position.

**Adding New Sound Types:**

- If one wants to incorporate e.g. music puzzles (tones you have to play), you might expose an action type that plays a note and an event when correct sequence happens.
- The engine can handle such – would create a mini state machine for the puzzle.
- Essentially, this is adding new script actions (like a series of PLAY_SOUND actions and maybe a WAIT or conditional in sequence).
- That might require a slight extension to script language (like an action to wait a second, etc.). Could be done by EventManager supporting a “delay” or scheduling.

## Extending Gameplay and Scripting

**New Verbs/Commands:** If designers want to add more parser verbs (e.g., "jump", "smell", "taste" – which Sierra occasionally had quirky responses for):

- Add the verb to Parser’s vocabulary (with synonyms).
- If it's just flavor, dynamic LLM can handle it. If it's puzzle-relevant, ensure the LLM knows to use it when needed (maybe mention in prompt puzzles solution could involve "jump").
- Also possibly add default responses for global verbs (like always respond to "smell" with something funny if not specific).
- We can have a table of default messages in Parser or EventManager for certain verbs and no object (like "jump" -> "Whee, you jump on the spot." globally).
- The architecture handles adding these easily. Just ensure not to conflict existing words.

**Global Scripts or Timers:**

- If wanting complex behaviors (like after 10 minutes, an earthquake event triggers globally):

  - We can already schedule a timer in GameManager. But that was per room maybe.
  - Could implement a global event in JSON (like under plot, a `globalEvents` array).
  - Then EventManager or GameManager would load those and schedule them (with conditions if needed).
  - It's extensible: just decide on format like:

    ```json
    "globalEvents": [
      { "time": 600, "event": {"type": "PRINT", "text": "The volcano rumbles."} }
    ]
    ```

    - Then GameManager after generation schedules that 600-second event to print text.

  - Alternatively, the LLM could attach such events to rooms (like put a timed event in a room’s script that triggers if player is in that room for certain ticks). Possibly overkill, but engine could be extended for that.

**Inventory and Player Stats:**

- Sierra’s Quest for Glory had stats (strength, etc.), an RPG layer. If ever we want that:

  - Extend GameState to include `playerStats` or similar.
  - Possibly allow items to have attributes (like weapon damage).
  - This is a significant gameplay shift. The engine can hold data, but logic to use it (like combat system) would be new.
  - You’d implement a CombatManager maybe that when a fight verb triggers, it calculates outcomes with stats.
  - The LLM could be involved to narrate combat results or even generate enemy stats, but that gets complex.
  - For now, not in scope, but showing that adding a subsystem (like an RPG system) can be done in parallel without disturbing core (just hooking into parser verbs and state flags).

**Point-and-Click UI Mode:**

- If one wanted to evolve Somnium to a point-and-click interface (like SCI1 did, e.g., King’s Quest V):

  - You’d keep the same content engine largely, but change input: instead of text parser, you have icons (walk, look, hand, talk).
  - Implement a MouseManager that on click on the canvas figures out what user clicked (you’d need hotspots for objects, which we have as object coordinates maybe? We might approximate by bounding boxes or if we had control map).
  - Then translate that click + current cursor mode into a command (like if user in "eye (look)" mode and clicked on dragon sprite, treat as "look at dragon").
  - The rest of engine (EventManager, etc.) can remain the same handling "look at dragon".
  - So extension: add a new UI layer and possibly some data to support it (like object coordinates on screen for hit testing—ViewManager knows where sprites are, so it can map click to a view id).
  - This is a non-trivial UI addition but doable without altering how content is generated. We might need to instruct the AI to generate unique object images or highlights but not necessarily; we can use bounding boxes from primitives or have objects define approximate position.

- We can include both interfaces simultaneously: e.g., user can either type or click. That requires keeping them in sync (like when user clicks, we internally call the parser logic so that all remains consistent).

**Engine Performance Scaling:**

- If we wanted more rooms or persistent worlds:

  - Possibly load/unload parts of GameState if memory huge. But since all JSON is loaded at once and that’s fine for moderate sizes, not an immediate need.
  - But if planning a more open-world or unlimited expansion, consider dynamic generation during gameplay (like generating new area on the fly). That would mean calling LLM mid-game for more content. Engine can handle content injection:

    - For example, if the world is infinite (like a roguelike generating rooms as you go), you’d implement a function that on entering an undefined exit triggers a new generation for that room alone.
    - Then merge that new JSON (for that room, maybe with some connecting puzzle?) into GameState.
    - This is advanced, but engine doesn’t preclude it. The separation means you could call AIManager anytime to extend JSON and just load new pieces (ensuring IDs unique).

  - Memory wise, a 50 room game with text and primitives likely under a few MB, which is fine.

**Refactoring and Replacement:**

- If one wanted to replace the LLM with a different AI (say a local model or a rule-based generator for some reason):

  - Only AIManager needs to change significantly. It could call a local function that has some algorithmic generation. The engine doesn’t care as long as it gets JSON.
  - This demonstrates the flexibility: one could experiment with different content sources (even human-made JSON content to use engine as a general interpreter).

## Adapting to New Platforms or Interfaces

**Mobile/Touch:** Already discussed point-and-click partly, but on mobile:

- The UI might need scaling or an on-screen keyboard for text input.
- Possibly implement touch gestures for arrow keys (like swipe to move).
- That’s more an input layer addition. The core remains same.

**Networking/Multiplayer:** Currently, single-player offline. If someone wanted multiplayer (like two players in same world):

- That’s very complex as these adventures aren’t designed for multi-user.
- But one could conceive a collaborative play where two players connect to the same game state.
- The engine could be run on a server and both clients see updates.
- Would need a sync mechanism for GameState and a lockstep input. Not trivial and probably outside intended scope.

**Modding Support:** If developers or modders want to hand-author some content or tweak AI outputs:

- They could load a JSON, edit it, and then feed it into engine (since engine can run any JSON that fits spec, not strictly AI-generated).
- We might make a small tool to validate and run a JSON file for testing.
- For adding new content types (like new fields or systems as above), updating the schema and code is needed.
- Documenting the JSON structure (this documentation partly does it) helps modders.

**Engine Code Extensibility:**

- We encourage writing engine code in a clean, well-documented manner to ease extension.
- Use descriptive names, break functions if too large, etc.
- Possibly in future, migrating to TypeScript could catch type errors when extending (if we do that, ensure types for resources and events etc.).

**Plugin Architecture Idea:**

- We could allow plug-in scripts to be loaded that extend functionality. For instance, a plugin could add a cheat menu or dev tools (like a room teleport or reveal all objects).
- This just means if the engine sees a plugin script loaded, it could call some init hook on it.
- Not necessary now, but for open-source it might be nice to let others extend without modifying core (for example, someone might write a new Save interface or a different renderer, and plug it in).

## Versioning and Compatibility

Whenever extending:

- Consider how it affects existing saved games or content.
- If incompatible, increment a version and ideally support loading old version via conversion or at least showing an error rather than crashing.
- If working on iterative improvements to generation, you might label them as "Somnium v1, v2" etc., so players can choose if they want the new style (especially if significant changes in look or puzzle logic happen).

**Example:** If you implement VGA mode as an option, maybe in JSON have `"engine_mode": "SCI1"` vs `"SCI0"`. The engine could adapt rendering depending on mode. Saves would note which mode they are in to use correct palette on load.

## Conclusion

The Somnium engine’s architecture—mirroring the SCI concept of an interpreter separate from game data—makes it naturally extensible. By adding new features in a modular way and updating the content generation accordingly, we can gradually evolve the project:

- Perhaps in the future, a **Somnium 2.0** might feature 256-color art and point-and-click, akin to 1990 Sierra games. Our current codebase should be a solid foundation to reach that, requiring mainly UI changes and graphical upgrades.
- We could also potentially pivot to other genres that Sierra did (like the sci-fi adventures, or even educational titles) by adjusting content prompts.

Developers are encouraged to experiment by adding small new features, testing them, and ensuring they align with the overall design. The key is to keep the core robust and not to hardcode things that limit variety. As long as we treat the engine as a generic platform for an adventure game and the content as data, we maintain a lot of freedom to extend Somnium in new and exciting directions.
