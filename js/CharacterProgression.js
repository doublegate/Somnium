/**
 * CharacterProgression - Character leveling, skills, and stat management
 *
 * Features:
 * - Experience points and leveling system
 * - Character stats (Strength, Dexterity, Intelligence, Vitality, Luck)
 * - Skill trees with multiple paths
 * - Perks and passive abilities
 * - Attribute point allocation
 * - Character classes and specializations
 * - Prestige system for replayability
 */

import { logger } from './logger.js';

export class CharacterProgression {
  constructor(gameState, eventManager) {
    this.gameState = gameState;
    this.eventManager = eventManager;

    // Character stats
    this.stats = {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,

      // Core attributes
      strength: 5, // Physical damage, carry weight
      dexterity: 5, // Attack speed, evasion
      intelligence: 5, // Magic power, mana
      vitality: 5, // Health, stamina
      luck: 5, // Critical chance, loot

      // Available attribute points
      attributePoints: 0,

      // Derived stats (calculated from attributes)
      maxHealth: 100,
      maxMana: 50,
      attack: 10,
      defense: 5,
      magic: 10,
      criticalChance: 0.05,
    };

    // Skill trees
    this.skillTrees = {
      warrior: {
        name: 'Warrior',
        skills: [
          {
            id: 'power_strike',
            name: 'Power Strike',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases physical damage by 10% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'heavy_armor',
            name: 'Heavy Armor Proficiency',
            maxLevel: 3,
            currentLevel: 0,
            description: 'Reduces damage taken by 5% per level.',
            cost: 1,
            requires: ['power_strike:1'],
          },
          {
            id: 'whirlwind',
            name: 'Whirlwind',
            maxLevel: 1,
            currentLevel: 0,
            description: 'Area attack hitting all nearby enemies.',
            cost: 2,
            requires: ['power_strike:3'],
          },
          {
            id: 'berserker_rage',
            name: 'Berserker Rage',
            maxLevel: 1,
            currentLevel: 0,
            description:
              'Doubles attack power but reduces defense for 3 turns.',
            cost: 3,
            requires: ['power_strike:5', 'heavy_armor:2'],
          },
        ],
      },
      mage: {
        name: 'Mage',
        skills: [
          {
            id: 'mana_mastery',
            name: 'Mana Mastery',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases max mana by 20% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'spell_power',
            name: 'Spell Power',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases spell damage by 15% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'meditation',
            name: 'Meditation',
            maxLevel: 3,
            currentLevel: 0,
            description: 'Increases mana regeneration by 50% per level.',
            cost: 1,
            requires: ['mana_mastery:1'],
          },
          {
            id: 'arcane_explosion',
            name: 'Arcane Explosion',
            maxLevel: 1,
            currentLevel: 0,
            description: 'Powerful AoE spell hitting all enemies.',
            cost: 2,
            requires: ['spell_power:3', 'mana_mastery:2'],
          },
        ],
      },
      rogue: {
        name: 'Rogue',
        skills: [
          {
            id: 'stealth',
            name: 'Stealth',
            maxLevel: 3,
            currentLevel: 0,
            description: 'Increases chance to avoid combat by 10% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'backstab',
            name: 'Backstab',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases critical damage by 25% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'lockpicking',
            name: 'Lockpicking',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases lockpick success chance.',
            cost: 1,
            requires: ['stealth:1'],
          },
          {
            id: 'shadow_step',
            name: 'Shadow Step',
            maxLevel: 1,
            currentLevel: 0,
            description: 'Teleport behind enemy for guaranteed critical hit.',
            cost: 3,
            requires: ['backstab:3', 'stealth:2'],
          },
        ],
      },
      explorer: {
        name: 'Explorer',
        skills: [
          {
            id: 'keen_eye',
            name: 'Keen Eye',
            maxLevel: 5,
            currentLevel: 0,
            description: 'Increases item find chance by 10% per level.',
            cost: 1,
            requires: [],
          },
          {
            id: 'herbalism',
            name: 'Herbalism',
            maxLevel: 3,
            currentLevel: 0,
            description: 'Find rare herbs and craft potions.',
            cost: 1,
            requires: ['keen_eye:1'],
          },
          {
            id: 'treasure_hunter',
            name: 'Treasure Hunter',
            maxLevel: 3,
            currentLevel: 0,
            description: 'Reveals hidden treasure locations.',
            cost: 2,
            requires: ['keen_eye:3'],
          },
          {
            id: 'map_reading',
            name: 'Map Reading',
            maxLevel: 1,
            currentLevel: 0,
            description: 'Unlock full map and fast travel.',
            cost: 2,
            requires: ['treasure_hunter:1'],
          },
        ],
      },
    };

    // Active perks
    this.activePerks = new Set();

    // Available skill points
    this.skillPoints = 0;

    // Character class
    this.characterClass = null;

    // Prestige system
    this.prestigeLevel = 0;
    this.prestigePoints = 0;

    // Progression statistics
    this.progressionStats = {
      totalExperienceEarned: 0,
      levelsGained: 0,
      skillsLearned: 0,
      attributePointsSpent: 0,
      prestigeCount: 0,
    };
  }

