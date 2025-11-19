/**
 * TournamentManager - Competitive Tournament System
 * Manages tournaments, brackets, scoring, and rankings
 *
 * Features:
 * - Tournament creation and management
 * - Bracket generation (single/double elimination, round-robin)
 * - Real-time scoring and rankings
 * - Leaderboard integration
 * - Tournament history and statistics
 *
 * @module TournamentManager
 * @version 2.0.0
 */

import logger from './logger.js';

export default class TournamentManager {
  constructor(apiClient) {
    this.apiClient = apiClient;

    // State
    this.currentTournament = null;
    this.tournaments = new Map();
    this.myTournaments = [];

    // Configuration
    this.config = {
      apiEndpoint: '/api/tournaments',
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
    };

    // Refresh timer
    this.refreshTimer = null;

    // Callbacks
    this.onTournamentUpdate = null;
    this.onMatchComplete = null;
    this.onTournamentComplete = null;
  }

  /**
   * Create a new tournament
   * @param {Object} tournamentData - Tournament configuration
   * @returns {Promise<Object>} Created tournament
   */
  async createTournament(tournamentData) {
    const {
      name,
      description = '',
      format = 'single-elimination', // single-elimination, double-elimination, round-robin
      maxParticipants = 8,
      worldId = null,
      startTime = null,
      entryFee = 0,
      prizes = [],
      rules = {},
    } = tournamentData;

    try {
      const response = await this.apiClient.post(
        `${this.config.apiEndpoint}/create`,
        {
          name,
          description,
          format,
          maxParticipants,
          worldId,
          startTime,
          entryFee,
          prizes,
          rules,
        }
      );

      const tournament = response.data.tournament;
      this.tournaments.set(tournament.id, tournament);
      this.currentTournament = tournament;

      logger.info('Tournament created:', tournament.id);
      return tournament;
    } catch (error) {
      logger.error('Failed to create tournament:', error);
      throw error;
    }
  }

  /**
   * Join an existing tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<boolean>} Success status
   */
  async joinTournament(tournamentId) {
    try {
      const response = await this.apiClient.post(
        `${this.config.apiEndpoint}/${tournamentId}/join`
      );

      const tournament = response.data.tournament;
      this.tournaments.set(tournamentId, tournament);

      if (!this.myTournaments.includes(tournamentId)) {
        this.myTournaments.push(tournamentId);
      }

      logger.info('Joined tournament:', tournamentId);
      return true;
    } catch (error) {
      logger.error('Failed to join tournament:', error);
      throw error;
    }
  }

  /**
   * Leave a tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<boolean>} Success status
   */
  async leaveTournament(tournamentId) {
    try {
      await this.apiClient.post(
        `${this.config.apiEndpoint}/${tournamentId}/leave`
      );

      const index = this.myTournaments.indexOf(tournamentId);
      if (index > -1) {
        this.myTournaments.splice(index, 1);
      }

      logger.info('Left tournament:', tournamentId);
      return true;
    } catch (error) {
      logger.error('Failed to leave tournament:', error);
      throw error;
    }
  }

