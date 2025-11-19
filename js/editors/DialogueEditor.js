/**
 * DialogueEditor - Visual dialogue tree designer for NPCs
 *
 * Features:
 * - Tree-style dialogue visualization
 * - Branching conversation paths
 * - Player response options
 * - Conditional dialogue nodes
 * - Interactive playthrough mode
 * - Export to NPCSystem format
 */

export class DialogueEditor {
  constructor() {
    // Canvas and rendering
    this.canvas = document.getElementById('dialogueCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.gridSize = 50;
    this.showGrid = true;
    this.autoExpand = true;

    // Dialogue data
    this.dialogue = this.createEmptyDialogue();
    this.nodes = new Map(); // nodeId -> { id, type, text, emotion, responses, conditions, x, y, parent, children }
    this.rootNode = null;
    this.selectedNode = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Playthrough mode
    this.isPlaying = false;
    this.currentNode = null;

    // UI elements
    this.initializeUIElements();
    this.setupEventListeners();
    this.updateCanvas();
    this.updateUI();
    this.log('Dialogue Editor initialized');
  }

  /**
   * Create empty dialogue template
   */
  createEmptyDialogue() {
    return {
      npcId: 'npc_1',
      npcName: 'NPC',
      personality: 'neutral',
      initialGreeting: 'Hello, traveler!',
      dialogueTree: {},
    };
  }

  /**
   * Initialize UI element references
   */
  initializeUIElements() {
    this.ui = {
      // Toolbar
      newDialogue: document.getElementById('newDialogue'),
      loadDialogue: document.getElementById('loadDialogue'),
      saveDialogue: document.getElementById('saveDialogue'),
      exportDialogue: document.getElementById('exportDialogue'),
      addNode: document.getElementById('addNode'),
      deleteNode: document.getElementById('deleteNode'),
      playDialogue: document.getElementById('playDialogue'),
      showGrid: document.getElementById('showGrid'),
      autoExpand: document.getElementById('autoExpand'),
      validateDialogue: document.getElementById('validateDialogue'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      resetView: document.getElementById('resetView'),
      zoomLevel: document.getElementById('zoomLevel'),

      // Dialogue properties
      npcId: document.getElementById('npcId'),
      npcName: document.getElementById('npcName'),
      npcPersonality: document.getElementById('npcPersonality'),
      initialGreeting: document.getElementById('initialGreeting'),

      // Node properties
      nodeProperties: document.getElementById('nodeProperties'),
      playerResponses: document.getElementById('playerResponses'),
      responsesList: document.getElementById('responsesList'),
      addResponse: document.getElementById('addResponse'),
      nodeConditions: document.getElementById('nodeConditions'),
      conditionsList: document.getElementById('conditionsList'),
      addCondition: document.getElementById('addCondition'),

      // Tree view
      treeView: document.getElementById('treeView'),

      // Preview
      npcSpeech: document.getElementById('npcSpeech'),
      playerOptions: document.getElementById('playerOptions'),

      // Bottom panel
      validationResults: document.getElementById('validationResults'),
      consoleOutput: document.getElementById('consoleOutput'),

      // Playthrough modal
      playModal: document.getElementById('playModal'),
      playthroughNPCName: document.getElementById('playthroughNPCName'),
      playthroughNPCText: document.getElementById('playthroughNPCText'),
      playthroughOptions: document.getElementById('playthroughOptions'),
      restartPlaythrough: document.getElementById('restartPlaythrough'),

      // Other modals
      nodeModal: document.getElementById('nodeModal'),
      loadDialogueModal: document.getElementById('loadDialogueModal'),
      dialogueFileInput: document.getElementById('dialogueFileInput'),
    };
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Toolbar actions
    this.ui.newDialogue.addEventListener('click', () => this.newDialogue());
    this.ui.loadDialogue.addEventListener('click', () => this.showModal('loadDialogueModal'));
    this.ui.saveDialogue.addEventListener('click', () => this.saveDialogue());
    this.ui.exportDialogue.addEventListener('click', () => this.exportDialogue());
    this.ui.addNode.addEventListener('click', () => this.addNode());
    this.ui.deleteNode.addEventListener('click', () => this.deleteSelectedNode());
    this.ui.playDialogue.addEventListener('click', () => this.startPlaythrough());
    this.ui.validateDialogue.addEventListener('click', () => this.validateDialogue());

    // Grid controls
    this.ui.showGrid.addEventListener('change', (e) => {
      this.showGrid = e.target.checked;
      this.updateCanvas();
    });
    this.ui.autoExpand.addEventListener('change', (e) => {
      this.autoExpand = e.target.checked;
      if (e.target.checked) this.autoExpandTree();
    });

    // Zoom controls
    this.ui.zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
    this.ui.zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    this.ui.resetView.addEventListener('click', () => this.resetView());

    // Dialogue properties
    this.ui.npcId.addEventListener('change', (e) => {
      this.dialogue.npcId = e.target.value;
    });
    this.ui.npcName.addEventListener('change', (e) => {
      this.dialogue.npcName = e.target.value;
      this.updatePreview();
    });
    this.ui.npcPersonality.addEventListener('change', (e) => {
      this.dialogue.personality = e.target.value;
    });
    this.ui.initialGreeting.addEventListener('change', (e) => {
      this.dialogue.initialGreeting = e.target.value;
      if (this.rootNode) {
        this.rootNode.text = e.target.value;
        this.updateCanvas();
        this.updateTreeView();
      }
    });

    // Template buttons
    document.querySelectorAll('.template-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.addNode(type);
      });
    });

