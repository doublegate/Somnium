# SCI-Style Graphics Generation Guide for Somnium (Expanded)

## The SCI0 Aesthetic

To achieve the nostalgic look of Sierra’s late-1980s adventures, we meticulously adhere to the graphical constraints and style principles of the **SCI0 engine era**:

- **Resolution:** 320×200 pixels, in a 4:3 aspect ratio (which on modern displays will likely be scaled with nearest-neighbor for a crisp pixel look). This low resolution is exactly what _King’s Quest IV_, _Police Quest II_, etc., used and is key to replicating their appearance. Every pixel is therefore a noticeable square of color, and artists in that era had to be creative in using this limited canvas.

- **Color Palette:** The _fixed 16-color EGA palette_ is our immutable artistic constraint. All backgrounds and sprites use only these 16 colors:

  - Black `#000000`
  - Blue `#0000AA`
  - Green `#00AA00`
  - Cyan `#00AAAA`
  - Red `#AA0000`
  - Magenta `#AA00AA`
  - Brown (dark yellow) `#AA5500`
  - Light Gray `#AAAAAA`
  - Dark Gray `#555555`
  - Bright Blue `#5555FF`
  - Bright Green `#55FF55`
  - Bright Cyan `#55FFFF`
  - Bright Red `#FF5555`
  - Bright Magenta `#FF55FF`
  - Bright Yellow `#FFFF55`
  - White `#FFFFFF`

  This palette is identical to what SCI0 games used and gives Somnium its authentic retro vibrancy. No colors outside this set are ever drawn (when the LLM describes scenes, it uses these colors by name or hex). If needed, we map any color names the AI gives to the nearest EGA color. The palette may seem extremely limited by today’s standards, but Sierra artists achieved amazing results within it, and we aim to do the same via procedural means.

- **Painterly Dithering:** A hallmark of SCI0 backgrounds is the heavy use of **dithering** to simulate intermediate colors and gradients. Dithering is the technique of alternating two colors in a checkerboard or patterned way so that from a distance they visually blend. Sierra’s backgrounds rarely showed large flat fills; instead, they’d dither, for example, light blue and black to suggest a darker blue or a gradient in the sky. This gave a more “painted” and rich look compared to the earlier AGI engine which often had flat colors. In Somnium, dithering is our primary tool for expanding the perceived color range beyond the base 16. We instruct the LLM to include `dithered_gradient` primitives in room graphics for any area that should have a smooth transition, like skies, water, shadows, etc.. Our renderer will implement dithering exactly (alternating pixel patterns). The two primary dithering patterns we use are 2×2 checkerboard (the most common, producing a 50-50 mix) and potentially ordered dithering for larger gradients. By combining different base colors, we effectively get many pseudo-colors; indeed, SCI games could achieve up to 120 unique dither combinations from 16 colors by mixing pairs. We won’t explicitly simulate all 120, but the concept is the same – any gradient or shading is done by mixing two of the 16 colors.

- **Detail Density:** Compared to the older AGI games (which had 160×200 resolution and simpler art), SCI0 scenes are **more detailed and less sparse**. Backgrounds include more objects, irregular terrain, and decorative elements. For example, a forest screen in KQ4 might have multiple trees, bushes, a log, and flowers, where an AGI version might’ve had just a couple trees. We push the AI to emulate this detail. Rooms in Somnium should not feel empty; they should have the little touches (rocks, furniture, wall hangings, etc.) that make them visually interesting, just as Sierra’s artists populated scenes with lots of pixel-level detail.

- **Visual Composition and Perspective:** Sierra’s SCI0 backgrounds usually employed a **2.5D perspective** (third-person side view with some depth). Typically, the scene has a foreground at the bottom where the player walks, and background toward the top. The artists drew scenes with a slight horizon or vanishing point effect to give depth (e.g., walls angling inward slightly, roads converging). We attempt to replicate this by instructing the AI to place horizon lines, use perspective scaling (things farther are smaller), and we interpret the primitives accordingly. While true perspective drawing is complex for an AI to output, we approximate it by convention: e.g., objects higher on the screen are assumed farther away and should be drawn smaller or partly behind nearer objects. We simulate a camera angle similar to Sierra’s (approximately eye-level or slightly elevated view into the scene).

