/**
 * MagicSystem - Complete magic and spell system
 *
 * Features:
 * - Spell learning and spell book management
 * - Mana management and regeneration
 * - Spell casting with resource costs
 * - Elemental magic schools (Fire, Ice, Lightning, Nature, Arcane, Dark)
 * - Spell combinations and synergies
 * - Magic research and discovery
 * - Enchantment system for items
 * - Magical effects and animations
 */

import { logger } from './logger.js';

export class MagicSystem {
  constructor(gameState, soundManager, viewManager, eventManager) {
    this.gameState = gameState;
    this.soundManager = soundManager;
    this.viewManager = viewManager;
    this.eventManager = eventManager;

    // Spell definitions by school
    this.spellLibrary = this.initializeSpellLibrary();

    // Player's known spells
    this.knownSpells = new Set();

    // Active magical effects
    this.activeEffects = [];

    // Spell cooldowns
    this.cooldowns = new Map();

    // Magic schools and proficiency
    this.schools = {
      fire: { level: 1, experience: 0 },
      ice: { level: 1, experience: 0 },
      lightning: { level: 1, experience: 0 },
      nature: { level: 1, experience: 0 },
      arcane: { level: 1, experience: 0 },
      dark: { level: 1, experience: 0 },
    };

    // Enchanted items
    this.enchantments = new Map(); // itemId -> enchantment

    // Magic statistics
    this.stats = {
      spellsCast: 0,
      totalManaspent: 0,
      spellsLearned: 0,
      enchantmentsCreated: 0,
      combinationsDiscovered: 0,
    };

    // Mana regeneration rate (per second)
    this.manaRegenRate = 1;
    this.lastManaRegen = Date.now();
  }