    // Response management
    this.ui.addResponse.addEventListener('click', () => this.addResponseToNode());

    // Condition management
    this.ui.addCondition.addEventListener('click', () => this.addConditionToNode());

    // Canvas interactions
    this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));

    // File input
    this.ui.dialogueFileInput.addEventListener('change', (e) => this.loadDialogueFile(e));

    // Playthrough
    this.ui.restartPlaythrough.addEventListener('click', () => {
      this.currentNode = this.rootNode;
      this.updatePlaythrough();
    });

    // Modal controls
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    document.getElementById('saveNodeModal').addEventListener('click', () => {
      this.saveNodeFromModal();
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

    const clickedNode = this.findNodeAtPosition(x, y);

    if (clickedNode) {
      this.selectedNode = clickedNode;
      this.isDragging = true;
      this.dragStart = { x: x - clickedNode.x, y: y - clickedNode.y };
      this.updateNodeProperties();
      this.updateTreeView();
      this.updatePreview();
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

    if (this.isDragging && this.selectedNode) {
      this.selectedNode.x = x - this.dragStart.x;
      this.selectedNode.y = y - this.dragStart.y;
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

    const clickedNode = this.findNodeAtPosition(x, y);
    if (clickedNode) {
      this.editNodeModal(clickedNode);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(e) {
    if (e.key === 'Delete' && this.selectedNode && this.selectedNode !== this.rootNode) {
      this.deleteSelectedNode();
    } else if (e.key === 'Escape') {
      this.selectedNode = null;
      this.updateCanvas();
      this.updateTreeView();
    }
  }

  /**
   * Find node at canvas position
   */
  findNodeAtPosition(x, y) {
    for (const node of this.nodes.values()) {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      if (distance <= 50) {
        // Node radius
        return node;
      }
    }
    return null;
  }

  /**
   * Add new node
   */
  addNode(type = 'response') {
    if (!this.selectedNode && this.nodes.size > 0) {
      this.log('Select a parent node first', 'warn');
      return;
    }

    const nodeId = `node_${Date.now()}`;
    const node = {
      id: nodeId,
      type,
      text: `${type} node`,
      emotion: 'neutral',
      responses: [],
      conditions: [],
      x: this.selectedNode ? this.selectedNode.x + 150 : 200,
      y: this.selectedNode ? this.selectedNode.y + 100 : 100,
      parent: this.selectedNode ? this.selectedNode.id : null,
      children: [],
    };

    this.nodes.set(nodeId, node);

    // Set as root if first node
    if (this.nodes.size === 1) {
      this.rootNode = node;
      node.type = 'greeting';
      node.text = this.dialogue.initialGreeting;
    }

    // Add to parent's children
    if (this.selectedNode) {
      this.selectedNode.children.push(nodeId);
    }

    this.selectedNode = node;

    if (this.autoExpand) {
      this.autoExpandTree();
    }

    this.updateCanvas();
    this.updateTreeView();
    this.updateNodeProperties();
    this.log(`Added ${type} node: ${nodeId}`);
  }

  /**
   * Delete selected node
   */
  deleteSelectedNode() {
    if (!this.selectedNode || this.selectedNode === this.rootNode) {
      this.log('Cannot delete root node', 'warn');
      return;
    }

    const nodeId = this.selectedNode.id;

    // Remove from parent
    if (this.selectedNode.parent) {
      const parent = this.nodes.get(this.selectedNode.parent);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== nodeId);
      }
    }

    // Delete children recursively
    const deleteChildren = (node) => {
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) {
          deleteChildren(child);
          this.nodes.delete(childId);
        }
      }
    };
    deleteChildren(this.selectedNode);

    this.nodes.delete(nodeId);
    this.selectedNode = null;

    this.updateCanvas();
    this.updateTreeView();
    this.updateNodeProperties();
    this.log(`Deleted node: ${nodeId}`);
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

    // Draw nodes
    for (const node of this.nodes.values()) {
      this.drawNode(node);
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

    const startX = Math.floor(-this.panX / this.zoom / this.gridSize) * this.gridSize;
    const startY = Math.floor(-this.panY / this.zoom / this.gridSize) * this.gridSize;
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
   * Draw connections between nodes
   */
  drawConnections() {
    this.ctx.strokeStyle = '#AAAAAA';
    this.ctx.lineWidth = 2 / this.zoom;

    for (const node of this.nodes.values()) {
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (!child) continue;

        this.ctx.beginPath();
        this.ctx.moveTo(node.x, node.y);

        // Curved line
        const midX = (node.x + child.x) / 2;
        const midY = (node.y + child.y) / 2;
        const controlX = midX + (child.y - node.y) / 4;
        const controlY = midY - (child.x - node.x) / 4;

        this.ctx.quadraticCurveTo(controlX, controlY, child.x, child.y);
        this.ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(child.y - controlY, child.x - controlX);
        const arrowSize = 10 / this.zoom;

        this.ctx.beginPath();
        this.ctx.moveTo(child.x, child.y);
        this.ctx.lineTo(
          child.x - arrowSize * Math.cos(angle - Math.PI / 6),
          child.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
          child.x - arrowSize * Math.cos(angle + Math.PI / 6),
          child.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.fill();
      }
    }
  }

  /**
   * Draw dialogue node
   */
  drawNode(node) {
    const isSelected = node === this.selectedNode;
    const isRoot = node === this.rootNode;

    // Node type colors
    const colors = {
      greeting: '#55FFFF',
      question: '#FFFF55',
      response: '#55FF55',
      branch: '#FF55FF',
      trade: '#5555FF',
      end: '#FF5555',
    };
    const color = colors[node.type] || '#AAAAAA';

    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, 50, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    if (isSelected || isRoot) {
      this.ctx.strokeStyle = isSelected ? '#5555FF' : '#FFFF55';
      this.ctx.lineWidth = 4 / this.zoom;
      this.ctx.stroke();
    }

    // Draw icon
    const icons = {
      greeting: '👋',
      question: '❓',
      response: '💬',
      branch: '🌳',
      trade: '💰',
      end: '🏁',
    };
    const icon = icons[node.type] || '●';

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${28 / this.zoom}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(icon, node.x, node.y);

    // Draw label
    this.ctx.font = `${11 / this.zoom}px monospace`;
    this.ctx.fillText(node.type, node.x, node.y + 65);

    // Draw text preview (truncated)
    const preview = node.text.length > 20 ? node.text.substring(0, 20) + '...' : node.text;
    this.ctx.font = `${10 / this.zoom}px monospace`;
    this.ctx.fillText(preview, node.x, node.y + 80);
  }

  /**
   * Auto-expand tree layout
   */
  autoExpandTree() {
    if (!this.rootNode) return;

    const levelWidth = 200;
    const levelHeight = 150;

    const layoutNode = (node, level, index, total) => {
      const xOffset = (index - (total - 1) / 2) * levelWidth;
      node.x = 400 + xOffset;
      node.y = 100 + level * levelHeight;

      let childIndex = 0;
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) {
          layoutNode(child, level + 1, childIndex, node.children.length);
          childIndex++;
        }
      }
    };

    layoutNode(this.rootNode, 0, 0, 1);
    this.updateCanvas();
  }

  /**
   * Update node properties panel
   */
  updateNodeProperties() {
    if (!this.selectedNode) {
      this.ui.nodeProperties.innerHTML = '<p class="text-muted">Select a node to edit properties</p>';
      this.ui.addResponse.disabled = true;
      this.ui.addCondition.disabled = true;
      return;
    }

    const node = this.selectedNode;
    this.ui.addResponse.disabled = false;
    this.ui.addCondition.disabled = false;

    // Properties form
    this.ui.nodeProperties.innerHTML = `
      <div class="form-group">
        <label>Node ID:</label>
        <input type="text" value="${node.id}" readonly />
      </div>
      <div class="form-group">
        <label>Type:</label>
        <select id="propNodeType">
          <option value="greeting" ${node.type === 'greeting' ? 'selected' : ''}>Greeting</option>
          <option value="question" ${node.type === 'question' ? 'selected' : ''}>Question</option>
          <option value="response" ${node.type === 'response' ? 'selected' : ''}>Response</option>
          <option value="branch" ${node.type === 'branch' ? 'selected' : ''}>Branch</option>
          <option value="trade" ${node.type === 'trade' ? 'selected' : ''}>Trade</option>
          <option value="end" ${node.type === 'end' ? 'selected' : ''}>End</option>
        </select>
      </div>
      <div class="form-group">
        <label>NPC Text:</label>
        <textarea id="propNodeText" rows="4">${node.text}</textarea>
      </div>
      <div class="form-group">
        <label>Emotion:</label>
        <select id="propNodeEmotion">
          <option value="neutral" ${node.emotion === 'neutral' ? 'selected' : ''}>Neutral</option>
          <option value="happy" ${node.emotion === 'happy' ? 'selected' : ''}>Happy</option>
          <option value="sad" ${node.emotion === 'sad' ? 'selected' : ''}>Sad</option>
          <option value="angry" ${node.emotion === 'angry' ? 'selected' : ''}>Angry</option>
          <option value="surprised" ${node.emotion === 'surprised' ? 'selected' : ''}>Surprised</option>
          <option value="fearful" ${node.emotion === 'fearful' ? 'selected' : ''}>Fearful</option>
        </select>
      </div>
      <div class="node-stats">
        <div class="node-stat">
          <span class="node-stat-icon">👶</span>
          <span>${node.children.length} children</span>
        </div>
        <div class="node-stat">
          <span class="node-stat-icon">💬</span>
          <span>${node.responses.length} responses</span>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('propNodeType').addEventListener('change', (e) => {
      node.type = e.target.value;
      this.updateCanvas();
      this.updateTreeView();
    });

    document.getElementById('propNodeText').addEventListener('change', (e) => {
      node.text = e.target.value;
      this.updateCanvas();
      this.updateTreeView();
      this.updatePreview();
    });

    document.getElementById('propNodeEmotion').addEventListener('change', (e) => {
      node.emotion = e.target.value;
    });

    // Update responses list
    this.updateResponsesList();

    // Update conditions list
    this.updateConditionsList();
  }

  /**
   * Update responses list
   */
  updateResponsesList() {
    if (!this.selectedNode) return;

    this.ui.responsesList.innerHTML = '';

    for (let i = 0; i < this.selectedNode.responses.length; i++) {
      const response = this.selectedNode.responses[i];
      const item = document.createElement('div');
      item.className = 'response-item';
      item.innerHTML = `
        <div class="response-item-header">
          <span>Response ${i + 1}</span>
          <span class="remove-btn" data-index="${i}">✕</span>
        </div>
        <textarea data-index="${i}">${response.text}</textarea>
        <div class="response-item-target">
          <label>Leads to:</label>
          <select data-index="${i}">
            <option value="">End conversation</option>
            ${Array.from(this.nodes.values())
              .filter((n) => n !== this.selectedNode)
              .map(
                (n) =>
                  `<option value="${n.id}" ${response.target === n.id ? 'selected' : ''}>${n.type} - ${n.id}</option>`
              )
              .join('')}
          </select>
        </div>
      `;
      this.ui.responsesList.appendChild(item);
    }

    // Event listeners
    this.ui.responsesList.querySelectorAll('textarea').forEach((textarea) => {
      textarea.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.selectedNode.responses[index].text = e.target.value;
        this.updatePreview();
      });
    });

    this.ui.responsesList.querySelectorAll('select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.selectedNode.responses[index].target = e.target.value;
      });
    });

    this.ui.responsesList.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.selectedNode.responses.splice(index, 1);
        this.updateResponsesList();
        this.updatePreview();
      });
    });
  }

  /**
   * Add response to selected node
   */
  addResponseToNode() {
    if (!this.selectedNode) return;

    this.selectedNode.responses.push({
      text: 'New response option',
      target: '',
    });

    this.updateResponsesList();
    this.updatePreview();
  }

  /**
   * Update conditions list
   */
  updateConditionsList() {
    if (!this.selectedNode) return;

    this.ui.conditionsList.innerHTML = '';

    for (let i = 0; i < this.selectedNode.conditions.length; i++) {
      const condition = this.selectedNode.conditions[i];
      const item = document.createElement('div');
      item.className = 'condition-item';
      item.innerHTML = `
        <div class="condition-item-header">
          <span>Condition ${i + 1}</span>
          <span class="remove-btn" data-index="${i}">✕</span>
        </div>
        <select data-index="${i}">
          <option value="item" ${condition.type === 'item' ? 'selected' : ''}>Has Item</option>
          <option value="flag" ${condition.type === 'flag' ? 'selected' : ''}>Flag Set</option>
          <option value="relationship" ${condition.type === 'relationship' ? 'selected' : ''}>Relationship Level</option>
        </select>
        <input type="text" data-index="${i}" value="${condition.value}" placeholder="Condition value" />
      `;
      this.ui.conditionsList.appendChild(item);
    }

    // Event listeners
    this.ui.conditionsList.querySelectorAll('select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.selectedNode.conditions[index].type = e.target.value;
      });
    });

    this.ui.conditionsList.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.selectedNode.conditions[index].value = e.target.value;
      });
    });

    this.ui.conditionsList.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.selectedNode.conditions.splice(index, 1);
        this.updateConditionsList();
      });
    });
  }

  /**
   * Add condition to selected node
   */
  addConditionToNode() {
    if (!this.selectedNode) return;

    this.selectedNode.conditions.push({
      type: 'item',
      value: '',
    });

    this.updateConditionsList();
  }

  /**
   * Update tree view in sidebar
   */
  updateTreeView() {
    if (!this.rootNode) {
      this.ui.treeView.innerHTML = '<p class="text-muted">No dialogue tree yet</p>';
      return;
    }

    const renderNode = (node, level = 0) => {
      const div = document.createElement('div');
      div.className = 'tree-node';
      if (level === 0) div.classList.add('root');
      if (node === this.selectedNode) div.classList.add('selected');

      const icons = {
        greeting: '👋',
        question: '❓',
        response: '💬',
        branch: '🌳',
        trade: '💰',
        end: '🏁',
      };

      div.innerHTML = `
        <span class="tree-node-icon">${icons[node.type] || '●'}</span>
        <span>${node.type}: ${node.text.substring(0, 30)}${node.text.length > 30 ? '...' : ''}</span>
      `;

      div.addEventListener('click', () => {
        this.selectedNode = node;
        this.updateTreeView();
        this.updateNodeProperties();
        this.updatePreview();
        this.updateCanvas();
      });

      return div;
    };

    const buildTree = (node) => {
      const container = document.createElement('div');
      container.appendChild(renderNode(node));

      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) {
          container.appendChild(buildTree(child));
        }
      }

      return container;
    };

    this.ui.treeView.innerHTML = '';
    this.ui.treeView.appendChild(buildTree(this.rootNode));
  }

  /**
   * Update preview panel
   */
  updatePreview() {
    if (!this.selectedNode) {
      this.ui.npcSpeech.textContent = 'Select a node to preview dialogue';
      this.ui.playerOptions.innerHTML = '';
      return;
    }

    this.ui.npcSpeech.textContent = this.selectedNode.text;

    this.ui.playerOptions.innerHTML = '';
    for (const response of this.selectedNode.responses) {
      const option = document.createElement('div');
      option.className = 'player-option';
      option.textContent = response.text;
      this.ui.playerOptions.appendChild(option);
    }
  }

  /**
   * Validate dialogue tree
   */
  validateDialogue() {
    const errors = [];
    const warnings = [];

    // Check if tree has nodes
    if (this.nodes.size === 0) {
      errors.push('Dialogue tree is empty');
    }

    // Check for orphaned nodes
    const visited = new Set();
    const visit = (node) => {
      visited.add(node.id);
      for (const childId of node.children) {
        const child = this.nodes.get(childId);
        if (child) visit(child);
      }
    };

    if (this.rootNode) {
      visit(this.rootNode);

      for (const node of this.nodes.values()) {
        if (!visited.has(node.id)) {
          warnings.push(`Node ${node.id} is orphaned (not connected to tree)`);
        }
      }
    }

    // Check for dead ends
    for (const node of this.nodes.values()) {
      if (node.type !== 'end' && node.children.length === 0 && node.responses.length === 0) {
        warnings.push(`Node ${node.id} is a dead end (no children or responses)`);
      }
    }

    let html = '';
    if (errors.length === 0) {
      html = '<div class="validation-success">✓ Dialogue tree is valid!</div>';
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
    this.log(`Validation complete: ${errors.length === 0 ? 'VALID' : 'INVALID'}`);
  }

  /**
   * Start playthrough mode
   */
  startPlaythrough() {
    if (!this.rootNode) {
      this.log('No dialogue tree to play', 'error');
      return;
    }

    this.isPlaying = true;
    this.currentNode = this.rootNode;
    this.showModal('playModal');
    this.updatePlaythrough();
  }

  /**
   * Update playthrough display
   */
  updatePlaythrough() {
    if (!this.currentNode) return;

    this.ui.playthroughNPCName.textContent = this.dialogue.npcName;
    this.ui.playthroughNPCText.textContent = this.currentNode.text;

    this.ui.playthroughOptions.innerHTML = '';

    if (this.currentNode.responses.length === 0 && this.currentNode.children.length === 0) {
      this.ui.playthroughOptions.innerHTML = '<p class="text-muted">End of conversation</p>';
      return;
    }

    // Show player responses
    for (const response of this.currentNode.responses) {
      const option = document.createElement('div');
      option.className = 'playthrough-option';
      option.textContent = response.text;

      option.addEventListener('click', () => {
        if (response.target) {
          this.currentNode = this.nodes.get(response.target);
          this.updatePlaythrough();
        } else {
          this.ui.playthroughOptions.innerHTML = '<p class="text-muted">End of conversation</p>';
        }
      });

      this.ui.playthroughOptions.appendChild(option);
    }

    // If no responses, auto-advance to first child
    if (this.currentNode.responses.length === 0 && this.currentNode.children.length > 0) {
      const firstChild = this.nodes.get(this.currentNode.children[0]);
      if (firstChild) {
        setTimeout(() => {
          this.currentNode = firstChild;
          this.updatePlaythrough();
        }, 1000);
      }
    }
  }

  /**
   * Save dialogue
   */
  saveDialogue() {
    this.dialogue.dialogueTree = this.exportDialogueTree();
    const dialogueData = JSON.stringify(this.dialogue, null, 2);
    localStorage.setItem('somnium_dialogue_editor', dialogueData);

    this.log('Dialogue saved to localStorage');
    alert('Dialogue saved successfully!');
  }

  /**
   * Export dialogue as JSON
   */
  exportDialogue() {
    this.dialogue.dialogueTree = this.exportDialogueTree();
    const dialogueData = JSON.stringify(this.dialogue, null, 2);
    const blob = new Blob([dialogueData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.dialogue.npcId}_dialogue.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.log(`Exported dialogue: ${a.download}`);
  }

  /**
   * Export dialogue tree structure
   */
  exportDialogueTree() {
    const tree = {};

    for (const node of this.nodes.values()) {
      tree[node.id] = {
        type: node.type,
        text: node.text,
        emotion: node.emotion,
        responses: node.responses,
        conditions: node.conditions,
        children: node.children,
      };
    }

    return tree;
  }

  /**
   * Load dialogue from file
   */
  loadDialogueFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dialogueData = JSON.parse(event.target.result);
        this.loadDialogue(dialogueData);
        this.hideModal('loadDialogueModal');
      } catch (error) {
        this.log(`Failed to load dialogue: ${error.message}`, 'error');
        alert('Failed to load dialogue file!');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Load dialogue data
   */
  loadDialogue(dialogueData) {
    this.dialogue = dialogueData;
    this.nodes.clear();
    this.rootNode = null;

    // Reconstruct nodes
    for (const [nodeId, nodeData] of Object.entries(dialogueData.dialogueTree || {})) {
      const node = {
        id: nodeId,
        ...nodeData,
        x: 200 + this.nodes.size * 100,
        y: 200,
        parent: null,
      };

      this.nodes.set(nodeId, node);

      if (!this.rootNode || node.type === 'greeting') {
        this.rootNode = node;
      }
    }

    // Set parent references
    for (const node of this.nodes.values()) {
      for (const childId of node.children || []) {
        const child = this.nodes.get(childId);
        if (child) {
          child.parent = node.id;
        }
      }
    }

    this.updateUI();
    if (this.autoExpand) {
      this.autoExpandTree();
    }
    this.updateCanvas();
    this.updateTreeView();
    this.log('Dialogue loaded successfully');
  }

  /**
   * Create new dialogue
   */
  newDialogue() {
    if (this.nodes.size > 0 && !confirm('Create new dialogue? Current work will be lost.')) {
      return;
    }

    this.dialogue = this.createEmptyDialogue();
    this.nodes.clear();
    this.rootNode = null;
    this.selectedNode = null;

    // Create initial greeting node
    const greetingId = 'node_greeting';
    const greeting = {
      id: greetingId,
      type: 'greeting',
      text: this.dialogue.initialGreeting,
      emotion: 'neutral',
      responses: [],
      conditions: [],
      x: 400,
      y: 100,
      parent: null,
      children: [],
    };

    this.nodes.set(greetingId, greeting);
    this.rootNode = greeting;

    this.updateUI();
    this.updateCanvas();
    this.updateTreeView();
    this.log('New dialogue created');
  }

  /**
   * Edit node in modal
   */
  editNodeModal(node) {
    document.getElementById('modalNodeId').value = node.id;
    document.getElementById('modalNodeType').value = node.type;
    document.getElementById('modalNodeText').value = node.text;
    document.getElementById('modalNodeEmotion').value = node.emotion;

    this.showModal('nodeModal');
  }

  /**
   * Save node from modal
   */
  saveNodeFromModal() {
    if (!this.selectedNode) return;

    this.selectedNode.type = document.getElementById('modalNodeType').value;
    this.selectedNode.text = document.getElementById('modalNodeText').value;
    this.selectedNode.emotion = document.getElementById('modalNodeEmotion').value;

    this.updateCanvas();
    this.updateTreeView();
    this.updateNodeProperties();
    this.updatePreview();
    this.hideModal('nodeModal');
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

    console.log(`[DialogueEditor] ${message}`);
  }

  /**
   * Initialize UI state
   */
  updateUI() {
    this.ui.npcId.value = this.dialogue.npcId;
    this.ui.npcName.value = this.dialogue.npcName;
    this.ui.npcPersonality.value = this.dialogue.personality;
    this.ui.initialGreeting.value = this.dialogue.initialGreeting;
  }
}

// Initialize editor on page load
window.addEventListener('DOMContentLoaded', () => {
  window.dialogueEditor = new DialogueEditor();
});