- **Three “Screens” Concept:** Sierra’s engine had the notion of **Visual**, **Priority**, and **Control** screens for each room:

  - _Visual_ is the actual art.
  - _Priority_ is an invisible layer that assigns a depth value (0–15) to every pixel for sorting sprites (higher priority means drawn in front of lower priority).
  - _Control_ is another invisible layer marking zones for triggers or impassable areas.

  In Somnium, we implicitly recreate these:

  - Priority: Instead of a separate priority bitmap, our engine might derive priority from object positions or allow the AI to label certain primitives with a priority number (or we assume priority = y coordinate band, as Sierra did by default where the screen was divided vertically into priority bands). The SceneRenderer can keep a parallel 2D array for priority if needed. This ensures the player can walk behind or in front of things correctly. For example, in a room with a table, the table’s upper part might have a higher priority (so the player appears behind it when walking behind the table).
  - Control: We haven’t explicitly asked the AI to define control polygons, as it’s quite technical. Instead, we might auto-generate a control map from certain primitives labeled as “solid” or from their shapes. For example, if a rock is drawn, we can mark its area as non-walkable. Or the AI could mark boundaries: perhaps an exit leads off-screen at certain edges, so everything else is implicitly blocked. If needed, future prompt versions might allow the AI to specify control regions (like a polygon for impassable water, etc.). The engine’s default will be that anything at the extreme edges of the screen is blocked except where an exit is, to prevent walking off-screen randomly.

- **Sprites (“VIEWs”):** Character and object sprites in SCI0 share the same palette and are drawn to scale with the backgrounds. Typically, the hero is around 30–50 pixels tall depending on perspective and game. We enforce that any sprite the AI creates use only the 16 colors (with similar dithering if needed for shading). The style of sprites is usually cartoonish but can have shading. We will likely have a library of basic sprite shapes (for a person, animal, etc.) and recolor or tweak them per AI’s description, because expecting the AI to output pixel art directly is not reliable. However, we do have the AI specify animations (like frames of walking). We ensure the animations are a bit choppy as in old games (like 5-6 frames per loop at most, low frame rates \~5–10 fps for animation). This gives that quirky, slightly jerky motion that evokes the era.

- **UI Elements:** Although minor, the interface UI (menu bar, text window, etc.) also follows the aesthetic:

  - The menu bar in SCI0 often had solid colors or simple gradients. We might use a Sierra-style font for menu text (white text on black or grey background).
  - The text window in SCI0 was a blue rectangle with white text (in early SCI) or sometimes gray with black text depending on user settings. We can mimic the classic look: a medium blue background for the text box with a white border, and white or light gray font in a pixelated font (we could use a font like IBM PC 8x16 or Sierra’s fonts if available).
  - Any icons (like the cursor or if we implement a simple inventory icon view) would also be drawn in 16 colors minimalistic form. Sierra’s parser games had an arrow cursor for menus, etc., we can replicate that.

&#x20;*An example screen from *King’s Quest IV* (1988, SCI0) showing the classic 16-color EGA palette, heavy dithering (e.g., the sky and water gradients), and a mix of bold and subtle details. Somnium aims to generate scenes with a similar level of detail and style.*

The above screenshot illustrates the kind of outcome we want from our AI-generated graphics: note the gradient of the sky achieved by mixing blues and black in a checker pattern, the textured appearance of the sand with dithered brown/yellow, and the distinct but limited colors used for Rosella’s sprite and other objects. We instruct our system to create **comparable visuals** so that a player would be hard-pressed to distinguish a Somnium scene from a hand-crafted Sierra scene at first glance.

## Graphics Generation Strategy