  /**
   * Initialize spell library
   * @returns {Object} Spell library organized by school
   */
  initializeSpellLibrary() {
    return {
      fire: [
        {
          id: 'spark',
          name: 'Spark',
          school: 'fire',
          level: 1,
          manaCost: 5,
          damage: 10,
          damageType: 'fire',
          description: 'A small flame that damages a single target.',
          castTime: 1,
        },
        {
          id: 'fireball',
          name: 'Fireball',
          school: 'fire',
          level: 3,
          manaCost: 15,
          damage: 25,
          damageType: 'fire',
          areaOfEffect: true,
          description: 'A powerful ball of fire that explodes on impact.',
          castTime: 2,
        },
        {
          id: 'flame_wall',
          name: 'Flame Wall',
          school: 'fire',
          level: 5,
          manaCost: 25,
          damage: 15,
          duration: 3,
          damageType: 'fire',
          description:
            'Creates a wall of flames that damages enemies over time.',
          castTime: 2,
        },
        {
          id: 'inferno',
          name: 'Inferno',
          school: 'fire',
          level: 8,
          manaCost: 50,
          damage: 60,
          damageType: 'fire',
          areaOfEffect: true,
          statusEffect: 'burn',
          description:
            'Massive firestorm that engulfs all enemies, applying burn.',
          castTime: 3,
        },
      ],
      ice: [
        {
          id: 'frost_bolt',
          name: 'Frost Bolt',
          school: 'ice',
          level: 1,
          manaCost: 5,
          damage: 8,
          damageType: 'ice',
          statusEffect: 'slow',
          description: 'Shard of ice that damages and slows target.',
          castTime: 1,
        },
        {
          id: 'ice_shield',
          name: 'Ice Shield',
          school: 'ice',
          level: 2,
          manaCost: 12,
          defenseBonus: 5,
          duration: 4,
          description: 'Protective shield of ice that absorbs damage.',
          castTime: 1,
        },
        {
          id: 'blizzard',
          name: 'Blizzard',
          school: 'ice',
          level: 6,
          manaCost: 35,
          damage: 30,
          damageType: 'ice',
          areaOfEffect: true,
          statusEffect: 'freeze',
          description:
            'Freezing storm that damages and freezes all enemies.',
          castTime: 3,
        },
      ],
      lightning: [
        {
          id: 'shock',
          name: 'Shock',
          school: 'lightning',
          level: 1,
          manaCost: 6,
          damage: 12,
          damageType: 'lightning',
          description: 'Quick bolt of lightning strikes the target.',
          castTime: 0.5,
        },
        {
          id: 'chain_lightning',
          name: 'Chain Lightning',
          school: 'lightning',
          level: 4,
          manaCost: 20,
          damage: 18,
          damageType: 'lightning',
          chains: 3,
          description: 'Lightning that bounces between multiple targets.',
          castTime: 2,
        },
        {
          id: 'thunderstorm',
          name: 'Thunderstorm',
          school: 'lightning',
          level: 7,
          manaCost: 40,
          damage: 35,
          damageType: 'lightning',
          areaOfEffect: true,
          statusEffect: 'stun',
          description: 'Devastating storm that stuns all enemies.',
          castTime: 3,
        },
      ],
      nature: [
        {
          id: 'heal',
          name: 'Heal',
          school: 'nature',
          level: 1,
          manaCost: 10,
          heal: 30,
          description: 'Restores health to the caster.',
          castTime: 2,
        },
        {
          id: 'regeneration',
          name: 'Regeneration',
          school: 'nature',
          level: 3,
          manaCost: 15,
          statusEffect: 'regen',
          duration: 5,
          description: 'Gradually restores health over time.',
          castTime: 1,
        },
        {
          id: 'poison_cloud',
          name: 'Poison Cloud',
          school: 'nature',
          level: 4,
          manaCost: 18,
          damage: 12,
          damageType: 'poison',
          areaOfEffect: true,
          statusEffect: 'poison',
          duration: 4,
          description: 'Toxic cloud that poisons all enemies in the area.',
          castTime: 2,
        },
        {
          id: 'natures_blessing',
          name: "Nature's Blessing",
          school: 'nature',
          level: 6,
          manaCost: 30,
          heal: 60,
          statusEffect: 'regen',
          removesCurses: true,
          description: 'Powerful heal that removes curses and grants regen.',
          castTime: 3,
        },
      ],
      arcane: [
        {
          id: 'mana_shield',
          name: 'Mana Shield',
          school: 'arcane',
          level: 2,
          manaCost: 15,
          absorbsDamage: 50,
          duration: 5,
          description: 'Uses mana to absorb incoming damage.',
          castTime: 1,
        },
        {
          id: 'arcane_missiles',
          name: 'Arcane Missiles',
          school: 'arcane',
          level: 3,
          manaCost: 18,
          damage: 20,
          damageType: 'magical',
          missiles: 3,
          description: 'Fires multiple homing magical projectiles.',
          castTime: 2,
        },
        {
          id: 'dispel',
          name: 'Dispel',
          school: 'arcane',
          level: 4,
          manaCost: 20,
          removesBuffs: true,
          description: 'Removes magical effects from target.',
          castTime: 1,
        },
        {
          id: 'time_stop',
          name: 'Time Stop',
          school: 'arcane',
          level: 9,
          manaCost: 80,
          duration: 2,
          statusEffect: 'timestop',
          description: 'Freezes time, allowing multiple free actions.',
          castTime: 3,
        },
      ],
      dark: [
        {
          id: 'shadow_bolt',
          name: 'Shadow Bolt',
          school: 'dark',
          level: 2,
          manaCost: 12,
          damage: 18,
          damageType: 'shadow',
          lifesteal: 0.3,
          description: 'Dark bolt that steals health from the target.',
          castTime: 1.5,
        },
        {
          id: 'curse',
          name: 'Curse',
          school: 'dark',
          level: 3,
          manaCost: 15,
          statusEffect: 'cursed',
          duration: 6,
          description: 'Weakens enemy, reducing their stats.',
          castTime: 2,
        },
        {
          id: 'drain_life',
          name: 'Drain Life',
          school: 'dark',
          level: 5,
          manaCost: 25,
          damage: 30,
          damageType: 'shadow',
          lifesteal: 0.5,
          description: 'Drains life force from target, healing caster.',
          castTime: 2,
        },
        {
          id: 'death_coil',
          name: 'Death Coil',
          school: 'dark',
          level: 7,
          manaCost: 40,
          damage: 50,
          damageType: 'shadow',
          instantKillChance: 0.1,
          description: 'Deadly spell with chance to instantly kill.',
          castTime: 3,
        },
      ],
    };
  }

