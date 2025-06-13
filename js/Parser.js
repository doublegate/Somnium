/**
 * Parser - Processes player text input into structured commands
 *
 * Responsibilities:
 * - Tokenize player input
 * - Resolve synonyms and abbreviations
 * - Handle pronouns with context
 * - Structure commands for execution
 */

import {
  VOCABULARY,
  getCanonicalVerb,
  isVerb,
  expandDirection,
} from './vocabulary.js';

export class Parser {
  /**
   * @param {Object} vocabulary - Optional custom vocabulary overrides
   */
  constructor(vocabulary = {}) {
    // Merge custom vocabulary with defaults
    this.vocabulary = { ...VOCABULARY, ...vocabulary };

    // Pronoun context tracking
    this.lastNoun = null;
    this.lastObject = null;
    this.lastRoom = null;

    // Recent command history for "again" command
    this.lastCommand = null;

    // Game state reference (set by GameManager)
    this.gameState = null;

    // Ambiguous object resolution
    this.ambiguousObjects = [];
  }

  /**
   * Parse player input string
   * @param {string} input - Raw input from player
   * @returns {Object|null} ParsedCommand or null if invalid
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        error: this.vocabulary.errors.noVerb,
      };
    }

    // Handle special case: "again" or "g"
    if (
      input.trim().toLowerCase() === 'again' ||
      input.trim().toLowerCase() === 'g'
    ) {
      if (this.lastCommand) {
        return this.lastCommand;
      }
      return {
        success: false,
        error: 'No previous command to repeat.',
      };
    }

    // Clean and normalize input
    let cleanInput = input.trim().toLowerCase();

    // Remove filler words
    this.vocabulary.fillers.forEach((filler) => {
      cleanInput = cleanInput.replace(new RegExp(`\\b${filler}\\b`, 'g'), '');
    });

    // Expand abbreviations
    cleanInput = this.expandAbbreviations(cleanInput);

    // Tokenize
    const tokens = cleanInput.split(/\s+/).filter((token) => token.length > 0);

    if (tokens.length === 0) {
      return {
        success: false,
        error: this.vocabulary.errors.noVerb,
      };
    }

    // Extract verb (might be multi-word)
    const verbResult = this.extractVerb(tokens);
    if (!verbResult.verb) {
      return {
        success: false,
        error: this.vocabulary.errors.unknownVerb,
      };
    }

    // Parse the rest of the command
    const parsedCommand = this.parseTokens(
      verbResult.verb,
      verbResult.remainingTokens
    );

    // Validate the command
    const validation = this.validateCommand(parsedCommand);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        command: parsedCommand,
      };
    }

    // Update contexts
    if (parsedCommand.directObject) {
      this.lastNoun = parsedCommand.directObject;
      this.lastObject = parsedCommand.resolvedDirectObject;
    }

    // Store for "again" command
    const result = {
      success: true,
      command: parsedCommand,
    };
    this.lastCommand = result;

    return result;
  }

  /**
   * Add vocabulary synonym
   * @param {string} word - Word to add
   * @param {string} canonical - Canonical form of the word
   */
  addSynonym(word, canonical) {
    const canonicalLower = canonical.toLowerCase();
    const wordLower = word.toLowerCase();

    // Find which verb list to add to
    if (this.vocabulary.verbs[canonicalLower]) {
      this.vocabulary.verbs[canonicalLower].push(wordLower);
    } else {
      // Add to abbreviations if it's a simple mapping
      this.vocabulary.abbreviations[wordLower] = canonicalLower;
    }
  }

  /**
   * Update parser context for pronouns
   * @param {GameState} gameState - Current game state
   */
  setContext(gameState) {
    this.gameState = gameState;
  }

  /**
   * Expand abbreviations in input
   * @private
   * @param {string} input - Input string
   * @returns {string} Expanded input
   */
  expandAbbreviations(input) {
    // Check for exact abbreviation match first
    if (this.vocabulary.abbreviations[input]) {
      return this.vocabulary.abbreviations[input];
    }

    // Then check for word-by-word abbreviations
    const words = input.split(/\s+/);
    const expandedWords = words.map(
      (word) => this.vocabulary.abbreviations[word] || word
    );

    return expandedWords.join(' ');
  }

  /**
   * Extract verb from tokens
   * @private
   * @param {Array<string>} tokens - Token array
   * @returns {Object} {verb: string|null, remainingTokens: Array}
   */
  extractVerb(tokens) {
    if (tokens.length === 0) {
      return { verb: null, remainingTokens: [] };
    }

    // Try multi-word verbs first (longest match)
    for (let length = Math.min(3, tokens.length); length > 0; length--) {
      const possibleVerb = tokens.slice(0, length).join(' ');

      // Check if it's a multi-word verb
      if (this.vocabulary.multiWordVerbs.includes(possibleVerb)) {
        const canonical = getCanonicalVerb(possibleVerb);
        return {
          verb: canonical || possibleVerb,
          remainingTokens: tokens.slice(length),
        };
      }

      // Check if it's a known verb or synonym
      if (length === 1 && isVerb(possibleVerb)) {
        const canonical = getCanonicalVerb(possibleVerb);
        return {
          verb: canonical || possibleVerb,
          remainingTokens: tokens.slice(1),
        };
      }
    }

    return { verb: null, remainingTokens: tokens };
  }