Creating graphics via AI for a game requires bridging descriptive text and actual drawable output. We adopt a **procedural generation strategy** steered by the LLM’s output:

1. **AI Scene Description:** Each room in the generated JSON contains a `graphics` object which is essentially a recipe for drawing the background. We prompt the LLM to be _specific_ in these recipes. Instead of just saying “a forest with trees,” the AI output should enumerate the important shapes and their colors (e.g., a green canopy, brown tree trunks, dithered patches of light for sunlight, etc.). This is achieved by providing the LLM with examples of the JSON format for graphics (as we did in development) and by reminding it of the 16-color limitation and dithering usage. For example, the LLM might output something like the earlier snippet: a list of rectangles, polygons, and gradients with exact coordinates/dimensions.

   To get variety, we allow shapes like:

   - **Rectangles (`rect`)**: For large fills like sky, ground, walls.
   - **Polygons (`polygon`)**: For irregular shapes – mountains, paths, lakes, furniture silhouettes.
   - **Circles or Ovals (`circle` or `ellipse`)**: If needed for round objects like a sun, pond, etc. We can approximate circles via polygon or have a direct draw function.
   - **Lines (`line`)**: For thin things like a horizon line or narrow objects (though those could be polygons too).
   - **Custom short-hands**: e.g., `star` as used in the example, which essentially places point-like highlights (we interpret a `star` primitive as drawing small crosshair or sparkles at given points to depict stars or sparkles).
   - **Dithered gradients**: A special primitive that takes two colors and fills an area with a checkerboard blend. We let the LLM specify the two colors and the area; the engine fills it in a 2×2 pattern (alternating pixels) or a more advanced pattern if we implement it. This is crucial for skies, water, lighting gradients on walls, etc.

   We encourage the AI to label shapes meaningfully (the `label` field) for our understanding, though the engine doesn’t require labels except for debug. Labels like “floor”, “back_wall”, “table” help debug the scene and could be used if we wanted to associate an object with a drawn region (but currently, interactive objects should be separate in the `objects` list rather than solely implied by graphics).

   **Example:** The _Tamir beach (SCI)_ scene above might be described as:

   - A blue rectangle for ocean, a dithered gradient for sky from dark blue to black, a polygon for cliffs in grey, some smaller polygons or lines for waves or foam, etc. The AI output for that could list those shapes, which our engine would then draw sequentially to produce a similar image.

2. **Drawing Order and Layering:** We instruct the LLM that the order of the `primitives` array matters. In Sierra’s original PIC format, drawings were sequential – later commands could overwrite pixels of earlier ones. We mimic that: if you want a tree to appear in front of the sky, the tree shape must come after the sky gradient in the list. The LLM thus essentially decides layering by the sequence of shapes. We’ve given it examples to illustrate this (e.g., draw background first, then foreground objects). If the AI ever outputs shapes in a weird order (like ground drawn after an object on the ground, causing overlap issues), our SceneRenderer might not correct it automatically, so we rely on the prompt examples to have taught it the right ordering.

   In trickier cases, such as an object that a character should walk behind partially (like a table), how do we handle that in a static draw? Sierra handled it with the priority layer. We can simulate by splitting the object’s drawing into parts: for example, draw the _back part_ of the table as a shape (so player can go behind it), but not draw the front legs, then have the table also exist as an interactive object so that our engine knows it’s there for collision and then perhaps draw the front part as part of the sprite or another layer with priority. This is complex to ask of the AI, so a simpler method: we could decide that anything meant to be an obstacle will always be drawn completely and we won’t allow the player’s sprite’s Y to go lower than a certain point (so effectively, they can’t step in front of it). Or we use priority hack: e.g., assign that object’s pixels a certain priority in an internal map so player sprite can be drawn behind those pixels if y is less than object’s base. For now, the simpler approach is to limit movement region so that it doesn’t visually conflict with drawn objects (like if a table is drawn, the player might not be able to walk “in front” of it at all, only behind, if it’s up against a wall).

