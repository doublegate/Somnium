# Testing and QA Plan

Quality Assurance (QA) for Somnium is challenging due to the procedurally generated nature of the game content. We cannot simply test one static game; we must ensure that the engine and AI reliably produce playable experiences across countless variations. Our QA plan addresses testing at multiple levels: unit tests for engine components, integration tests for AI generation, playtesting of generated games, and ongoing regression tests to catch any breakages as the code or AI prompts evolve.

## Objectives

The primary objectives of our testing and QA efforts are:

- **Correctness:** The engine should function as intended (parser correctly parses, renderer draws correctly, etc.), and AI-generated content should meet the expected format and result in solvable games.
- **Stability:** The game should not crash or become unplayable, even with unusual content or user inputs. It should handle error conditions gracefully.
- **Consistency:** The classic Sierra-like experience should be preserved (UI elements working, timing and controls consistent).
- **Safety:** The content should remain within moderated guidelines and not produce disallowed material (addressed in Content Moderation, but testing can help verify filters).
- **Performance:** The game should run smoothly (acceptable frame rates, no memory leaks) on target platforms (modern browsers on PC and potentially mobile).
- **Compatibility:** It should work on different browsers (Chrome, Firefox, Safari, Edge) and different screen sizes without major issues.

## Unit Testing (Engine Components)

We will write unit tests for critical pure logic functions in the engine. Because the engine is mostly JavaScript running in a browser environment, we might use a testing framework like Jest or Mocha that can run in Node for logic, and possibly a headless browser for integration tests.

Key units to test:

- **Parser:** Given various input strings, does it produce the correct command object?

  - Test synonyms (e.g., "look at lamp" vs "examine lamp" vs "lOok LaMp" casing).
  - Test edge cases (no input, gibberish input, commands with punctuation).
  - Test pronoun handling if implemented ("take it" after referencing item).
  - Ensure it handles multi-object commands (like "use key on door") properly.

- **GameState:**

  - Test adding and removing inventory items.
  - Setting and checking flags.
  - Transferring objects between rooms (e.g., if an item is picked up, it should no longer be in the room’s item list, but in inventory).
  - Loading a known state JSON and verifying GameState’s internal representation matches expected.

- **EventManager logic:**

  - Simulate a scenario: set up a dummy GameState with an object that has events, call EventManager with a matching command, and verify it triggers the right sequence (like sets flags, calls SoundManager, etc., which we can stub).
  - Test fallback to AI: If no event, does it correctly hand off to AIManager? (We might stub AIManager to return a dummy response for test.)

- **SceneRenderer’s functions:**

  - We can unit test the math of `drawDitheredGradient` by feeding a small dimension and checking that the pattern of colors in an output ImageData is correct alternating.
  - Test polygon drawing with simple shapes (like triangle) by verifying it covers expected pixels. However, graphical output tests can be brittle; maybe simpler to test that no exceptions occur and that fill style is set properly. We might skip pixel-perfect check aside from small patterns because canvas API itself is reliable if given correct instructions.
  - If we implement priority logic as a function (like computing priority from y coordinate), test that function mapping (e.g., y=0 yields priority 15 vs y=199 yields priority 0 if we do that).

- **SoundManager:**

  - If using Tone.js, unit testing actual audio output is hard. But we can test that given a room’s sound object, SoundManager picks correct instruments or that it calls Tone.js with expected parameters. Possibly stub Tone and verify calls.
  - Test that enabling/disabling sounds (like mute or volume control if any) works.

- **AIManager prompts:**

  - We might write tests that simulate sending a small known prompt to a stubbed LLM and ensure we parse it etc. But without calling actual API in tests. Instead, we can test the logic that builds the prompt string: given a GameState and an action, does AIManager craft the right context string?
  - If we have fallback patterns (like "I don't understand" as default vs LLM response), test that logic toggles appropriately.

We will mock external parts (like the actual LLM API calls) in unit tests to focus on our code. For example, AIManager can be injected with a fake LLM interface that returns a predetermined JSON when asked, so we can test how the engine handles it.

**Automated Testing Tools:** We can use Node + Jest for logic. For any browser-specific parts (like canvas APIs), perhaps use JSDom or a headless Chrome in CI. If that’s too complex, rely more on integration tests (below).

## Integration Testing (LLM and Game Content)

Integration tests involve multiple components working together, and often the live LLM or at least a simulation of it:

