/**
 * Vocabulary Configuration for Parser
 *
 * This file contains all verb definitions, synonyms, and patterns
 * for the natural language parser. Based on Sierra's SCI0 parser.
 */

export const VOCABULARY = {
  // Core verbs with their canonical forms
  verbs: {
    // Movement
    go: ['go', 'move', 'walk', 'travel', 'proceed', 'head'],
    run: ['run', 'dash', 'sprint', 'hurry'],
    climb: ['climb', 'scale', 'ascend'],
    enter: ['enter', 'go in', 'go into', 'get in'],
    exit: ['exit', 'leave', 'go out', 'get out'],

    // Object manipulation
    take: ['take', 'get', 'grab', 'pick up', 'acquire', 'obtain', 'lift'],
    drop: ['drop', 'put down', 'discard', 'release', 'let go'],
    use: ['use', 'apply', 'utilize', 'employ', 'operate'],
    give: ['give', 'offer', 'hand', 'present', 'deliver'],
    throw: ['throw', 'toss', 'hurl', 'fling', 'pitch'],

    // Examination
    look: ['look', 'l', 'gaze', 'observe', 'view'],
    examine: [
      'examine',
      'x',
      'inspect',
      'study',
      'investigate',
      'check',
      'analyze',
    ],
    search: ['search', 'explore', 'hunt', 'look for'],
    read: ['read', 'peruse', 'scan'],

    // Container operations
    open: ['open', 'unlock', 'unseal', 'unfasten'],
    close: ['close', 'shut', 'seal', 'lock', 'fasten'],
    put: ['put', 'place', 'insert', 'set'],
    remove: ['remove', 'extract', 'take out', 'pull out'],

    // Communication
    talk: ['talk', 'speak', 'chat', 'converse', 'say'],
    ask: ['ask', 'question', 'inquire', 'query'],
    tell: ['tell', 'inform', 'say', 'report'],
    yell: ['yell', 'shout', 'scream', 'holler'],

    // Physical actions
    push: ['push', 'shove', 'press'],
    pull: ['pull', 'drag', 'tug', 'yank'],
    turn: ['turn', 'rotate', 'twist', 'spin'],
    touch: ['touch', 'feel', 'pat', 'stroke'],
    hit: ['hit', 'strike', 'punch', 'kick', 'attack'],
    break: ['break', 'smash', 'destroy', 'shatter'],

    // Special actions
    eat: ['eat', 'consume', 'devour', 'taste'],
    drink: ['drink', 'sip', 'gulp', 'swallow'],
    wear: ['wear', 'put on', 'don', 'equip'],
    takeoff: ['remove', 'take off', 'doff', 'unequip'],
    sleep: ['sleep', 'rest', 'nap', 'doze'],
    wait: ['wait', 'pause', 'stay'],

    // Meta commands
    save: ['save', 'save game'],
    load: ['load', 'restore', 'load game'],
    quit: ['quit', 'exit game', 'stop', 'q'],
    restart: ['restart', 'start over', 'new game'],
    inventory: ['inventory', 'i', 'inv'],
    score: ['score', 'points'],
    help: ['help', '?', 'hint', 'clue'],
  },

  // Single-letter abbreviations
  abbreviations: {
    l: 'look',
    x: 'examine',
    i: 'inventory',
    n: 'go north',
    s: 'go south',
    e: 'go east',
    w: 'go west',
    ne: 'go northeast',
    nw: 'go northwest',
    se: 'go southeast',
    sw: 'go southwest',
    u: 'go up',
    d: 'go down',
    q: 'quit',
    z: 'wait',
  },

  // Multi-word verb patterns
  multiWordVerbs: [
    'pick up',
    'put down',
    'put on',
    'take off',
    'look at',
    'talk to',
    'go to',
    'get in',
    'get out',
    'turn on',
    'turn off',
    'save game',
    'load game',
    'exit game',
  ],

  // Prepositions for complex commands
  prepositions: [
    'with',
    'to',
    'from',
    'in',
    'on',
    'at',
    'under',
    'over',
    'behind',
    'beside',
    'between',
    'into',
    'onto',
    'through',
    'across',
    'around',
    'about',
    'for',
    'off',
  ],

  // Articles to filter out
  articles: ['a', 'an', 'the'],

  // Common filler words to ignore
  fillers: ['please', 'kindly', 'now', 'then', 'very', 'really'],

  // Directions
  directions: {
    north: ['north', 'n'],
    south: ['south', 's'],
    east: ['east', 'e'],
    west: ['west', 'w'],
    northeast: ['northeast', 'ne'],
    northwest: ['northwest', 'nw'],
    southeast: ['southeast', 'se'],
    southwest: ['southwest', 'sw'],
    up: ['up', 'u', 'upstairs', 'above'],
    down: ['down', 'd', 'downstairs', 'below'],
    in: ['in', 'inside', 'enter'],
    out: ['out', 'outside', 'exit'],
  },

  // Pronouns to track
  pronouns: {
    direct: ['it', 'them', 'that', 'this', 'these', 'those'],
    possessive: ['its', 'their', 'my', 'mine'],
  },

  // Special keywords
  special: {
    all: ['all', 'everything', 'every'],
    except: ['except', 'but', 'not'],
  },

  // Response templates for parser errors
  errors: {
    unknownVerb: "I don't understand that verb.",
    noVerb: 'Please start your command with a verb.',
    ambiguousObject: 'Which {object} do you mean?',
    objectNotFound: "You don't see any {object} here.",
    cantDoThat: "You can't {verb} that.",
    needMoreInfo: 'What do you want to {verb}?',
    needIndirectObject:
      'What do you want to {verb} the {object} {preposition}?',
  },
};

/**
 * Helper function to get all synonyms for a verb
 */
export function getVerbSynonyms(verb) {
  for (const [canonical, synonyms] of Object.entries(VOCABULARY.verbs)) {
    if (canonical === verb || synonyms.includes(verb)) {
      return { canonical, synonyms: [canonical, ...synonyms] };
    }
  }
  return null;
}

/**
 * Helper function to check if a word is a verb
 */
export function isVerb(word) {
  // Check direct verbs
  if (VOCABULARY.verbs[word]) return true;

  // Check synonyms
  for (const synonyms of Object.values(VOCABULARY.verbs)) {
    if (synonyms.includes(word)) return true;
  }

  return false;
}

/**
 * Helper function to get canonical form of a verb
 */
export function getCanonicalVerb(verb) {
  // Already canonical
  if (VOCABULARY.verbs[verb]) return verb;

  // Find in synonyms
  for (const [canonical, synonyms] of Object.entries(VOCABULARY.verbs)) {
    if (synonyms.includes(verb)) return canonical;
  }

  return null;
}

/**
 * Helper function to expand direction abbreviations
 */
export function expandDirection(dir) {
  for (const [canonical, variants] of Object.entries(VOCABULARY.directions)) {
    if (canonical === dir || variants.includes(dir)) {
      return canonical;
    }
  }
  return dir;
}
