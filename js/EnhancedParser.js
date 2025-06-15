/**
 * EnhancedParser - Parser with Sierra-style Said pattern matching
 * Integrates SaidPattern system while maintaining compatibility with existing Parser
 */

import { Parser } from './Parser.js';
import { SaidPatternCollection } from './SaidPattern.js';
import { expandDirection } from './vocabulary.js';

export class EnhancedParser extends Parser {
  constructor(vocabulary = {}) {
    super(vocabulary);
    
    // Initialize Sierra-style pattern collection
    this.saidPatterns = new SaidPatternCollection();
    
    // Multi-word verb preprocessing
    this.initializeMultiWordVerbs();
  }

  /**
   * Initialize multi-word verb mappings from Sierra games
   */
  initializeMultiWordVerbs() {
    this.multiWordMappings = {
      'pick up': 'take',
      'put down': 'drop',
      'look at': 'examine',
      'turn on': 'activate',
      'turn off': 'deactivate',
      'climb up': 'ascend',
      'climb down': 'descend',
      'get in': 'enter',
      'get out': 'exit',
      'lie down': 'sleep',
      'stand up': 'stand',
      'sit down': 'sit',
      'wake up': 'wake',
      'put on': 'wear',
      'take off': 'remove',
      'pick lock': 'unlock',
      'listen to': 'listen',
      'think about': 'think',
      'search for': 'search'
    };
  }

  /**
   * Parse player input with Sierra-style pattern matching
   * @override
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      return {
        success: false,
        error: this.vocabulary.errors.noVerb,
      };
    }

    // Handle special cases (again, g)
    if (input.trim().toLowerCase() === 'again' || input.trim().toLowerCase() === 'g') {
      if (this.lastCommand) {
        return this.lastCommand;
      }
      return {
        success: false,
        error: 'No previous command to repeat.',
      };
    }

    // Clean input
    let cleanInput = input.trim().toLowerCase();

    // Try Sierra-style pattern matching first
    const patternMatch = this.saidPatterns.findMatch(cleanInput, this.vocabulary);
    
    if (patternMatch) {
      // Convert pattern match to command structure
      const command = this.convertPatternToCommand(patternMatch);
      
      // Validate the command
      const validation = this.validateCommand(command);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          command: command,
        };
      }

      // Update contexts
      if (command.directObject) {
        this.lastNoun = command.directObject;
        this.lastObject = command.resolvedDirectObject;
      }

      // Store for "again" command
      const result = {
        success: true,
        command: command,
      };
      this.lastCommand = result;

      return result;
    }

    // Fall back to original parser if no pattern matches
    return super.parse(input);
  }

  /**
   * Convert pattern match to command structure
   * @private
   */
  convertPatternToCommand(patternMatch) {
    const { action, captures } = patternMatch;
    
    const command = {
      verb: this.mapActionToVerb(action),
      directObject: null,
      indirectObject: null,
      preposition: null,
      modifiers: [],
      resolvedDirectObject: null,
      resolvedIndirectObject: null,
      action: action // Store original action for CommandExecutor
    };

    // Map captures to command fields
    if (captures.item || captures.object) {
      command.directObject = captures.item || captures.object;
      command.resolvedDirectObject = this.resolveObject(command.directObject);
    }

    if (captures.character || captures.target || captures.person) {
      const target = captures.character || captures.target || captures.person;
      if (command.directObject) {
        command.indirectObject = target;
        command.resolvedIndirectObject = this.resolveObject(target);
      } else {
        command.directObject = target;
        command.resolvedDirectObject = this.resolveObject(target);
      }
    }

    if (captures.container || captures.vendor) {
      command.indirectObject = captures.container || captures.vendor;
      command.resolvedIndirectObject = this.resolveObject(command.indirectObject);
    }

    if (captures.spell) {
      command.spell = captures.spell;
    }

    if (captures.control || captures.equipment) {
      command.directObject = captures.control || captures.equipment;
      command.resolvedDirectObject = this.resolveObject(command.directObject);
    }

    if (captures.value || captures.depth) {
      command.value = captures.value || captures.depth;
    }

    if (captures.topic) {
      command.topic = captures.topic;
    }

    // Handle special movement commands
    if (action === 'GO' && captures.direction) {
      command.directObject = expandDirection(captures.direction);
      command.resolvedDirectObject = command.directObject;
    }

    return command;
  }

  /**
   * Map Sierra action names to game verbs
   * @private
   */
  mapActionToVerb(action) {
    const actionVerbMap = {
      'GIVE': 'give',
      'WAVE_WAND': 'wave',
      'PLAY_INSTRUMENT': 'play',
      'DIG': 'dig',
      'INSERT': 'put',
      'SCAN': 'examine',
      'PUSH_BUTTON': 'push',
      'ORDER': 'order',
      'CAST': 'cast',
      'THROW': 'throw',
      'ASK_ABOUT': 'ask',
      'CLIMB': 'climb',
      'SET_CONTROL': 'set',
      'INSPECT': 'examine',
      'SALUTE': 'salute',
      'DIVE': 'dive',
      'TAKE': 'take',
      'DROP': 'drop',
      'EXAMINE': 'examine',
      'LOOK_IN': 'search',
      'ACTIVATE': 'activate',
      'DEACTIVATE': 'deactivate',
      'ENTER': 'enter',
      'EXIT': 'exit',
      'SLEEP': 'sleep',
      'STAND': 'stand',
      'SIT': 'sit',
      'WAKE': 'wake',
      'WEAR': 'wear',
      'REMOVE': 'remove',
      'UNLOCK': 'unlock',
      'LOCK': 'lock',
      'TALK': 'talk',
      'USE': 'use',
      'OPEN': 'open',
      'CLOSE': 'close',
      'READ': 'read',
      'EAT': 'eat',
      'DRINK': 'drink',
      'SWIM': 'swim',
      'KISS': 'kiss',
      'BUY': 'buy',
      'SELL': 'sell',
      'GO': 'go'
    };

    return actionVerbMap[action] || action.toLowerCase();
  }

  /**
   * Preprocess input to handle multi-word verbs
   * @override
   */
  expandAbbreviations(input) {
    // First handle multi-word verb mappings
    let processed = input;
    
    for (const [multiWord, canonical] of Object.entries(this.multiWordMappings)) {
      const regex = new RegExp(`\\b${multiWord}\\b`, 'g');
      processed = processed.replace(regex, canonical);
    }
    
    // Then handle regular abbreviations
    return super.expandAbbreviations(processed);
  }

  /**
   * Add custom Said pattern
   * @param {string} pattern - Sierra-style pattern
   * @param {string} action - Action name
   */
  addPattern(pattern, action) {
    this.saidPatterns.add(pattern, action);
  }

  /**
   * Get pattern debug info
   * @param {string} input - Input to test
   * @returns {Array} All patterns and their match status
   */
  debugPatterns(input) {
    const results = [];
    
    for (const pattern of this.saidPatterns.patterns) {
      const result = pattern.matches(input, this.vocabulary);
      results.push({
        pattern: pattern.originalPattern,
        action: pattern.action,
        matched: result.matched,
        captures: result.matched ? result.captures : null
      });
    }
    
    return results;
  }
}