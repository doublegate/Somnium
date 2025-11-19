/**
 * WorldEditor - Visual drag-and-drop world creation tool
 *
 * Features:
 * - Visual canvas-based room layout
 * - Drag-and-drop room positioning
 * - Property editing panels
 * - World validation integration
 * - Save/load functionality
 * - Auto-layout algorithm
 * - Zoom and pan controls
 * - Minimap overview
 */

import { WorldValidator } from '../WorldValidator.js';

export class WorldEditor {
  constructor() {
    // Canvas and rendering
    this.canvas = document.getElementById('worldCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.gridSize = 50;
    this.showGrid = true;
    this.snapToGrid = true;

    // World data
    this.world = this.createEmptyWorld();
    this.rooms = new Map(); // roomId -> { id, name, description, x, y, width, height, exits, objects, items }
    this.selectedRoom = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.isPanning = false;

    // Validator
    this.validator = new WorldValidator();

    // UI elements
    this.initializeUIElements();
    this.setupEventListeners();
    this.updateCanvas();
    this.updateUI();
    this.log('World Editor initialized');
  }

  /**
   * Create empty world template
   */
  createEmptyWorld() {
    return {
      title: 'Untitled World',
      description: '',
      genre: 'fantasy',
      difficulty: 'normal',
      rooms: [],
      items: [],
      npcs: [],
      puzzles: [],
    };
  }

  /**
   * Initialize UI element references
   */
  initializeUIElements() {
    // Toolbar buttons
    this.ui = {
      newWorld: document.getElementById('newWorld'),
      loadWorld: document.getElementById('loadWorld'),
      saveWorld: document.getElementById('saveWorld'),
      exportWorld: document.getElementById('exportWorld'),
      addRoom: document.getElementById('addRoom'),
      deleteRoom: document.getElementById('deleteRoom'),
      validateWorld: document.getElementById('validateWorld'),
      showGrid: document.getElementById('showGrid'),
      snapToGrid: document.getElementById('snapToGrid'),
      autoLayout: document.getElementById('autoLayout'),
      showHelp: document.getElementById('showHelp'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      resetZoom: document.getElementById('resetZoom'),
      zoomLevel: document.getElementById('zoomLevel'),

      // World properties
      worldTitle: document.getElementById('worldTitle'),
      worldDescription: document.getElementById('worldDescription'),
      worldGenre: document.getElementById('worldGenre'),
      worldDifficulty: document.getElementById('worldDifficulty'),

      // Room list and properties
      roomList: document.getElementById('roomList'),
      roomProperties: document.getElementById('roomProperties'),
      roomExits: document.getElementById('roomExits'),
      roomObjects: document.getElementById('roomObjects'),
      objectsList: document.getElementById('objectsList'),

      // Bottom panel
      validationResults: document.getElementById('validationResults'),
      consoleOutput: document.getElementById('consoleOutput'),
      statRooms: document.getElementById('statRooms'),
      statItems: document.getElementById('statItems'),
      statNPCs: document.getElementById('statNPCs'),
      statPuzzles: document.getElementById('statPuzzles'),

      // Modals
      newWorldModal: document.getElementById('newWorldModal'),
      loadWorldModal: document.getElementById('loadWorldModal'),
      roomModal: document.getElementById('roomModal'),
      helpModal: document.getElementById('helpModal'),
      worldFileInput: document.getElementById('worldFileInput'),
    };
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Toolbar actions
    this.ui.newWorld.addEventListener('click', () =>
      this.showModal('newWorldModal')
    );
    this.ui.loadWorld.addEventListener('click', () =>
      this.showModal('loadWorldModal')
    );
    this.ui.saveWorld.addEventListener('click', () => this.saveWorld());
    this.ui.exportWorld.addEventListener('click', () => this.exportWorld());
    this.ui.addRoom.addEventListener('click', () => this.addRoom());
    this.ui.deleteRoom.addEventListener('click', () =>
      this.deleteSelectedRoom()
    );
    this.ui.validateWorld.addEventListener('click', () => this.validateWorld());
    this.ui.autoLayout.addEventListener('click', () => this.autoLayoutRooms());
    this.ui.showHelp.addEventListener('click', () =>
      this.showModal('helpModal')
    );

    // Grid controls
    this.ui.showGrid.addEventListener('change', (e) => {
      this.showGrid = e.target.checked;
      this.updateCanvas();
    });
    this.ui.snapToGrid.addEventListener('change', (e) => {
      this.snapToGrid = e.target.checked;
    });

    // Zoom controls
    this.ui.zoomIn.addEventListener('click', () => this.adjustZoom(0.1));
    this.ui.zoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    this.ui.resetZoom.addEventListener('click', () => this.resetZoom());

    // World properties
    this.ui.worldTitle.addEventListener('change', (e) => {
      this.world.title = e.target.value;
      this.updateStatistics();
    });
    this.ui.worldDescription.addEventListener('change', (e) => {
      this.world.description = e.target.value;
    });
    this.ui.worldGenre.addEventListener('change', (e) => {
      this.world.genre = e.target.value;
    });
    this.ui.worldDifficulty.addEventListener('change', (e) => {
      this.world.difficulty = e.target.value;
    });

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
    this.ui.worldFileInput.addEventListener('change', (e) =>
      this.loadWorldFile(e)
    );

    // Modal controls
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    document.getElementById('confirmNew').addEventListener('click', () => {
      this.newWorld();
      this.hideModal('newWorldModal');
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

    // Check if clicking on a room
    const clickedRoom = this.findRoomAtPosition(x, y);

    if (clickedRoom) {
      this.selectedRoom = clickedRoom;
      this.isDragging = true;
      this.dragStart = { x: x - clickedRoom.x, y: y - clickedRoom.y };
      this.updateRoomProperties();
      this.updateRoomList();
      this.updateCanvas();
    } else if (e.button === 1 || e.ctrlKey) {
      // Middle click or Ctrl+click for panning
      this.isPanning = true;
      this.dragStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Handle canvas mouse move
   */
  handleCanvasMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.zoom;
    const y = (e.clientY - rect.top - this.panY) / this.zoom;

    if (this.isDragging && this.selectedRoom) {
      // Drag room
      let newX = x - this.dragStart.x;
      let newY = y - this.dragStart.y;

      if (this.snapToGrid) {
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }

      this.selectedRoom.x = newX;
      this.selectedRoom.y = newY;
      this.updateCanvas();
    } else if (this.isPanning) {
      // Pan canvas
      this.panX = e.clientX - this.dragStart.x;
      this.panY = e.clientY - this.dragStart.y;
      this.updateCanvas();
    } else {
      // Update cursor based on hover
      const hoverRoom = this.findRoomAtPosition(x, y);
      this.canvas.style.cursor = hoverRoom ? 'pointer' : 'grab';
    }
  }

  /**
   * Handle canvas mouse up
   */
  handleCanvasMouseUp(_e) {
    this.isDragging = false;
    this.isPanning = false;
    this.canvas.style.cursor = 'grab';
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
   * Handle canvas double-click (edit room)
   */
  handleCanvasDoubleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.panX) / this.zoom;
    const y = (e.clientY - rect.top - this.panY) / this.zoom;

    const clickedRoom = this.findRoomAtPosition(x, y);
    if (clickedRoom) {
      this.editRoomModal(clickedRoom);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyDown(e) {
    if (e.key === 'Delete' && this.selectedRoom) {
      this.deleteSelectedRoom();
    } else if (e.key === 'Escape') {
      this.selectedRoom = null;
      this.updateCanvas();
      this.updateRoomList();
    } else if (e.key === 'F1' || e.key === '?') {
      e.preventDefault();
      this.showModal('helpModal');
    } else if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          this.saveWorld();
          break;
        case 'o':
          e.preventDefault();
          this.showModal('loadWorldModal');
          break;
        case 'n':
          e.preventDefault();
          this.showModal('newWorldModal');
          break;
      }
    }
  }

  /**
   * Find room at canvas position
   */
  findRoomAtPosition(x, y) {
    for (const room of this.rooms.values()) {
      if (
        x >= room.x &&
        x <= room.x + room.width &&
        y >= room.y &&
        y <= room.y + room.height
      ) {
        return room;
      }
    }
    return null;
  }

  /**
   * Add new room
   */
  addRoom() {
    const roomId = `room_${Date.now()}`;
    const room = {
      id: roomId,
      name: `Room ${this.rooms.size + 1}`,
      description: 'A new room.',
      x: 100 + this.rooms.size * 50,
      y: 100 + this.rooms.size * 50,
      width: 120,
      height: 80,
      exits: {},
      objects: [],
      items: [],
    };

    this.rooms.set(roomId, room);
    this.selectedRoom = room;
    this.updateCanvas();
    this.updateRoomList();
    this.updateRoomProperties();
    this.updateStatistics();
    this.log(`Added room: ${roomId}`);
  }

  /**
   * Delete selected room
   */
  deleteSelectedRoom() {
    if (!this.selectedRoom) {
      this.log('No room selected', 'warn');
      return;
    }

    const roomId = this.selectedRoom.id;
    this.rooms.delete(roomId);

    // Remove references from other rooms' exits
    for (const room of this.rooms.values()) {
      for (const [dir, targetId] of Object.entries(room.exits)) {
        if (targetId === roomId) {
          delete room.exits[dir];
        }
      }
    }

    this.selectedRoom = null;
    this.updateCanvas();
    this.updateRoomList();
    this.updateRoomProperties();
    this.updateStatistics();
    this.log(`Deleted room: ${roomId}`);
  }

  /**
   * Update canvas rendering
   */
  updateCanvas() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Save context state
    this.ctx.save();

    // Apply pan and zoom
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw grid
    if (this.showGrid) {
      this.drawGrid();
    }

    // Draw connections first (underneath rooms)
    this.drawConnections();

    // Draw rooms
    for (const room of this.rooms.values()) {
      this.drawRoom(room);
    }

    // Restore context
    this.ctx.restore();
  }

  /**
   * Draw grid
   */
  drawGrid() {
    const { width, height } = this.canvas;
    const gridColor = '#333333';

    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1 / this.zoom;

    // Calculate visible grid bounds
    const startX =
      Math.floor(-this.panX / this.zoom / this.gridSize) * this.gridSize;
    const startY =
      Math.floor(-this.panY / this.zoom / this.gridSize) * this.gridSize;
    const endX = startX + width / this.zoom + this.gridSize;
    const endY = startY + height / this.zoom + this.gridSize;

    // Vertical lines
    for (let x = startX; x < endX; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  /**
   * Draw room connections
   */
  drawConnections() {
    this.ctx.strokeStyle = '#AAAAAA';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);

    for (const room of this.rooms.values()) {
      const centerX = room.x + room.width / 2;
      const centerY = room.y + room.height / 2;

      for (const [dir, targetId] of Object.entries(room.exits)) {
        const targetRoom = this.rooms.get(targetId);
        if (!targetRoom) continue;

        const targetCenterX = targetRoom.x + targetRoom.width / 2;
        const targetCenterY = targetRoom.y + targetRoom.height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(targetCenterX, targetCenterY);
        this.ctx.stroke();

        // Draw direction label
        const midX = (centerX + targetCenterX) / 2;
        const midY = (centerY + targetCenterY) / 2;
        this.ctx.fillStyle = '#FFFF55';
        this.ctx.font = `${12 / this.zoom}px monospace`;
        this.ctx.fillText(dir, midX, midY);
      }
    }

    this.ctx.setLineDash([]);
  }

  /**
   * Draw room
   */
  drawRoom(room) {
    const isSelected = room === this.selectedRoom;

    // Room background
    this.ctx.fillStyle = isSelected ? '#0000AA' : '#1a1a1a';
    this.ctx.fillRect(room.x, room.y, room.width, room.height);

    // Room border
    this.ctx.strokeStyle = isSelected ? '#5555FF' : '#AAAAAA';
    this.ctx.lineWidth = isSelected ? 3 / this.zoom : 2 / this.zoom;
    this.ctx.strokeRect(room.x, room.y, room.width, room.height);

    // Room name
    this.ctx.fillStyle = isSelected ? '#FFFF55' : '#55FFFF';
    this.ctx.font = `${14 / this.zoom}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      room.name,
      room.x + room.width / 2,
      room.y + room.height / 2
    );

    // Room ID (small text)
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.font = `${10 / this.zoom}px monospace`;
    this.ctx.fillText(
      room.id,
      room.x + room.width / 2,
      room.y + room.height - 10
    );
  }

  /**
   * Update room list in sidebar
   */
  updateRoomList() {
    this.ui.roomList.innerHTML = '';

    for (const room of this.rooms.values()) {
      const item = document.createElement('div');
      item.className = 'room-list-item';
      if (room === this.selectedRoom) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <div>${room.name}</div>
        <div class="room-id">${room.id}</div>
      `;

      item.addEventListener('click', () => {
        this.selectedRoom = room;
        this.updateRoomList();
        this.updateRoomProperties();
        this.updateCanvas();
      });

      this.ui.roomList.appendChild(item);
    }
  }

  /**
   * Update room properties panel
   */
  updateRoomProperties() {
    if (!this.selectedRoom) {
      this.ui.roomProperties.innerHTML =
        '<p class="text-muted">Select a room to edit properties</p>';
      this.ui.roomExits.innerHTML =
        '<p class="text-muted">Select a room to edit exits</p>';
      return;
    }

    const room = this.selectedRoom;

    // Properties form
    this.ui.roomProperties.innerHTML = `
      <div class="form-group">
        <label>Room ID:</label>
        <input type="text" value="${room.id}" readonly />
      </div>
      <div class="form-group">
        <label>Name:</label>
        <input type="text" id="propRoomName" value="${room.name}" />
      </div>
      <div class="form-group">
        <label>Description:</label>
        <textarea id="propRoomDescription" rows="4">${room.description}</textarea>
      </div>
    `;

    // Exits form
    const exitOptions = Array.from(this.rooms.values())
      .filter((r) => r.id !== room.id)
      .map((r) => `<option value="${r.id}">${r.name} (${r.id})</option>`)
      .join('');

    this.ui.roomExits.innerHTML = `
      <div class="exit-row">
        <label>North:</label>
        <select id="exitNorth">
          <option value="">None</option>
          ${exitOptions}
        </select>
      </div>
      <div class="exit-row">
        <label>South:</label>
        <select id="exitSouth">
          <option value="">None</option>
          ${exitOptions}
        </select>
      </div>
      <div class="exit-row">
        <label>East:</label>
        <select id="exitEast">
          <option value="">None</option>
          ${exitOptions}
        </select>
      </div>
      <div class="exit-row">
        <label>West:</label>
        <select id="exitWest">
          <option value="">None</option>
          ${exitOptions}
        </select>
      </div>
    `;

    // Set current values
    document.getElementById('exitNorth').value = room.exits.north || '';
    document.getElementById('exitSouth').value = room.exits.south || '';
    document.getElementById('exitEast').value = room.exits.east || '';
    document.getElementById('exitWest').value = room.exits.west || '';

    // Add event listeners
    document.getElementById('propRoomName').addEventListener('change', (e) => {
      room.name = e.target.value;
      this.updateCanvas();
      this.updateRoomList();
    });

    document
      .getElementById('propRoomDescription')
      .addEventListener('change', (e) => {
        room.description = e.target.value;
      });

    ['north', 'south', 'east', 'west'].forEach((dir) => {
      document
        .getElementById(`exit${dir.charAt(0).toUpperCase() + dir.slice(1)}`)
        .addEventListener('change', (e) => {
          if (e.target.value) {
            room.exits[dir] = e.target.value;
          } else {
            delete room.exits[dir];
          }
          this.updateCanvas();
        });
    });
  }

  /**
   * Update statistics display
   */
  updateStatistics() {
    this.ui.statRooms.textContent = this.rooms.size;
    this.ui.statItems.textContent = this.world.items.length;
    this.ui.statNPCs.textContent = this.world.npcs.length;
    this.ui.statPuzzles.textContent = this.world.puzzles.length;
  }

  /**
   * Adjust zoom level
   */
  adjustZoom(delta) {
    this.zoom = Math.max(0.25, Math.min(2.0, this.zoom + delta));
    this.ui.zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateCanvas();
  }

  /**
   * Reset zoom and pan
   */
  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.ui.zoomLevel.textContent = '100%';
    this.updateCanvas();
  }

  /**
   * Auto-layout rooms using force-directed algorithm
   */
  autoLayoutRooms() {
    if (this.rooms.size === 0) return;

    const rooms = Array.from(this.rooms.values());
    const iterations = 100;
    const repulsionStrength = 5000;
    const attractionStrength = 0.01;
    const idealDistance = 200;

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces
      for (const room of rooms) {
        let fx = 0;
        let fy = 0;

        // Repulsion from all other rooms
        for (const other of rooms) {
          if (room === other) continue;

          const dx = room.x - other.x;
          const dy = room.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const repulsion = repulsionStrength / (distance * distance);
          fx += (dx / distance) * repulsion;
          fy += (dy / distance) * repulsion;
        }

        // Attraction to connected rooms
        for (const targetId of Object.values(room.exits)) {
          const target = this.rooms.get(targetId);
          if (!target) continue;

          const dx = target.x - room.x;
          const dy = target.y - room.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const attraction = (distance - idealDistance) * attractionStrength;
          fx += (dx / distance) * attraction;
          fy += (dy / distance) * attraction;
        }

        // Apply forces
        room.x += fx * 0.1;
        room.y += fy * 0.1;
      }
    }

    // Snap to grid
    if (this.snapToGrid) {
      for (const room of rooms) {
        room.x = Math.round(room.x / this.gridSize) * this.gridSize;
        room.y = Math.round(room.y / this.gridSize) * this.gridSize;
      }
    }

    this.updateCanvas();
    this.log('Auto-layout complete');
  }

  /**
   * Validate world using WorldValidator
   */
  validateWorld() {
    // Convert rooms to world format
    this.world.rooms = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      exits: room.exits,
      objects: room.objects,
      items: room.items,
    }));

    const result = this.validator.validate(this.world);

    let html = '';
    if (result.valid) {
      html = '<div class="validation-success">✓ World is valid!</div>';
    } else {
      html += '<h4>Errors:</h4>';
      for (const error of result.errors) {
        html += `<div class="validation-error">${error.message}</div>`;
      }
    }

    if (result.warnings.length > 0) {
      html += '<h4>Warnings:</h4>';
      for (const warning of result.warnings) {
        html += `<div class="validation-warning">${warning.message}</div>`;
      }
    }

    this.ui.validationResults.innerHTML = html;
    this.switchTab('validation');
    this.log(`Validation complete: ${result.valid ? 'VALID' : 'INVALID'}`);
  }

  /**
   * Save world to localStorage
   */
  saveWorld() {
    // Convert rooms to world format
    this.world.rooms = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      exits: room.exits,
      objects: room.objects,
      items: room.items,
    }));

    const worldData = JSON.stringify(this.world, null, 2);
    localStorage.setItem('somnium_world_editor', worldData);

    this.log('World saved to localStorage');
    alert('World saved successfully!');
  }

  /**
   * Export world as JSON file
   */
  exportWorld() {
    // Convert rooms to world format
    this.world.rooms = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      exits: room.exits,
      objects: room.objects,
      items: room.items,
    }));

    const worldData = JSON.stringify(this.world, null, 2);
    const blob = new Blob([worldData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.world.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.log(`Exported world: ${a.download}`);
  }

  /**
   * Load world from file
   */
  loadWorldFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const worldData = JSON.parse(event.target.result);
        this.loadWorld(worldData);
        this.hideModal('loadWorldModal');
      } catch (error) {
        this.log(`Failed to load world: ${error.message}`, 'error');
        alert('Failed to load world file!');
      }
    };
    reader.readAsText(file);
  }

  /**
   * Load world data
   */
  loadWorld(worldData) {
    this.world = worldData;
    this.rooms.clear();

    // Convert rooms to editor format
    for (const room of worldData.rooms || []) {
      this.rooms.set(room.id, {
        ...room,
        x: 100 + this.rooms.size * 150,
        y: 100 + Math.floor(this.rooms.size / 5) * 150,
        width: 120,
        height: 80,
      });
    }

    // Update UI
    this.ui.worldTitle.value = this.world.title || '';
    this.ui.worldDescription.value = this.world.description || '';
    this.ui.worldGenre.value = this.world.genre || 'fantasy';
    this.ui.worldDifficulty.value = this.world.difficulty || 'normal';

    this.updateCanvas();
    this.updateRoomList();
    this.updateStatistics();
    this.autoLayoutRooms();
    this.log('World loaded successfully');
  }

  /**
   * Create new world
   */
  newWorld() {
    this.world = this.createEmptyWorld();
    this.rooms.clear();
    this.selectedRoom = null;

    this.ui.worldTitle.value = this.world.title;
    this.ui.worldDescription.value = this.world.description;
    this.ui.worldGenre.value = this.world.genre;
    this.ui.worldDifficulty.value = this.world.difficulty;

    this.updateCanvas();
    this.updateRoomList();
    this.updateRoomProperties();
    this.updateStatistics();
    this.log('New world created');
  }

  /**
   * Edit room in modal
   */
  editRoomModal(room) {
    document.getElementById('modalRoomId').value = room.id;
    document.getElementById('modalRoomName').value = room.name;
    document.getElementById('modalRoomDescription').value = room.description;

    const saveBtn = document.getElementById('saveRoomModal');
    saveBtn.onclick = () => {
      room.name = document.getElementById('modalRoomName').value;
      room.description = document.getElementById('modalRoomDescription').value;
      this.updateCanvas();
      this.updateRoomList();
      this.updateRoomProperties();
      this.hideModal('roomModal');
    };

    this.showModal('roomModal');
  }

  /**
   * Show modal
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Hide modal
   */
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
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
   * Log message to console
   */
  log(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.ui.consoleOutput.appendChild(line);
    this.ui.consoleOutput.scrollTop = this.ui.consoleOutput.scrollHeight;

    console.log(`[WorldEditor] ${message}`);
  }

  /**
   * Initialize UI state
   */
  updateUI() {
    this.ui.worldTitle.value = this.world.title;
    this.ui.worldDescription.value = this.world.description;
    this.ui.worldGenre.value = this.world.genre;
    this.ui.worldDifficulty.value = this.world.difficulty;
    this.updateRoomList();
    this.updateStatistics();
  }
}

// Initialize editor on page load
window.addEventListener('DOMContentLoaded', () => {
  window.worldEditor = new WorldEditor();
});
