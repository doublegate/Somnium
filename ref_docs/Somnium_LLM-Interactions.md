# LLM Interaction Protocols for Somnium (Expanded)

Somnium’s integration with a Large Language Model (LLM) is central to its dynamic content generation. This document details the **prompt structures** and communication patterns used to interface with the LLM, as well as measures to maintain consistency and handle the LLM’s output in the game context.

## 1. Initial World Generation Prompt

**Purpose:** At the start of a new game, we send a _master prompt_ to the LLM instructing it to generate an entire game world as a JSON object. This JSON encompasses the plot, rooms, items, puzzles, and optionally any other resources (objects, NPCs, etc.). The prompt is carefully crafted to ensure the output is well-structured, internally consistent, and follows the design constraints (like the Sierra-style elements we need).

**Prompt Template:** The prompt we send looks roughly as follows (with some variations for theme seeding):

_"Generate a complete, self-contained, and solvable text adventure game in the style of a 1989 Sierra SCI0 graphical adventure. The theme should be \[one of: fantasy, sci-fi, mystery, horror]. The game must be structured as a JSON object._

_The JSON object must have the following root keys: `"plot"`, `"rooms"`, `"puzzles"`, and `"items"`._

1. **plot**: An object containing:

   - `title`: A creative title for this adventure.
   - `backstory`: A short paragraph (backstory) explaining the setup.
   - `goal`: A clear, one-sentence description of what the player must achieve to win.

2. **items**: An array of item objects, each having:

   - `id`: A unique lowercase string ID (e.g., `"rusty_key"`).
   - `name`: A display name (e.g., `"a rusty key"`).
   - `description`: A sentence describing the item when the player looks at it.

3. **puzzles**: An array of puzzle objects, each defining a single obstacle:

   - `id`: A unique string ID (e.g., `"locked_door_puzzle"`).
   - `description`: A hint or clue about the puzzle (for optional use as a hint to the player).
   - `obstacle`: The text describing the obstacle (e.g., `"The heavy oak door is locked."`).
   - `solution`: An object defining the requirement to solve:

     - `verb`: The required player action (e.g., `"use"`, `"unlock"`).
     - `item`: The `id` of the item needed (e.g., `"rusty_key"`).
     - `target`: (Optional) the `id` of the object or entity that item must be used on (e.g., `"oak_door"`).

   - `reward_text`: The text to display when the puzzle is solved (narrating the result).
   - `unlocks`: An action that happens upon solving (e.g., enabling a new exit, revealing an item, etc., represented as a small JSON snippet like `{"type": "ENABLE_EXIT", "roomId": "hallway", "exit": "north"}`).

4. **rooms**: An array of room objects. **The first room in the array is the starting room.** Each room must have:

   - `id`: A unique lowercase string ID (e.g., `"dusty_cellar"`).
   - `name`: A short display name for the room (e.g., `"Dusty Cellar"`).
   - `description`: The main text description of the room (what the player sees on entering).
   - `exits`: An object mapping directions to destination room IDs (e.g., `{"north": "hallway", "up": "attic"}`).
   - `items`: An array of item IDs present in this room initially.
   - `objects`: An array of interactive object IDs present in the room.
   - `sound`: An object describing the room’s audio environment:

     - `music_theme`: A short descriptive prompt for a procedural music generator (e.g., `"A slow, lonely piano melody in a minor key"`, `"An upbeat, heroic fanfare with synth brass"`).
     - `ambience`: A description of looping ambient sound (e.g., `"The sound of dripping water and distant echoes"`, `"A low electronic hum and occasional computer beeps"`).

   - `graphics`: A procedural graphics object for the room’s background:

     - `backgroundColor`: An EGA hex code for the background base (e.g., `"#000000"`).
     - `primitives`: An array of objects describing shapes (supports at least `rect`, `polygon`, and `"dithered_gradient"` among others), to be drawn in order to create the scene.
     - (The `graphics` can also include any other shape or visual details as needed.)

_The entire response must be a single, valid JSON object and nothing else._ Ensure all IDs are internally consistent (exits refer to actual room IDs, puzzle item references exist, etc.). The game must be winnable (the goal can be achieved with the provided puzzles and items)."

In practice, the prompt we send through the API might also include some system-level instructions like:

- The LLM should **not include any explanatory text** or apologies, just the JSON.
- It should stick to the format even if it’s creative.
- It may have a token limit, so we hint at a reasonable size (we don’t want a 100k character output; usually aiming for maybe 5k-10k characters).
- We also updated the prompt to emphasize _sound design cues_ and _graphics details_ as seen above, because earlier versions might have omitted those.

