/**
 * SaidPattern - Sierra-style pattern matching for natural language commands
 * Based on analysis of KQ4, SQ3, QFG1, and Iceman decompiled source
 */

export class SaidPattern {
  constructor(pattern, action) {
    this.originalPattern = pattern;
    this.action = action;
    this.captureGroups = [];
    this.pattern = this.compileSaidPattern(pattern);
  }

  /**
   * Compiles Sierra-style patterns to JavaScript regex
   * Syntax:
   * - / for alternatives: "get/take/grab"
   * - [] for optional words: "[the] key"
   * - <> for word classes: "<object>"
   * - * for wildcards: "* key"
   */
  compileSaidPattern(pattern) {
    let regex = pattern;
    
    // Handle word classes first to identify capture groups
    regex = regex.replace(/<(\w+)>/g, (match, group) => {
      this.captureGroups.push(group);
      return '([\\w\\s]+?)'; // Non-greedy capture
    });
    
    // Handle alternatives - support multiple alternatives
    regex = regex.replace(/(\w+)(?:\/(\w+))+/g, (match) => {
      const alternatives = match.split('/');
      return `(?:${alternatives.join('|')})`;
    });
    
    // Handle optional words/phrases
    regex = regex.replace(/\[([^\]]+)\]/g, '(?:$1)?\\s*');
    
    // Handle wildcards
    regex = regex.replace(/\*/g, '.*?');
    
    // Handle whitespace - make it flexible
    regex = regex.replace(/\s+/g, '\\s+');
    
    // Anchor the pattern
    return new RegExp(`^${regex}$`, 'i');
  }

  matches(input, vocabulary) {
    // First expand input using vocabulary synonyms
    const expanded = this.expandSynonyms(input, vocabulary);
    const match = expanded.match(this.pattern);
    
    if (match) {
      const captures = {};
      this.captureGroups.forEach((group, index) => {
        captures[group] = match[index + 1]?.trim();
      });
      return { matched: true, captures, action: this.action };
    }
    
    return { matched: false };
  }

  expandSynonyms(input, vocabulary) {
    return input.split(' ').map(word => {
      const canonical = vocabulary.getCanonical(word);
      return canonical || word;
    }).join(' ');
  }
}

/**
 * Pattern collection for common Sierra adventure game commands
 */
export class SaidPatternCollection {
  constructor() {
    this.patterns = [];
    this.initializePatterns();
  }

  initializePatterns() {
    // From KQ4: Complex fairy tale commands
    this.add('give/offer/hand [the] <item> [to] <character>', 'GIVE');
    this.add('wave [the] [magic] wand [at] <target>', 'WAVE_WAND');
    this.add('play [the] lute/flute/instrument', 'PLAY_INSTRUMENT');
    this.add('dig [in] [the] [ground/dirt/sand]', 'DIG');
    
    // From SQ3: Sci-fi interactions
    this.add('insert/put [the] <item> [in/into] [the] <container>', 'INSERT');
    this.add('scan/analyze <object> [with] [the] [scanner]', 'SCAN');
    this.add('push/press [the] <button> [button]', 'PUSH_BUTTON');
    this.add('order <item> [from] [the] [menu]', 'ORDER');
    
    // From QFG1: Combat and RPG commands
    this.add('cast [magic/spell] <spell> [at/on] <target>', 'CAST');
    this.add('throw/hurl [the] <item> [at] <target>', 'THROW');
    this.add('ask [the] <character> about <topic>', 'ASK_ABOUT');
    this.add('climb [up/down] [the] <object>', 'CLIMB');
    
    // From Iceman: Procedural commands
    this.add('set [the] <control> [to] <value>', 'SET_CONTROL');
    this.add('check/inspect [the] <equipment> [for] [damage]', 'INSPECT');
    this.add('salute [the] <person>', 'SALUTE');
    this.add('dive [to] <depth> [feet/meters]', 'DIVE');
    
    // Common multi-word verbs from all games
    this.add('pick up [the] <item>', 'TAKE');
    this.add('put down [the] <item>', 'DROP');
    this.add('look at/examine [the] <object>', 'EXAMINE');
    this.add('look in/inside [the] <container>', 'LOOK_IN');
    this.add('turn on [the] <device>', 'ACTIVATE');
    this.add('turn off [the] <device>', 'DEACTIVATE');
    this.add('get in/inside/into [the] <vehicle>', 'ENTER');
    this.add('get out [of] [the] <vehicle>', 'EXIT');
    this.add('lie down [on] [the] <surface>', 'SLEEP');
    this.add('stand up', 'STAND');
    this.add('sit down [on] [the] <seat>', 'SIT');
    this.add('wake up', 'WAKE');
    this.add('put on [the] <clothing>', 'WEAR');
    this.add('take off [the] <clothing>', 'REMOVE');
    
    // Additional patterns from Sierra games
    this.add('unlock [the] <door> [with] [the] <key>', 'UNLOCK');
    this.add('lock [the] <door> [with] [the] <key>', 'LOCK');
    this.add('talk to/with [the] <character>', 'TALK');
    this.add('use [the] <item> [on/with] [the] <target>', 'USE');
    this.add('open [the] <object>', 'OPEN');
    this.add('close [the] <object>', 'CLOSE');
    this.add('read [the] <text>', 'READ');
    this.add('eat/consume [the] <food>', 'EAT');
    this.add('drink [the] <beverage>', 'DRINK');
    this.add('sleep [in/on] [the] <surface>', 'SLEEP');
    this.add('swim [to/across] [the] <destination>', 'SWIM');
    this.add('kiss [the] <target>', 'KISS');
    this.add('buy/purchase [the] <item> [from] <vendor>', 'BUY');
    this.add('sell [the] <item> [to] <vendor>', 'SELL');
  }

  add(pattern, action) {
    this.patterns.push(new SaidPattern(pattern, action));
  }

  findMatch(input, vocabulary) {
    for (const pattern of this.patterns) {
      const result = pattern.matches(input, vocabulary);
      if (result.matched) {
        return result;
      }
    }
    return null;
  }
}