/**
 * PuzzleBuilder - Visual puzzle designer with flowchart interface
 *
 * Features:
 * - Flowchart-style step visualization
 * - Drag-and-drop step positioning
 * - Dependency management
 * - Testing simulation
 * - Validation and solvability checking
 * - Multi-step puzzle creation
 */

export class PuzzleBuilder {
  constructor() {
    // Canvas and rendering
    this.canvas = document.getElementById('puzzleCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.gridSize = 50;
    this.showGrid = true;
    this.autoArrange = true;

    // Puzzle data
    this.puzzle = this.createEmptyPuzzle();
    this.steps = new Map(); // stepId -> { id, type, description, requirement, x, y, width, height, dependencies, hints }
    this.selectedStep = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Testing
    this.isTestMode = false;
    this.testState = {
      currentStep: null,
      completedSteps: new Set(),
      inventory: [],
    };

    // UI elements
    this.initializeUIElements();
    this.setupEventListeners();
    this.updateCanvas();
    this.updateUI();
    this.log('Puzzle Builder initialized');
  }

  /**
   * Create empty puzzle template
   */
  createEmptyPuzzle() {
    return {
      id: 'puzzle_1',
      name: 'Untitled Puzzle',
      description: '',
      difficulty: 'medium',
      category: 'logic',
      steps: [],
      rewards: [],
      hints: [],
    };
  }

  /**
   * Initialize UI element references
   */
  initializeUIElements() {
    this.ui = {
      // Toolbar
      newPuzzle: document.getElementById('newPuzzle'),
      loadPuzzle: document.getElementById('loadPuzzle'),
      savePuzzle: document.getElementById('savePuzzle'),
      exportPuzzle: document.getElementById('exportPuzzle'),
      addStep: document.getElementById('addStep'),
      deleteStep: document.getElementById('deleteStep'),
      testPuzzle: document.getElementById('testPuzzle'),
      showGrid: document.getElementById('showGrid'),
      autoArrange: document.getElementById('autoArrange'),
      validatePuzzle: document.getElementById('validatePuzzle'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      resetView: document.getElementById('resetView'),
      zoomLevel: document.getElementById('zoomLevel'),

      // Puzzle properties
      puzzleId: document.getElementById('puzzleId'),
      puzzleName: document.getElementById('puzzleName'),
      puzzleDescription: document.getElementById('puzzleDescription'),
      puzzleDifficulty: document.getElementById('puzzleDifficulty'),
      puzzleCategory: document.getElementById('puzzleCategory'),

      // Step properties
      stepProperties: document.getElementById('stepProperties'),
      stepDependencies: document.getElementById('stepDependencies'),
      stepHints: document.getElementById('stepHints'),
      hintsList: document.getElementById('hintsList'),
      addHint: document.getElementById('addHint'),

      // Rewards
      rewardsList: document.getElementById('rewardsList'),
      addReward: document.getElementById('addReward'),

      // Bottom panel
      validationResults: document.getElementById('validationResults'),
      consoleOutput: document.getElementById('consoleOutput'),
      testOutput: document.getElementById('testOutput'),
      startTest: document.getElementById('startTest'),
      resetTest: document.getElementById('resetTest'),
      stepForward: document.getElementById('stepForward'),

      // Modals
      stepModal: document.getElementById('stepModal'),
      loadPuzzleModal: document.getElementById('loadPuzzleModal'),
      puzzleFileInput: document.getElementById('puzzleFileInput'),
    };
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Toolbar actions
    this.ui.newPuzzle.addEventListener('click', () => this.newPuzzle());
    this.ui.loadPuzzle.addEventListener('click', () =>
      this.showModal('loadPuzzleModal')
    );
    this.ui.savePuzzle.addEventListener('click', () => this.savePuzzle());
    this.ui.exportPuzzle.addEventListener('click', () => this.exportPuzzle());
    this.ui.addStep.addEventListener('click', () => this.addStep('item'));
    this.ui.deleteStep.addEventListener('click', () =>
      this.deleteSelectedStep()
    );
    this.ui.testPuzzle.addEventListener('click', () => this.testPuzzle());
    this.ui.validatePuzzle.addEventListener('click', () =>
      this.validatePuzzle()
    );

    // Grid controls
    this.ui.showGrid.addEventListener('change', (e) => {
      this.showGrid = e.target.checked;
      this.updateCanvas();
    });
    this.ui.autoArrange.addEventListener('change', (e) => {
      this.autoArrange = e.target.checked;
      if (e.target.checked) this.autoArrangeSteps();
    });

    // Zoom controls
    this.ui.zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
    this.ui.zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    this.ui.resetView.addEventListener('click', () => this.resetView());

    // Puzzle properties
    this.ui.puzzleId.addEventListener('change', (e) => {
      this.puzzle.id = e.target.value;
    });
    this.ui.puzzleName.addEventListener('change', (e) => {
      this.puzzle.name = e.target.value;
    });
    this.ui.puzzleDescription.addEventListener('change', (e) => {
      this.puzzle.description = e.target.value;
    });
    this.ui.puzzleDifficulty.addEventListener('change', (e) => {
      this.puzzle.difficulty = e.target.value;
    });
    this.ui.puzzleCategory.addEventListener('change', (e) => {
      this.puzzle.category = e.target.value;
    });

    // Template buttons
    document.querySelectorAll('.template-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.addStep(type);
      });
    });

