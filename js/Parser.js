/**
 * Parser - Processes player text input into structured commands
 * 
 * Responsibilities:
 * - Tokenize player input
 * - Resolve synonyms and abbreviations
 * - Handle pronouns with context
 * - Structure commands for execution
 */

export class Parser {
  /**
   * @param {Object} vocabulary - Verb synonyms and patterns
   */
  constructor(vocabulary) {
    // Core vocabulary
    this.verbs = vocabulary.verbs || [
      'look', 'examine', 'take', 'get', 'drop', 'use', 'open', 'close',
      'go', 'walk', 'run', 'talk', 'give', 'push', 'pull', 'turn',
      'read', 'wear', 'remove', 'inventory', 'save', 'load', 'quit'
    ];
    
    // Synonym mappings
    this.synonyms = vocabulary.synonyms || {
      'l': 'look',
      'x': 'examine',
      'exam': 'examine',
      'get': 'take',
      'grab': 'take',
      'pick': 'take',
      'i': 'inventory',
      'inv': 'inventory',
      'n': 'go north',
      's': 'go south',
      'e': 'go east',
      'w': 'go west',
      'ne': 'go northeast',
      'nw': 'go northwest',
      'se': 'go southeast',
      'sw': 'go southwest',
      'u': 'go up',
      'd': 'go down'
    };
    
    // Prepositions
    this.prepositions = [
      'with', 'to', 'from', 'in', 'on', 'at', 'under', 'over',
      'behind', 'beside', 'between', 'into', 'onto', 'through'
    ];
    
    // Articles to ignore
    this.articles = ['a', 'an', 'the'];
    
    // Pronoun context
    this.lastNoun = null;
    this.lastObject = null;
    
    // Game state reference (set by GameManager)
    this.gameState = null;
  }
  
  /**
   * Parse player input string
   * @param {string} input - Raw input from player
   * @returns {Object|null} ParsedCommand or null if invalid
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }
    
    // Clean and normalize input
    let cleanInput = input.trim().toLowerCase();
    
    // Handle synonyms first
    cleanInput = this.expandSynonyms(cleanInput);
    
    // Tokenize
    const tokens = cleanInput.split(/\s+/).filter(token => token.length > 0);
    
    if (tokens.length === 0) {
      return null;
    }
    
    // Extract verb
    const verb = this.extractVerb(tokens);
    if (!verb) {
      return null;
    }
    
    // Remove verb from tokens
    const remainingTokens = tokens.slice(1);
    
    // Parse the rest of the command
    const parsedCommand = this.parseTokens(verb, remainingTokens);
    
    // Update pronoun context if we found objects
    if (parsedCommand && parsedCommand.directObject) {
      this.lastNoun = parsedCommand.directObject;
    }
    
    return parsedCommand;
  }
  
  /**
   * Add vocabulary synonym
   * @param {string} word - Word to add
   * @param {string} canonical - Canonical form of the word
   */
  addSynonym(word, canonical) {
    this.synonyms[word.toLowerCase()] = canonical.toLowerCase();
  }
  
  /**
   * Update parser context for pronouns
   * @param {GameState} gameState - Current game state
   */
  setContext(gameState) {
    this.gameState = gameState;
  }
  
  /**
   * Expand synonyms in input
   * @private
   * @param {string} input - Input string
   * @returns {string} Expanded input
   */
  expandSynonyms(input) {
    // Check for exact synonym match first
    if (this.synonyms[input]) {
      return this.synonyms[input];
    }
    
    // Then check for word-by-word synonyms
    const words = input.split(/\s+/);
    const expandedWords = words.map(word => this.synonyms[word] || word);
    
    return expandedWords.join(' ');
  }
  
  /**
   * Extract verb from tokens
   * @private
   * @param {Array<string>} tokens - Token array
   * @returns {string|null} Verb or null
   */
  extractVerb(tokens) {
    if (tokens.length === 0) return null;
    
    const firstToken = tokens[0];
    
    // Check if it's a known verb
    if (this.verbs.includes(firstToken)) {
      return firstToken;
    }
    
    // Check for multi-word verbs (like "pick up")
    if (tokens.length > 1) {
      const twoWordVerb = `${tokens[0]} ${tokens[1]}`;
      if (this.verbs.includes(twoWordVerb)) {
        tokens.splice(0, 1); // Remove first token (second will be removed by caller)
        return twoWordVerb;
      }
    }
    
    return null;
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
      preposition: null
    };
    
    // Handle special cases
    if (verb === 'go' && tokens.length > 0) {
      // Direction as direct object for movement
      command.directObject = tokens[0];
      return command;
    }
    
    // Remove articles
    const filteredTokens = tokens.filter(token => !this.articles.includes(token));
    
    if (filteredTokens.length === 0) {
      return command;
    }
    
    // Look for preposition
    let prepositionIndex = -1;
    for (let i = 0; i < filteredTokens.length; i++) {
      if (this.prepositions.includes(filteredTokens[i])) {
        prepositionIndex = i;
        command.preposition = filteredTokens[i];
        break;
      }
    }
    
    // Split tokens by preposition
    if (prepositionIndex > -1) {
      // Everything before preposition is direct object
      const directTokens = filteredTokens.slice(0, prepositionIndex);
      command.directObject = this.resolveObject(directTokens.join(' '));
      
      // Everything after preposition is indirect object
      const indirectTokens = filteredTokens.slice(prepositionIndex + 1);
      if (indirectTokens.length > 0) {
        command.indirectObject = this.resolveObject(indirectTokens.join(' '));
      }
    } else {
      // No preposition, all tokens are direct object
      command.directObject = this.resolveObject(filteredTokens.join(' '));
    }
    
    return command;
  }
  
  /**
   * Resolve object references (handle pronouns, abbreviations)
   * @private
   * @param {string} objectString - Object reference string
   * @returns {string} Resolved object name
   */
  resolveObject(objectString) {
    if (!objectString) return null;
    
    // Handle pronouns
    if (objectString === 'it' || objectString === 'them') {
      return this.lastNoun;
    }
    
    // Handle "all"
    if (objectString === 'all' || objectString === 'everything') {
      return 'all';
    }
    
    // Try to match against known objects in current room
    if (this.gameState) {
      const currentRoom = this.gameState.getCurrentRoom();
      const inventory = this.gameState.getInventory();
      
      // Check room objects
      if (currentRoom && currentRoom.objects) {
        for (const [objId, obj] of Object.entries(currentRoom.objects)) {
          if (this.matchesObject(objectString, obj.name, objId)) {
            return objId;
          }
        }
      }
      
      // Check inventory items
      for (const itemId of inventory) {
        const item = this.gameState.getItem(itemId);
        if (item && this.matchesObject(objectString, item.name, itemId)) {
          return itemId;
        }
      }
      
      // Check global objects
      const allObjects = this.gameState.objects || {};
      for (const [objId, obj] of Object.entries(allObjects)) {
        if (this.matchesObject(objectString, obj.name, objId)) {
          return objId;
        }
      }
    }
    
    // Return as-is if no match found
    return objectString;
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
    return inputWords.every(inputWord => 
      nameWords.some(nameWord => nameWord.startsWith(inputWord))
    );
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
    this.verbs.forEach(verb => {
      if (verb.startsWith(partialLower)) {
        suggestions.push(verb);
      }
    });
    
    // Suggest from synonyms
    Object.keys(this.synonyms).forEach(syn => {
      if (syn.startsWith(partialLower)) {
        suggestions.push(syn);
      }
    });
    
    return suggestions.slice(0, 5); // Limit suggestions
  }
}