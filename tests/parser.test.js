import { Parser } from '../js/Parser.js';
import { GameState } from '../js/GameState.js';

describe('Parser', () => {
  let parser;
  let gameState;

  beforeEach(() => {
    parser = new Parser();
    gameState = new GameState();

    // Set up mock game data in the correct format
    const mockGameData = {
      startRoom: 'library',
      rooms: {
        library: {
          id: 'library',
          name: 'Library',
          description: 'A dusty old library.',
          graphics: {
            background: '#0000aa',
            objects: [],
          },
          objects: {
            desk: {
              id: 'desk',
              name: 'wooden desk',
              description: 'An old oak desk.',
            },
            book: {
              id: 'book',
              name: 'red book',
              description: 'A leather-bound book.',
            },
          },
          items: ['brass_key'],
          exits: {
            north: { roomId: 'hallway', enabled: true },
            east: { roomId: 'study', enabled: true },
          },
        },
        hallway: {
          id: 'hallway',
          name: 'Hallway',
          description: 'A long corridor.',
          graphics: { background: '#0000aa', objects: [] },
          exits: {
            south: { roomId: 'library', enabled: true },
          },
        },
        study: {
          id: 'study',
          name: 'Study',
          description: 'A cozy study.',
          graphics: { background: '#0000aa', objects: [] },
          exits: {
            west: { roomId: 'library', enabled: true },
          },
        },
      },
      items: {
        brass_key: {
          id: 'brass_key',
          name: 'brass key',
          description: 'A small brass key.',
        },
        lamp: { id: 'lamp', name: 'lamp', description: 'An oil lamp.' },
      },
    };

    // Load resources and add lamp to inventory
    gameState.loadResources(mockGameData);
    gameState.addToInventory('lamp');

    parser.setContext(gameState);
  });

  describe('Basic Command Parsing', () => {
    test('should parse simple verb commands', () => {
      const result = parser.parse('look');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('look');
      expect(result.command.directObject).toBeNull();
    });

    test('should parse verb + object commands', () => {
      const result = parser.parse('take book');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('take');
      expect(result.command.directObject).toBe('book');
      expect(result.command.resolvedDirectObject.type).toBe('object');
      expect(result.command.resolvedDirectObject.value).toBe('book');
    });

    test('should parse commands with prepositions', () => {
      const result = parser.parse('put lamp on desk');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('put');
      expect(result.command.directObject).toBe('lamp');
      expect(result.command.preposition).toBe('on');
      expect(result.command.indirectObject).toBe('desk');
    });
  });

  describe('Abbreviation Handling', () => {
    test('should expand single-letter abbreviations', () => {
      const result = parser.parse('x desk');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('examine');
    });

    test('should expand direction abbreviations', () => {
      const result = parser.parse('n');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('go');
      expect(result.command.directObject).toBe('north');
    });

    test('should handle inventory abbreviation', () => {
      const result = parser.parse('i');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('inventory');
    });
  });

  describe('Synonym Resolution', () => {
    test('should resolve verb synonyms', () => {
      const result = parser.parse('get key');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('take');
    });

    test('should handle multi-word verbs', () => {
      const result = parser.parse('pick up book');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('take');
      expect(result.command.directObject).toBe('book');
    });
  });

  describe('Pronoun Resolution', () => {
    test('should resolve "it" to last referenced object', () => {
      parser.parse('examine book');
      const result = parser.parse('take it');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('take');
      expect(result.command.resolvedDirectObject.value).toBe('book');
      expect(result.command.resolvedDirectObject.type).toBe('object');
    });

    test('should handle "all" modifier', () => {
      const result = parser.parse('take all');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('take');
      expect(result.command.resolvedDirectObject.type).toBe('special');
      expect(result.command.resolvedDirectObject.value).toBe('all');
    });
  });

  describe('Object Matching', () => {
    test('should match partial object names', () => {
      const result = parser.parse('examine des');
      expect(result.success).toBe(true);
      expect(result.command.resolvedDirectObject.value).toBe('desk');
    });

    test('should match multi-word objects', () => {
      const result = parser.parse('look at wooden desk');
      expect(result.success).toBe(true);
      expect(result.command.resolvedDirectObject.value).toBe('desk');
      expect(result.command.verb).toBe('look');
      expect(result.command.directObject).toBe('wooden desk');
    });

    test('should prioritize inventory items', () => {
      const result = parser.parse('examine lamp');
      expect(result.success).toBe(true);
      expect(result.command.resolvedDirectObject.value).toBe('lamp');
      expect(result.command.resolvedDirectObject.object.location).toBe(
        'inventory'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown verbs', () => {
      const result = parser.parse('frobnicate the widget');
      expect(result.success).toBe(false);
      expect(result.error).toContain("don't understand");
    });

    test('should handle missing objects', () => {
      const result = parser.parse('take');
      expect(result.success).toBe(false);
      expect(result.error).toContain('What do you want to take?');
    });

    test('should handle ambiguous objects', () => {
      // Add another book to create ambiguity
      gameState.rooms.library.objects.journal = {
        id: 'journal',
        name: 'red journal',
        description: 'A red journal.',
      };

      const result = parser.parse('take red');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Which one?');
      expect(result.error).toContain('red book');
      expect(result.error).toContain('red journal');
    });
  });

  describe('Special Commands', () => {
    test('should handle "again" command', () => {
      const first = parser.parse('look at desk');
      const again = parser.parse('again');
      expect(again.success).toBe(true);
      expect(again.command.verb).toBe('look');
      expect(again.command.directObject).toBe('desk');
    });

    test('should handle movement commands', () => {
      const result = parser.parse('go north');
      expect(result.success).toBe(true);
      expect(result.command.verb).toBe('go');
      expect(result.command.directObject).toBe('north');
    });

    test('should filter out articles', () => {
      const result = parser.parse('take the brass key');
      expect(result.success).toBe(true);
      expect(result.command.directObject).toBe('brass key');
    });
  });

  describe('Command Validation', () => {
    test('should validate commands needing indirect objects', () => {
      const result = parser.parse('give lamp to');
      expect(result.success).toBe(false);
      expect(result.error).toContain('What do you want to give the lamp to?');
    });

    test('should allow commands without objects when appropriate', () => {
      const commands = ['look', 'inventory', 'wait', 'help', 'quit'];
      commands.forEach((cmd) => {
        const result = parser.parse(cmd);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Auto-complete Suggestions', () => {
    test('should suggest verb completions', () => {
      const suggestions = parser.getSuggestions('ex');
      expect(suggestions).toContain('examine');
      expect(suggestions).toContain('exit');
    });

    test('should suggest abbreviations', () => {
      const suggestions = parser.getSuggestions('n');
      expect(suggestions).toContain('n');
    });
  });
});
