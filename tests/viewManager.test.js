/**
 * Tests for ViewManager sprite and animation system
 */

import { ViewManager, ViewEffects } from '../js/ViewManager.js';

// Mock SceneRenderer
class MockSceneRenderer {
  constructor() {
    this.ctx = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
      strokeRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 1,
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      drawImage: jest.fn(),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: false,
    };
    this.debugMode = false;
  }
}

describe('ViewManager', () => {
  let viewManager;
  let mockRenderer;

  beforeEach(() => {
    mockRenderer = new MockSceneRenderer();
    viewManager = new ViewManager(mockRenderer);
  });

  describe('VIEW Resource Structure', () => {
    test('should create view with proper structure', () => {
      const viewData = {
        x: 100,
        y: 50,
        loops: [
          {
            name: 'idle',
            cells: [
              {
                width: 16,
                height: 24,
                anchorX: 8,
                anchorY: 24,
                duration: 500,
                pixels: [
                  [5, 5, 1],
                  [6, 5, 1],
                ],
              },
            ],
          },
        ],
      };

      const view = viewManager.createView('test_sprite', viewData);

      expect(view).toBeDefined();
      expect(view.id).toBe('test_sprite');
      expect(view.x).toBe(100);
      expect(view.y).toBe(50);
      expect(view.data.loops).toHaveLength(1);
      expect(view.data.loops[0].cells).toHaveLength(1);
    });

    test('should validate and normalize view data', () => {
      const viewData = {
        loops: {
          idle: {
            frames: [{ width: 16, height: 16 }], // Using old 'frames' key
          },
        },
      };

      const view = viewManager.createView('test', viewData);

      expect(view.data.loops).toHaveLength(1);
      expect(view.data.loops[0].name).toBe('idle');
      expect(view.data.loops[0].cells).toHaveLength(1);
      expect(view.data.loops[0].cells[0].width).toBe(16);
    });
  });

  describe('Animation System', () => {
    test('should advance animation cells based on duration', () => {
      const viewData = {
        loops: [
          {
            name: 'walk',
            cells: [
              { duration: 100, pixels: [] },
              { duration: 100, pixels: [] },
              { duration: 100, pixels: [] },
            ],
          },
        ],
      };

      viewManager.createView('animated', viewData);

      // Initial cell
      expect(viewManager.getView('animated').currentCell).toBe(0);

      // Advance time by 150ms
      viewManager.updateView('animated', 0.15);
      expect(viewManager.getView('animated').currentCell).toBe(1);

      // Advance more
      viewManager.updateView('animated', 0.15);
      expect(viewManager.getView('animated').currentCell).toBe(2);
    });

    test('should loop animation when repeat is true', () => {
      const viewData = {
        loops: [
          {
            name: 'loop',
            cells: [{ duration: 100 }, { duration: 100 }],
            repeat: true,
          },
        ],
      };

      viewManager.createView('looping', viewData);

      // Go through full loop
      viewManager.updateView('looping', 0.1);
      viewManager.updateView('looping', 0.1);
      viewManager.updateView('looping', 0.1);

      // Should be back at first cell
      expect(viewManager.getView('looping').currentCell).toBe(0);
    });

    test('should stop at last cell when repeat is false', () => {
      const viewData = {
        loops: [
          {
            name: 'once',
            cells: [{ duration: 100 }, { duration: 100 }],
            repeat: false,
          },
        ],
      };

      viewManager.createView('once', viewData);

      // Go past the end
      viewManager.updateView('once', 0.1);
      viewManager.updateView('once', 0.1);
      viewManager.updateView('once', 0.1);

      // Should stay at last cell
      expect(viewManager.getView('once').currentCell).toBe(1);
    });

    test('should trigger loop callback when animation completes', () => {
      const callback = jest.fn();
      const viewData = {
        loops: [
          {
            name: 'test',
            cells: [{ duration: 100 }, { duration: 100 }],
            repeat: false,
          },
        ],
      };

      viewManager.createView('callback_test', viewData);
      viewManager.setLoop('callback_test', 0, callback);

      // Complete the animation
      viewManager.updateView('callback_test', 0.1);
      viewManager.updateView('callback_test', 0.1);

      expect(callback).toHaveBeenCalledWith('callback_test', 0);
    });

    test('should respect animation speed multiplier', () => {
      const viewData = {
        loops: [
          {
            name: 'speed',
            cells: [{ duration: 100 }, { duration: 100 }],
          },
        ],
      };

      viewManager.createView('speed_test', viewData);
      viewManager.setAnimationSpeed(2.0);

      // With 2x speed, should advance faster
      viewManager.updateView('speed_test', 0.05);
      expect(viewManager.getView('speed_test').currentCell).toBe(1);
    });
  });

  describe('Movement System', () => {
    test('should move view over specified duration', () => {
      viewManager.createView('mover', { x: 0, y: 0, loops: [] });

      viewManager.moveView('mover', 100, 50, 1.0);

      // After 0.5 seconds, should be halfway
      viewManager.updatePositions(0.5);
      const view = viewManager.getView('mover');
      expect(view.x).toBeCloseTo(50);
      expect(view.y).toBeCloseTo(25);

      // After 1 second total, should be at destination
      viewManager.updatePositions(0.5);
      expect(view.x).toBe(100);
      expect(view.y).toBe(50);
    });

    test('should set position immediately', () => {
      viewManager.createView('jumper', { x: 0, y: 0, loops: [] });

      viewManager.setPosition('jumper', 200, 150);

      const view = viewManager.getView('jumper');
      expect(view.x).toBe(200);
      expect(view.y).toBe(150);
    });

    test('should cancel movement when setting position', () => {
      viewManager.createView('mover', { x: 0, y: 0, loops: [] });
      viewManager.moveView('mover', 100, 100, 2.0);

      // Start moving
      viewManager.updatePositions(0.5);

      // Set position directly
      viewManager.setPosition('mover', 50, 50);

      // Continue updating - position shouldn't change
      viewManager.updatePositions(0.5);
      const view = viewManager.getView('mover');
      expect(view.x).toBe(50);
      expect(view.y).toBe(50);
    });
  });

  describe('Loop Management', () => {
    test('should change loop by index', () => {
      const viewData = {
        loops: [
          { name: 'idle', cells: [{}] },
          { name: 'walk', cells: [{}] },
          { name: 'run', cells: [{}] },
        ],
      };

      viewManager.createView('multi_loop', viewData);

      viewManager.setLoop('multi_loop', 1);
      expect(viewManager.getView('multi_loop').currentLoop).toBe(1);

      viewManager.setLoop('multi_loop', 2);
      expect(viewManager.getView('multi_loop').currentLoop).toBe(2);
    });

    test('should change loop by name', () => {
      const viewData = {
        loops: [
          { name: 'idle', cells: [{}] },
          { name: 'walk', cells: [{}] },
          { name: 'run', cells: [{}] },
        ],
      };

      viewManager.createView('named_loop', viewData);

      viewManager.setLoop('named_loop', 'walk');
      expect(viewManager.getView('named_loop').currentLoop).toBe(1);

      viewManager.setLoop('named_loop', 'idle');
      expect(viewManager.getView('named_loop').currentLoop).toBe(0);
    });

    test('should reset cell when changing loops', () => {
      const viewData = {
        loops: [
          { name: 'a', cells: [{}, {}, {}] },
          { name: 'b', cells: [{}, {}] },
        ],
      };

      viewManager.createView('reset_test', viewData);

      // Advance in first loop
      viewManager.getView('reset_test').currentCell = 2;

      // Change loop
      viewManager.setLoop('reset_test', 1);

      expect(viewManager.getView('reset_test').currentCell).toBe(0);
      expect(viewManager.getView('reset_test').cellTime).toBe(0);
    });
  });

  describe('Collision Detection', () => {
    test('should detect collision between two views', () => {
      // Create two overlapping views
      viewManager.createView('view1', {
        x: 50,
        y: 50,
        loops: [
          {
            cells: [{ width: 20, height: 20, anchorX: 10, anchorY: 10 }],
          },
        ],
      });

      viewManager.createView('view2', {
        x: 55,
        y: 55,
        loops: [
          {
            cells: [{ width: 20, height: 20, anchorX: 10, anchorY: 10 }],
          },
        ],
      });

      expect(viewManager.checkCollision('view1', 'view2')).toBe(true);
    });

    test('should not detect collision when views are apart', () => {
      viewManager.createView('view1', {
        x: 50,
        y: 50,
        loops: [
          {
            cells: [{ width: 10, height: 10, anchorX: 5, anchorY: 5 }],
          },
        ],
      });

      viewManager.createView('view2', {
        x: 100,
        y: 100,
        loops: [
          {
            cells: [{ width: 10, height: 10, anchorX: 5, anchorY: 5 }],
          },
        ],
      });

      expect(viewManager.checkCollision('view1', 'view2')).toBe(false);
    });

    test('should get all colliding views', () => {
      // Create center view
      viewManager.createView('center', {
        x: 50,
        y: 50,
        loops: [{ cells: [{ width: 30, height: 30 }] }],
      });

      // Create surrounding views (some colliding, some not)
      viewManager.createView('collider1', {
        x: 55,
        y: 55,
        loops: [{ cells: [{ width: 10, height: 10 }] }],
      });

      viewManager.createView('collider2', {
        x: 45,
        y: 45,
        loops: [{ cells: [{ width: 10, height: 10 }] }],
      });

      viewManager.createView('non_collider', {
        x: 200,
        y: 200,
        loops: [{ cells: [{ width: 10, height: 10 }] }],
      });

      const collisions = viewManager.getCollisions('center');
      expect(collisions).toContain('collider1');
      expect(collisions).toContain('collider2');
      expect(collisions).not.toContain('non_collider');
    });

    test('should respect collision enabled flag', () => {
      viewManager.createView('view1', {
        x: 50,
        y: 50,
        loops: [{ cells: [{ width: 20, height: 20 }] }],
      });

      viewManager.createView('view2', {
        x: 55,
        y: 55,
        loops: [{ cells: [{ width: 20, height: 20 }] }],
      });

      viewManager.collisionEnabled = false;
      expect(viewManager.checkCollision('view1', 'view2')).toBe(false);
      expect(viewManager.getCollisions('view1')).toEqual([]);
    });
  });

  describe('Sprite Effects', () => {
    test('should apply mirror effect', () => {
      viewManager.createView('mirror_test', { loops: [] });

      viewManager.setMirrored('mirror_test', true);
      expect(viewManager.getView('mirror_test').mirrored).toBe(true);

      viewManager.setMirrored('mirror_test', false);
      expect(viewManager.getView('mirror_test').mirrored).toBe(false);
    });

    test('should apply effect mask', () => {
      viewManager.createView('effect_test', { loops: [] });

      viewManager.setEffectMask(
        'effect_test',
        ViewEffects.GHOST | ViewEffects.INVERTED
      );

      const view = viewManager.getView('effect_test');
      expect(view.effectMask & ViewEffects.GHOST).toBeTruthy();
      expect(view.effectMask & ViewEffects.INVERTED).toBeTruthy();
    });

    test('should apply scale with bounds', () => {
      viewManager.createView('scale_test', {
        loops: [{ cells: [{ width: 10, height: 10 }] }],
      });

      viewManager.setScale('scale_test', 2.0);
      expect(viewManager.getView('scale_test').scale).toBe(2.0);

      // Test bounds
      viewManager.setScale('scale_test', 5.0);
      expect(viewManager.getView('scale_test').scale).toBe(3.0);

      viewManager.setScale('scale_test', 0.1);
      expect(viewManager.getView('scale_test').scale).toBe(0.5);
    });

    test('should update bounding box when scaling', () => {
      viewManager.createView('scale_bounds', {
        x: 50,
        y: 50,
        loops: [
          {
            cells: [{ width: 10, height: 10, anchorX: 5, anchorY: 5 }],
          },
        ],
      });

      const originalBox = { ...viewManager.getView('scale_bounds').boundingBox };

      viewManager.setScale('scale_bounds', 2.0);

      const scaledBox = viewManager.getView('scale_bounds').boundingBox;
      expect(scaledBox.width).toBe(originalBox.width * 2);
      expect(scaledBox.height).toBe(originalBox.height * 2);
    });
  });

  describe('Priority System', () => {
    test('should calculate priority based on Y position', () => {
      viewManager.createView('priority_test', { x: 0, y: 100, loops: [] });

      const priority = viewManager.getViewPriority('priority_test');
      expect(priority).toBe(7); // 100/200 * 15 = 7.5, floored to 7
    });

    test('should update priority when Y changes', () => {
      viewManager.createView('priority_update', { x: 0, y: 50, loops: [] });

      const initialPriority = viewManager.getViewPriority('priority_update');

      viewManager.setPosition('priority_update', 0, 150);
      viewManager.updateViewPriority('priority_update');

      const newPriority = viewManager.getViewPriority('priority_update');
      expect(newPriority).toBeGreaterThan(initialPriority);
    });

    test('should sort views by priority and Y position', () => {
      viewManager.createView('view1', { x: 0, y: 50, priority: 5, loops: [] });
      viewManager.createView('view2', { x: 0, y: 100, priority: 5, loops: [] });
      viewManager.createView('view3', { x: 0, y: 75, priority: 3, loops: [] });
      viewManager.createView('view4', { x: 0, y: 25, priority: 8, loops: [] });

      // Render and check draw order
      const renderSpy = jest.spyOn(viewManager, 'renderView');
      viewManager.renderAll();

      const callOrder = renderSpy.mock.calls.map((call) => call[0].id);
      expect(callOrder).toEqual(['view3', 'view1', 'view2', 'view4']);
    });
  });

  describe('Sprite Pooling', () => {
    test('should reuse views from pool', () => {
      // Create and remove a view
      viewManager.createView('pooled', { loops: [] });
      viewManager.removeView('pooled');

      // Pool should have the view
      expect(viewManager.spritePool.length).toBe(1);

      // Create another view - should reuse from pool
      const initialPoolSize = viewManager.spritePool.length;
      viewManager.createView('reused', { loops: [] });
      expect(viewManager.spritePool.length).toBe(initialPoolSize - 1);
    });

    test('should reset view properties when returning to pool', () => {
      viewManager.createView('to_pool', {
        loops: [],
        visible: true,
      });

      const view = viewManager.getView('to_pool');
      view.effectMask = ViewEffects.GHOST;
      view.mirrored = true;

      viewManager.removeView('to_pool');

      // Check the pooled view is reset
      const pooledView = viewManager.spritePool[viewManager.spritePool.length - 1];
      expect(pooledView.id).toBe('');
      expect(pooledView.visible).toBe(false);
      expect(pooledView.loopCallback).toBeNull();
    });

    test('should limit pool size', () => {
      // Create and remove many views
      for (let i = 0; i < 60; i++) {
        viewManager.createView(`temp_${i}`, { loops: [] });
        viewManager.removeView(`temp_${i}`);
      }

      // Pool should be capped at 50
      expect(viewManager.spritePool.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Batch Rendering', () => {
    test('should initialize batch canvas', () => {
      expect(viewManager.batchCanvas).toBeDefined();
      expect(viewManager.batchCanvas.width).toBe(640);
      expect(viewManager.batchCanvas.height).toBe(400);
      expect(viewManager.batchCtx.imageSmoothingEnabled).toBe(false);
    });

    test('should clear batch canvas before rendering', () => {
      viewManager.createView('batch_test', { loops: [] });

      const clearSpy = jest.spyOn(viewManager.batchCtx, 'clearRect');
      viewManager.renderAll();

      expect(clearSpy).toHaveBeenCalledWith(0, 0, 640, 400);
    });

    test('should draw batch to main canvas', () => {
      viewManager.createView('batch_view', { loops: [] });

      const drawImageSpy = jest.spyOn(mockRenderer.ctx, 'drawImage');
      viewManager.renderAll();

      expect(drawImageSpy).toHaveBeenCalledWith(viewManager.batchCanvas, 0, 0);
    });
  });

  describe('Rendering', () => {
    test('should skip transparent pixels', () => {
      const viewData = {
        loops: [
          {
            cells: [
              {
                width: 3,
                height: 3,
                pixels: [
                  [0, 0, 1],
                  [1, 1, 0], // Transparent (color 0)
                  [2, 2, 2],
                ],
                transparentColor: 0,
              },
            ],
          },
        ],
      };

      viewManager.createView('transparent_test', viewData);

      const fillRectSpy = jest.spyOn(viewManager.batchCtx, 'fillRect');
      viewManager.renderAll();

      // Should only draw 2 pixels (skipping the transparent one)
      expect(fillRectSpy).toHaveBeenCalledTimes(2);
    });

    test('should apply ghost effect with transparency', () => {
      viewManager.createView('ghost', {
        loops: [{ cells: [{ pixels: [[0, 0, 1]] }] }],
      });

      viewManager.setEffectMask('ghost', ViewEffects.GHOST);

      const ctx = viewManager.batchCtx;
      jest.spyOn(ctx, 'save');
      jest.spyOn(ctx, 'restore');

      viewManager.renderAll();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.globalAlpha).toBe(0.5);
      expect(ctx.restore).toHaveBeenCalled();
    });

    test('should draw debug bounding box when enabled', () => {
      mockRenderer.debugMode = true;
      viewManager.createView('debug_box', {
        loops: [{ cells: [{ width: 10, height: 10 }] }],
      });

      const strokeRectSpy = jest.spyOn(viewManager.batchCtx, 'strokeRect');
      viewManager.renderAll();

      expect(strokeRectSpy).toHaveBeenCalled();
      expect(viewManager.batchCtx.strokeStyle).toBe('#FF55FF');
    });
  });

  describe('Utility Functions', () => {
    test('should check if view is at position', () => {
      viewManager.createView('position_test', {
        x: 100,
        y: 50,
        loops: [],
      });

      expect(viewManager.isViewAt('position_test', 100, 50)).toBe(true);
      expect(viewManager.isViewAt('position_test', 101, 50, 2)).toBe(true);
      expect(viewManager.isViewAt('position_test', 105, 50, 2)).toBe(false);
    });

    test('should get all view IDs', () => {
      viewManager.createView('view1', { loops: [] });
      viewManager.createView('view2', { loops: [] });
      viewManager.createView('view3', { loops: [] });

      const ids = viewManager.getAllViewIds();
      expect(ids).toContain('view1');
      expect(ids).toContain('view2');
      expect(ids).toContain('view3');
      expect(ids).toHaveLength(3);
    });

    test('should handle visibility', () => {
      viewManager.createView('visible_test', { loops: [] });

      viewManager.setVisible('visible_test', false);
      expect(viewManager.getView('visible_test').visible).toBe(false);

      // Should not render invisible views
      const renderSpy = jest.spyOn(viewManager, 'renderView');
      viewManager.renderAll();

      expect(renderSpy).not.toHaveBeenCalled();
    });
  });
});