**Theme Selection:** If the player chooses a theme or seed, we insert that into the prompt. E.g., if the player selected “horror”, we ensure the prompt says “The theme is horror.” or includes that word to bias content (monsters, spooky atmosphere). If they provide a custom seed word, we might say: “Theme: haunted; incorporate a haunted mansion element,” etc. This guides the randomness.

**Example Snippet from Prompt:**

```
... style of a 1989 Sierra SCI0 adventure. The theme should be haunted (horror).
The game must be structured as JSON...
```

This way, the LLM tailors the content (monsters, darkness, etc., for horror, or aliens/tech for sci-fi, etc.).

**Expected Output Validation:** The LLM’s response is supposed to be just JSON. On receiving it:

- We parse it with a JSON parser. If it fails to parse, we might have gotten invalid JSON (LLM could have introduced an extra comment or some natural language if it deviated). In such case, our AIManager can attempt to fix minor issues (like adding a missing comma or quote if it’s obvious) or, if it’s too broken, we may ask the LLM again with a prompt like “Your output was not valid JSON, please follow the format strictly.”
- We then validate content consistency:

  - Make sure at least one room is present.
  - The first room is reachable (starting room).
  - Check each exit leads to a valid room (if not, we might either drop that exit or guess if a typo).
  - Check each puzzle’s item and target exist in items/objects.
  - Check items referenced in rooms exist in the items list.
  - If any validation fails, we have options:

    - Ideally, we have the LLM do it right first try by prompt. But if something is off, we could programmatically correct small things (like if it said exit to `"celar"` but actual id is `"cellar"`, we fix spelling).
    - Or we can go back to LLM: feed back “There was a consistency error: X. Please correct and output the JSON again.”

  - Our goal is to avoid multiple round-trips to keep load time short, but we also want a playable game. In practice, a well-crafted prompt and perhaps examples in fine-tuning should minimize errors.

**Sound and Graphics in Initial Generation:** One enhancement we included is the `sound` and `graphics` in each room, which earlier iterations lacked. This ensures the LLM gives us:

- A music prompt and ambience line per room (which SoundManager will use to create audio).
- A graphics set of primitives per room (for SceneRenderer).
  This way the initial JSON fully describes audio-visual aspects, not just text. We specifically mention the `"dithered_gradient"` support so the LLM knows it can use that to make nice gradients.

**Plot and Puzzle Coherence:** We instruct the LLM the game “must be solvable/winnable”. This implies:

- There is a clear `goal` and once achieved, presumably the game ends. The LLM might not explicitly say how it ends, but we can consider the goal puzzle as implicit final event.
- The puzzles should gate progress logically. If puzzle says unlocking a door unlocks an exit, then reaching the goal likely involves going through that door eventually.
- We also want no extraneous items or puzzles that aren’t used (like a red herring item or an unsolvable puzzle).
- There’s some risk the LLM might create more puzzles than necessary or an item with no use. In Sierra games, sometimes extra items exist only for points or flavor, which is okay as long as critical path is intact. We can allow some, but we check that every `puzzles.solution.item` is obtainable and used properly.

**LLM Limitations and Mitigations:** LLM might be tempted to write a lot of narrative or break character (like explaining why it chose something). The structure demand usually keeps it focused. We include phrases like “and nothing else” to ensure it doesn’t add fluff outside JSON. Additionally:

- We avoid asking for any dialogue text in the initial JSON beyond descriptions, because dynamic interactions can cover that. If we did, it could blow up the size. (We might allow some object events text e.g., `responseText` for look/touch which is fine).
- We emphasize style: “in the style of a 1989 Sierra game” to influence the tone of descriptions (they should be concise, present-tense, second-person, sometimes humorous). This is subtle, but it helps. We also mention it’s a text adventure which hints not to produce graphics or anything but text and structured data.

## 2. Dynamic Interaction Prompt

While the world generation is one-time per game, dynamic prompts occur whenever the player tries something that isn’t pre-defined by the JSON scripts.

The dynamic interaction prompt remains similar to what we used in earlier prototypes, but with the SCI context in mind. Essentially, when we need the LLM’s help during gameplay, we craft a prompt such as:

_Context:_ (we provide a description of the current situation)

- Current room name and description.
- Notable objects in the room and their descriptions or states.
- Inventory items the player has.
- Possibly relevant flags or puzzle states (if it would affect the response, e.g., if an NPC is angry or if the lights are off).
- The last narration that was shown, if any (to provide continuity).
- The player’s input/action that wasn’t handled by a script.