  /**
   * Add experience points
   * @param {number} amount - Experience amount
   * @returns {Object} Experience gain result (includes level up info)
   */
  addExperience(amount) {
    this.stats.experience += amount;
    this.progressionStats.totalExperienceEarned += amount;

    logger.info(`Gained ${amount} experience`);

    const levelUps = [];

    // Check for level up
    while (this.stats.experience >= this.stats.experienceToNextLevel) {
      const result = this.levelUp();
      levelUps.push(result);
    }

    return {
      experienceGained: amount,
      currentExperience: this.stats.experience,
      experienceToNext: this.stats.experienceToNextLevel,
      levelUps,
    };
  }

  /**
   * Level up the character
   * @returns {Object} Level up result
   */
  levelUp() {
    this.stats.level++;
    this.stats.experience -= this.stats.experienceToNextLevel;

    // Calculate next level experience requirement (exponential growth)
    this.stats.experienceToNextLevel = Math.floor(
      100 * Math.pow(1.5, this.stats.level - 1)
    );

    // Grant attribute and skill points
    this.stats.attributePoints += 3;
    this.skillPoints += 1;

    // Increase base stats
    this.stats.maxHealth += 10;
    this.stats.maxMana += 5;

    // Fully heal on level up
    this.gameState.setPlayerHealth(this.stats.maxHealth);
    this.gameState.setPlayerMana(this.stats.maxMana);

    this.progressionStats.levelsGained++;

    logger.info(`Level up! Now level ${this.stats.level}`);

    // Trigger level up event
    this.eventManager.triggerEvent('levelUp', {
      level: this.stats.level,
      attributePoints: this.stats.attributePoints,
      skillPoints: this.skillPoints,
    });

    // Update game state
    this.updateDerivedStats();

    return {
      newLevel: this.stats.level,
      attributePointsGained: 3,
      skillPointsGained: 1,
      healthIncrease: 10,
      manaIncrease: 5,
    };
  }

  /**
   * Allocate attribute point
   * @param {string} attribute - Attribute to increase
   * @returns {Object} Allocation result
   */
  allocateAttributePoint(attribute) {
    if (this.stats.attributePoints <= 0) {
      return { success: false, message: 'No attribute points available!' };
    }

    const validAttributes = [
      'strength',
      'dexterity',
      'intelligence',
      'vitality',
      'luck',
    ];
    if (!validAttributes.includes(attribute)) {
      return { success: false, message: 'Invalid attribute!' };
    }

    this.stats[attribute]++;
    this.stats.attributePoints--;
    this.progressionStats.attributePointsSpent++;

    // Update derived stats
    this.updateDerivedStats();

    logger.info(`Increased ${attribute} to ${this.stats[attribute]}`);

    return {
      success: true,
      attribute,
      newValue: this.stats[attribute],
      pointsRemaining: this.stats.attributePoints,
    };
  }

  /**
   * Update derived stats based on attributes
   */
  updateDerivedStats() {
    // Health: 10 per vitality
    this.stats.maxHealth = 100 + this.stats.vitality * 10;

    // Mana: 5 per intelligence
    this.stats.maxMana = 50 + this.stats.intelligence * 5;

    // Attack: 2 per strength
    this.stats.attack = 10 + this.stats.strength * 2;

    // Defense: 1 per vitality
    this.stats.defense = 5 + this.stats.vitality;

    // Magic: 2 per intelligence
    this.stats.magic = 10 + this.stats.intelligence * 2;

    // Critical chance: 1% per 5 luck
    this.stats.criticalChance = 0.05 + this.stats.luck * 0.01;

    // Apply skill modifiers
    this.applySkillModifiers();

    // Update game state
    this.gameState.setPlayerMaxHealth(this.stats.maxHealth);
    this.gameState.setPlayerMaxMana(this.stats.maxMana);
    this.gameState.setPlayerAttack(this.stats.attack);
    this.gameState.setPlayerDefense(this.stats.defense);
    this.gameState.setPlayerMagic(this.stats.magic);
  }

