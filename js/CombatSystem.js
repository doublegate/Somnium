/**
 * CombatSystem - Turn-based combat system with animations and enemy AI
 *
 * Features:
 * - Turn-based combat with initiative
 * - Attack/defend/flee/use item mechanics
 * - Enemy AI with difficulty levels
 * - Combat animations and effects
 * - Damage calculation with critical hits
 * - Status effects (poison, stun, etc.)
 * - Victory/defeat handling with experience
 * - Combat statistics tracking
 */

import { logger } from './logger.js';

export class CombatSystem {
  constructor(gameState, soundManager, viewManager, eventManager) {
    this.gameState = gameState;
    this.soundManager = soundManager;
    this.viewManager = viewManager;
    this.eventManager = eventManager;

    // Combat state
    this.inCombat = false;
    this.combatData = null;
    this.turnOrder = [];
    this.currentTurn = 0;
    this.playerAction = null;

    // Combat statistics
    this.stats = {
      battlesWon: 0,
      battlesLost: 0,
      battlesFled: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      criticalHits: 0,
    };

    // Enemy AI strategies
    this.aiStrategies = {
      aggressive: this.aggressiveAI.bind(this),
      defensive: this.defensiveAI.bind(this),
      balanced: this.balancedAI.bind(this),
      tactical: this.tacticalAI.bind(this),
    };

    // Status effect definitions
    this.statusEffects = {
      poison: {
        name: 'Poisoned',
        duration: 3,
        onTurn: (combatant) => this.applyPoisonDamage(combatant),
      },
      stun: {
        name: 'Stunned',
        duration: 1,
        onTurn: (combatant) => (combatant.canAct = false),
      },
      burn: {
        name: 'Burning',
        duration: 2,
        onTurn: (combatant) => this.applyBurnDamage(combatant),
      },
      regen: {
        name: 'Regenerating',
        duration: 3,
        onTurn: (combatant) => this.applyRegen(combatant),
      },
      defend: {
        name: 'Defending',
        duration: 1,
        onTurn: (combatant) => (combatant.defenseBonus = 2),
      },
    };

    // Damage type effectiveness
    this.damageTypes = {
      physical: { multipliers: { ghost: 0.5, undead: 1.0, beast: 1.2 } },
      magical: { multipliers: { ghost: 1.5, undead: 1.2, beast: 0.8 } },
      fire: { multipliers: { ice: 2.0, plant: 1.5, water: 0.5 } },
      ice: { multipliers: { fire: 0.5, plant: 1.5, water: 1.2 } },
      lightning: { multipliers: { water: 2.0, metal: 1.5, earth: 0.5 } },
    };
  }

  /**
   * Start combat encounter
   * @param {Object} enemy - Enemy data
   * @param {Object} options - Combat options (canFlee, etc.)
   * @returns {Object} Combat initialization result
   */
  startCombat(enemy, options = {}) {
    if (this.inCombat) {
      return { success: false, message: 'Already in combat!' };
    }

    logger.info('Starting combat with', enemy.name);

    // Initialize combat data
    this.inCombat = true;
    this.combatData = {
      enemy: {
        ...enemy,
        currentHealth: enemy.health,
        maxHealth: enemy.health,
        currentMana: enemy.mana || 0,
        maxMana: enemy.mana || 0,
        statusEffects: [],
        canAct: true,
        defenseBonus: 0,
      },
      player: {
        name: 'Player',
        currentHealth: this.gameState.getPlayerHealth(),
        maxHealth: this.gameState.getPlayerMaxHealth(),
        currentMana: this.gameState.getPlayerMana(),
        maxMana: this.gameState.getPlayerMaxMana(),
        attack: this.gameState.getPlayerAttack(),
        defense: this.gameState.getPlayerDefense(),
        magic: this.gameState.getPlayerMagic(),
        statusEffects: [],
        canAct: true,
        defenseBonus: 0,
      },
      canFlee: options.canFlee !== false,
      isBossFight: options.isBossFight || false,
      turnCount: 0,
      combatLog: [],
    };

    // Determine turn order based on initiative
    this.determineTurnOrder();

    // Play combat music
    this.soundManager.playMusic('combat', { loop: true });

    // Trigger combat start event
    this.eventManager.triggerEvent('combatStart', {
      enemy: enemy.name,
      playerHealth: this.combatData.player.currentHealth,
    });

    this.addToCombatLog(`Combat started with ${enemy.name}!`);

    // Start first turn
    this.processTurn();

    return {
      success: true,
      message: `You enter combat with ${enemy.name}!`,
      combatData: this.getCombatData(),
    };
  }

