/**
 * StateAnimator - State-based animation system inspired by Sierra games
 * Manages complex character animations with state transitions
 */

export class StateAnimator {
  constructor(view) {
    this.view = view;
    this.states = new Map();
    this.currentState = null;
    this.stateTime = 0;
    this.stateFrame = 0;
    this.transitionCallbacks = new Map();

    // Animation speed control
    this.animationSpeed = 1.0;
    this.frameDuration = 0;

    // State history for debugging
    this.stateHistory = [];
    this.maxHistory = 10;
  }

  /**
   * Define an animation state
   */
  defineState(name, config) {
    this.states.set(name, {
      name: name,
      loops: config.loops || [],
      transitions: config.transitions || {},
      onEnter: config.onEnter || (() => {}),
      onExit: config.onExit || (() => {}),
      onFrame: config.onFrame || (() => {}),
      duration: config.duration || Infinity,
      nextState: config.nextState || null,
      priority: config.priority || 0,
      interruptible: config.interruptible !== false,
    });
  }

  /**
   * Initialize common character states (based on Sierra games)
   */
  initializeCharacterStates() {
    // Idle state - character standing still
    this.defineState('idle', {
      loops: [{ loop: 0, cels: [0], cycleTime: 1000 }],
      transitions: {
        walk: { condition: () => this.view.isMoving },
        sit: { condition: () => this.view.wantsToSit },
        pickup: { condition: () => this.view.currentAction === 'take' },
        talk: { condition: () => this.view.isTalking },
      },
    });

    // Walking states for 8 directions (KQ4/SQ3 style)
    const walkStates = {
      walk_north: { loop: 3, direction: 'north' },
      walk_south: { loop: 2, direction: 'south' },
      walk_east: { loop: 0, direction: 'east' },
      walk_west: { loop: 1, direction: 'west' },
      walk_northeast: { loop: 4, direction: 'northeast' },
      walk_northwest: { loop: 5, direction: 'northwest' },
      walk_southeast: { loop: 6, direction: 'southeast' },
      walk_southwest: { loop: 7, direction: 'southwest' },
    };

    for (const [stateName, config] of Object.entries(walkStates)) {
      this.defineState(stateName, {
        loops: [{ loop: config.loop, cels: [0, 1, 2, 3], cycleTime: 150 }],
        transitions: {
          idle: { condition: () => !this.view.isMoving },
          // Transition to other walk directions
          ...Object.keys(walkStates).reduce((acc, name) => {
            if (name !== stateName) {
              acc[name] = {
                condition: () =>
                  this.view.isMoving &&
                  this.view.direction === walkStates[name].direction,
              };
            }
            return acc;
          }, {}),
        },
      });
    }

    // Pick up animation (from KQ4)
    this.defineState('pickup', {
      loops: [{ loop: 8, cels: [0, 1, 2, 3, 4], cycleTime: 200 }],
      duration: 1000,
      nextState: 'idle',
      interruptible: false,
      onExit: () => {
        this.view.currentAction = null;
        this.view.onActionComplete?.('pickup');
      },
    });

    // Sitting states (from SQ3 bar scene)
    this.defineState('sit_down', {
      loops: [{ loop: 9, cels: [0, 1, 2, 3], cycleTime: 200 }],
      duration: 800,
      nextState: 'sitting',
      interruptible: false,
    });

    this.defineState('sitting', {
      loops: [{ loop: 10, cels: [0], cycleTime: 1000 }],
      transitions: {
        stand_up: { condition: () => !this.view.wantsToSit },
      },
    });

    this.defineState('stand_up', {
      loops: [{ loop: 9, cels: [3, 2, 1, 0], cycleTime: 200 }],
      duration: 800,
      nextState: 'idle',
      interruptible: false,
    });

    // Talking animation (multiple loops for variety)
    this.defineState('talk', {
      loops: [
        { loop: 11, cels: [0, 1, 2, 1], cycleTime: 150 },
        { loop: 12, cels: [0, 1, 2, 3, 2, 1], cycleTime: 120 },
      ],
      transitions: {
        idle: { condition: () => !this.view.isTalking },
      },
      onFrame: (frame) => {
        // Sync mouth movement with dialogue
        if (this.view.currentDialogue) {
          const syllableIndex = Math.floor(this.stateTime / 150) % 4;
          this.view.mouthFrame = syllableIndex;
        }
      },
    });

    // Death animation (from various Sierra games)
    this.defineState('death', {
      loops: [{ loop: 13, cels: [0, 1, 2, 3, 4, 5], cycleTime: 300 }],
      duration: 1800,
      interruptible: false,
      priority: 100, // Highest priority
      onExit: () => {
        this.view.isDead = true;
        this.view.onDeath?.();
      },
    });

    // Swimming states (from KQ4)
    this.defineState('swim', {
      loops: [{ loop: 14, cels: [0, 1, 2, 3], cycleTime: 250 }],
      transitions: {
        idle: { condition: () => !this.view.inWater },
        drown: { condition: () => this.view.oxygen <= 0 },
      },
    });

    // Combat states (from QFG1)
    this.defineState('attack', {
      loops: [{ loop: 15, cels: [0, 1, 2, 3, 4], cycleTime: 100 }],
      duration: 500,
      nextState: 'combat_ready',
      interruptible: false,
      onFrame: (frame) => {
        // Trigger hit detection on specific frame
        if (frame === 3) {
          this.view.onAttackFrame?.();
        }
      },
    });

    this.defineState('dodge', {
      loops: [{ loop: 16, cels: [0, 1, 2, 1, 0], cycleTime: 150 }],
      duration: 750,
      nextState: 'combat_ready',
      interruptible: false,
    });

    this.defineState('combat_ready', {
      loops: [{ loop: 17, cels: [0, 1], cycleTime: 500 }],
      transitions: {
        attack: { condition: () => this.view.wantsToAttack },
        dodge: { condition: () => this.view.wantsToDodge },
        idle: { condition: () => !this.view.inCombat },
      },
    });
  }

