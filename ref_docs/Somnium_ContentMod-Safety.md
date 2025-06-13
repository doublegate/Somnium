# Content Moderation and Safety Protocols

Somnium leverages an LLM for content generation, which means we must be vigilant about the content quality and safety. This document outlines how we prevent and handle disallowed or inappropriate content, both in the AI’s output and in user interactions. The goal is to ensure the game remains a fun, **appropriate-for-general-audience** experience, akin to Sierra games which, while sometimes edgy (e.g., _Leisure Suit Larry_ innuendo), never crossed into truly objectionable territory.

## Introduction

We follow OpenAI’s content guidelines (or analogous standards if using a different LLM) to filter out content that includes:

- Hate speech or harassment
- Excessive violence or gore
- Sexual content (especially anything involving minors, non-consensual acts, etc., which are absolutely forbidden)
- Extremist ideologies or political propaganda
- Personal identifiable information (PII) – though in our context, AI shouldn’t produce any since it’s making up fiction, but we keep an eye on it.

Additionally, beyond hard disallowed categories, we maintain the **tone consistent with a PG-13 fantasy adventure**:

- Violence may occur (monsters, death traps) but should not be graphically described (Sierra games usually described death in a light or indirect way, often with humorous tone).
- Sexual content: Flirtation or innuendo is fine in comedic contexts (like Larry games) but nothing explicit. No nudity in graphics beyond maybe comical suggestions. We’ll err on side of caution as we don’t have age gating.
- Profanity: Occasional mild expletives might be tolerated (Sierra games had very little – maybe “damn” rarely). The AI should avoid strong profanity unless perhaps used sparingly for comedic effect in appropriate context (and even then, likely unnecessary). We can instruct to avoid f-words and such entirely.

## LLM Output Moderation

We employ a two-layer approach for moderation:

1. **Prompt Engineering:** The initial and dynamic prompts themselves include instructions to avoid disallowed content. For instance, we add at the end of the prompt: _“Do not include any profanity, slurs, or highly explicit content. Stay in the style of a classic adventure game which is family-friendly.”_

   - This steers the model from the get-go. Most LLMs will abide if told clearly.
   - We may enumerate certain categories: “No sexual content involving minors, no extreme gore, etc.”
   - Because our context is fantasy/horror sometimes, we allow horror elements but instruct to keep descriptions atmospheric, not graphic.
   - We mention to avoid modern strong language or references to current real world controversial topics (the game is supposed to be escapist in a fictional world).

2. **Automated Moderation API/Filter:** If using OpenAI or similar, we can leverage their content filter endpoints. Process:

   - After we get the LLM’s initial JSON, run the text portions (plot backstory, descriptions, etc.) through a moderation check. This could be OpenAI’s moderation endpoint which returns flags for hate/sex/violence.
   - If any flag is tripped (especially for disallowed categories), we reject that generation and request a new one (maybe by re-prompting with stronger warnings).
   - We may also log such instances for dev review to adjust prompt if needed (if a theme tends to cause borderline content).
   - The dynamic outputs (which are usually short) can also be moderated the same way before displaying to user. This adds a slight delay, but ensures if the AI tried to say something inappropriate (perhaps in reaction to a user’s provocation), we intercept it.
   - If a dynamic response is flagged, we can do one of:

     - Instead of the AI message, show a canned response like “The character refuses to respond to that.” Or just nothing, effectively like the game ignoring the input.
     - Or re-generate with more constraints if possible (like if the user input is fine but AI gave a borderline response, maybe try again with a stricter system prompt).

   - If user input itself is disallowed (e.g., user types a slur or highly explicit command):

     - We should not feed that raw to the AI (to avoid the AI reacting improperly or being forced to handle it).
     - Instead, we can intercept at parser: detect certain banned words. Possibly simply ignore the command or respond with a mild rebuke: “That kind of language has no effect here.” as some games did easter-eggy.
     - But to be safe, likely we do not send disallowed user content to the LLM at all. We drop or sanitize it, and maybe log if needed.

   - We can maintain a small list of banned user terms locally (for quick filter) and also use the moderation API on user input if available.