  /**
   * Learn a new spell
   * @param {string} spellId - Spell ID to learn
   * @returns {Object} Learn result
   */
  learnSpell(spellId) {
    if (this.knownSpells.has(spellId)) {
      return { success: false, message: 'Already know this spell!' };
    }

    const spell = this.getSpell(spellId);
    if (!spell) {
      return { success: false, message: 'Spell not found!' };
    }

    // Check if player meets level requirement
    const schoolLevel = this.schools[spell.school].level;
    if (spell.level > schoolLevel) {
      return {
        success: false,
        message: `Requires ${spell.school} magic level ${spell.level}!`,
      };
    }

    this.knownSpells.add(spellId);
    this.stats.spellsLearned++;

    logger.info(`Learned spell: ${spell.name}`);

    this.eventManager.triggerEvent('spellLearned', { spellId, spell });

    return {
      success: true,
      message: `Learned ${spell.name}!`,
    };
  }

  /**
   * Cast a spell
   * @param {string} spellId - Spell to cast
   * @param {Object} target - Target (can be player, enemy, object)
   * @param {Object} options - Casting options
   * @returns {Object} Cast result
   */
  castSpell(spellId, target, options = {}) {
    if (!this.knownSpells.has(spellId)) {
      return { success: false, message: "You don't know that spell!" };
    }

    const spell = this.getSpell(spellId);
    if (!spell) {
      return { success: false, message: 'Spell not found!' };
    }

    // Check cooldown
    if (this.cooldowns.has(spellId)) {
      const remaining = this.cooldowns.get(spellId) - Date.now();
      if (remaining > 0) {
        return {
          success: false,
          message: `Spell on cooldown for ${Math.ceil(remaining / 1000)}s!`,
        };
      }
    }

    // Check mana cost
    const currentMana = this.gameState.getPlayerMana();
    if (currentMana < spell.manaCost) {
      return { success: false, message: 'Not enough mana!' };
    }

    // Deduct mana
    this.gameState.setPlayerMana(currentMana - spell.manaCost);

    // Apply spell effects
    const result = this.applySpellEffects(spell, target, options);

    // Set cooldown if specified
    if (spell.cooldown) {
      this.cooldowns.set(spellId, Date.now() + spell.cooldown * 1000);
    }

    // Gain school experience
    this.gainSchoolExperience(spell.school, spell.manaCost);

    // Update statistics
    this.stats.spellsCast++;
    this.stats.totalManaSpent += spell.manaCost;

    // Play spell effects
    this.playSpellEffects(spell);

    logger.info(`Cast spell: ${spell.name}`);

    return {
      success: true,
      spell,
      result,
    };
  }

  /**
   * Apply spell effects to target
   * @param {Object} spell - Spell data
   * @param {Object} target - Target entity
   * @param {Object} options - Additional options
   * @returns {Object} Effect results
   */
  applySpellEffects(spell, target, options) {
    const results = {};

    // Damage spells
    if (spell.damage) {
      const damage = this.calculateSpellDamage(spell, target);
      results.damage = damage;

      if (target.applyDamage) {
        target.applyDamage(damage, spell.damageType);
      }
    }

    // Healing spells
    if (spell.heal) {
      const healAmount = spell.heal;
      results.heal = healAmount;

      if (target === 'player' || options.healPlayer) {
        const currentHealth = this.gameState.getPlayerHealth();
        const maxHealth = this.gameState.getPlayerMaxHealth();
        this.gameState.setPlayerHealth(
          Math.min(maxHealth, currentHealth + healAmount)
        );
      }
    }

    // Status effects
    if (spell.statusEffect) {
      results.statusEffect = spell.statusEffect;
      if (target.applyStatusEffect) {
        target.applyStatusEffect(spell.statusEffect, spell.duration || 3);
      }
    }

    // Lifesteal
    if (spell.lifesteal && results.damage) {
      const healAmount = Math.floor(results.damage * spell.lifesteal);
      const currentHealth = this.gameState.getPlayerHealth();
      const maxHealth = this.gameState.getPlayerMaxHealth();
      this.gameState.setPlayerHealth(
        Math.min(maxHealth, currentHealth + healAmount)
      );
      results.lifesteal = healAmount;
    }

    // Defense bonus
    if (spell.defenseBonus) {
      results.defenseBonus = spell.defenseBonus;
      this.applyMagicalEffect({
        type: 'defenseBonus',
        value: spell.defenseBonus,
        duration: spell.duration || 5,
        spellId: spell.id,
      });
    }

    // Absorb shield
    if (spell.absorbsDamage) {
      results.shield = spell.absorbsDamage;
      this.applyMagicalEffect({
        type: 'absorbShield',
        value: spell.absorbsDamage,
        duration: spell.duration || 5,
        spellId: spell.id,
      });
    }

    return results;
  }