  /**
   * Parse remaining tokens after verb
   * @private
   * @param {string} verb - The verb
   * @param {Array<string>} tokens - Remaining tokens
   * @returns {Object} ParsedCommand object
   */
  parseTokens(verb, tokens) {
    const command = {
      verb: verb,
      directObject: null,
      indirectObject: null,
      preposition: null,
      modifiers: [],
      resolvedDirectObject: null,
      resolvedIndirectObject: null,
    };

    // Handle special cases
    if (verb === 'go' && tokens.length > 0) {
      // Expand direction and treat as direct object
      const direction = expandDirection(tokens[0]);
      command.directObject = direction;
      command.resolvedDirectObject = direction;
      return command;
    }

    // Remove articles and track modifiers
    const processedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (this.vocabulary.articles.includes(token)) {
        continue; // Skip articles
      }

      if (this.vocabulary.special.all.includes(token)) {
        command.modifiers.push('all');
        command.directObject = 'all';
        command.resolvedDirectObject = { type: 'special', value: 'all' };
        continue;
      }

      processedTokens.push(token);
    }

    if (processedTokens.length === 0) {
      return command;
    }

    // Look for preposition
    let prepositionIndex = -1;
    for (let i = 0; i < processedTokens.length; i++) {
      if (this.vocabulary.prepositions.includes(processedTokens[i])) {
        prepositionIndex = i;
        command.preposition = processedTokens[i];
        break;
      }
    }

    // Split tokens by preposition
    if (prepositionIndex > -1) {
      // Everything before preposition is direct object
      const directTokens = processedTokens.slice(0, prepositionIndex);
      if (directTokens.length > 0) {
        const directPhrase = directTokens.join(' ');
        command.directObject = directPhrase;
        command.resolvedDirectObject = this.resolveObject(directPhrase);
      }

      // Everything after preposition is indirect object
      const indirectTokens = processedTokens.slice(prepositionIndex + 1);
      if (indirectTokens.length > 0) {
        const indirectPhrase = indirectTokens.join(' ');
        command.indirectObject = indirectPhrase;
        command.resolvedIndirectObject = this.resolveObject(indirectPhrase);
      }
    } else {
      // No preposition, all tokens are direct object
      const directPhrase = processedTokens.join(' ');
      command.directObject = directPhrase;
      command.resolvedDirectObject = this.resolveObject(directPhrase);
    }

    // Special case: "look at X" should treat X as direct object
    if (
      command.verb === 'look' &&
      command.preposition === 'at' &&
      command.indirectObject &&
      !command.directObject
    ) {
      command.directObject = command.indirectObject;
      command.resolvedDirectObject = command.resolvedIndirectObject;
      command.indirectObject = null;
      command.resolvedIndirectObject = null;
      command.preposition = null;
    }