**Transparency vs Game Immersion:** We will not show any "Content blocked" messages explicitly, as that breaks immersion. Instead, we handle it in-world:

- If a user tries something disallowed (like sexual assault command or hate speech), the game can respond with a generic failure message in character, or just no effect. E.g., "That's not a proper action." or even a humorous one-liner if appropriate. The key is we do not validate hateful or extreme commands as acceptable actions.

**Edge Cases:**

- The AI might occasionally produce something subtle that triggers filters erroneously (false positive). Example: In a horror theme, it says "blood drips from the ceiling" - mild gore. OpenAI’s filter might allow that (should, it’s not extreme). If it flags mild horror, we might adjust filter thresholds or prompt. We want to allow typical horror tropes (ghosts, blood, etc.) but ensure it doesn’t escalate to torture porn.
- Sexual innuendo in a Larry-like scenario: e.g., describing a scantily clad character. That should be okay as long as not explicit. The filter might mark "sexual" category but not necessarily disallow it if mild. We need to interpret results. Possibly configure that moderate sexual content is allowed but not explicit.
- We define internally what we consider acceptable. For instance, making out might be PG-13, actual described sex acts are not. We instruct AI accordingly.

**Manual Review:** During initial development, developers will review random samples of AI output to ensure compliance. If any content is borderline, refine prompts or add specific disallow instructions.

- For example, if we see AI often making violent descriptions too gory in horror mode, we'll explicitly tell it to tone down gore.
- If in romance scenarios it gets too steamy, we dial it back by instructions or adding a training example of how far to go (like a kiss is fine, anything beyond fade to black).

## User Input Filtering

Users can type anything, so we must guard both for the AI’s sake and for other players if multi-user (not applicable here, single player).

- We implement a simple input filter: if input contains certain slurs or extremely vulgar phrases, we either:

  - Replace them with asterisks before sending to AI or,
  - Simply have the parser respond "Let's keep it civil." or a snarky in-game response. Sierra games sometimes responded to cursing with jokes (like “Such language!”).

- Because it’s a single-player experience, the user only "harms" themselves with bad input, but it could push AI into uncomfortable territory. So it's more about preventing AI from producing something disallowed in reaction.
- For example, if user tries to get the game to describe sexual acts by typing explicit command, our parser can catch a key explicit verb and disallow. Perhaps just treat it as unknown command or say "You must be joking."

We maintain a list of disallowed user inputs (regex for common swear words and slurs). The list should be comprehensive for major languages if we consider localization, but game is in English presumably.