_Instruction:_ "You are the game’s narrative engine. The player just attempted: `[player’s input]`. Respond as the game would, describing the outcome or the character’s dialogue, in one or two sentences, staying in style. If the action cannot be done, respond with a gentle message or witty remark, rather than a generic error."

We do **not** ask it to output JSON for dynamic interactions (that would be too slow and unnecessary for every small action). Instead, we want just a plain text response (or possibly a single snippet of script). Since the engine itself handles state, we usually treat the LLM’s dynamic answer as _flavor text only_. We explicitly instruct it not to change the core game state in these responses (because we can’t fully trust it to make consistent state changes). However, the LLM might imply something (like “the dragon looks at you annoyed”). If that’s purely narrative, fine; if it implies a state (dragon_is_angry), we could optionally set that flag if we want emergent behavior, but we have to be cautious. Usually, critical state changes are done via the designed puzzles/scripts, not freeform interactions.

**Why keep dynamic prompt mostly text?** To ensure the game doesn’t go off rails. We want LLM to embellish the experience but not accidentally hand out a key or kill an NPC because the player typed a weird command – unless such is logical. So we lean towards safe responses.

**Example dynamic prompt usage:**

- Player types `"talk to ghost"`. Suppose no `onTalk` script on ghost object.
- Engine builds prompt: "Room: Lighthouse Interior. Description: 'You stand in a dusty circular room...' Objects: ghost (an apparition floating...). The ghost is currently calm. Inventory: (list items). Player action: talk to ghost."
- LLM might reply: `"The ghost lets out a hollow laugh and whispers, 'Find my locket...'"`
- Engine displays that as the game text output. Now, interestingly, the ghost hinted at a locket. That’s unscripted content. If there's indeed no locket in the game originally, this is just flavor or a red herring (unless the LLM cleverly weaved something it knows – maybe there's a puzzle with a ghost needing a locket? It could be inventing one on the fly, which could confuse the player if not real).
- To mitigate such issues, our dynamic prompt instructs the LLM to **stay within the established game world** and not introduce new key items or puzzles spontaneously. It can give hints or flavor that align with existing puzzles. For example, if the ghost’s backstory was in `plot` or we have an item like "silver locket" in items (maybe not used yet), then it’s fine for LLM to mention it. But if not, that could mislead. So we might include in context a quick list of all puzzle goals or items to avoid “creating from scratch.” And instruct: “Do not introduce new items or puzzle-critical information not present in the game data.”

The dynamic prompt in earlier version was something like: _"The player is playing a text adventure. Given the context and their command, respond with the game output."_ We maintain that structure. It has proven effective in testing because the LLM can produce very contextually appropriate and sometimes amusing responses to unusual commands, which greatly enhances the experience beyond rote error messages.

We do **not** change the dynamic prompt specifically for SCI beyond ensuring the style remains fitting:

- If the game is comedic (like a Leisure Suit Larry style scenario), the LLM likely picks up on that from descriptions and will respond in kind with humor.
- If it’s a serious mystery, it will keep a serious tone.

We don't need to tell it about graphics or sounds in dynamic prompt; those are handled by engine. The dynamic prompt is purely for textual interaction.

**No Change in Structure:** Our dynamic prompt format did not require changes when moving from a simpler text adventure to this more complex SCI-like one. It’s still basically: _“Given this game state and command, output what happens.”_ The richness of game state is higher now (more objects, etc.), but LLMs handle that if given properly.

**Ensuring brevity:** We instruct dynamic responses to be concise (a sentence or two). Sierra games never dumped paragraphs for a single action usually. And long outputs slow down the game. So we might say “respond in one or two sentences.”

**Preventing Meta or Invalid Output:** We guard the prompt so the LLM doesn’t say things like “As an AI, I cannot...”. We already set role as the game, and context helps. Also “nothing else but the response.”

**Edge Cases:** If a player input is completely off-the-wall (like swearing at an NPC, or asking the game to do something out of scope), the LLM might try a witty retort. We allow some playful responses (Sierra games sometimes had easter egg responses to profanity or bizarre actions). But we also have **Content Moderation** protocols (see that document) to ensure it doesn’t produce anything nasty. Usually, we’d filter the input or output if it’s inappropriate.

**Memory and Continuity:** For dynamic prompts, one challenge is if the player has a long interaction, can the LLM remember earlier unscripted info it introduced? Since each dynamic call is stateless unless we provide previous dialogue as context, the LLM might forget what it improvised. Our strategy:

