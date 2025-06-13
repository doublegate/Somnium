/**
 * SceneRenderer Test Suite
 * Tests enhanced vector graphics engine with EGA palette
 */

import { SceneRenderer } from '../js/SceneRenderer.js';

describe('SceneRenderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    renderer = new SceneRenderer(canvas);
  });

  describe('EGA Palette System', () => {
    test('should validate hex colors to EGA palette', () => {
      expect(renderer.validateColor('#000000')).toBe('#000000');
      expect(renderer.validateColor('#0000AA')).toBe('#0000AA');
      expect(renderer.validateColor('#FFFFFF')).toBe('#FFFFFF');
    });

    test('should convert color names to EGA colors', () => {
      expect(renderer.validateColor('black')).toBe('#000000');
      expect(renderer.validateColor('blue')).toBe('#0000AA');
      expect(renderer.validateColor('lightblue')).toBe('#5555FF');
      expect(renderer.validateColor('yellow')).toBe('#FFFF55');
    });

    test('should convert color indices to EGA colors', () => {
      expect(renderer.validateColor(0)).toBe('#000000');
      expect(renderer.validateColor(1)).toBe('#0000AA');
      expect(renderer.validateColor(15)).toBe('#FFFFFF');
    });

    test('should find nearest EGA color for non-palette colors', () => {
      // Dark purple should map to magenta
      expect(renderer.validateColor('#800080')).toBe('#AA00AA');
      // Orange should map to brown
      expect(renderer.validateColor('#FFA500')).toBe('#AA5500');
    });

    test('should get correct color index', () => {
      expect(renderer.getColorIndex('#000000')).toBe(0);
      expect(renderer.getColorIndex('#0000AA')).toBe(1);
      expect(renderer.getColorIndex('#FFFFFF')).toBe(15);
    });
  });

  describe('Primitive Drawing', () => {
    test('should draw filled rectangle', () => {
      const primitive = {
        type: 'rect',
        dims: [10, 10, 50, 30],
        color: '#00AA00',
        filled: true,
      };

      // Spy on context methods
      const fillRectSpy = jest.spyOn(renderer.backCtx, 'fillRect');

      renderer.drawPrimitive(primitive);

      expect(fillRectSpy).toHaveBeenCalledWith(20, 20, 100, 60);
      expect(renderer.backCtx.fillStyle.toUpperCase()).toBe('#00AA00');
    });

    test('should draw stroked rectangle', () => {
      const primitive = {
        type: 'rect',
        dims: [10, 10, 50, 30],
        color: '#00AA00',
        filled: false,
      };

      const strokeRectSpy = jest.spyOn(renderer.backCtx, 'strokeRect');

      renderer.drawPrimitive(primitive);

      expect(strokeRectSpy).toHaveBeenCalledWith(20, 20, 100, 60);
      expect(renderer.backCtx.strokeStyle.toUpperCase()).toBe('#00AA00');
    });

    test('should draw polygon', () => {
      const primitive = {
        type: 'polygon',
        points: [
          [10, 10],
          [60, 10],
          [35, 50],
        ],
        color: '#AA0000',
      };

      const beginPathSpy = jest.spyOn(renderer.backCtx, 'beginPath');
      const moveToSpy = jest.spyOn(renderer.backCtx, 'moveTo');
      const lineToSpy = jest.spyOn(renderer.backCtx, 'lineTo');
      const fillSpy = jest.spyOn(renderer.backCtx, 'fill');

      renderer.drawPrimitive(primitive);

      expect(beginPathSpy).toHaveBeenCalled();
      expect(moveToSpy).toHaveBeenCalledWith(20, 20);
      expect(lineToSpy).toHaveBeenCalledWith(120, 20);
      expect(lineToSpy).toHaveBeenCalledWith(70, 100);
      expect(fillSpy).toHaveBeenCalled();
    });

    test('should draw line', () => {
      const primitive = {
        type: 'line',
        points: [
          [10, 20],
          [50, 80],
        ],
        color: '#FFFF55',
        width: 2,
      };

      const strokeSpy = jest.spyOn(renderer.backCtx, 'stroke');

      renderer.drawPrimitive(primitive);

      expect(strokeSpy).toHaveBeenCalled();
      expect(renderer.backCtx.strokeStyle.toUpperCase()).toBe('#FFFF55');
    });

    test('should draw star pixels', () => {
      const primitive = {
        type: 'star',
        points: [
          [100, 50],
          [150, 60],
          [200, 40],
        ],
        color: '#FFFFFF',
      };

      const fillRectSpy = jest.spyOn(renderer.backCtx, 'fillRect');

      renderer.drawPrimitive(primitive);

      // Each star should draw 5 pixels (center + 4 cross)
      expect(fillRectSpy).toHaveBeenCalledTimes(15);
    });
  });

  describe('Dithering Patterns', () => {
    test('should apply checkerboard dithering', () => {
      const imageDataSpy = jest.spyOn(renderer.backCtx, 'createImageData');

      renderer.drawDitheredGradient(
        0,
        0,
        100,
        50,
        '#0000AA',
        '#00AA00',
        2,
        renderer.backCtx
      );

      // For large areas, should use ImageData
      expect(imageDataSpy).toHaveBeenCalled();
    });

    test('should support all dithering patterns', () => {
      // Test each pattern exists
      for (let i = 0; i <= 8; i++) {
        expect(renderer.ditherPatterns[i]).toBeDefined();
        expect(renderer.ditherPatterns[i].length).toBe(2);
        expect(renderer.ditherPatterns[i][0].length).toBe(2);
      }
    });
  });

  describe('Priority System', () => {
    test('should update priority buffer for rectangles', () => {
      renderer.updatePriorityBuffer(10, 20, 30, 40, 5);

      // Check corners
      expect(renderer.getPixelPriority(10, 20)).toBe(5);
      expect(renderer.getPixelPriority(39, 59)).toBe(5);
      expect(renderer.getPixelPriority(9, 20)).toBe(0);
    });

    test('should calculate priority bands based on Y coordinate', () => {
      expect(renderer.getPriorityBand(0)).toBe(1);
      expect(renderer.getPriorityBand(100)).toBe(8);
      expect(renderer.getPriorityBand(199)).toBe(15);
    });

    test('should fill polygon priority correctly', () => {
      const points = [
        [50, 50],
        [100, 50],
        [75, 100],
      ];

      renderer.updatePolygonPriority(points, 7);

      // Check inside triangle
      expect(renderer.getPixelPriority(75, 75)).toBe(7);
      // Check outside triangle
      expect(renderer.getPixelPriority(40, 50)).toBe(0);
    });
  });

  describe('Scene Caching', () => {
    test('should cache rendered scenes', () => {
      const roomGraphics = {
        backgroundColor: '#000000',
        primitives: [
          {
            type: 'rect',
            dims: [0, 0, 320, 200],
            color: '#0000AA',
          },
        ],
      };

      const drawImageSpy = jest.spyOn(renderer.ctx, 'drawImage');

      // First render should draw primitives
      renderer.renderRoom(roomGraphics, 'room1');
      expect(renderer.currentRoomId).toBe('room1');
      expect(renderer.sceneCache).toBeTruthy();

      // Second render should use cache
      drawImageSpy.mockClear();
      renderer.renderRoom(roomGraphics, 'room1');
      expect(drawImageSpy).toHaveBeenCalledWith(renderer.sceneCache, 0, 0);
    });

    test('should clear cache when requested', () => {
      renderer.currentRoomId = 'test';
      renderer.sceneCache = {};

      renderer.clearCache();

      expect(renderer.currentRoomId).toBeNull();
      expect(renderer.sceneCache).toBeNull();
    });
  });

  describe('Debug Mode', () => {
    test('should toggle debug mode', () => {
      renderer.setDebugMode(true, {
        showPriorityMap: true,
        showGrid: true,
      });

      expect(renderer.debugMode).toBe(true);
      expect(renderer.showPriorityMap).toBe(true);
      expect(renderer.showGrid).toBe(true);
    });

    test('should draw debug overlay when enabled', () => {
      renderer.setDebugMode(true, { showGrid: true });

      const strokeSpy = jest.spyOn(renderer.ctx, 'stroke');

      renderer.drawDebugOverlay();

      // Should draw grid lines
      expect(strokeSpy).toHaveBeenCalled();
    });
  });

  describe('Complex Shapes', () => {
    test('should draw ellipse', () => {
      const primitive = {
        type: 'ellipse',
        center: [100, 100],
        radiusX: 50,
        radiusY: 30,
        rotation: Math.PI / 4,
        color: '#55FF55',
      };

      const ellipseSpy = jest.spyOn(renderer.backCtx, 'ellipse');

      renderer.drawPrimitive(primitive);

      expect(ellipseSpy).toHaveBeenCalledWith(
        200,
        200,
        100,
        60,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
    });

    test('should draw complex path', () => {
      const primitive = {
        type: 'path',
        commands: [
          { type: 'moveTo', x: 10, y: 10 },
          { type: 'lineTo', x: 50, y: 10 },
          { type: 'quadraticCurveTo', cpx: 50, cpy: 30, x: 30, y: 30 },
          { type: 'closePath' },
        ],
        color: '#FF5555',
        filled: true,
      };

      const moveToSpy = jest.spyOn(renderer.backCtx, 'moveTo');
      const lineToSpy = jest.spyOn(renderer.backCtx, 'lineTo');
      const quadraticCurveSpy = jest.spyOn(
        renderer.backCtx,
        'quadraticCurveTo'
      );

      renderer.drawPrimitive(primitive);

      expect(moveToSpy).toHaveBeenCalledWith(20, 20);
      expect(lineToSpy).toHaveBeenCalledWith(100, 20);
      expect(quadraticCurveSpy).toHaveBeenCalledWith(100, 60, 60, 60);
    });
  });
});