Additionally, if the user tries something like revealing PII (not likely, as it's fictional, but say they type "My name is X, do you know address Y?"), the AI might either not have a clue or hallucinate. That’s not a big risk except if AI tries to produce some real-world info incorrectly. Since game world is fictional, not a main worry.

## Thematic Guidelines

We instruct the AI about thematic limitations:

- **Horror**: It can be scary but not traumatizingly graphic. More psychological or atmospheric horror (like Sierra’s Colonel’s Bequest had murder but not gore on screen).
- **Mystery/Police**: There might be crime scenes or murder. Acceptable to describe a body, but perhaps not in grotesque detail.
- **Fantasy**: Monster violence is fine, but if someone is dismembered, keep it like "the orc falls in battle" rather than describing entrails.
- **No Sexual Violence**: Absolutely off-limits. We ensure the AI never includes it. Likely the AI wouldn’t unless user pushes explicitly, but we put in prompt: “Do not include sexual violence or violence towards children, etc.”
- **Drug use**: Sierra games rarely touched on that, maybe comedic (Larry had wine, etc.). We allow perhaps mentions of alcohol (tavern scenes) but not heavy drug content. If the setting calls for a potion or magical drug, fine, but nothing promoting real drug use.
- **Religion/Politics**: The game likely doesn’t go there, but if it does (like an evil cult in a plot), ensure it’s fictional and not paralleling real groups in a defamatory way. Avoid any real-world religious references that might offend. The AI seldom does unless specifically asked, so it's low risk.

## Moderation Pipeline and Tools

**Pipeline for Initial Generation:**

1. After receiving JSON, iterate through each text field:

   - Plot backstory, goal.
   - Each room’s description.
   - Each item and puzzle description.
   - Also any script text (like responseText in object events).
   - For each, run through moderation filter API if available.
   - Alternatively, combine them into one string and check (OpenAI’s mod can handle a batch).
   - If any disallowed content flagged, we do not use this output. We then:

     - Log the offending content for analysis.
     - Regenerate: possibly we add a stronger instruction and call the LLM again. For instance, if it gave something gory, we update the prompt to say "the game should not include graphic gore".
     - Or we simply re-call the prompt as is; the model might produce something different on second try, maybe milder. But better to adjust prompt if pattern emerges.

   - We have a threshold: some categories like violence will be labeled but not disallowed. We decide if it's acceptable. We might allow a moderate level. For clarity, treat only the "disallowed" or "severe" flags as reject.
   - For borderline (like moderate sexual reference): if it's in context (say a brothel exists in a Larry-like story but nothing explicit), we might allow it. The filter might mark it but not disallow. We could allow those through or do a case-by-case by reviewing that text. Possibly the first few times we’ll manually check such outputs to calibrate.

**Pipeline for Dynamic Prompts:**

- Because dynamic responses are live, we can’t delay too much. But OpenAI’s moderation is fast (\~X ms). We likely still do it asynchronously.
- If flagged disallowed:

  - Instead of showing AI’s text, show a pre-canned safe message. For example:

    - If user tried extreme violence: maybe respond "Violence isn’t the answer to this problem."
    - If user was harassing an NPC with slurs (rare from user side, but if): NPC could respond "The NPC looks offended and refuses to respond."

  - Essentially, handle it in-character but not using AI's possibly offensive output.

- If flagged but only as warning (not hard disallow), we use judgement:

  - The AI might rarely output a strong insult if provoked. We probably want to filter that anyway, because Sierra NPCs rarely used profanity. We could soften it: if dynamic text had a minor swear, either replace it or just choose not to output it. Possibly instruct the AI not to swear at all to avoid even having to do that.

**Logging and Developer Alerts:**

- We will log any instance of blocked content with relevant info (user input that caused it, the AI output snippet that was blocked, etc.) to a secure location for the team. This helps improve the system over time.
- Privacy: since this is single-player offline mostly, logging might only be local or if an online version is used, with user consent. But during testing, definitely.

**Testing Moderation:**

- We deliberately test generating worlds with sensitive themes to see if filters catch them:

  - e.g., theme "serial killer" might push gore. See how filter reacts.
  - Test user inputs of swears, ensure filter triggers and we handle as intended.
  - It's important no false negatives (bad content slipping) or false positives that ruin benign content.

**Adapting to Model Changes:**

- If we upgrade the LLM or it changes behavior, re-check moderation. Perhaps a new model is more verbose or uses more violent descriptors. We then tighten or retrain prompt for that model accordingly.
- Keep an eye on OpenAI policy updates too. If something was okay and later considered not, adapt the filter or content generation to comply.

**User Options:**

- Possibly, allow the user some control: e.g., a "content filter strictness" setting? But likely not needed. We want a safe default experience for all. If someone truly wants unfiltered output, that’s beyond our scope here (and likely not allowed by API usage terms anyway).
- Possibly an option to turn off adult innuendo (for younger players) could be considered, but given the game is inherently a bit complex for very young kids, we assume teen+ audience with mild innuendo is fine.

## Conclusion

By integrating these moderation protocols, we ensure Somnium remains a **safe and enjoyable** experience:

- It adheres to content standards and avoids controversies.
- It stays true to the spirit of classic adventure games, which were generally wholesome with touches of humor and suspense but never truly vile or explicit.
- We protect both our users from seeing unwanted content and our product from potential misuse.

All developers and contributors should be aware of these guidelines. When adjusting prompts or code, consider if the change could allow something problematic and test accordingly. Our content filters and guidelines act as guardrails, but maintaining a cautious approach at the source (the prompt and engine logic) is the best way to prevent issues.