  /**
   * Apply modifiers from learned skills
   */
  applySkillModifiers() {
    // Warrior skills
    const powerStrike = this.getSkillLevel('warrior', 'power_strike');
    if (powerStrike > 0) {
      this.stats.attack = Math.floor(
        this.stats.attack * (1 + powerStrike * 0.1)
      );
    }

    const heavyArmor = this.getSkillLevel('warrior', 'heavy_armor');
    if (heavyArmor > 0) {
      this.stats.defense = Math.floor(
        this.stats.defense * (1 + heavyArmor * 0.05)
      );
    }

    // Mage skills
    const manaMastery = this.getSkillLevel('mage', 'mana_mastery');
    if (manaMastery > 0) {
      this.stats.maxMana = Math.floor(
        this.stats.maxMana * (1 + manaMastery * 0.2)
      );
    }

    const spellPower = this.getSkillLevel('mage', 'spell_power');
    if (spellPower > 0) {
      this.stats.magic = Math.floor(this.stats.magic * (1 + spellPower * 0.15));
    }

    // Rogue skills
    const backstab = this.getSkillLevel('rogue', 'backstab');
    if (backstab > 0) {
      this.stats.criticalChance += backstab * 0.05;
    }
  }

  /**
   * Learn a skill
   * @param {string} tree - Skill tree name
   * @param {string} skillId - Skill ID
   * @returns {Object} Learn result
   */
  learnSkill(tree, skillId) {
    if (this.skillPoints <= 0) {
      return { success: false, message: 'No skill points available!' };
    }

    const skillTree = this.skillTrees[tree];
    if (!skillTree) {
      return { success: false, message: 'Invalid skill tree!' };
    }

    const skill = skillTree.skills.find((s) => s.id === skillId);
    if (!skill) {
      return { success: false, message: 'Skill not found!' };
    }

    if (skill.currentLevel >= skill.maxLevel) {
      return { success: false, message: 'Skill already maxed!' };
    }

    // Check requirements
    const reqCheck = this.checkSkillRequirements(skill);
    if (!reqCheck.met) {
      return { success: false, message: reqCheck.message };
    }

    // Check skill point cost
    if (this.skillPoints < skill.cost) {
      return { success: false, message: 'Not enough skill points!' };
    }

    // Learn the skill
    skill.currentLevel++;
    this.skillPoints -= skill.cost;
    this.progressionStats.skillsLearned++;

    // Activate perk if learning for first time
    if (skill.currentLevel === 1) {
      this.activePerks.add(`${tree}:${skillId}`);
    }

    // Update derived stats
    this.updateDerivedStats();

    logger.info(`Learned ${skill.name} (Level ${skill.currentLevel})`);

    this.eventManager.triggerEvent('skillLearned', {
      tree,
      skillId,
      level: skill.currentLevel,
    });

    return {
      success: true,
      skill: skill.name,
      level: skill.currentLevel,
      pointsRemaining: this.skillPoints,
    };
  }

  /**
   * Check if skill requirements are met
   * @param {Object} skill - Skill to check
   * @returns {Object} Requirement check result
   */
  checkSkillRequirements(skill) {
    for (const requirement of skill.requires) {
      const [reqTree, reqSkillLevel] = requirement.split(':');
      const [reqSkillId, reqLevel] = reqSkillLevel
        ? [reqTree, parseInt(reqSkillLevel)]
        : [requirement, 1];

      const currentLevel = this.getSkillLevel(
        this.getTreeForSkill(reqSkillId),
        reqSkillId
      );

      if (currentLevel < reqLevel) {
        return {
          met: false,
          message: `Requires ${reqSkillId} level ${reqLevel}`,
        };
      }
    }

    return { met: true };
  }