- Keep dynamic interactions mostly one-off and not crucial to plot, so consistency isn’t a big issue. If the ghost said “Find my locket” but we had no locket, either the player ignores it or if we want, we add a note to GameState that ghost mentioned a locket. But that would be going off script – typically better avoid.
- If the player engages in a conversation by repeatedly using dynamic queries (like multiple “ask about X”), the engine could include the last LLM answer as part of context for the next one (“Previously, the ghost said: '...'. Now player asks about Y.”). This gives some continuity for that session. We have to be careful not to overflow token limit with too much context, so maybe limit to last one or two exchanges.

**Summarizing dynamic protocol:**

- It’s triggered as needed, not for every command (only when not handled by JSON scripts).
- It’s designed to make the game respond intelligently to a wide range of inputs.
- It leverages the same LLM but in a lightweight manner (less output, presumably lower cost per call).
- It keeps the game world immersive by avoiding generic “I don’t understand” messages and instead providing context-aware responses.

## 3. Maintaining Coherence and Preventing AI Goofs

While not a separate prompt, it’s worth detailing how we ensure the LLM interactions (both initial and dynamic) maintain a stable game experience:

- **Style Enforcement:** We pass along in either the system or user prompt that the style should mimic Sierra’s tone. For example, we might include, “Maintain a light narrative tone consistent with 1980s Sierra adventures. The narrator is third-person, past-tense is generally avoided in descriptions (use present tense), and occasionally humorous observations are welcome for invalid actions.” This gives flavor guidance.

- **No Breaking the Fourth Wall:** The LLM should not reveal that content is AI-generated or talk about “the JSON” to the player. In initial generation, since it outputs JSON, that’s fine. In dynamic, it should remain in-world. We add instructions like: “Never mention you are an AI or talk about JSON or the player’s real world—stay in the game world perspective.”

- **Safety and Moderation:** As detailed in the Content Moderation doc, we filter what goes to the LLM (to avoid disallowed requests) and what comes out. We instruct the LLM in the prompt to avoid extreme violence, sexual content beyond innuendo, or derogatory language, because Sierra games, while they had adult humor (Larry) or violence (e.g., deaths in Police Quest), they did so in a relatively mild manner. We emphasize a **PG-13** level rating in style guidelines.

- **Re-rolling and Corrections:** If initial generation produces something broken, we might regenerate entirely or fix via a smaller follow-up prompt. If dynamic output is unsatisfactory (e.g., it ignores the command or is bland), we might not re-roll because that would double latency; instead maybe just live with it or design better prompt next time.

- **Gemini API Endpoint:** In the architecture, it mentions a Gemini API. This suggests perhaps using Google’s Gemini LLM. Regardless of which (OpenAI GPT, etc.), the principle is same. The exact API usage and keys are abstracted in AIManager, but as devs we must ensure not to hit rate limits or cost overrun by too frequent calls. We implemented caching for dynamic responses for repeated identical inputs or known common phrases (like if the player types "look around" many times, we might just reuse the room description rather than calling AI each time).

- **Multi-turn example:** Suppose a player tries a multi-step unscripted interaction: “ask guard about treasure” (no script), LLM says guard grunts. Player: “hit guard” (no script, LLM maybe says guard got angry). We might then set a flag guard_angry. If the player then tries “ask guard about treasure” again, maybe we put in context that guard is now angry. The LLM then might respond with an angrier retort. This emergent behavior is possible if we manage context and state carefully. It’s a cool way to simulate more complex NPC interaction. However, we also have to ensure the AI doesn’t let the player circumvent puzzles via clever asks (like telling where the key is hidden outright, unless puzzle structure allowed asking NPC for hints).

  - We mitigate that by not giving the LLM puzzle solutions in dynamic context unless an NPC would logically hint it. The LLM only knows what’s in JSON plus what’s happened. It might deduce solutions though (these models are clever!). For example, if the puzzle is a locked door and the player asks an NPC “how to open door?”, the LLM might output something like “NPC says: maybe there’s a key nearby.” That’s actually reasonable as a hint. We allow that, as Sierra games had subtle or not-so-subtle hints in dialogues at times.

In conclusion, the LLM interaction protocols ensure that:

- **Initial generation** produces a robust game framework with all necessary data.
- **Dynamic interactions** use the LLM to enrich gameplay beyond what was pre-authored, making the game feel smart and responsive like a human dungeon master behind the scenes.
- Throughout, consistency, style, and safety are maintained so the experience is smooth and true to the classic adventure spirit.

Developers can tweak the prompts as needed if the LLM’s outputs show patterns of error. It’s an iterative process. The provided prompt structure has been refined to cover most needs, but as LLM or requirements change, we may add fields (for example, an “objects” root key explicitly, or more complex puzzle logic). If so, we update the prompt and this document accordingly, always ensuring the LLM is explicitly told about any new structure to prevent formatting mistakes.
