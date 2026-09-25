/**
 * Rethrown errors keep the original error as `cause`
 * (ESLint 10 preserve-caught-error).
 */

import { jest } from '@jest/globals';
import logger from '../js/logger.js';
import { AIManager } from '../js/AIManager.js';
import { EnhancedWorldGenerator } from '../js/EnhancedWorldGenerator.js';
import { SaveGameManager } from '../js/SaveGameManager.js';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AIManager', () => {
  it('attaches the JSON.parse error to an invalid world response', () => {
    const ai = new AIManager({});

    let thrown;
    try {
      ai.parseAndValidateWorldData('not json');
    } catch (error) {
      thrown = error;
    }

    expect(thrown.message).toMatch(/^Invalid JSON response from AI:/);
    expect(thrown.cause).toBeInstanceOf(SyntaxError);
  });

  it('attaches the underlying failure when world generation fails', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    const ai = new AIManager({});
    const original = new Error('upstream down');
    jest.spyOn(ai, 'makeAPIRequest').mockRejectedValue(original);

    await expect(ai.generateWorld('space')).rejects.toMatchObject({
      message: 'Failed to generate world: upstream down',
      cause: original,
    });
  });

  it('attaches the parse error when the API returns non-JSON content', async () => {
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const ai = new AIManager({
      apiKey: 'test-key',
      apiEndpoint: 'https://example.invalid/v1/chat',
    });
    const mock = { fallback: true };
    jest.spyOn(ai, 'getMockResponse').mockReturnValue(mock);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
    }));

    try {
      await expect(ai.makeAPIRequest('prompt', false, 0)).resolves.toBe(mock);
    } finally {
      globalThis.fetch = originalFetch;
    }

    const logged = errorSpy.mock.calls.find(([, err]) => err instanceof Error);
    expect(logged[1].message).toMatch(/^Failed to parse JSON response:/);
    expect(logged[1].cause).toBeInstanceOf(SyntaxError);
  });
});

describe('EnhancedWorldGenerator', () => {
  it('attaches the last failure after exhausting retries', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    const generator = new EnhancedWorldGenerator({}, { validate: jest.fn() });
    const original = new Error('structure failed');
    jest.spyOn(generator, 'generateStructure').mockRejectedValue(original);

    await expect(
      generator.generateWorld({ maxRetries: 1 })
    ).rejects.toMatchObject({
      message: 'Failed to generate valid world after max retries',
      cause: original,
    });
  });
});

describe('SaveGameManager', () => {
  it('attaches the storage error when localStorage rejects the write', () => {
    const gameManager = {
      saveGame: () => ({}),
      gameState: { getCurrentRoom: () => null, score: 0 },
    };
    const manager = new SaveGameManager(gameManager);
    jest.spyOn(manager.logger, 'log').mockImplementation(() => {});
    jest.spyOn(manager.logger, 'error').mockImplementation(() => {});
    const quota = new Error('QuotaExceededError');
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota;
    });

    let thrown;
    try {
      manager.saveToSlot(0);
    } catch (error) {
      thrown = error;
    }

    expect(thrown.message).toBe('Failed to save game to browser storage');
    expect(thrown.cause).toBe(quota);
  });
});