    return command;
  }

  /**
   * Resolve object references (handle pronouns, abbreviations)
   * @private
   * @param {string} objectString - Object reference string
   * @returns {Object|string|null} Resolved object or string
   */
  resolveObject(objectString) {
    if (!objectString) return null;

    // Handle pronouns
    if (this.vocabulary.pronouns.direct.includes(objectString)) {
      return this.lastObject || this.lastNoun;
    }

    // Handle "all"
    if (this.vocabulary.special.all.includes(objectString)) {
      return { type: 'special', value: 'all' };
    }

    // Try to match against known objects
    if (this.gameState) {
      const matches = this.findMatchingObjects(objectString);

      if (matches.length === 0) {
        return { type: 'unknown', value: objectString };
      }

      if (matches.length === 1) {
        return { type: 'object', value: matches[0].id, object: matches[0] };
      }

      // Multiple matches - store for disambiguation
      this.ambiguousObjects = matches;
      return {
        type: 'ambiguous',
        value: objectString,
        matches: matches.map((m) => ({ id: m.id, name: m.name })),
      };
    }

    // Return as-is if no game state
    return { type: 'literal', value: objectString };
  }

  /**
   * Find all objects matching the given string
   * @private
   * @param {string} objectString - String to match
   * @returns {Array} Array of matching objects
   */
  findMatchingObjects(objectString) {
    const matches = [];
    const currentRoom = this.gameState.getCurrentRoom();
    const inventory = this.gameState.getInventory();

    // Helper to add unique matches
    const addMatch = (obj, location) => {
      if (this.matchesObject(objectString, obj.name, obj.id)) {
        matches.push({ ...obj, location });
      }
    };

    // Check room objects
    if (currentRoom && currentRoom.objects) {
      Object.values(currentRoom.objects).forEach((obj) => {
        addMatch(obj, 'room');
      });
    }

    // Check room items
    if (currentRoom && currentRoom.items) {
      currentRoom.items.forEach((itemId) => {
        const item = this.gameState.getItem(itemId);
        if (item) addMatch(item, 'room');
      });
    }

    // Check inventory
    inventory.forEach((itemId) => {
      const item = this.gameState.getItem(itemId);
      if (item) addMatch(item, 'inventory');
    });

    // Check NPCs in room
    if (currentRoom && currentRoom.npcs) {
      Object.values(currentRoom.npcs).forEach((npc) => {
        addMatch(npc, 'room');
      });
    }

    return matches;
  }

  /**
   * Check if input matches object name
   * @private
   * @param {string} input - Player input
   * @param {string} objectName - Full object name
   * @param {string} objectId - Object ID
   * @returns {boolean} Whether it matches
   */
  matchesObject(input, objectName, objectId) {
    if (!objectName) return false;

    const inputLower = input.toLowerCase();
    const nameLower = objectName.toLowerCase();
    const idLower = objectId.toLowerCase();

    // Exact match
    if (inputLower === nameLower || inputLower === idLower) {
      return true;
    }

    // Partial match from start
    if (nameLower.startsWith(inputLower)) {
      return true;
    }

    // Match individual words
    const inputWords = inputLower.split(/\s+/);
    const nameWords = nameLower.split(/\s+/);

    // Check if all input words appear in name
    return inputWords.every((inputWord) =>
      nameWords.some((nameWord) => nameWord.startsWith(inputWord))
    );
  }

  /**
   * Validate a parsed command
   * @private
   * @param {Object} command - Parsed command
   * @returns {Object} {valid: boolean, error?: string}
   */
  validateCommand(command) {
    // Commands that don't need objects
    const noObjectVerbs = [
      'look',
      'inventory',
      'wait',
      'save',
      'load',
      'quit',
      'help',
      'score',
      'restart',
    ];

    if (noObjectVerbs.includes(command.verb)) {
      return { valid: true };
    }

    // Movement commands just need a direction
    if (command.verb === 'go') {
      if (!command.directObject) {
        return {
          valid: false,
          error: 'Go where? Please specify a direction.',
        };
      }
      return { valid: true };
    }

    // Commands that need a direct object
    const needsObjectVerbs = [
      'take',
      'drop',
      'examine',
      'use',
      'open',
      'close',
      'read',
      'eat',
      'drink',
    ];

    if (needsObjectVerbs.includes(command.verb) && !command.directObject) {
      return {
        valid: false,
        error: this.vocabulary.errors.needMoreInfo.replace(
          '{verb}',
          command.verb
        ),
      };
    }

    // Commands that need both objects
    const needsBothVerbs = ['give', 'put', 'use'];

    if (
      needsBothVerbs.includes(command.verb) &&
      command.directObject &&
      !command.indirectObject &&
      command.preposition
    ) {
      return {
        valid: false,
        error: this.vocabulary.errors.needIndirectObject
          .replace('{verb}', command.verb)
          .replace('{object}', command.directObject)
          .replace('{preposition}', command.preposition),
      };
    }

    // Check for ambiguous objects
    if (command.resolvedDirectObject?.type === 'ambiguous') {
      const names = command.resolvedDirectObject.matches
        .map((m) => m.name)
        .join(', ');
      return {
        valid: false,
        error: `Which one? I see: ${names}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get suggestions for partial input (for autocomplete)
   * @param {string} partial - Partial input
   * @returns {Array<string>} Suggested completions
   */
  getSuggestions(partial) {
    if (!partial) return [];

    const partialLower = partial.toLowerCase();
    const suggestions = [];

    // Suggest verbs
    Object.keys(this.vocabulary.verbs).forEach((verb) => {
      if (verb.startsWith(partialLower)) {
        suggestions.push(verb);
      }
    });

    // Suggest verb synonyms
    Object.values(this.vocabulary.verbs).forEach((synonyms) => {
      synonyms.forEach((syn) => {
        if (syn.startsWith(partialLower)) {
          suggestions.push(syn);
        }
      });
    });

    // Suggest from abbreviations
    Object.keys(this.vocabulary.abbreviations).forEach((abbr) => {
      if (abbr.startsWith(partialLower)) {
        suggestions.push(abbr);
      }
    });

    // Remove duplicates and limit
    return [...new Set(suggestions)].slice(0, 8);
  }

  /**
   * Resolve ambiguous object reference
   * @param {string} clarification - User's clarification input
   * @returns {Object|null} Resolved object or null
   */
  resolveAmbiguity(clarification) {
    if (!this.ambiguousObjects || this.ambiguousObjects.length === 0) {
      return null;
    }

    // Try to match clarification against ambiguous objects
    for (const obj of this.ambiguousObjects) {
      if (this.matchesObject(clarification, obj.name, obj.id)) {
        // Clear ambiguity
        this.ambiguousObjects = [];
        return obj;
      }
    }

    return null;
  }
}
