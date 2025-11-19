/**
 * VoiceCommandManager - Web Speech API Integration
 * Enables voice control for Somnium using browser's speech recognition
 *
 * Features:
 * - Continuous listening mode
 * - Natural language command recognition
 * - Integration with existing Parser
 * - Visual feedback for recognition
 * - Configurable language support
 *
 * @module VoiceCommandManager
 * @version 2.0.0
 */

import logger from './logger.js';

export default class VoiceCommandManager {
  constructor(parser, commandExecutor) {
    this.parser = parser;
    this.commandExecutor = commandExecutor;

    // Speech Recognition API (WebKit prefixed for Safari)
    this.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = null;

    // State
    this.isListening = false;
    this.isEnabled = false;
    this.isContinuous = false;

    // Configuration
    this.config = {
      language: 'en-US',
      continuous: false, // Toggle for continuous listening
      interimResults: true, // Show partial results
      maxAlternatives: 3, // Number of alternative interpretations
      autoStart: false, // Start listening on page load
    };

    // Callbacks
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;

    // Stats
    this.stats = {
      commandsRecognized: 0,
      commandsExecuted: 0,
      errors: 0,
      lastCommand: null,
      lastTimestamp: null,
    };

    // Check browser support
    this.checkSupport();
  }

  /**
   * Check if browser supports Speech Recognition API
   * @returns {boolean} True if supported
   */
  checkSupport() {
    if (!this.SpeechRecognition) {
      logger.warn('Speech Recognition API not supported in this browser');
      this.isEnabled = false;
      return false;
    }

    this.isEnabled = true;
    logger.info('Speech Recognition API supported');
    return true;
  }

  /**
   * Initialize speech recognition
   */
  initialize() {
    if (!this.isEnabled) {
      logger.error('Cannot initialize: Speech Recognition not supported');
      return false;
    }

    try {
      this.recognition = new this.SpeechRecognition();

      // Configure recognition
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
      this.recognition.lang = this.config.language;

      // Event handlers
      this.recognition.onstart = () => this.handleStart();
      this.recognition.onend = () => this.handleEnd();
      this.recognition.onresult = (event) => this.handleResult(event);
      this.recognition.onerror = (event) => this.handleError(event);
      this.recognition.onnomatch = () => this.handleNoMatch();

      logger.info('Voice recognition initialized', this.config);
      return true;
    } catch (error) {
      logger.error('Failed to initialize voice recognition', error);
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Start listening for voice commands
   */
  start() {
    if (!this.isEnabled) {
      logger.warn('Cannot start: Voice recognition not enabled');
      return false;
    }

    if (!this.recognition) {
      this.initialize();
    }

    if (this.isListening) {
      logger.warn('Already listening');
      return false;
    }

    try {
      this.recognition.start();
      logger.info('Started voice recognition');
      return true;
    } catch (error) {
      logger.error('Failed to start voice recognition', error);
      return false;
    }
  }

  /**
   * Stop listening for voice commands
   */
  stop() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      logger.info('Stopped voice recognition');
    } catch (error) {
      logger.error('Failed to stop voice recognition', error);
    }
  }

  /**
   * Toggle listening on/off
   */
  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Set continuous listening mode
   * @param {boolean} enabled - Enable continuous listening
   */
  setContinuous(enabled) {
    this.config.continuous = enabled;
    if (this.recognition) {
      this.recognition.continuous = enabled;
      logger.info('Continuous mode:', enabled);
    }
  }