  /**
   * Determine turn order based on initiative/speed
   */
  determineTurnOrder() {
    const playerInitiative =
      this.combatData.player.speed ||
      10 + Math.floor(Math.random() * 10);
    const enemyInitiative =
      this.combatData.enemy.speed || 10 + Math.floor(Math.random() * 10);

    if (playerInitiative >= enemyInitiative) {
      this.turnOrder = ['player', 'enemy'];
      this.addToCombatLog('You have initiative!');
    } else {
      this.turnOrder = ['enemy', 'player'];
      this.addToCombatLog(`${this.combatData.enemy.name} has initiative!`);
    }

    this.currentTurn = 0;
  }

  /**
   * Process current turn
   */
  processTurn() {
    const actor = this.turnOrder[this.currentTurn];
    this.combatData.turnCount++;

    // Process status effects at start of turn
    this.processStatusEffects(actor);

    if (!this.combatData[actor].canAct) {
      this.addToCombatLog(`${this.combatData[actor].name} is stunned!`);
      this.nextTurn();
      return;
    }

    if (actor === 'enemy') {
      // Enemy AI takes action
      setTimeout(() => this.performEnemyAction(), 1000);
    }
    // Player action is handled via executePlayerAction()
  }

  /**
   * Execute player action
   * @param {string} action - Action type (attack, defend, flee, item, magic)
   * @param {Object} params - Action parameters
   * @returns {Object} Action result
   */
  executePlayerAction(action, params = {}) {
    if (!this.inCombat) {
      return { success: false, message: 'Not in combat!' };
    }

    if (this.turnOrder[this.currentTurn] !== 'player') {
      return { success: false, message: 'Not your turn!' };
    }

    let result;

    switch (action) {
      case 'attack':
        result = this.performAttack('player', 'enemy', params);
        break;
      case 'defend':
        result = this.performDefend('player');
        break;
      case 'flee':
        result = this.attemptFlee();
        break;
      case 'item':
        result = this.useItem('player', params.itemId);
        break;
      case 'magic':
        result = this.castSpell('player', 'enemy', params.spellId);
        break;
      default:
        return { success: false, message: 'Unknown action!' };
    }

    if (result.success && action !== 'flee') {
      this.nextTurn();
    }

    return result;
  }

  /**
   * Perform attack action
   * @param {string} attacker - 'player' or 'enemy'
   * @param {string} target - 'player' or 'enemy'
   * @param {Object} params - Attack parameters
   * @returns {Object} Attack result
   */
  performAttack(attacker, target, params = {}) {
    const attackerData = this.combatData[attacker];
    const targetData = this.combatData[target];

    // Calculate base damage
    let baseDamage = attackerData.attack || 10;
    if (params.weapon) {
      baseDamage += params.weapon.damage || 0;
    }

    // Calculate defense
    const defense =
      (targetData.defense || 5) + (targetData.defenseBonus || 0);

    // Hit chance (base 90%, modified by stats)
    const hitChance = 0.9;
    const hitRoll = Math.random();

    if (hitRoll > hitChance) {
      this.addToCombatLog(`${attackerData.name}'s attack misses!`);
      this.playAttackAnimation(attacker, false);
      return { success: true, hit: false, damage: 0 };
    }

    // Critical hit (10% chance)
    const isCritical = Math.random() < 0.1;
    let damage = Math.max(1, baseDamage - defense);

    if (isCritical) {
      damage = Math.floor(damage * 2);
      this.addToCombatLog(`CRITICAL HIT!`);
      if (attacker === 'player') this.stats.criticalHits++;
    }

    // Apply damage type effectiveness
    if (params.damageType && targetData.type) {
      const multiplier =
        this.damageTypes[params.damageType]?.multipliers[targetData.type] ||
        1.0;
      damage = Math.floor(damage * multiplier);
    }

    // Apply damage
    targetData.currentHealth = Math.max(
      0,
      targetData.currentHealth - damage
    );

    // Update statistics
    if (attacker === 'player') {
      this.stats.totalDamageDealt += damage;
    } else {
      this.stats.totalDamageTaken += damage;
    }

    this.addToCombatLog(
      `${attackerData.name} attacks ${targetData.name} for ${damage} damage!`
    );
    this.playAttackAnimation(attacker, true);

    // Check for victory/defeat
    if (targetData.currentHealth <= 0) {
      this.endCombat(attacker === 'player' ? 'victory' : 'defeat');
    }

    return { success: true, hit: true, damage, critical: isCritical };
  }

