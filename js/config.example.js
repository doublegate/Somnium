/**
 * Example configuration file for Somnium
 * 
 * Copy this file to config.js and add your actual API key.
 * The config.js file is gitignored to keep your API key safe.
 */

export const API_CONFIG = {
  // Your OpenAI API key
  apiKey: 'sk-YOUR-API-KEY-HERE',
  
  // API endpoint
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  
  // Model to use for world generation
  model: 'gpt-3.5-turbo',  // or 'gpt-4' for better quality
  
  // Optional: Model for dynamic interactions (can be same or different)
  interactionModel: 'gpt-3.5-turbo',
  
  // Optional: Content moderation endpoint
  moderationEndpoint: 'https://api.openai.com/v1/moderations',
  
  // Optional: Enable debug mode
  debug: false
};