- **LLM Generation Test:** We will have a suite of prompts that we feed to the actual LLM (or possibly a local stub if we can’t call external in CI, but for QA manually we can). These include:

  - A standard fantasy theme prompt, ensure it returns JSON and the JSON passes our validation script (no missing fields, correct types).
  - Edge theme or unusual words to see if format breaks.
  - We can automate checking that each required key is present in output and basic sanity (e.g., at least 1 puzzle, at least 1 exit in each room except maybe final room).
  - If possible, run the output JSON through the engine in a headless mode that simulates playing it to verify solvability (see Playtesting).
  - These tests help catch if an update to the AI or our prompt inadvertently changed output structure (e.g., after some time the model might start adding an extra key or missing one).

- **Complete Game Simulation:** For a given generated JSON, we can simulate a playthrough:

  - Use puzzle definitions to attempt to solve the game. We can write a solver that:

    - Starts at start room.
    - Repeatedly, if a puzzle is unsolved, perform the solution action (e.g., if puzzle says use X on Y, simulate those commands via Parser/EventManager).
    - Moves through exits that become enabled.
    - This requires that puzzles and structure indeed lead to goal. If our solver script cannot find a way to reach the goal, either generation was flawed or solver logic might be missing something (like maybe multiple ways or a linear order expectation).
    - We might not capture complex puzzles (like one puzzle unlocks multiple, etc.), but at least ensure no puzzle is completely blocking due to missing item.

  - Additionally, test saving and loading in the middle of this simulation to ensure state is truly preserved (like save, then modify some stuff in memory, then load, and check it matches original saved state).
  - This simulation can be run in a headless environment using the core game classes with some slight modifications (like injecting a “virtual player”).

- **Cross-Browser Basic Tests:** We can use Selenium or Playwright to automate launching the game in multiple browsers with a small script:

  - E.g., automatically start a new game, wait for generation, then type a couple of commands (like "look around", "inventory") and verify that output appears (maybe by querying DOM elements).
  - This can catch if something works in Chrome but not in Safari due to, say, an Audio context issue or canvas behavior differences.
  - We likely won’t do a full solve in UI automation (complex), but at least ensure UI elements (menu click) do not throw errors.

- **Performance and Memory Test:** Use browser dev tools or an automated performance API if available:

  - Generate a large world (maybe trick the AI to produce 15 rooms, etc.) and see if any memory spikes, or how fast it loads.
  - Keep the game running and simulate a lot of commands quickly (maybe via script) to see if memory increases (memory leak).
  - Also test extreme cases: if LLM gave e.g. 50 primitives in a room, does it slow down rendering significantly? We can measure frame rate by triggering animations and using `performance.now()` in a test harness.
  - Ensure that our asset generation (like if we created images for sprites) isn’t leaking (like many canvases left in memory).

## Playtesting and Solvability

No amount of unit tests can replace actual playtesting for a game:

- **Team Playtesting:** The development team (and possibly a pool of beta testers) will regularly play a variety of generated games from start to finish. We encourage testers to:

  - Try different themes to cover different content styles.
  - Deliberately input some unusual commands to see how dynamic LLM responds.
  - Save and load at various points to ensure it works and doesn’t break narrative.
  - Note any puzzles that felt unsolvable or clues insufficient.
  - Check that all puzzles can indeed be solved logically (e.g., not requiring guess-the-verb beyond what synonyms allow, etc.).
  - Note any content issues (like an item described as red but drawn as blue, minor but immersion issues).

- **Solvability Verification:** For each playtest game, did the player manage to win? If not, why:

  - If it was due to a generation flaw (key item never generated, puzzle logic contradictory), we log that JSON as a test case and adjust prompts or add safeguards in generation.
  - If due to parser issues (player typed a valid command and game didn’t understand while it should), we improve parser synonyms or documentation.
  - If due to difficulty, consider if we allow hint system or adjust puzzle generation to be slightly more hinting (we can prompt AI to include puzzle `description` as hint).

- **UX Feedback:** Testers also note things like:

  - Are text messages appearing in a timely fashion? (No big lag aside from initial gen).
  - Are there any UI annoyances (like needing to click input box every time, or text scrolling issues).
  - Does the Speed setting work (maybe test slow/fast speeds for animation).
  - On different resolutions (some might play in a small window vs fullscreen scaling).

- **Regression Playtesting:** After any significant change (engine code change, prompt tweak, LLM model update), do a quick playthrough of at least one game to make sure nothing obvious broke. We keep a known seed (if we implement seeding deterministically for testing) to regenerate a specific world for this purpose, to compare behavior before/after changes.

## Content QA and Safety Checks

While content moderation filters handle the automatic blocking of disallowed content, QA should double-check:

- Generate a game with a theme that could be sensitive (e.g., horror might get graphic). See if any descriptions cross the line (too gory, etc.). If so, maybe tighten prompt guidelines.
- Similarly, try to prompt the dynamic LLM by doing potentially problematic actions:

  - e.g., “kill character” – does it respond with some gore? If yes, adjust to be more mild (“That’s not a good idea” or a fade-out).
  - "do something sexual" – ensure the response is either a humorous rebuff or something that doesn't go into detail (like how Leisure Suit Larry handled it with jokes).