  /**
   * Get tournament details
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Tournament data
   */
  async getTournament(tournamentId) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/${tournamentId}`
      );

      const tournament = response.data.tournament;
      this.tournaments.set(tournamentId, tournament);

      return tournament;
    } catch (error) {
      logger.error('Failed to get tournament:', error);
      throw error;
    }
  }

  /**
   * List all tournaments
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of tournaments
   */
  async listTournaments(filters = {}) {
    const { status = 'all', format = null, limit = 50 } = filters;

    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}`,
        {
          params: { status, format, limit },
        }
      );

      const tournaments = response.data.tournaments;
      tournaments.forEach((t) => this.tournaments.set(t.id, t));

      return tournaments;
    } catch (error) {
      logger.error('Failed to list tournaments:', error);
      throw error;
    }
  }

  /**
   * Get tournament bracket
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Bracket structure
   */
  async getBracket(tournamentId) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/${tournamentId}/bracket`
      );

      return response.data.bracket;
    } catch (error) {
      logger.error('Failed to get bracket:', error);
      throw error;
    }
  }

  /**
   * Submit match result
   * @param {string} tournamentId - Tournament ID
   * @param {string} matchId - Match ID
   * @param {Object} result - Match result data
   * @returns {Promise<boolean>} Success status
   */
  async submitMatchResult(tournamentId, matchId, result) {
    try {
      const response = await this.apiClient.post(
        `${this.config.apiEndpoint}/${tournamentId}/matches/${matchId}/result`,
        result
      );

      const tournament = response.data.tournament;
      this.tournaments.set(tournamentId, tournament);

      if (this.onMatchComplete) {
        this.onMatchComplete(tournamentId, matchId, result);
      }

      // Check if tournament is complete
      if (tournament.status === 'completed') {
        if (this.onTournamentComplete) {
          this.onTournamentComplete(tournament);
        }
      }

      logger.info('Match result submitted:', matchId);
      return true;
    } catch (error) {
      logger.error('Failed to submit match result:', error);
      throw error;
    }
  }

  /**
   * Get tournament standings
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Current standings
   */
  async getStandings(tournamentId) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/${tournamentId}/standings`
      );

      return response.data.standings;
    } catch (error) {
      logger.error('Failed to get standings:', error);
      throw error;
    }
  }

  /**
   * Get my tournament matches
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} My matches
   */
  async getMyMatches(tournamentId) {
    try {
      const response = await this.apiClient.get(
        `${this.config.apiEndpoint}/${tournamentId}/my-matches`
      );

      return response.data.matches;
    } catch (error) {
      logger.error('Failed to get my matches:', error);
      throw error;
    }
  }

  /**
   * Start tournament (organizer only)
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<boolean>} Success status
   */
  async startTournament(tournamentId) {
    try {
      const response = await this.apiClient.post(
        `${this.config.apiEndpoint}/${tournamentId}/start`
      );

      const tournament = response.data.tournament;
      this.tournaments.set(tournamentId, tournament);

      logger.info('Tournament started:', tournamentId);
      return true;
    } catch (error) {
      logger.error('Failed to start tournament:', error);
      throw error;
    }
  }

  /**
   * Cancel tournament (organizer only)
   * @param {string} tournamentId - Tournament ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<boolean>} Success status
   */
  async cancelTournament(tournamentId, reason = '') {
    try {
      await this.apiClient.post(
        `${this.config.apiEndpoint}/${tournamentId}/cancel`,
        { reason }
      );

      logger.info('Tournament cancelled:', tournamentId);
      return true;
    } catch (error) {
      logger.error('Failed to cancel tournament:', error);
      throw error;
    }
  }

  /**
   * Generate bracket for tournament
   * @param {Array} participants - List of participants
   * @param {string} format - Tournament format
   * @returns {Object} Generated bracket
   */
  generateBracket(participants, format = 'single-elimination') {
    switch (format) {
      case 'single-elimination':
        return this.generateSingleEliminationBracket(participants);
      case 'double-elimination':
        return this.generateDoubleEliminationBracket(participants);
      case 'round-robin':
        return this.generateRoundRobinBracket(participants);
      default:
        throw new Error(`Unknown tournament format: ${format}`);
    }
  }

  /**
   * Generate single elimination bracket
   * @param {Array} participants - Participants
   * @returns {Object} Bracket structure
   */
  generateSingleEliminationBracket(participants) {
    const rounds = Math.ceil(Math.log2(participants.length));
    const totalSlots = Math.pow(2, rounds);
    const byes = totalSlots - participants.length;

    const bracket = {
      format: 'single-elimination',
      rounds: [],
      matches: [],
    };

    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Add byes
    for (let i = 0; i < byes; i++) {
      shuffled.push(null);
    }

    // Generate rounds
    let currentRound = shuffled;
    for (let r = 0; r < rounds; r++) {
      const roundMatches = [];
      const nextRound = [];

      for (let i = 0; i < currentRound.length; i += 2) {
        const match = {
          id: `r${r}m${i / 2}`,
          round: r,
          player1: currentRound[i],
          player2: currentRound[i + 1],
          winner: null,
          score: null,
        };

        roundMatches.push(match);
        nextRound.push(null); // Placeholder for winner
      }

      bracket.rounds.push({
        number: r,
        name: this.getRoundName(r, rounds),
        matches: roundMatches,
      });

      currentRound = nextRound;
    }

    return bracket;
  }

  /**
   * Generate double elimination bracket
   * @param {Array} participants - Participants
   * @returns {Object} Bracket structure
   */
  generateDoubleEliminationBracket(participants) {
    const winnersBracket = this.generateSingleEliminationBracket(participants);
    const losersBracket = {
      rounds: [],
    };

    // Losers bracket has twice as many rounds
    const rounds = winnersBracket.rounds.length;
    for (let r = 0; r < rounds * 2 - 1; r++) {
      losersBracket.rounds.push({
        number: r,
        name: `Losers R${r + 1}`,
        matches: [],
      });
    }

    return {
      format: 'double-elimination',
      winners: winnersBracket,
      losers: losersBracket,
      grandFinal: {
        match: null,
        resetMatch: null, // If losers bracket winner wins first match
      },
    };
  }

  /**
   * Generate round-robin bracket
   * @param {Array} participants - Participants
   * @returns {Object} Bracket structure
   */
  generateRoundRobinBracket(participants) {
    const matches = [];
    const standings = participants.map((p) => ({
      player: p,
      wins: 0,
      losses: 0,
      points: 0,
    }));

    // Generate all matchups
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `m${i}-${j}`,
          player1: participants[i],
          player2: participants[j],
          winner: null,
          score: null,
        });
      }
    }

    return {
      format: 'round-robin',
      matches,
      standings,
    };
  }

  /**
   * Get round name for bracket display
   * @param {number} round - Round number
   * @param {number} totalRounds - Total rounds
   * @returns {string} Round name
   */
  getRoundName(round, totalRounds) {
    const fromEnd = totalRounds - round - 1;

    if (fromEnd === 0) return 'Finals';
    if (fromEnd === 1) return 'Semi-Finals';
    if (fromEnd === 2) return 'Quarter-Finals';
    return `Round ${round + 1}`;
  }

  /**
   * Calculate tournament statistics
   * @param {Object} tournament - Tournament data
   * @returns {Object} Statistics
   */
  calculateStatistics(tournament) {
    return {
      totalParticipants: tournament.participants?.length || 0,
      matchesPlayed: tournament.matchesPlayed || 0,
      matchesRemaining: tournament.matchesTotal - tournament.matchesPlayed || 0,
      averageMatchDuration: tournament.averageMatchDuration || 0,
      estimatedTimeRemaining: this.estimateTimeRemaining(tournament),
      topPlayers: this.getTopPlayers(tournament, 3),
    };
  }

  /**
   * Estimate time remaining in tournament
   * @param {Object} tournament - Tournament data
   * @returns {number} Estimated minutes
   */
  estimateTimeRemaining(tournament) {
    const avgDuration = tournament.averageMatchDuration || 15; // minutes
    const remaining = tournament.matchesTotal - tournament.matchesPlayed;
    return avgDuration * remaining;
  }

  /**
   * Get top players from tournament
   * @param {Object} tournament - Tournament data
   * @param {number} count - Number of players
   * @returns {Array} Top players
   */
  getTopPlayers(tournament, count = 3) {
    if (!tournament.standings) return [];

    return tournament.standings
      .sort((a, b) => b.points - a.points)
      .slice(0, count);
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    if (!this.config.autoRefresh) return;

    this.stopAutoRefresh();

    this.refreshTimer = setInterval(async () => {
      if (this.currentTournament) {
        try {
          await this.getTournament(this.currentTournament.id);
        } catch (error) {
          logger.error('Auto-refresh failed:', error);
        }
      }
    }, this.config.refreshInterval);

    logger.info('Auto-refresh started');
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('Auto-refresh stopped');
    }
  }

  /**
   * Dispose tournament manager
   */
  dispose() {
    this.stopAutoRefresh();
    this.tournaments.clear();
    this.myTournaments = [];
    this.currentTournament = null;
    logger.info('TournamentManager disposed');
  }
}