3. **Procedural Generation via Engine:** While the LLM provides the blueprint, the heavy lifting of turning those instructions into pixels is done by the **SceneRenderer**:

   - When `drawScene(roomData)` is called for a room, it clears the canvas to the room’s `backgroundColor` and then iterates through `roomData.graphics.primitives`.
   - For each primitive:

     - If `shape === 'rect'`: it calls the canvas `fillRect(x, y, w, h)` with the specified color.
     - If `shape === 'polygon'`: it uses `beginPath()` and `moveTo`/`lineTo` for each point, then `fill()` with the color to draw the polygon (likely assuming the polygon is convex or simple).
     - If `shape === 'line'`: it would use `moveTo`/`lineTo` and stroke with that color (though thickness 1 so it’s basically a 1px line).
     - If `shape === 'circle'`: we can approximate with `arc()` or draw an ellipse polygon.
     - If `shape === 'dithered_gradient'`: it calls a custom function `drawDitheredGradient(dims, color1, color2)`. In our implementation:

       ```js
       drawDitheredGradient([x, y, w, h], color1, color2) {
         for (let j = 0; j < h; j++) {
           for (let i = 0; i < w; i++) {
             // Checker pattern: e.g., (i + j) % 2 alternates colors
             this.ctx.fillStyle = ((i + j) % 2 === 0) ? color1 : color2;
             this.ctx.fillRect(x + i, y + j, 1, 1);
           }
         }
       }
       ```

       This will produce a 2-color checkerboard area. We might enhance this later to allow other patterns (like 2×2 blocks or vertical stripe dithers), but checker is a good default. The result is a combined color area.

     - If `shape === 'star'`: We define it so that given an array of `points`, for each point (px, py) we draw a small plus-shaped sparkle or just a single pixel of that color (depending on the desired look). Possibly a star could be drawn as a plus: 1 pixel at (px,py) and maybe one pixel on each side (px±1, py and px, py±1). Or just a bright pixel if we interpret it as distant star. This can be used for night sky stars or glitter.
     - We continue through all primitives. Complex scenes might have 10-20 primitives.

   By using these primitives, we lean on the CPU to draw vectors and patterns in real time. This is efficient given the low res – drawing even a full 320x200 gradient pixel by pixel is trivial for modern JS on a single frame, as that’s only 64k pixels.

4. **Dynamic Elements vs Static Background:** The background drawn by SceneRenderer is static for the room (unless we implement palette shifts or cycling for effects, which SCI did for things like water animations or lighting—maybe a future enhancement). Anything that moves (like characters, or a flickering light) is handled by sprites (VIEWs) via ViewManager. The background may include things like a door or item that later gets removed. How do we remove or change part of a background? In Sierra SCI, if an object needed to disappear (like an drawn object that becomes pickable), they often actually drew it as part of background and then just overlaid a sprite to cover/hide it or redrew background section. For us, since backgrounds are redrawn from scratch when needed, the simpler solution is:

   - If something might change (like a door opening), treat it as an object/sprite from the start rather than part of the static background. For example, the closed door could be drawn as part of background initially, but if it needs to animate open, better to have it as a sprite so we can change its image. Or we draw two states and use the one appropriate when redrawing.
   - The LLM could include conditional graphics (which is complicated), so more practically, we’ll rely on objects. E.g., define door as an `object` with an image (sprite) that can be toggled. The background might have the doorway hole behind it drawn, and the door sprite on top that can vanish when opened.
   - For items that are part of scenery then picked up (like a key on a table), often Sierra drew them as part of background until picked up (for performance). We can do similarly or treat them as a small sprite lying there. Our engine could handle either, but treating them as sprites simplifies removal (just stop drawing the item sprite once picked up, as opposed to needing to redraw background over it—though we _can_ redraw background easily since we have the drawing commands).