  /**
   * Perform defend action
   * @param {string} actor - 'player' or 'enemy'
   * @returns {Object} Defend result
   */
  performDefend(actor) {
    const actorData = this.combatData[actor];
    actorData.defenseBonus = 2;

    // Apply defend status effect
    this.applyStatusEffect(actor, 'defend');

    this.addToCombatLog(`${actorData.name} takes a defensive stance!`);
    this.soundManager.playSoundEffect('defend');

    return { success: true };
  }

  /**
   * Attempt to flee from combat
   * @returns {Object} Flee result
   */
  attemptFlee() {
    if (!this.combatData.canFlee) {
      this.addToCombatLog("You can't flee from this battle!");
      return { success: false, message: "Can't flee!" };
    }

    // 60% base flee chance
    const fleeChance = 0.6;
    const fleeRoll = Math.random();

    if (fleeRoll < fleeChance) {
      this.addToCombatLog('You successfully fled from combat!');
      this.stats.battlesFled++;
      this.endCombat('fled');
      return { success: true, fled: true };
    } else {
      this.addToCombatLog('Failed to flee!');
      this.nextTurn();
      return { success: true, fled: false };
    }
  }

  /**
   * Use item in combat
   * @param {string} user - 'player' or 'enemy'
   * @param {string} itemId - Item ID
   * @returns {Object} Item use result
   */
  useItem(user, itemId) {
    const item = this.gameState.getItem(itemId);
    if (!item) {
      return { success: false, message: 'Item not found!' };
    }

    const userData = this.combatData[user];

    // Health potion
    if (item.restoresHealth) {
      const healAmount = item.restoresHealth;
      userData.currentHealth = Math.min(
        userData.maxHealth,
        userData.currentHealth + healAmount
      );
      this.addToCombatLog(
        `${userData.name} used ${item.name} and restored ${healAmount} health!`
      );
    }

    // Mana potion
    if (item.restoresMana) {
      const manaAmount = item.restoresMana;
      userData.currentMana = Math.min(
        userData.maxMana,
        userData.currentMana + manaAmount
      );
      this.addToCombatLog(
        `${userData.name} used ${item.name} and restored ${manaAmount} mana!`
      );
    }

    // Remove item from inventory (if consumable)
    if (user === 'player' && item.consumable !== false) {
      this.gameState.removeItem(itemId);
    }

    this.soundManager.playSoundEffect('item_use');

    return { success: true };
  }

  /**
   * Cast spell in combat
   * @param {string} caster - 'player' or 'enemy'
   * @param {string} target - 'player' or 'enemy'
   * @param {string} spellId - Spell ID
   * @returns {Object} Spell cast result
   */
  castSpell(caster, target, spellId) {
    const casterData = this.combatData[caster];
    const targetData = this.combatData[target];

    // Get spell from magic system (will be implemented)
    const spell = this.getSpell(spellId);
    if (!spell) {
      return { success: false, message: 'Spell not found!' };
    }

    // Check mana cost
    if (casterData.currentMana < spell.manaCost) {
      this.addToCombatLog(`Not enough mana to cast ${spell.name}!`);
      return { success: false, message: 'Not enough mana!' };
    }

    // Deduct mana
    casterData.currentMana -= spell.manaCost;

    // Apply spell effects
    if (spell.damage) {
      const damage = Math.floor(
        spell.damage + (casterData.magic || 0) * 0.5
      );
      targetData.currentHealth = Math.max(
        0,
        targetData.currentHealth - damage
      );
      this.addToCombatLog(
        `${casterData.name} casts ${spell.name} for ${damage} magical damage!`
      );

      if (targetData.currentHealth <= 0) {
        this.endCombat(caster === 'player' ? 'victory' : 'defeat');
      }
    }

    if (spell.heal) {
      const healAmount = spell.heal;
      casterData.currentHealth = Math.min(
        casterData.maxHealth,
        casterData.currentHealth + healAmount
      );
      this.addToCombatLog(
        `${casterData.name} casts ${spell.name} and heals ${healAmount} HP!`
      );
    }

    if (spell.statusEffect) {
      this.applyStatusEffect(target, spell.statusEffect);
    }

    this.soundManager.playSoundEffect('spell_cast');

    return { success: true };
  }