  /**
   * Calculate spell damage
   * @param {Object} spell - Spell data
   * @param {Object} target - Target entity
   * @returns {number} Damage amount
   */
  calculateSpellDamage(spell, target) {
    let damage = spell.damage;

    // Add magic stat bonus
    const magicPower = this.gameState.getPlayerMagic() || 10;
    damage += Math.floor(magicPower * 0.5);

    // School mastery bonus
    const schoolLevel = this.schools[spell.school].level;
    const masteryBonus = 1 + schoolLevel * 0.05;
    damage = Math.floor(damage * masteryBonus);

    // Check for spell combinations
    const comboBonus = this.checkSpellCombinations(spell);
    damage = Math.floor(damage * comboBonus);

    // Random variance (90-110%)
    damage = Math.floor(damage * (0.9 + Math.random() * 0.2));

    return damage;
  }

  /**
   * Check for spell combinations
   * @param {Object} spell - Current spell
   * @returns {number} Combo multiplier
   */
  checkSpellCombinations(spell) {
    // Check recent spells (last 10 seconds)
    const recentSpells = this.getRecentSpells(10000);
    let multiplier = 1.0;

    // Fire + Ice = Steam explosion (1.5x damage)
    if (
      spell.school === 'fire' &&
      recentSpells.some((s) => s.school === 'ice')
    ) {
      multiplier = 1.5;
      this.stats.combinationsDiscovered++;
      this.soundManager.playSoundEffect('combo_steam');
    }

    // Lightning + Water = Electrified (2x damage)
    if (
      spell.school === 'lightning' &&
      recentSpells.some((s) => s.damageType === 'water')
    ) {
      multiplier = 2.0;
      this.stats.combinationsDiscovered++;
      this.soundManager.playSoundEffect('combo_electric');
    }

    // Dark + Nature = Corruption (1.3x damage + poison)
    if (
      spell.school === 'dark' &&
      recentSpells.some((s) => s.school === 'nature')
    ) {
      multiplier = 1.3;
      spell.statusEffect = 'poison';
      this.stats.combinationsDiscovered++;
      this.soundManager.playSoundEffect('combo_corruption');
    }

    return multiplier;
  }

  /**
   * Get recently cast spells
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array} Recent spells
   */
  getRecentSpells(timeWindow) {
    // This would track recent spell casts
    // For now, return empty array
    return [];
  }

  /**
   * Apply magical effect to player
   * @param {Object} effect - Effect data
   */
  applyMagicalEffect(effect) {
    effect.startTime = Date.now();
    effect.endTime = Date.now() + effect.duration * 1000;
    this.activeEffects.push(effect);

    logger.info(`Applied magical effect: ${effect.type}`);
  }

  /**
   * Update active magical effects
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update active effects
    const now = Date.now();
    this.activeEffects = this.activeEffects.filter(
      (effect) => effect.endTime > now
    );

    // Regenerate mana
    this.updateManaRegeneration(deltaTime);

    // Update cooldowns (automatic via Map timestamps)
  }

  /**
   * Update mana regeneration
   * @param {number} deltaTime - Time delta in milliseconds
   */
  updateManaRegeneration(deltaTime) {
    const currentMana = this.gameState.getPlayerMana();
    const maxMana = this.gameState.getPlayerMaxMana();

    if (currentMana < maxMana) {
      const regenAmount = (this.manaRegenRate * deltaTime) / 1000;
      this.gameState.setPlayerMana(
        Math.min(maxMana, currentMana + regenAmount)
      );
    }
  }