  /**
   * Update animation state
   */
  update(deltaTime) {
    if (!this.currentState) {
      this.changeState('idle');
      return;
    }

    const state = this.states.get(this.currentState);
    if (!state) return;

    // Update state time
    this.stateTime += deltaTime * this.animationSpeed;

    // Check duration-based transitions
    if (this.stateTime >= state.duration && state.nextState) {
      this.changeState(state.nextState);
      return;
    }

    // Check conditional transitions
    for (const [nextState, transition] of Object.entries(state.transitions)) {
      if (transition.condition()) {
        // Check priority - don't interrupt higher priority states
        const nextStateObj = this.states.get(nextState);
        if (!state.interruptible && nextStateObj.priority <= state.priority) {
          continue;
        }

        this.changeState(nextState);
        return;
      }
    }

    // Update animation frame
    this.updateAnimation(state, deltaTime);
  }

  /**
   * Update current animation frame
   */
  updateAnimation(state, deltaTime) {
    if (!state.loops || state.loops.length === 0) return;

    // Select loop (can have multiple for variety)
    const loopIndex = this.view.animationVariant || 0;
    const loop = state.loops[loopIndex % state.loops.length];

    if (!loop.cels || loop.cels.length === 0) return;

    // Update frame duration
    this.frameDuration += deltaTime * this.animationSpeed;

    if (this.frameDuration >= loop.cycleTime) {
      this.frameDuration = 0;
      this.stateFrame = (this.stateFrame + 1) % loop.cels.length;

      // Call frame callback
      state.onFrame?.(this.stateFrame);
    }

    // Apply to view
    this.view.setLoop(loop.loop);
    this.view.setCel(loop.cels[this.stateFrame]);
  }

  /**
   * Change to a new state
   */
  changeState(newStateName) {
    if (this.currentState === newStateName) return;

    const oldState = this.states.get(this.currentState);
    const newState = this.states.get(newStateName);

    if (!newState) {
      console.warn(`State '${newStateName}' not defined`);
      return;
    }

    // Exit old state
    if (oldState) {
      oldState.onExit();

      // Add to history
      this.stateHistory.push({
        state: this.currentState,
        duration: this.stateTime,
        timestamp: Date.now(),
      });

      if (this.stateHistory.length > this.maxHistory) {
        this.stateHistory.shift();
      }
    }

    // Enter new state
    this.currentState = newStateName;
    this.stateTime = 0;
    this.stateFrame = 0;
    this.frameDuration = 0;

    newState.onEnter();

    // Trigger transition callbacks
    const callback = this.transitionCallbacks.get(
      `${oldState?.name}->${newState.name}`
    );
    if (callback) {
      callback();
    }
  }

  /**
   * Force a state change (ignores interruptible flag)
   */
  forceState(stateName) {
    const state = this.states.get(stateName);
    if (state) {
      this.currentState = null; // Clear to force change
      this.changeState(stateName);
    }
  }

  /**
   * Register a transition callback
   */
  onTransition(fromState, toState, callback) {
    this.transitionCallbacks.set(`${fromState}->${toState}`, callback);
  }

  /**
   * Get current state info
   */
  getCurrentStateInfo() {
    const state = this.states.get(this.currentState);
    if (!state) return null;

    return {
      name: this.currentState,
      time: this.stateTime,
      frame: this.stateFrame,
      interruptible: state.interruptible,
      priority: state.priority,
    };
  }

  /**
   * Check if in a specific state
   */
  isInState(stateName) {
    return this.currentState === stateName;
  }

  /**
   * Check if in any of the listed states
   */
  isInAnyState(stateNames) {
    return stateNames.includes(this.currentState);
  }

  /**
   * Set animation speed multiplier
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  /**
   * Get state history for debugging
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearHistory() {
    this.stateHistory = [];
  }
}