    // Rewards
    this.ui.addReward.addEventListener('click', () => this.addReward());

    // Canvas interactions
    this.canvas.addEventListener('mousedown', (e) =>
      this.handleCanvasMouseDown(e)
    );
    this.canvas.addEventListener('mousemove', (e) =>
      this.handleCanvasMouseMove(e)
    );
    this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    this.canvas.addEventListener('dblclick', (e) =>
      this.handleCanvasDoubleClick(e)
    );

    // File input
    this.ui.puzzleFileInput.addEventListener('change', (e) =>
      this.loadPuzzleFile(e)
    );

    // Test controls
    this.ui.startTest.addEventListener('click', () => this.startTest());
    this.ui.resetTest.addEventListener('click', () => this.resetTest());
    this.ui.stepForward.addEventListener('click', () => this.stepForwardTest());

    // Modal controls
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    document.getElementById('saveStepModal').addEventListener('click', () => {
      this.saveStepFromModal();
    });

    // Tab switching
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * Handle canvas mouse down
   */
  handleCanvasMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.zoom;
    const y = (e.clientY - rect.top - this.panY) / this.zoom;

    const clickedStep = this.findStepAtPosition(x, y);

    if (clickedStep) {
      this.selectedStep = clickedStep;
      this.isDragging = true;
      this.dragStart = { x: x - clickedStep.x, y: y - clickedStep.y };
      this.updateStepProperties();
      this.updateCanvas();
    }
  }

  /**
   * Handle canvas mouse move
   */
  handleCanvasMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.zoom;
    const y = (e.clientY - rect.top - this.panY) / this.zoom;

    if (this.isDragging && this.selectedStep) {
      this.selectedStep.x = x - this.dragStart.x;
      this.selectedStep.y = y - this.dragStart.y;
      this.updateCanvas();
    }
  }

  /**
   * Handle canvas mouse up
   */
  handleCanvasMouseUp(e) {
    this.isDragging = false;
  }

  /**
   * Handle canvas wheel (zoom)
   */
  handleCanvasWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.adjustZoom(delta);
  }

  /**
   * Handle canvas double-click
   */
  handleCanvasDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.zoom;
    const y = (e.clientY - rect.top - this.panY) / this.zoom;

    const clickedStep = this.findStepAtPosition(x, y);
    if (clickedStep) {
      this.editStepModal(clickedStep);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(e) {
    if (e.key === 'Delete' && this.selectedStep) {
      this.deleteSelectedStep();
    } else if (e.key === 'Escape') {
      this.selectedStep = null;
      this.updateCanvas();
    }
  }

  /**
   * Find step at canvas position
   */
  findStepAtPosition(x, y) {
    for (const step of this.steps.values()) {
      const distance = Math.sqrt(
        Math.pow(x - (step.x + step.width / 2), 2) +
          Math.pow(y - (step.y + step.height / 2), 2)
      );
      if (distance <= step.width / 2) {
        return step;
      }
    }
    return null;
  }

  /**
   * Add new step
   */
  addStep(type = 'item') {
    const stepId = `step_${Date.now()}`;
    const step = {
      id: stepId,
      type,
      description: `${type} step`,
      requirement: '',
      x: 200 + this.steps.size * 100,
      y: 200,
      width: 100,
      height: 100,
      dependencies: [],
      hints: [],
    };

    this.steps.set(stepId, step);
    this.selectedStep = step;

    if (this.autoArrange) {
      this.autoArrangeSteps();
    }

    this.updateCanvas();
    this.updateStepProperties();
    this.log(`Added ${type} step: ${stepId}`);
  }

  /**
   * Delete selected step
   */
  deleteSelectedStep() {
    if (!this.selectedStep) {
      this.log('No step selected', 'warn');
      return;
    }

    const stepId = this.selectedStep.id;
    this.steps.delete(stepId);

    // Remove dependencies
    for (const step of this.steps.values()) {
      step.dependencies = step.dependencies.filter((d) => d !== stepId);
    }

    this.selectedStep = null;
    this.updateCanvas();
    this.updateStepProperties();
    this.log(`Deleted step: ${stepId}`);
  }

  /**
   * Update canvas rendering
   */
  updateCanvas() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    if (this.showGrid) {
      this.drawGrid();
    }

    // Draw connections
    this.drawConnections();

    // Draw steps
    for (const step of this.steps.values()) {
      this.drawStep(step);
    }

    this.ctx.restore();
  }

  /**
   * Draw grid
   */
  drawGrid() {
    const { width, height } = this.canvas;
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1 / this.zoom;

    const startX =
      Math.floor(-this.panX / this.zoom / this.gridSize) * this.gridSize;
    const startY =
      Math.floor(-this.panY / this.zoom / this.gridSize) * this.gridSize;
    const endX = startX + width / this.zoom + this.gridSize;
    const endY = startY + height / this.zoom + this.gridSize;

    for (let x = startX; x < endX; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw dependency connections
   */
  drawConnections() {
    this.ctx.strokeStyle = '#AAAAAA';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);

    for (const step of this.steps.values()) {
      const fromX = step.x + step.width / 2;
      const fromY = step.y + step.height / 2;

      for (const depId of step.dependencies) {
        const depStep = this.steps.get(depId);
        if (!depStep) continue;

        const toX = depStep.x + depStep.width / 2;
        const toY = depStep.y + depStep.height / 2;

        // Draw curved arrow
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);

        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const controlX = midX + (toY - fromY) / 4;
        const controlY = midY - (toX - fromX) / 4;

        this.ctx.quadraticCurveTo(controlX, controlY, toX, toY);
        this.ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(toY - controlY, toX - controlX);
        const arrowSize = 10 / this.zoom;

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
          toX - arrowSize * Math.cos(angle - Math.PI / 6),
          toY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
          toX - arrowSize * Math.cos(angle + Math.PI / 6),
          toY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.fill();
      }
    }

    this.ctx.setLineDash([]);
  }

  /**
   * Draw step node
   */
  drawStep(step) {
    const isSelected = step === this.selectedStep;
    const isTesting = this.isTestMode && this.testState.currentStep === step;
    const isCompleted = this.testState.completedSteps.has(step.id);

    // Color based on type
    const colors = {
      item: '#FFFF55',
      action: '#FF5555',
      sequence: '#55FFFF',
      condition: '#FF55FF',
      combine: '#55FF55',
      trigger: '#5555FF',
    };
    const color = colors[step.type] || '#AAAAAA';

    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(
      step.x + step.width / 2,
      step.y + step.height / 2,
      step.width / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = isCompleted ? '#00AA00' : color;
    this.ctx.fill();

    if (isSelected || isTesting) {
      this.ctx.strokeStyle = isSelected ? '#5555FF' : '#FFFF55';
      this.ctx.lineWidth = 4 / this.zoom;
      this.ctx.stroke();
    }

    // Draw icon
    const icons = {
      item: '🔑',
      action: '⚡',
      sequence: '🔢',
      condition: '❓',
      combine: '🔗',
      trigger: '🎯',
    };
    const icon = icons[step.type] || '●';

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${24 / this.zoom}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      icon,
      step.x + step.width / 2,
      step.y + step.height / 2 - 5
    );

    // Draw label
    this.ctx.font = `${12 / this.zoom}px monospace`;
    this.ctx.fillText(
      step.type,
      step.x + step.width / 2,
      step.y + step.height + 15
    );
  }

  /**
   * Auto-arrange steps in hierarchical layout
   */
  autoArrangeSteps() {
    if (this.steps.size === 0) return;

    const steps = Array.from(this.steps.values());
    const layers = this.calculateLayers(steps);

    let y = 100;
    for (const layer of layers) {
      const xSpacing = 150;
      const startX = (this.canvas.width - layer.length * xSpacing) / 2;

      layer.forEach((step, index) => {
        step.x = startX + index * xSpacing;
        step.y = y;
      });

      y += 150;
    }

    this.updateCanvas();
  }

  /**
   * Calculate hierarchical layers for steps
   */
  calculateLayers(steps) {
    const layers = [];
    const visited = new Set();

    // Find root steps (no dependencies)
    const roots = steps.filter((s) => s.dependencies.length === 0);

    let currentLayer = roots;
    while (currentLayer.length > 0) {
      layers.push(currentLayer);
      currentLayer.forEach((s) => visited.add(s.id));

      // Find next layer (steps whose dependencies are all visited)
      currentLayer = steps.filter(
        (s) => !visited.has(s.id) && s.dependencies.every((d) => visited.has(d))
      );
    }

    return layers;
  }

  /**
   * Update step properties panel
   */
  updateStepProperties() {
    if (!this.selectedStep) {
      this.ui.stepProperties.innerHTML =
        '<p class="text-muted">Select a step to edit properties</p>';
      this.ui.stepDependencies.innerHTML =
        '<p class="text-muted">Select a step to manage dependencies</p>';
      this.ui.addHint.disabled = true;
      return;
    }

    const step = this.selectedStep;
    this.ui.addHint.disabled = false;

    // Properties form
    this.ui.stepProperties.innerHTML = `
      <div class="form-group">
        <label>Step ID:</label>
        <input type="text" value="${step.id}" readonly />
      </div>
      <div class="form-group">
        <label>Type:</label>
        <select id="propStepType">
          <option value="item" ${step.type === 'item' ? 'selected' : ''}>Item Required</option>
          <option value="action" ${step.type === 'action' ? 'selected' : ''}>Action Required</option>
          <option value="sequence" ${step.type === 'sequence' ? 'selected' : ''}>Sequence</option>
          <option value="condition" ${step.type === 'condition' ? 'selected' : ''}>Condition</option>
          <option value="combine" ${step.type === 'combine' ? 'selected' : ''}>Combine Items</option>
          <option value="trigger" ${step.type === 'trigger' ? 'selected' : ''}>Trigger Event</option>
        </select>
      </div>
      <div class="form-group">
        <label>Description:</label>
        <textarea id="propStepDescription" rows="3">${step.description}</textarea>
      </div>
      <div class="form-group">
        <label>Requirement:</label>
        <input type="text" id="propStepRequirement" value="${step.requirement}" />
      </div>
    `;

    // Dependencies form
    const otherSteps = Array.from(this.steps.values()).filter(
      (s) => s.id !== step.id
    );
    const depOptions = otherSteps
      .map((s) => `<option value="${s.id}">${s.type} - ${s.id}</option>`)
      .join('');

    this.ui.stepDependencies.innerHTML = `
      <div class="form-group">
        <label>Depends on:</label>
        <select id="addDependency">
          <option value="">Select step...</option>
          ${depOptions}
        </select>
      </div>
      <div id="currentDependencies"></div>
    `;

    // Show current dependencies
    const depsContainer = document.getElementById('currentDependencies');
    for (const depId of step.dependencies) {
      const depStep = this.steps.get(depId);
      if (!depStep) continue;

      const depItem = document.createElement('div');
      depItem.className = 'dependency-item';
      depItem.innerHTML = `
        <span>${depStep.type} - ${depStep.id}</span>
        <span class="remove-btn" data-dep="${depId}">✕</span>
      `;
      depsContainer.appendChild(depItem);
    }

    // Event listeners
    document.getElementById('propStepType').addEventListener('change', (e) => {
      step.type = e.target.value;
      this.updateCanvas();
    });

    document
      .getElementById('propStepDescription')
      .addEventListener('change', (e) => {
        step.description = e.target.value;
      });

    document
      .getElementById('propStepRequirement')
      .addEventListener('change', (e) => {
        step.requirement = e.target.value;
      });

    document.getElementById('addDependency').addEventListener('change', (e) => {
      if (e.target.value) {
        step.dependencies.push(e.target.value);
        this.updateStepProperties();
        this.updateCanvas();
        if (this.autoArrange) this.autoArrangeSteps();
      }
    });

    depsContainer.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const depId = btn.dataset.dep;
        step.dependencies = step.dependencies.filter((d) => d !== depId);
        this.updateStepProperties();
        this.updateCanvas();
      });
    });
  }

  /**
   * Validate puzzle
   */
  validatePuzzle() {
    const errors = [];
    const warnings = [];

    // Check if puzzle has steps
    if (this.steps.size === 0) {
      errors.push('Puzzle has no steps');
    }

    // Check for circular dependencies
    for (const step of this.steps.values()) {
      if (this.hasCircularDependency(step.id, new Set())) {
        errors.push(`Circular dependency detected for step ${step.id}`);
      }
    }

    // Check for unreachable steps
    const reachable = this.getReachableSteps();
    for (const step of this.steps.values()) {
      if (!reachable.has(step.id)) {
        warnings.push(`Step ${step.id} is unreachable`);
      }
    }

    let html = '';
    if (errors.length === 0) {
      html = '<div class="validation-success">✓ Puzzle is valid!</div>';
    } else {
      html += '<h4>Errors:</h4>';
      for (const error of errors) {
        html += `<div class="validation-error">${error}</div>`;
      }
    }

    if (warnings.length > 0) {
      html += '<h4>Warnings:</h4>';
      for (const warning of warnings) {
        html += `<div class="validation-warning">${warning}</div>`;
      }
    }

    this.ui.validationResults.innerHTML = html;
    this.switchTab('validation');
    this.log(
      `Validation complete: ${errors.length === 0 ? 'VALID' : 'INVALID'}`
    );
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(stepId, visited) {
    if (visited.has(stepId)) return true;
    visited.add(stepId);

    const step = this.steps.get(stepId);
    if (!step) return false;

    for (const depId of step.dependencies) {
      if (this.hasCircularDependency(depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all reachable steps from roots
   */
  getReachableSteps() {
    const reachable = new Set();
    const roots = Array.from(this.steps.values()).filter(
      (s) => s.dependencies.length === 0
    );

    const visit = (stepId) => {
      if (reachable.has(stepId)) return;
      reachable.add(stepId);

      // Visit dependents
      for (const step of this.steps.values()) {
        if (step.dependencies.includes(stepId)) {
          visit(step.id);
        }
      }
    };

    roots.forEach((root) => visit(root.id));
    return reachable;
  }

  /**
   * Start test mode
   */
  startTest() {
    this.isTestMode = true;
    this.testState.completedSteps.clear();
    this.testState.inventory = [];

    // Find first step (no dependencies)
    const firstStep = Array.from(this.steps.values()).find(
      (s) => s.dependencies.length === 0
    );

    if (!firstStep) {
      this.log('No starting step found', 'error');
      return;
    }

    this.testState.currentStep = firstStep;
    this.updateTestOutput();
    this.updateCanvas();
    this.ui.stepForward.disabled = false;
    this.log('Test mode started');
  }

  /**
   * Reset test mode
   */
  resetTest() {
    this.isTestMode = false;
    this.testState.currentStep = null;
    this.testState.completedSteps.clear();
    this.testState.inventory = [];
    this.ui.stepForward.disabled = true;
    this.updateCanvas();
    this.ui.testOutput.innerHTML =
      '<p class="text-muted">Click "Start Test" to test puzzle flow</p>';
  }

  /**
   * Step forward in test
   */
  stepForwardTest() {
    if (!this.testState.currentStep) return;

    // Mark current step as completed
    this.testState.completedSteps.add(this.testState.currentStep.id);

    // Find next available step
    const nextSteps = Array.from(this.steps.values()).filter((s) => {
      if (this.testState.completedSteps.has(s.id)) return false;
      return s.dependencies.every((d) => this.testState.completedSteps.has(d));
    });

    if (nextSteps.length > 0) {
      this.testState.currentStep = nextSteps[0];
    } else {
      this.testState.currentStep = null;
      this.ui.stepForward.disabled = true;
      this.log('Puzzle completed!', 'info');
    }

    this.updateTestOutput();
    this.updateCanvas();
  }

  /**
   * Update test output
   */
  updateTestOutput() {
    let html = '<h4>Test Progress:</h4>';

    for (const step of this.steps.values()) {
      const isCompleted = this.testState.completedSteps.has(step.id);
      const isCurrent = this.testState.currentStep === step;

      const className = isCurrent ? 'current' : isCompleted ? 'completed' : '';

      html += `
        <div class="test-step ${className}">
          <div class="test-step-header">${step.type} - ${step.id}</div>
          <div class="test-step-description">${step.description}</div>
          ${isCurrent ? '<div>← Current Step</div>' : ''}
          ${isCompleted ? '<div>✓ Completed</div>' : ''}
        </div>
      `;
    }

    this.ui.testOutput.innerHTML = html;
  }

  /**
   * Save puzzle
   */
  savePuzzle() {
    this.puzzle.steps = Array.from(this.steps.values()).map((step) => ({
      id: step.id,
      type: step.type,
      description: step.description,
      requirement: step.requirement,
      dependencies: step.dependencies,
      hints: step.hints,
    }));

    const puzzleData = JSON.stringify(this.puzzle, null, 2);
    localStorage.setItem('somnium_puzzle_builder', puzzleData);

    this.log('Puzzle saved to localStorage');
    alert('Puzzle saved successfully!');
  }

  /**
   * Export puzzle as JSON
   */
  exportPuzzle() {
    this.puzzle.steps = Array.from(this.steps.values()).map((step) => ({
      id: step.id,
      type: step.type,
      description: step.description,
      requirement: step.requirement,
      dependencies: step.dependencies,
      hints: step.hints,
    }));

    const puzzleData = JSON.stringify(this.puzzle, null, 2);
    const blob = new Blob([puzzleData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.puzzle.id}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.log(`Exported puzzle: ${a.download}`);
  }

  /**
   * Load puzzle from file
   */
  loadPuzzleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const puzzleData = JSON.parse(event.target.result);
        this.loadPuzzle(puzzleData);
        this.hideModal('loadPuzzleModal');
      } catch (error) {
        this.log(`Failed to load puzzle: ${error.message}`, 'error');
        alert('Failed to load puzzle file!');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Load puzzle data
   */
  loadPuzzle(puzzleData) {
    this.puzzle = puzzleData;
    this.steps.clear();

    for (const step of puzzleData.steps || []) {
      this.steps.set(step.id, {
        ...step,
        x: 200 + this.steps.size * 100,
        y: 200,
        width: 100,
        height: 100,
      });
    }

    this.ui.puzzleId.value = this.puzzle.id || 'puzzle_1';
    this.ui.puzzleName.value = this.puzzle.name || '';
    this.ui.puzzleDescription.value = this.puzzle.description || '';
    this.ui.puzzleDifficulty.value = this.puzzle.difficulty || 'medium';
    this.ui.puzzleCategory.value = this.puzzle.category || 'logic';

    if (this.autoArrange) {
      this.autoArrangeSteps();
    }

    this.updateCanvas();
    this.log('Puzzle loaded successfully');
  }

  /**
   * Create new puzzle
   */
  newPuzzle() {
    if (
      this.steps.size > 0 &&
      !confirm('Create new puzzle? Current work will be lost.')
    ) {
      return;
    }

    this.puzzle = this.createEmptyPuzzle();
    this.steps.clear();
    this.selectedStep = null;

    this.updateUI();
    this.updateCanvas();
    this.log('New puzzle created');
  }

  /**
   * Edit step in modal
   */
  editStepModal(step) {
    document.getElementById('modalStepId').value = step.id;
    document.getElementById('modalStepDescription').value = step.description;
    document.getElementById('modalStepType').value = step.type;
    document.getElementById('modalStepRequirement').value = step.requirement;

    this.showModal('stepModal');
  }

  /**
   * Save step from modal
   */
  saveStepFromModal() {
    if (!this.selectedStep) return;

    this.selectedStep.description = document.getElementById(
      'modalStepDescription'
    ).value;
    this.selectedStep.type = document.getElementById('modalStepType').value;
    this.selectedStep.requirement = document.getElementById(
      'modalStepRequirement'
    ).value;

    this.updateCanvas();
    this.updateStepProperties();
    this.hideModal('stepModal');
  }

  /**
   * Add reward
   */
  addReward() {
    const reward = {
      type: 'points',
      value: 10,
    };
    this.puzzle.rewards.push(reward);
    this.log('Reward added');
  }

  /**
   * Adjust zoom
   */
  adjustZoom(delta) {
    this.zoom = Math.max(0.25, Math.min(2.0, this.zoom + delta));
    this.ui.zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateCanvas();
  }

  /**
   * Reset view
   */
  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.ui.zoomLevel.textContent = '100%';
    this.updateCanvas();
  }

  /**
   * Test puzzle
   */
  testPuzzle() {
    this.startTest();
    this.switchTab('testing');
  }

  /**
   * Show modal
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === tabName);
    });
  }

  /**
   * Log message
   */
  log(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.ui.consoleOutput.appendChild(line);
    this.ui.consoleOutput.scrollTop = this.ui.consoleOutput.scrollHeight;

    console.log(`[PuzzleBuilder] ${message}`);
  }

  /**
   * Initialize UI state
   */
  updateUI() {
    this.ui.puzzleId.value = this.puzzle.id;
    this.ui.puzzleName.value = this.puzzle.name;
    this.ui.puzzleDescription.value = this.puzzle.description;
    this.ui.puzzleDifficulty.value = this.puzzle.difficulty;
    this.ui.puzzleCategory.value = this.puzzle.category;
  }
}

// Initialize builder on page load
window.addEventListener('DOMContentLoaded', () => {
  window.puzzleBuilder = new PuzzleBuilder();
});