  /**
   * Change recognition language
   * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
   */
  setLanguage(lang) {
    this.config.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
      logger.info('Language changed to:', lang);
    }
  }

  /**
   * Handle recognition start
   */
  handleStart() {
    this.isListening = true;
    logger.info('Voice recognition started listening');

    if (this.onStart) {
      this.onStart();
    }

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('voiceRecognitionStart', {
        detail: { timestamp: Date.now() },
      })
    );
  }

  /**
   * Handle recognition end
   */
  handleEnd() {
    this.isListening = false;
    logger.info('Voice recognition stopped listening');

    if (this.onEnd) {
      this.onEnd();
    }

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('voiceRecognitionEnd', {
        detail: { timestamp: Date.now() },
      })
    );

    // Auto-restart if continuous mode
    if (this.config.continuous && this.isEnabled) {
      setTimeout(() => {
        if (!this.isListening) {
          this.start();
        }
      }, 100);
    }
  }

  /**
   * Handle recognition result
   * @param {SpeechRecognitionEvent} event - Recognition event
   */
  handleResult(event) {
    const results = event.results;
    const lastIndex = results.length - 1;
    const result = results[lastIndex];

    // Get transcript
    const transcript = result[0].transcript.trim().toLowerCase();
    const confidence = result[0].confidence;
    const isFinal = result.isFinal;

    logger.info('Voice recognition result:', {
      transcript,
      confidence,
      isFinal,
    });

    // Update stats
    if (isFinal) {
      this.stats.commandsRecognized++;
      this.stats.lastCommand = transcript;
      this.stats.lastTimestamp = Date.now();
    }

    // Dispatch event for UI feedback
    window.dispatchEvent(
      new CustomEvent('voiceRecognitionResult', {
        detail: {
          transcript,
          confidence,
          isFinal,
          alternatives: this.getAlternatives(result),
        },
      })
    );

    // Process final results
    if (isFinal) {
      this.processCommand(transcript, confidence);
    }

    // Callback
    if (this.onResult) {
      this.onResult(transcript, confidence, isFinal);
    }
  }

  /**
   * Get alternative interpretations
   * @param {SpeechRecognitionResult} result - Recognition result
   * @returns {Array} Alternative transcripts
   */
  getAlternatives(result) {
    const alternatives = [];
    for (let i = 0; i < result.length && i < 3; i++) {
      alternatives.push({
        transcript: result[i].transcript,
        confidence: result[i].confidence,
      });
    }
    return alternatives;
  }

  /**
   * Process recognized command
   * @param {string} transcript - Recognized text
   * @param {number} confidence - Confidence score (0-1)
   */
  processCommand(transcript, confidence) {
    // Filter out low-confidence results
    if (confidence < 0.5) {
      logger.warn('Low confidence, ignoring:', confidence);
      window.dispatchEvent(
        new CustomEvent('voiceCommandLowConfidence', {
          detail: { transcript, confidence },
        })
      );
      return;
    }

    // Check for special voice commands
    if (this.handleSpecialCommand(transcript)) {
      return;
    }

    // Parse and execute game command
    try {
      const parsedCommand = this.parser.parse(transcript);

      if (!parsedCommand) {
        logger.warn('Failed to parse voice command:', transcript);
        window.dispatchEvent(
          new CustomEvent('voiceCommandParseFailed', {
            detail: { transcript },
          })
        );
        return;
      }

      // Execute command
      logger.info('Executing voice command:', parsedCommand);
      this.commandExecutor.execute(parsedCommand);

      this.stats.commandsExecuted++;

      // Dispatch success event
      window.dispatchEvent(
        new CustomEvent('voiceCommandExecuted', {
          detail: { transcript, command: parsedCommand },
        })
      );
    } catch (error) {
      logger.error('Error processing voice command:', error);
      window.dispatchEvent(
        new CustomEvent('voiceCommandError', {
          detail: { transcript, error: error.message },
        })
      );
    }
  }

  /**
   * Handle special voice commands (meta-commands)
   * @param {string} transcript - Recognized text
   * @returns {boolean} True if special command was handled
   */
  handleSpecialCommand(transcript) {
    const lower = transcript.toLowerCase();

    // Voice control commands
    if (lower.includes('stop listening') || lower.includes('stop voice')) {
      this.stop();
      return true;
    }

    if (lower.includes('start listening') || lower.includes('start voice')) {
      this.start();
      return true;
    }

    // Help command
    if (lower === 'voice help' || lower === 'help voice') {
      this.showVoiceHelp();
      return true;
    }

    // Repeat last command
    if (lower === 'repeat' || lower === 'say that again') {
      if (this.stats.lastCommand) {
        this.processCommand(this.stats.lastCommand, 1.0);
      }
      return true;
    }

    return false;
  }

  /**
   * Show voice command help
   */
  showVoiceHelp() {
    const helpText = `
Voice Commands Help:
- Speak any game command naturally
- Examples: "look around", "go north", "take the key"
- Special commands:
  * "stop listening" - Stop voice recognition
  * "start listening" - Start voice recognition
  * "repeat" - Repeat last command
  * "voice help" - Show this help

Tips:
- Speak clearly and at normal pace
- Wait for the microphone icon to activate
- Commands work the same as typed commands
    `.trim();

    logger.info(helpText);

    window.dispatchEvent(
      new CustomEvent('voiceCommandHelp', {
        detail: { helpText },
      })
    );
  }

  /**
   * Handle recognition error
   * @param {SpeechRecognitionErrorEvent} event - Error event
   */
  handleError(event) {
    this.stats.errors++;

    logger.error('Voice recognition error:', event.error);

    // User-friendly error messages
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not available. Check permissions.',
      'not-allowed': 'Microphone access denied. Enable in browser settings.',
      network: 'Network error. Check your connection.',
      'aborted': 'Recognition aborted.',
      'bad-grammar': 'Grammar error in recognition.',
      'language-not-supported': 'Language not supported.',
    };

    const message =
      errorMessages[event.error] || `Unknown error: ${event.error}`;

    if (this.onError) {
      this.onError(event.error, message);
    }

    // Dispatch error event
    window.dispatchEvent(
      new CustomEvent('voiceRecognitionError', {
        detail: {
          error: event.error,
          message,
        },
      })
    );

    // Auto-restart on some errors
    if (event.error === 'no-speech' && this.config.continuous) {
      setTimeout(() => this.start(), 1000);
    }
  }

  /**
   * Handle no match (speech detected but not recognized)
   */
  handleNoMatch() {
    logger.warn('Speech detected but not recognized');

    window.dispatchEvent(
      new CustomEvent('voiceRecognitionNoMatch', {
        detail: { timestamp: Date.now() },
      })
    );
  }

  /**
   * Get current stats
   * @returns {Object} Statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      commandsRecognized: 0,
      commandsExecuted: 0,
      errors: 0,
      lastCommand: null,
      lastTimestamp: null,
    };
    logger.info('Voice recognition stats reset');
  }

  /**
   * Test voice recognition
   */
  test() {
    if (!this.isEnabled) {
      return {
        supported: false,
        message: 'Speech Recognition API not supported',
      };
    }

    return {
      supported: true,
      isListening: this.isListening,
      config: this.config,
      stats: this.stats,
      message: 'Voice recognition is working',
    };
  }

  /**
   * Get supported languages
   * @returns {Array} List of language codes
   */
  static getSupportedLanguages() {
    return [
      'en-US', // English (United States)
      'en-GB', // English (United Kingdom)
      'es-ES', // Spanish (Spain)
      'es-MX', // Spanish (Mexico)
      'fr-FR', // French (France)
      'de-DE', // German (Germany)
      'it-IT', // Italian (Italy)
      'pt-BR', // Portuguese (Brazil)
      'ru-RU', // Russian (Russia)
      'zh-CN', // Chinese (Simplified)
      'ja-JP', // Japanese (Japan)
      'ko-KR', // Korean (South Korea)
    ];
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stop();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onnomatch = null;
      this.recognition = null;
    }
    logger.info('Voice recognition disposed');
  }
}
