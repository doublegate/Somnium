/**
 * Somnium Configuration
 *
 * Copy this file to config.js and fill in your settings.
 *
 * IMPORTANT: config.js is gitignored to protect your API keys.
 * Never commit config.js with real API keys!
 */

export const API_CONFIG = {
  // ===== AI Configuration =====

  /**
   * OpenAI API Key (or compatible service)
   * Get your key from: https://platform.openai.com/api-keys
   *
   * Leave as 'your-api-key-here' to run in offline mode with static test worlds
   */
  apiKey: 'your-api-key-here',

  /**
   * API Endpoint
   * OpenAI: 'https://api.openai.com/v1/chat/completions'
   * Or use any OpenAI-compatible endpoint
   */
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',

  /**
   * Model to use
   * Recommended: 'gpt-3.5-turbo' (fast, cheap)
   * Advanced: 'gpt-4' or 'gpt-4-turbo' (better quality, more expensive)
   */
  model: 'gpt-3.5-turbo',

  /**
   * Content moderation endpoint (optional)
   * OpenAI: 'https://api.openai.com/v1/moderations'
   * Leave null to disable
   */
  moderationEndpoint: null,

  // ===== Game Configuration =====

  /**
   * Enable auto-save every 5 minutes
   */
  autoSave: true,

  /**
   * Enable debug mode (shows FPS counter, verbose logging)
   */
  debugMode: false,

  /**
   * Use Sierra-style Said() pattern parser
   * Set to false to use simple parser
   */
  useSierraParser: true,

  /**
   * Use priority-based renderer (Sierra-style depth testing)
   * Set to false to use simple renderer
   */
  usePriorityRenderer: true,

  // ===== Audio Configuration =====

  /**
   * Master volume (0.0 to 1.0)
   */
  masterVolume: 0.7,

  /**
   * Music volume (0.0 to 1.0)
   */
  musicVolume: 0.6,

  /**
   * Sound effects volume (0.0 to 1.0)
   */
  sfxVolume: 0.8,

  /**
   * Ambient sound volume (0.0 to 1.0)
   */
  ambientVolume: 0.5,

  // ===== Advanced Configuration =====

  /**
   * Rate limit: Maximum API requests per minute
   */
  maxRequestsPerMinute: 20,

  /**
   * Cache size for AI responses
   */
  responseCacheSize: 100,

  /**
   * Number of save slots
   */
  maxSaveSlots: 10,

  /**
   * Game speed (1-5, where 3 is normal)
   */
  defaultSpeed: 3,
};

// Example configurations for different setups:

// ===== Offline Mode (No API Key) =====
// Just leave apiKey as 'your-api-key-here'
// The game will use static test worlds

// ===== Local LLM (Ollama, LM Studio, etc.) =====
/*
export const API_CONFIG = {
  apiKey: 'not-needed',
  apiEndpoint: 'http://localhost:11434/v1/chat/completions', // Ollama
  model: 'llama2',
  moderationEndpoint: null,
  // ... rest of config
};
*/

// ===== Budget Mode (Minimize API Costs) =====
/*
export const API_CONFIG = {
  apiKey: 'your-key-here',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  maxRequestsPerMinute: 5,  // Lower rate limit
  responseCacheSize: 200,    // Larger cache
  // ... rest of config
};
*/