  /**
   * Perform enemy action (AI)
   */
  performEnemyAction() {
    const enemy = this.combatData.enemy;
    const strategy =
      this.aiStrategies[enemy.aiStrategy || 'balanced'] ||
      this.aiStrategies.balanced;

    const action = strategy();
    this.addToCombatLog(`${enemy.name}'s turn...`);

    switch (action.type) {
      case 'attack':
        this.performAttack('enemy', 'player', action.params);
        break;
      case 'defend':
        this.performDefend('enemy');
        break;
      case 'magic':
        this.castSpell('enemy', 'player', action.params.spellId);
        break;
    }

    this.nextTurn();
  }

  /**
   * Aggressive AI strategy
   * @returns {Object} AI action
   */
  aggressiveAI() {
    return { type: 'attack', params: {} };
  }

  /**
   * Defensive AI strategy
   * @returns {Object} AI action
   */
  defensiveAI() {
    const enemy = this.combatData.enemy;
    const healthPercent = enemy.currentHealth / enemy.maxHealth;

    if (healthPercent < 0.3) {
      return { type: 'defend', params: {} };
    }
    return { type: 'attack', params: {} };
  }

  /**
   * Balanced AI strategy
   * @returns {Object} AI action
   */
  balancedAI() {
    const enemy = this.combatData.enemy;
    const healthPercent = enemy.currentHealth / enemy.maxHealth;
    const choice = Math.random();

    if (healthPercent < 0.5 && choice < 0.3) {
      return { type: 'defend', params: {} };
    }
    return { type: 'attack', params: {} };
  }

  /**
   * Tactical AI strategy (uses spells and items)
   * @returns {Object} AI action
   */
  tacticalAI() {
    const enemy = this.combatData.enemy;
    const healthPercent = enemy.currentHealth / enemy.maxHealth;

    // Use healing spell if low health
    if (healthPercent < 0.3 && enemy.currentMana >= 10) {
      return {
        type: 'magic',
        params: { spellId: 'heal' },
      };
    }

    // Use offensive spell if high mana
    if (enemy.currentMana >= 15 && Math.random() < 0.4) {
      return {
        type: 'magic',
        params: { spellId: 'fireball' },
      };
    }

    return { type: 'attack', params: {} };
  }

  /**
   * Apply status effect to combatant
   * @param {string} target - 'player' or 'enemy'
   * @param {string} effectId - Status effect ID
   */
  applyStatusEffect(target, effectId) {
    const targetData = this.combatData[target];
    const effect = this.statusEffects[effectId];

    if (!effect) return;

    // Check if already has this effect
    const existing = targetData.statusEffects.find(
      (e) => e.id === effectId
    );
    if (existing) {
      existing.turnsRemaining = effect.duration;
    } else {
      targetData.statusEffects.push({
        id: effectId,
        name: effect.name,
        turnsRemaining: effect.duration,
      });
    }

    this.addToCombatLog(`${targetData.name} is now ${effect.name}!`);
  }

  /**
   * Process status effects at start of turn
   * @param {string} actor - 'player' or 'enemy'
   */
  processStatusEffects(actor) {
    const actorData = this.combatData[actor];
    const toRemove = [];

    for (const effect of actorData.statusEffects) {
      const effectDef = this.statusEffects[effect.id];
      if (effectDef && effectDef.onTurn) {
        effectDef.onTurn(actorData);
      }

      effect.turnsRemaining--;
      if (effect.turnsRemaining <= 0) {
        toRemove.push(effect);
      }
    }

    // Remove expired effects
    for (const effect of toRemove) {
      const index = actorData.statusEffects.indexOf(effect);
      if (index > -1) {
        actorData.statusEffects.splice(index, 1);
        this.addToCombatLog(`${effect.name} wore off!`);
      }
    }

    // Reset defense bonus if not defending
    if (!actorData.statusEffects.find((e) => e.id === 'defend')) {
      actorData.defenseBonus = 0;
    }

    // Reset canAct
    actorData.canAct = true;
  }

  /**
   * Apply poison damage
   * @param {Object} combatant - Combatant data
   */
  applyPoisonDamage(combatant) {
    const damage = Math.floor(combatant.maxHealth * 0.05);
    combatant.currentHealth = Math.max(0, combatant.currentHealth - damage);
    this.addToCombatLog(`${combatant.name} takes ${damage} poison damage!`);
  }

