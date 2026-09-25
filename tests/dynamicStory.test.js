/**
 * DynamicStory.adaptDialogue fallback tests
 */

import { jest } from '@jest/globals';
import { DynamicStory } from '../js/DynamicStory.js';

function makeStory({ npc, generateText }) {
  const npcSystem = {
    getNPC: jest.fn(() => npc),
    getRelationship: jest.fn(() => 0),
  };
  const aiManager = { generateText: jest.fn(generateText) };
  const gameState = {
    getCurrentRoomName: () => 'Bridge',
    getPlayerLevel: () => 1,
  };
  return new DynamicStory(aiManager, gameState, npcSystem, {});
}

describe('DynamicStory.adaptDialogue', () => {
  it('returns the generated text on success', async () => {
    const story = makeStory({
      npc: { name: 'Mira', personality: 'wry' },
      generateText: async () => ({ text: 'Hello there.' }),
    });

    await expect(story.adaptDialogue('mira', 'hello')).resolves.toBe(
      'Hello there.'
    );
  });

  it('falls back to the NPC name when generation fails', async () => {
    const story = makeStory({
      npc: { name: 'Mira' },
      generateText: async () => {
        throw new Error('offline');
      },
    });

    await expect(story.adaptDialogue('mira', 'hello')).resolves.toBe(
      'Mira looks at you thoughtfully.'
    );
  });

  it('falls back to a generic line when the NPC lookup itself throws', async () => {
    const story = makeStory({ npc: undefined, generateText: async () => ({}) });
    story.npcSystem.getNPC.mockImplementation(() => {
      throw new Error('no such npc');
    });

    await expect(story.adaptDialogue('ghost', 'hello')).resolves.toBe(
      'The character looks at you thoughtfully.'
    );
  });
});