5. **Inspiration from Sierra Techniques:** Sierra artists had a few tricks we note:

   - **Palette Cycling:** In SCI0, they sometimes cycled palette entries to animate things like water or light. E.g., one color index would be rapidly swapped between blue shades to make water shimmer. We could simulate that by slight color changes in our dither patterns. For now, we are not doing palette cycling (since our images are drawn with actual colors, not indices). But a future idea: assign certain primitives a tag that they should cycle between two colors every few frames (a simple effect). For example, we could make a “water” primitive that alternates its blue brightness—Tone.js or the main loop could call SceneRenderer to recolor it every second. This could add life to scenes.
   - **Lighting and Shadows:** With only 16 colors, artists used high contrast for light. We encourage the AI to draw shadows as black or dark gray shapes and highlights as white or bright colors. These can be polygons layered over base colors. For instance, an indoor room might have a black polygon covering most of it to indicate darkness, with a “hole” shape cut out for a light beam (since we can’t easily do translucency, they would have drawn the lit area separately). We can mimic by careful layering (draw base, then dark polygon leaving a gap).
   - **Texturing:** Repetitive patterns like brick walls or grassy ground were done by manually stippling pixels. Our approach can approximate some textures via small repeated shapes. For example, an `object` or repeated primitive for each brick – but that’s too heavy. Instead, instruct AI to suggest pattern: e.g., use a checker of dark/light brown to imply dirt, or small polka dots of green on dark green for foliage. We might create a `patternFill` primitive in future (like supply a small pattern matrix and tile it).
   - **Comparison of AGI vs SCI art:** The Sierra Chest screenshots (see KQ4 SCI vs AGI images) show how SCI added more shading and details. In our context, we explicitly push for those extra details via more primitives. Instead of a single polygon for ground, the AI might produce multiple overlapping polygons of slightly different colors to simulate uneven terrain. For water, rather than flat cyan, we might have cyan with streaks of white (for foam) or darker blue patches.

