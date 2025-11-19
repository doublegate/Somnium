/**
 * WorldEditor.js
 * Visual world editor for creating Somnium adventures
 */

class WorldEditor {
  constructor() {
    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.world = {
      metadata: {
        title: '',
        author: '',
        description: '',
        genre: 'adventure',
        version: '1.0',
      },
      rooms: [],
      objects: [],
      items: [],
      npcs: [],
      puzzles: [],
      achievements: [],
    };

    this.currentRoom = null;
    this.currentTool = 'select';
    this.currentColor = '#AAAAAA';
    this.filled = true;
    this.selectedPrimitive = null;
    this.drawingPrimitive = null;
    this.drawStartPos = null;

    this.zoom = 1.0;
    this.gridSize = 10;
    this.showGrid = true;

    this.undoStack = [];
    this.redoStack = [];

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupMenuHandlers();
    this.setupPalette();
    this.render();
  }

  setupEventListeners() {
    // Canvas mouse events
    this.canvas.addEventListener('mousedown', this.onCanvasMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onCanvasMouseUp.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.setTool(tool);
      });
    });

    // Color picker
    document.getElementById('ega-color-select').addEventListener('change', (e) => {
      this.currentColor = e.target.value;
    });

    // Fill checkbox
    document.getElementById('fill-shape').addEventListener('change', (e) => {
      this.filled = e.target.checked;
    });

    // Palette tabs
    document.querySelectorAll('.palette-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        this.switchPaletteTab(e.target.dataset.tab);
      });
    });
  }

  setupMenuHandlers() {
    document.querySelectorAll('.menu-option').forEach((option) => {
      option.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleMenuAction(action);
      });
    });

    // Modal cancel buttons
    document.querySelectorAll('[data-action="cancel-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Create room
    document.querySelector('[data-action="create-room"]').addEventListener('click', () => {
      this.showModal('new-room-modal');
    });

    document.querySelector('[data-action="confirm-room"]').addEventListener('click', () => {
      this.createRoom();
    });
  }

  setupPalette() {
    // Create room button
    const createRoomBtn = document.querySelector('[data-action="create-room"]');
    if (createRoomBtn) {
      createRoomBtn.addEventListener('click', () => {
        this.showModal('new-room-modal');
      });
    }
  }

  handleMenuAction(action) {
    switch (action) {
      case 'new-world':
        this.newWorld();
        break;
      case 'open-world':
        this.openWorld();
        break;
      case 'save-world':
        this.saveWorld();
        break;
      case 'export-world':
        this.exportWorld();
        break;
      case 'import-world':
        this.importWorld();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'toggle-grid':
        this.toggleGrid();
        break;
      case 'zoom-in':
        this.zoomIn();
        break;
      case 'zoom-out':
        this.zoomOut();
        break;
      case 'test-world':
        this.testWorld();
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  setTool(tool) {
    this.currentTool = tool;

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.classList.remove('active');
    });

    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

    this.updateStatus(`Tool: ${tool}`);
  }

  switchPaletteTab(tab) {
    document.querySelectorAll('.palette-tab').forEach((t) => {
      t.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.palette-content').forEach((content) => {
      content.classList.add('hidden');
    });

    document.querySelector(`[data-content="${tab}"]`).classList.remove('hidden');
  }

  onCanvasMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 2); // Canvas is scaled 2x
    const y = Math.floor((e.clientY - rect.top) / 2);

    this.drawStartPos = { x, y };

    if (this.currentTool === 'select') {
      this.selectPrimitive(x, y);
    } else {
      this.startDrawing(x, y);
    }
  }

  onCanvasMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 2);
    const y = Math.floor((e.clientY - rect.top) / 2);

    document.getElementById('cursor-position').textContent = `X: ${x}, Y: ${y}`;

    if (this.drawingPrimitive && this.drawStartPos) {
      this.updateDrawing(x, y);
      this.render();
    }
  }

  onCanvasMouseUp(e) {
    if (this.drawingPrimitive) {
      this.finishDrawing();
    }

    this.drawStartPos = null;
  }

  startDrawing(x, y) {
    if (!this.currentRoom) {
      this.updateStatus('Please select a room first');
      return;
    }

    const primitive = {
      type: this.currentTool,
      color: this.currentColor,
      filled: this.filled,
    };

    switch (this.currentTool) {
      case 'rectangle':
        primitive.x = x;
        primitive.y = y;
        primitive.width = 0;
        primitive.height = 0;
        break;
      case 'circle':
        primitive.x = x;
        primitive.y = y;
        primitive.radius = 0;
        break;
      case 'line':
        primitive.x1 = x;
        primitive.y1 = y;
        primitive.x2 = x;
        primitive.y2 = y;
        break;
      case 'polygon':
        primitive.points = [[x, y]];
        break;
    }

    this.drawingPrimitive = primitive;
  }

  updateDrawing(x, y) {
    if (!this.drawingPrimitive || !this.drawStartPos) return;

    switch (this.currentTool) {
      case 'rectangle':
        this.drawingPrimitive.width = x - this.drawStartPos.x;
        this.drawingPrimitive.height = y - this.drawStartPos.y;
        break;
      case 'circle':
        const dx = x - this.drawStartPos.x;
        const dy = y - this.drawStartPos.y;
        this.drawingPrimitive.radius = Math.sqrt(dx * dx + dy * dy);
        break;
      case 'line':
        this.drawingPrimitive.x2 = x;
        this.drawingPrimitive.y2 = y;
        break;
    }
  }

  finishDrawing() {
    if (!this.drawingPrimitive) return;

    this.addPrimitive(this.drawingPrimitive);
    this.drawingPrimitive = null;
    this.saveState();
  }

  addPrimitive(primitive) {
    if (!this.currentRoom) return;

    if (!this.currentRoom.graphics) {
      this.currentRoom.graphics = {
        backgroundColor: '#0000AA',
        primitives: [],
      };
    }

    this.currentRoom.graphics.primitives.push(primitive);
    this.render();
  }

  selectPrimitive(x, y) {
    if (!this.currentRoom || !this.currentRoom.graphics) return;

    const primitives = this.currentRoom.graphics.primitives;

    for (let i = primitives.length - 1; i >= 0; i--) {
      const primitive = primitives[i];

      if (this.isPrimitiveClicked(primitive, x, y)) {
        this.selectedPrimitive = primitive;
        this.updatePropertiesPanel();
        this.render();
        return;
      }
    }

    this.selectedPrimitive = null;
    this.updatePropertiesPanel();
    this.render();
  }

  isPrimitiveClicked(primitive, x, y) {
    switch (primitive.type) {
      case 'rectangle':
      case 'rect':
        return (
          x >= primitive.x &&
          x <= primitive.x + primitive.width &&
          y >= primitive.y &&
          y <= primitive.y + primitive.height
        );
      case 'circle':
        const dx = x - primitive.x;
        const dy = y - primitive.y;
        return Math.sqrt(dx * dx + dy * dy) <= primitive.radius;
      case 'line':
        // Simplified line hit detection
        const dist = this.pointToLineDistance(x, y, primitive.x1, primitive.y1, primitive.x2, primitive.y2);
        return dist < 5;
      default:
        return false;
    }
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 's':
          e.preventDefault();
          this.saveWorld();
          break;
        case 'o':
          e.preventDefault();
          this.openWorld();
          break;
      }
    }

    if (e.key === 'Delete' && this.selectedPrimitive) {
      this.deletePrimitive(this.selectedPrimitive);
    }
  }

  deletePrimitive(primitive) {
    if (!this.currentRoom || !this.currentRoom.graphics) return;

    const index = this.currentRoom.graphics.primitives.indexOf(primitive);
    if (index !== -1) {
      this.currentRoom.graphics.primitives.splice(index, 1);
      this.selectedPrimitive = null;
      this.saveState();
      this.render();
    }
  }

  createRoom() {
    const id = document.getElementById('room-id-input').value.trim();
    const name = document.getElementById('room-name-input').value.trim();
    const description = document.getElementById('room-desc-input').value.trim();
    const bgColor = document.getElementById('room-bg-color').value;

    if (!id || !name) {
      alert('Please fill in room ID and name');
      return;
    }

    const room = {
      id,
      name,
      description,
      graphics: {
        backgroundColor: bgColor,
        primitives: [],
      },
      exits: {},
      objects: [],
      items: [],
      npcs: [],
    };

    this.world.rooms.push(room);
    this.currentRoom = room;
    this.updateRoomsList();
    this.closeAllModals();
    this.saveState();
    this.render();

    document.getElementById('current-room-label').textContent = `Room: ${name}`;
  }

  updateRoomsList() {
    const roomsList = document.getElementById('rooms-list');
    roomsList.innerHTML = '';

    this.world.rooms.forEach((room) => {
      const item = document.createElement('div');
      item.className = 'palette-list-item';
      if (room === this.currentRoom) {
        item.classList.add('selected');
      }
      item.textContent = room.name;
      item.addEventListener('click', () => {
        this.selectRoom(room);
      });
      roomsList.appendChild(item);
    });
  }

  selectRoom(room) {
    this.currentRoom = room;
    this.updateRoomsList();
    this.render();
    document.getElementById('current-room-label').textContent = `Room: ${room.name}`;
  }

  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, 320, 200);

    if (this.showGrid) {
      this.drawGrid();
    }

    if (this.currentRoom && this.currentRoom.graphics) {
      const graphics = this.currentRoom.graphics;

      // Background color
      this.ctx.fillStyle = graphics.backgroundColor || '#0000AA';
      this.ctx.fillRect(0, 0, 320, 200);

      // Primitives
      graphics.primitives.forEach((primitive) => {
        this.drawPrimitive(primitive);
      });

      // Selected primitive highlight
      if (this.selectedPrimitive) {
        this.highlightPrimitive(this.selectedPrimitive);
      }
    }

    // Drawing preview
    if (this.drawingPrimitive) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.7;
      this.drawPrimitive(this.drawingPrimitive);
      this.ctx.restore();
    }
  }

  drawPrimitive(primitive) {
    this.ctx.strokeStyle = primitive.color;
    this.ctx.fillStyle = primitive.color;
    this.ctx.lineWidth = 1;

    switch (primitive.type) {
      case 'rectangle':
      case 'rect':
        if (primitive.filled) {
          this.ctx.fillRect(primitive.x, primitive.y, primitive.width, primitive.height);
        } else {
          this.ctx.strokeRect(primitive.x, primitive.y, primitive.width, primitive.height);
        }
        break;

      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(primitive.x, primitive.y, primitive.radius, 0, Math.PI * 2);
        if (primitive.filled) {
          this.ctx.fill();
        } else {
          this.ctx.stroke();
        }
        break;

      case 'line':
        this.ctx.beginPath();
        this.ctx.moveTo(primitive.x1, primitive.y1);
        this.ctx.lineTo(primitive.x2, primitive.y2);
        this.ctx.stroke();
        break;

      case 'polygon':
        if (primitive.points && primitive.points.length > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(primitive.points[0][0], primitive.points[0][1]);
          for (let i = 1; i < primitive.points.length; i++) {
            this.ctx.lineTo(primitive.points[i][0], primitive.points[i][1]);
          }
          this.ctx.closePath();
          if (primitive.filled) {
            this.ctx.fill();
          } else {
            this.ctx.stroke();
          }
        }
        break;
    }
  }

  highlightPrimitive(primitive) {
    this.ctx.strokeStyle = '#FFFF00';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);

    switch (primitive.type) {
      case 'rectangle':
      case 'rect':
        this.ctx.strokeRect(primitive.x - 2, primitive.y - 2, primitive.width + 4, primitive.height + 4);
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(primitive.x, primitive.y, primitive.radius + 2, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
    }

    this.ctx.setLineDash([]);
  }

  drawGrid() {
    this.ctx.strokeStyle = '#222222';
    this.ctx.lineWidth = 1;

    for (let x = 0; x < 320; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, 200);
      this.ctx.stroke();
    }

    for (let y = 0; y < 200; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(320, y);
      this.ctx.stroke();
    }
  }

  updatePropertiesPanel() {
    const panel = document.getElementById('properties-panel');

    if (!this.selectedPrimitive) {
      panel.innerHTML = '<p class="no-selection">No object selected</p>';
      return;
    }

    panel.innerHTML = `
      <div class="property-group">
        <label>Type</label>
        <input type="text" value="${this.selectedPrimitive.type}" readonly>
      </div>
      <div class="property-group">
        <label>Color</label>
        <select id="prop-color">
          ${this.getEGAColorOptions(this.selectedPrimitive.color)}
        </select>
      </div>
      <div class="property-group">
        <label>
          <input type="checkbox" id="prop-filled" ${this.selectedPrimitive.filled ? 'checked' : ''}>
          Filled
        </label>
      </div>
    `;

    // Add event listeners
    document.getElementById('prop-color').addEventListener('change', (e) => {
      this.selectedPrimitive.color = e.target.value;
      this.render();
    });

    document.getElementById('prop-filled').addEventListener('change', (e) => {
      this.selectedPrimitive.filled = e.target.checked;
      this.render();
    });
  }

  getEGAColorOptions(selectedColor) {
    const colors = [
      ['#000000', 'Black'], ['#0000AA', 'Blue'], ['#00AA00', 'Green'], ['#00AAAA', 'Cyan'],
      ['#AA0000', 'Red'], ['#AA00AA', 'Magenta'], ['#AA5500', 'Brown'], ['#AAAAAA', 'Light Gray'],
      ['#555555', 'Dark Gray'], ['#5555FF', 'Light Blue'], ['#55FF55', 'Light Green'], ['#55FFFF', 'Light Cyan'],
      ['#FF5555', 'Light Red'], ['#FF55FF', 'Light Magenta'], ['#FFFF55', 'Yellow'], ['#FFFFFF', 'White'],
    ];

    return colors
      .map(([value, name]) => {
        const selected = value === selectedColor ? 'selected' : '';
        return `<option value="${value}" ${selected}>${name}</option>`;
      })
      .join('');
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.render();
  }

  zoomIn() {
    this.zoom = Math.min(this.zoom + 0.1, 2.0);
    this.updateZoomLabel();
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom - 0.1, 0.5);
    this.updateZoomLabel();
  }

  updateZoomLabel() {
    document.getElementById('zoom-level').textContent = `Zoom: ${Math.round(this.zoom * 100)}%`;
  }

  saveState() {
    this.undoStack.push(JSON.stringify(this.world));
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const currentState = JSON.stringify(this.world);
    this.redoStack.push(currentState);

    const previousState = this.undoStack.pop();
    this.world = JSON.parse(previousState);
    this.render();
    this.updateRoomsList();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const currentState = JSON.stringify(this.world);
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.world = JSON.parse(nextState);
    this.render();
    this.updateRoomsList();
  }

  newWorld() {
    if (confirm('Create a new world? Unsaved changes will be lost.')) {
      this.world = {
        metadata: { title: '', author: '', description: '', genre: 'adventure', version: '1.0' },
        rooms: [],
        objects: [],
        items: [],
        npcs: [],
        puzzles: [],
        achievements: [],
      };
      this.currentRoom = null;
      this.updateRoomsList();
      this.render();
      this.updateStatus('New world created');
    }
  }

  saveWorld() {
    // Sync metadata from UI
    this.world.metadata.title = document.getElementById('world-title').value;
    this.world.metadata.author = document.getElementById('world-author').value;
    this.world.metadata.description = document.getElementById('world-description').value;
    this.world.metadata.genre = document.getElementById('world-genre').value;

    const json = JSON.stringify(this.world, null, 2);
    localStorage.setItem('somnium_editor_world', json);
    this.updateStatus('World saved to localStorage');
  }

  openWorld() {
    const json = localStorage.getItem('somnium_editor_world');
    if (json) {
      this.world = JSON.parse(json);
      this.currentRoom = this.world.rooms[0] || null;
      this.updateRoomsList();
      this.render();
      this.updateStatus('World loaded from localStorage');

      // Update UI
      document.getElementById('world-title').value = this.world.metadata.title || '';
      document.getElementById('world-author').value = this.world.metadata.author || '';
      document.getElementById('world-description').value = this.world.metadata.description || '';
      document.getElementById('world-genre').value = this.world.metadata.genre || 'adventure';
    } else {
      this.updateStatus('No saved world found');
    }
  }

  exportWorld() {
    const json = JSON.stringify(this.world, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.world.metadata.title || 'world'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.updateStatus('World exported as JSON');
  }

  importWorld() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          this.world = JSON.parse(event.target.result);
          this.currentRoom = this.world.rooms[0] || null;
          this.updateRoomsList();
          this.render();
          this.updateStatus('World imported successfully');
        } catch (error) {
          alert('Invalid world file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  testWorld() {
    // Save current world and open in new tab
    const json = JSON.stringify(this.world);
    localStorage.setItem('somnium_test_world', json);
    window.open('index.html?test=true', '_blank');
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach((modal) => {
      modal.classList.add('hidden');
    });
  }

  updateStatus(message) {
    document.getElementById('editor-status').textContent = message;
  }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.editor = new WorldEditor();
});