  /**
   * Get current level of a skill
   * @param {string} tree - Skill tree
   * @param {string} skillId - Skill ID
   * @returns {number} Skill level
   */
  getSkillLevel(tree, skillId) {
    const skillTree = this.skillTrees[tree];
    if (!skillTree) return 0;

    const skill = skillTree.skills.find((s) => s.id === skillId);
    return skill ? skill.currentLevel : 0;
  }

  /**
   * Get tree containing skill
   * @param {string} skillId - Skill ID
   * @returns {string|null} Tree name
   */
  getTreeForSkill(skillId) {
    for (const treeName in this.skillTrees) {
      const tree = this.skillTrees[treeName];
      if (tree.skills.some((s) => s.id === skillId)) {
        return treeName;
      }
    }
    return null;
  }

  /**
   * Set character class
   * @param {string} className - Class name
   * @returns {Object} Class selection result
   */
  setClass(className) {
    if (this.characterClass) {
      return { success: false, message: 'Class already selected!' };
    }

    if (!this.skillTrees[className]) {
      return { success: false, message: 'Invalid class!' };
    }

    this.characterClass = className;

    // Give bonus starting skill points for choosing class
    this.skillPoints += 2;

    logger.info(`Selected class: ${className}`);

    this.eventManager.triggerEvent('classSelected', { class: className });

    return {
      success: true,
      class: className,
      bonusSkillPoints: 2,
    };
  }

  /**
   * Prestige (reset with bonuses)
   * @returns {Object} Prestige result
   */
  prestige() {
    if (this.stats.level < 50) {
      return {
        success: false,
        message: 'Must be level 50 to prestige!',
      };
    }

    this.prestigeLevel++;
    this.prestigePoints += this.stats.level;
    this.progressionStats.prestigeCount++;

    // Reset character but keep prestige bonuses
    const prestigeBonus = this.prestigeLevel;

    this.stats = {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      strength: 5 + prestigeBonus,
      dexterity: 5 + prestigeBonus,
      intelligence: 5 + prestigeBonus,
      vitality: 5 + prestigeBonus,
      luck: 5 + prestigeBonus,
      attributePoints: 0,
      maxHealth: 100 + prestigeBonus * 10,
      maxMana: 50 + prestigeBonus * 5,
      attack: 10,
      defense: 5,
      magic: 10,
      criticalChance: 0.05,
    };

    // Reset skills but keep one skill tree unlocked
    for (const tree in this.skillTrees) {
      for (const skill of this.skillTrees[tree].skills) {
        skill.currentLevel = 0;
      }
    }

    this.skillPoints = prestigeBonus * 2;
    this.characterClass = null;
    this.activePerks.clear();

    logger.info(`Prestiged to level ${this.prestigeLevel}!`);

    this.eventManager.triggerEvent('prestige', {
      prestigeLevel: this.prestigeLevel,
      bonusPoints: prestigeBonus,
    });

    return {
      success: true,
      prestigeLevel: this.prestigeLevel,
      prestigePoints: this.prestigePoints,
      bonusStats: prestigeBonus,
    };
  }

  /**
   * Get character statistics
   * @returns {Object} Character stats
   */
  getStatistics() {
    return {
      ...this.stats,
      skillPoints: this.skillPoints,
      characterClass: this.characterClass,
      prestigeLevel: this.prestigeLevel,
      activePerks: Array.from(this.activePerks),
      progressionStats: { ...this.progressionStats },
    };
  }

  /**
   * Save progression state
   * @returns {Object} Save data
   */
  save() {
    return {
      stats: { ...this.stats },
      skillTrees: JSON.parse(JSON.stringify(this.skillTrees)),
      activePerks: Array.from(this.activePerks),
      skillPoints: this.skillPoints,
      characterClass: this.characterClass,
      prestigeLevel: this.prestigeLevel,
      prestigePoints: this.prestigePoints,
      progressionStats: { ...this.progressionStats },
    };
  }

  /**
   * Load progression state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.stats = saveData.stats || this.stats;
    this.skillTrees = saveData.skillTrees || this.skillTrees;
    this.activePerks = new Set(saveData.activePerks || []);
    this.skillPoints = saveData.skillPoints || 0;
    this.characterClass = saveData.characterClass || null;
    this.prestigeLevel = saveData.prestigeLevel || 0;
    this.prestigePoints = saveData.prestigePoints || 0;
    this.progressionStats = saveData.progressionStats || this.progressionStats;

    this.updateDerivedStats();
  }
}