6. **Character and Object Drawing:** Sprites (VIEWs) are drawn separately by ViewManager, but their graphics need to be generated or sourced. We have a few strategies:

   - **Procedural Placeholder Sprites:** For development, if the AI says a character is a “guard” wearing red, we might not have an actual drawn guard. We can generate a placeholder by drawing a human shape: e.g., a 10-pixel wide, 20-pixel tall figure with some color blocks (maybe use #AA0000 for shirt if red). This can be done by code (like a tiny drawing routine) or use a very simple template image tinted.
   - **Predefined Sprite Library:** We may have a small library of generic EGA sprites: a male hero, a female hero, a monster, etc., drawn beforehand. The LLM could reference them by describing them (like if “guard” we use the generic guard sprite). We could map keywords in the LLM’s description to choose a sprite. This isn’t in JSON explicitly, but something the engine can do behind the scenes when interpreting the view description. For example, if the view’s `loops` are given but actual pixel data not, we assign an appropriate sprite sheet from our assets and use that.
   - **LLM-Generated ASCII Art (experimental):** There’s a possibility to have the LLM output a very low-res ASCII or matrix representation of a sprite. For example, it could output a 5x7 grid of characters representing colors (0-9 or A-F for the palette index). This was toyed in initial designs but is quite advanced and error-prone for the LLM. If done, our engine could parse that into an actual canvas image. At this point, we assume the LLM will not provide pixel-level detail and instead rely on engine side choices.
   - **Scaling and Perspective:** Sprites should scale when moving in depth (like if the character moves far up the screen, they appear smaller). Sierra’s approach was priority bands but same size sprite (they didn’t scale sprites in SCI0). So we might similarly not scale dynamically (the character stays same pixel size always). This can look a bit odd (hero near horizon still as tall as in foreground) but was accepted in those games. Alternatively, we could pre-scale or have two versions of each sprite (small and large) and switch when the character goes far away. This is a possible extension (like a crude form of perspective scaling).
   - **Animation Loops:** The LLM can define loops (walk, idle, talk). Our engine will cycle through frames at a set rate. We ensure that, as per classics, walking animations loop as the character moves, and idle animations play when standing. We can have the hero’s walking speed tied to frame rate (to avoid “moonwalking”). Each sprite’s frames can be stored as an Image or offscreen canvas after generation for quick blitting each frame.

7. **Visual Consistency:** We aim for each game’s visuals to be internally consistent (the style should not wildly change from room to room). Because the same LLM and prompt generates all rooms, we expect a cohesive style. However, one challenge is _varied environments_ – Sierra games often had diverse locales (especially in something like Quest for Glory which had forest, town, desert). The palette being fixed helps unify them, but the AI might choose very different scene compositions. We have a function to perhaps post-process certain things for consistency:

   - Ensure the overall brightness or contrast of scenes doesn’t vary too much (e.g., not one room all dark and another blindingly bright unless context says night vs day).
   - If multiple rooms represent the same area (like several screens of a forest), we might detect that from names and ensure the color usage is similar.
   - However, we like some variety if story demands (like a spooky cave should indeed be darker than a sunny meadow). So mostly we trust the LLM’s context-awareness.

8. **Performance:** By using vector primitives, our backgrounds are lightweight to store (just some coordinates) and fast to draw. Even on mobile devices, 320x200 with maybe up to 1000 drawing operations per scene (which is on the high side) is fine at 60 fps if needed, since typically backgrounds only redraw on room entry or when something changes drastically. Animations are drawn on top without redrawing the whole background every frame (we use a two-layer approach: static background can be cached to an offscreen canvas, and then moving sprites are drawn each frame on a copy of that background, or via compositing). We likely implement double-buffering: one canvas for background, one for foreground, combine or just redraw background to main canvas when needed.

In summary, **Somnium’s graphics pipeline** tries to automate what Sierra artists did by hand: draw shapes and apply clever color tricks to create beautiful scenes under strict limitations. By leveraging AI to outline scenes and a custom renderer to execute them, we generate retro visuals on the fly. The result should evoke nostalgia while being generated anew each time.

## Implementation in SceneRenderer.js

Below we highlight how the SceneRenderer class handles SCI-style drawing based on the primitives, including some code snippets:

```js
// SceneRenderer.js - Conceptual SCI Additions (Pseudo-code/Examples)
class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    // The context is set to imageSmoothingEnabled = false to preserve hard edges
    this.ctx.imageSmoothingEnabled = false;
  }

  drawScene(roomData) {
    // Fill background
    this.ctx.fillStyle = roomData.graphics.backgroundColor || '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    // Draw each primitive in order
    for (const primitive of roomData.graphics.primitives) {
      let shape = primitive.shape;
      let color = primitive.color;
      this.ctx.fillStyle = color;
      switch (shape) {
        case 'rect':
          // dims: [x, y, width, height]
          this.ctx.fillRect(...primitive.dims);
          break;
        case 'polygon':
          this.ctx.beginPath();
          const points = primitive.points;
          this.ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i][0], points[i][1]);
          }
          this.ctx.closePath();
          this.ctx.fill();
          break;
        case 'line':
          this.ctx.strokeStyle = color;
          this.ctx.beginPath();
          this.ctx.moveTo(primitive.points[0][0], primitive.points[0][1]);
          this.ctx.lineTo(primitive.points[1][0], primitive.points[1][1]);
          this.ctx.stroke();
          break;
        case 'dithered_gradient':
          const [x, y, w, h] = primitive.dims;
          this.drawDitheredGradient(
            x,
            y,
            w,
            h,
            primitive.colors[0],
            primitive.colors[1]
          );
          break;
        case 'circle':
          const [cx, cy, r] = primitive.dims; // e.g., center x,y and radius
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
          this.ctx.fill();
          break;
        case 'star':
          for (const [sx, sy] of primitive.points) {
            this.drawStarPixel(sx, sy, color);
          }
          break;
        // ... (more shapes as needed)
      }
    }
  }

  drawDitheredGradient(x, y, w, h, color1, color2) {
    // Basic checkerboard dithering
    const imgData = this.ctx.createImageData(w, h);
    // Convert color hex to RGBA for performance, or fill row by row
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const useColor1 = (i + j) % 2 === 0;
        const [r, g, b] = useColor1
          ? this.hexToRGB(color1)
          : this.hexToRGB(color2);
        const index = (j * w + i) * 4;
        imgData.data[index] = r;
        imgData.data[index + 1] = g;
        imgData.data[index + 2] = b;
        imgData.data[index + 3] = 255; // opaque
      }
    }
    this.ctx.putImageData(imgData, x, y);
  }

  drawStarPixel(x, y, color) {
    // Draw a plus-shaped star (3x3 cross)
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 1, 1);
    this.ctx.fillRect(x - 1, y, 1, 1);
    this.ctx.fillRect(x + 1, y, 1, 1);
    this.ctx.fillRect(x, y - 1, 1, 1);
    this.ctx.fillRect(x, y + 1, 1, 1);
  }

  hexToRGB(hex) {
    // Utility to parse hex like "#AA00AA"
    hex = hex.replace('#', '');
    let bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
}
```

The above pseudocode illustrates handling of various primitives. In practice, we ensure this code is optimized (like caching colors or using `fillRect` for each pixel might be slow, so constructing an ImageData as shown is one solution for dithering). Also note:

- We disable anti-aliasing by `imageSmoothingEnabled = false`, so shapes have pixelated edges (which is what we want for purity – no subpixel blending).
- The `drawStarPixel` draws a star as a plus; we might adjust if we just want a point.
- For polygons, we assume the points are given such that the polygon can be filled (AI should give either convex shapes or we accept concave as long as the fill rule covers it).
- If needed, we add a `patternFill` method to do repeating patterns.

**Testing the Renderer:** We test the SceneRenderer with known scenarios (like the example JSON from the guide) to ensure it produces expected output. We compare it against reference screenshots from Sierra games to tune color usage and dithering patterns.

## Dynamic Graphics Adjustments

While backgrounds are static after generation, we allow some runtime graphical effects:

- **Room Transitions:** When moving between rooms, we might use a simple fade or wipe effect (like Sierra sometimes did a screen wipe). This can be done by quickly drawing a black rectangle increasing, or fade the canvas via globalAlpha.

- **Night/Day Cycle:** If a generated game has a notion of time (like KQ4 did), we could simulate day to night by altering the palette. E.g., if at night, we could darken certain colors by swapping the palette to more blues. Since we don't have multiple palettes in use (unlike SCI which could switch palettes on the fly), we might instead have two versions of backgrounds (the LLM could output two sets of colors for two times). This is advanced and likely not in initial scope, but the architecture (with vector redraw) would allow us to recolor and redraw a scene to simulate dusk or dawn relatively easily if the content supports it.

- **Animated Background elements:** If the LLM specifies something like a flickering sign or a flowing waterfall, ideally those should animate. Sierra might do that with a looping script that toggles some pixels or uses a cell-based animation on background (like the water in SQ3 might use a view overlay). In Somnium, we could treat such as a sprite animation overlaying the background. Or, easier, incorporate it into the view system (like a waterfall is just a view with an animation loop of a few frames).
  The AI currently doesn’t explicitly separate those, but if the prompt yields something like “waterfall_view” in views and places it in room, we handle it.

In conclusion, our graphics generation approach carefully balances **AI-driven description** and **engine-side rendering** to recreate the SCI0 aesthetic. Developers working on Somnium’s graphics should focus on expanding the library of primitive shapes, optimizing drawing routines, and perhaps incorporating more of Sierra’s visual tricks (priority layers, palette shifts) as needed. But even with the basics of rectangles, polygons, and dithering, we achieve scenes that strongly evoke 1980s Sierra games, bringing players that warm wave of nostalgia in a freshly generated world.