  /**
   * Gain experience in a magic school
   * @param {string} school - Magic school
   * @param {number} amount - Experience amount
   */
  gainSchoolExperience(school, amount) {
    if (!this.schools[school]) return;

    this.schools[school].experience += amount;

    // Level up check (100 exp per level)
    const expForNextLevel = this.schools[school].level * 100;
    if (this.schools[school].experience >= expForNextLevel) {
      this.schools[school].level++;
      this.schools[school].experience -= expForNextLevel;

      logger.info(`${school} magic leveled up to ${this.schools[school].level}!`);

      this.eventManager.triggerEvent('magicLevelUp', {
        school,
        level: this.schools[school].level,
      });
    }
  }

  /**
   * Enchant an item
   * @param {string} itemId - Item to enchant
   * @param {Object} enchantment - Enchantment data
   * @returns {Object} Enchantment result
   */
  enchantItem(itemId, enchantment) {
    const item = this.gameState.getItem(itemId);
    if (!item) {
      return { success: false, message: 'Item not found!' };
    }

    if (this.enchantments.has(itemId)) {
      return { success: false, message: 'Item already enchanted!' };
    }

    // Check mana cost
    const manaCost = enchantment.manaCost || 50;
    const currentMana = this.gameState.getPlayerMana();
    if (currentMana < manaCost) {
      return { success: false, message: 'Not enough mana!' };
    }

    this.gameState.setPlayerMana(currentMana - manaCost);
    this.enchantments.set(itemId, enchantment);
    this.stats.enchantmentsCreated++;

    logger.info(`Enchanted ${item.name} with ${enchantment.name}`);

    return {
      success: true,
      message: `Successfully enchanted ${item.name}!`,
      enchantment,
    };
  }

  /**
   * Get item enchantment
   * @param {string} itemId - Item ID
   * @returns {Object|null} Enchantment or null
   */
  getEnchantment(itemId) {
    return this.enchantments.get(itemId) || null;
  }

  /**
   * Remove enchantment from item
   * @param {string} itemId - Item ID
   * @returns {boolean} Success
   */
  removeEnchantment(itemId) {
    return this.enchantments.delete(itemId);
  }

  /**
   * Get spell by ID
   * @param {string} spellId - Spell ID
   * @returns {Object|null} Spell data or null
   */
  getSpell(spellId) {
    for (const school in this.spellLibrary) {
      const spell = this.spellLibrary[school].find((s) => s.id === spellId);
      if (spell) return spell;
    }
    return null;
  }

  /**
   * Get all known spells
   * @returns {Array} Array of known spells
   */
  getKnownSpells() {
    return Array.from(this.knownSpells).map((id) => this.getSpell(id));
  }

  /**
   * Get available spells for school
   * @param {string} school - Magic school
   * @returns {Array} Available spells
   */
  getSpellsBySchool(school) {
    return this.spellLibrary[school] || [];
  }

  /**
   * Play spell visual and sound effects
   * @param {Object} spell - Spell data
   */
  playSpellEffects(spell) {
    // Play sound effect
    const soundEffect = `spell_${spell.school}`;
    this.soundManager.playSoundEffect(soundEffect);

    // Play visual effect
    if (this.viewManager.playEffect) {
      this.viewManager.playEffect(`spell_${spell.school}`, {
        duration: spell.castTime || 1,
      });
    }
  }

  /**
   * Get magic statistics
   * @returns {Object} Magic stats
   */
  getStatistics() {
    return {
      ...this.stats,
      schools: { ...this.schools },
      knownSpellCount: this.knownSpells.size,
      activeEffectsCount: this.activeEffects.length,
    };
  }

  /**
   * Save magic system state
   * @returns {Object} Save data
   */
  save() {
    return {
      knownSpells: Array.from(this.knownSpells),
      schools: { ...this.schools },
      enchantments: Array.from(this.enchantments.entries()),
      stats: { ...this.stats },
    };
  }

  /**
   * Load magic system state
   * @param {Object} saveData - Save data
   */
  load(saveData) {
    this.knownSpells = new Set(saveData.knownSpells || []);
    this.schools = saveData.schools || this.schools;
    this.enchantments = new Map(saveData.enchantments || []);
    this.stats = saveData.stats || this.stats;
  }
}