  /**
   * Apply burn damage
   * @param {Object} combatant - Combatant data
   */
  applyBurnDamage(combatant) {
    const damage = Math.floor(combatant.maxHealth * 0.08);
    combatant.currentHealth = Math.max(0, combatant.currentHealth - damage);
    this.addToCombatLog(`${combatant.name} takes ${damage} burn damage!`);
  }

  /**
   * Apply regeneration healing
   * @param {Object} combatant - Combatant data
   */
  applyRegen(combatant) {
    const healAmount = Math.floor(combatant.maxHealth * 0.1);
    combatant.currentHealth = Math.min(
      combatant.maxHealth,
      combatant.currentHealth + healAmount
    );
    this.addToCombatLog(`${combatant.name} regenerates ${healAmount} HP!`);
  }

  /**
   * Move to next turn
   */
  nextTurn() {
    this.currentTurn = (this.currentTurn + 1) % this.turnOrder.length;

    // If back to player's turn, process enemy turn
    if (this.turnOrder[this.currentTurn] === 'player') {
      // Player's turn - wait for input
    } else {
      // Process enemy turn
      this.processTurn();
    }
  }

  /**
   * End combat
   * @param {string} result - 'victory', 'defeat', or 'fled'
   */
  endCombat(result) {
    this.inCombat = false;

    // Update statistics
    if (result === 'victory') {
      this.stats.battlesWon++;
      const xpGained = this.combatData.enemy.xpReward || 50;
      this.gameState.addExperience(xpGained);
      this.addToCombatLog(`Victory! Gained ${xpGained} experience!`);
    } else if (result === 'defeat') {
      this.stats.battlesLost++;
      this.addToCombatLog('Defeat...');
    }

    // Stop combat music
    this.soundManager.stopMusic();

    // Trigger combat end event
    this.eventManager.triggerEvent('combatEnd', {
      result,
      enemy: this.combatData.enemy.name,
      turnsElapsed: this.combatData.turnCount,
    });

    // Award loot if victory
    if (result === 'victory' && this.combatData.enemy.loot) {
      this.awardLoot(this.combatData.enemy.loot);
    }

    const combatLog = [...this.combatData.combatLog];
    this.combatData = null;

    return { result, combatLog };
  }

  /**
   * Award loot to player
   * @param {Array} loot - Loot items
   */
  awardLoot(loot) {
    for (const item of loot) {
      const chance = item.chance || 1.0;
      if (Math.random() < chance) {
        this.gameState.addItem(item.id);
        this.addToCombatLog(`Received ${item.name}!`);
      }
    }
  }

  /**
   * Play attack animation
   * @param {string} attacker - 'player' or 'enemy'
   * @param {boolean} hit - Whether attack hit
   */
  playAttackAnimation(attacker, hit) {
    if (hit) {
      this.soundManager.playSoundEffect('attack_hit');
      this.viewManager.playEffect('hit_flash', attacker);
    } else {
      this.soundManager.playSoundEffect('attack_miss');
    }
  }

  /**
   * Add message to combat log
   * @param {string} message - Log message
   */
  addToCombatLog(message) {
    if (this.combatData) {
      this.combatData.combatLog.push(message);
    }
    logger.info('[Combat]', message);
  }

  /**
   * Get current combat data
   * @returns {Object} Combat data
   */
  getCombatData() {
    return this.combatData
      ? {
          inCombat: this.inCombat,
          player: { ...this.combatData.player },
          enemy: { ...this.combatData.enemy },
          turnCount: this.combatData.turnCount,
          currentTurn: this.turnOrder[this.currentTurn],
          combatLog: [...this.combatData.combatLog],
        }
      : { inCombat: false };
  }

  /**
   * Get spell data (temporary implementation)
   * @param {string} spellId - Spell ID
   * @returns {Object} Spell data
   */
  getSpell(spellId) {
    const spells = {
      fireball: {
        name: 'Fireball',
        manaCost: 15,
        damage: 25,
        damageType: 'fire',
      },
      heal: {
        name: 'Heal',
        manaCost: 10,
        heal: 30,
      },
      poison: {
        name: 'Poison Cloud',
        manaCost: 12,
        damage: 10,
        statusEffect: 'poison',
      },
    };

    return spells[spellId];
  }

  /**
   * Get combat statistics
   * @returns {Object} Combat stats
   */
  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.stats = {
      battlesWon: 0,
      battlesLost: 0,
      battlesFled: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      criticalHits: 0,
    };
  }
}