- Test profanity input: user swears; likely our filter might block it or the LLM responds with an in-character scolding. Ensure it doesn’t escalate or produce slurs.
- If any content violations slip through, adapt the content moderation rules or prompt instructions, and add that scenario to test cases.

Additionally, ensure the **content rating** stays consistent. If we advertise as Teen, testers should verify no unexpectedly adult content arises from random generations. If an edge case does (LLM can occasionally do weird things), we may have to adjust our moderation or instruct the AI more firmly not to include that (like “no sexual content” in prompt if not already).

## Performance and Compatibility Testing

- **Frame Rate**: Especially when multiple animations or large rooms:

  - Use dev tools Timeline to see if our rendering stays within 16ms per frame (for 60fps) or at least 30fps on typical machines. If heavy, optimize (maybe we find that drawing a full screen dither every frame is slow, so we then only draw background once and blit it – such decisions come from performance test).
  - On older devices or mobile, see if the canvas is sluggish. Possibly implement lowering frame rate or detail if needed for slower devices (maybe not needed given simplicity).

- **Memory**: With Tone.js and big JSON, check memory usage. A full game JSON might be a few hundred KB in memory, which is fine. But ensure Tone.js isn’t leaking instruments each room. We might test switching music tracks 50 times to see if memory grows.
- **Browser differences**:

  - Safari is known for stricter audio policies (need user interaction for audio), test that starting a game actually triggers audio after input (if not, may require a user gesture or show a "Click to start audio" button).
  - Also canvas rendering differences (shouldn’t be many in 2D canvas).
  - Local file saving: ensure it works in all browsers (some may not allow initiating download via blob easily). Test Save on each browser - does it download a file? And Load - is file input working? Possibly need polyfills.
  - Test on mobile browsers if intended: Is the UI usable (text input on mobile could be tricky, keyboard pops up overlaying canvas?). If mobile is not a target, at least ensure it doesn’t break if someone tries.

## Continuous Integration (CI)

We aim to incorporate these tests in a CI pipeline:

- Every commit runs unit tests and integration validation (maybe not actual LLM calls to avoid cost - we can mock or use a cached known output).
- We can store one or two example JSON outputs (from known seeds) as fixtures and test that our engine can load and solve those in CI. This way, even if we don’t call the AI, we have a regression baseline of content to test engine logic.
- Linting or type checking (if using TypeScript or similar) to catch code issues early.

## Testing Save/Load and File Format

We create specific tests for the save system:

- Start a game (maybe with a small dummy JSON), change some state, call save. Then load that output and verify all state matches.
- Do fuzz testing: randomly flip a bit in a save file and try load, see if we handle gracefully (maybe our code will throw parse error or if format differences).
- Backward compatibility: If we release an update that changes GameState structure, we might increment save version. We should test that loading old version either converts or at least doesn't break horribly (maybe show an error "incompatible save" rather than crash). If we plan to maintain backward compatibility, include conversion code and test that with old sample saves.

## Beta Testing and Feedback Loop

Finally, once an alpha version is ready, we plan a closed beta:

- Provide it to a group of adventure game enthusiasts. They are likely to try all sorts of things and give qualitative feedback on fun factor, narrative quality, and any frustrations.
- Collect logs from their playthroughs (with permission). Could instrument the game to log commands and maybe LLM response times, etc., to our server for analysis (particularly any error occurrences).
- Use this feedback to refine either game design (maybe puzzles should be slightly simpler or have multiple solutions if many get stuck), or refine AI prompts (if narrative is too random or puzzles too hard/easy, we adjust prompt to influence that).
- Also, get feedback on whether it indeed _feels_ like a Sierra game. If not, what’s missing? Perhaps people want a score displayed (if we didn’t implement yet), or more death scenarios (some Sierra players expect to be able to die in stupid ways). We can then add content in generation to include occasional dangers, etc.

Testing in an AI-driven game is an ongoing process; the unpredictability means we will continuously encounter new scenarios. Thus, part of the QA plan is also to **monitor in production**:

- If we have analytics or crash logging, we keep an eye on any unhandled exceptions thrown.
- Provide a way for players to report issues directly (like a feedback form that can attach the save file or seed for debugging).
- Periodically, take a sample of newly generated worlds and do a quick sanity check that none of the new LLM updates changed the style drastically (since AI services can evolve their models).

By following this comprehensive QA plan, we aim to catch as many issues as possible before release and maintain the high quality of the Somnium experience as both the engine and the AI content evolve.
