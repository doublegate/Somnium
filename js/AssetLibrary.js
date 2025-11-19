/**
 * AssetLibrary - Asset management and browsing system
 *
 * Features:
 * - Asset categorization (graphics, audio, data)
 * - Search and filtering
 * - Tagging system
 * - Asset preview/playback
 * - Upload and import
 * - Metadata editing
 * - Usage tracking
 * - Integration with editors
 */

import { logger } from './logger.js';

export class AssetLibrary {
  /**
   * @param {Object} [options] - Optional configuration
   * @param {Array<string>} [options.categories] - Custom asset categories
   */
  constructor(options = {}) {
    // Asset storage
    this.assets = new Map(); // assetId -> asset data
    
    // Configure categories (use custom or defaults)
    const defaultCategories = [
      'graphics',
      'audio',
      'data',
      'sprites',
      'backgrounds',
      'music',
      'sfx',
      'worlds',
      'puzzles',
      'dialogues',
    ];
    const categoryNames = Array.isArray(options.categories) ? options.categories : defaultCategories;
    this.categories = {};
    for (const name of categoryNames) {
      this.categories[name] = new Set();
    }

    // Tagging system
    this.tags = new Map(); // tag -> Set of assetIds
    this.assetTags = new Map(); // assetId -> Set of tags

    // Usage tracking
    this.usage = new Map(); // assetId -> { count, lastUsed, usedIn: [] }

    // Search index
    this.searchIndex = new Map(); // keyword -> Set of assetIds

    // Statistics
    this.stats = {
      totalAssets: 0,
      totalSize: 0,
      byCategory: {},
      mostUsed: [],
      recentlyAdded: [],
    };

    logger.info('AssetLibrary initialized');
  }

  /**
   * Add asset to library
   * @param {Object} asset - Asset data
   * @returns {string} Asset ID
   */
  addAsset(asset) {
    const assetId = asset.id || `asset_${crypto.randomUUID()}`;

    const assetData = {
      id: assetId,
      name: asset.name || 'Untitled Asset',
      type: asset.type, // 'image', 'audio', 'json', 'sprite', etc.
      category: asset.category, // 'graphics', 'audio', 'data'
      data: asset.data, // Base64, URL, or object
      size: asset.size || 0,
      format: asset.format, // 'png', 'mp3', 'json', etc.
      metadata: asset.metadata || {},
      tags: asset.tags || [],
      dateAdded: Date.now(),
      dateModified: Date.now(),
      author: asset.author || 'Unknown',
      description: asset.description || '',
      thumbnail: asset.thumbnail || null,
      isPublic: asset.isPublic !== undefined ? asset.isPublic : true,
    };

    this.assets.set(assetId, assetData);

    // Update category
    if (assetData.category && this.categories[assetData.category]) {
      this.categories[assetData.category].add(assetId);
    }

    // Add tags
    for (const tag of assetData.tags) {
      this.addTag(assetId, tag);
    }

    // Update search index
    this.indexAsset(assetData);

    // Initialize usage tracking
    this.usage.set(assetId, {
      count: 0,
      lastUsed: null,
      usedIn: [],
    });

    // Update statistics
    this.updateStatistics();

    logger.info(`Asset added: ${assetId} (${assetData.name})`);

    return assetId;
  }

  /**
   * Get asset by ID
   * @param {string} assetId - Asset ID
   * @returns {Object|null} Asset data
   */
  getAsset(assetId) {
    return this.assets.get(assetId) || null;
  }

  /**
   * Update asset
   * @param {string} assetId - Asset ID
   * @param {Object} updates - Update data
   * @returns {boolean} Success
   */
  updateAsset(assetId, updates) {
    const asset = this.assets.get(assetId);
    if (!asset) {
      logger.error(`Asset not found: ${assetId}`);
      return false;
    }

    // Update fields
    Object.assign(asset, updates);
    asset.dateModified = Date.now();

    // Re-index if name/description changed
    if (updates.name || updates.description || updates.tags) {
      this.reindexAsset(asset);
    }

    // Update tags if changed
    if (updates.tags) {
      this.updateAssetTags(assetId, updates.tags);
    }

    this.updateStatistics();
    logger.info(`Asset updated: ${assetId}`);

    return true;
  }

  /**
   * Delete asset
   * @param {string} assetId - Asset ID
   * @returns {boolean} Success
   */
  deleteAsset(assetId) {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // Remove from category
    if (asset.category && this.categories[asset.category]) {
      this.categories[asset.category].delete(assetId);
    }

    // Remove tags
    const tags = this.assetTags.get(assetId);
    if (tags) {
      for (const tag of tags) {
        const tagSet = this.tags.get(tag);
        if (tagSet) {
          tagSet.delete(assetId);
          if (tagSet.size === 0) {
            this.tags.delete(tag);
          }
        }
      }
      this.assetTags.delete(assetId);
    }

    // Remove from search index
    this.removeFromSearchIndex(assetId);

    // Remove usage tracking
    this.usage.delete(assetId);

    // Remove asset
    this.assets.delete(assetId);

    this.updateStatistics();
    logger.info(`Asset deleted: ${assetId}`);

    return true;
  }

  /**
   * Search assets
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching assets
   */
  search(criteria = {}) {
    let results = Array.from(this.assets.values());

    // Filter by query (keyword search)
    if (criteria.query) {
      const keywords = criteria.query.toLowerCase().split(/\s+/);
      results = results.filter((asset) => {
        const searchText =
          `${asset.name} ${asset.description} ${asset.tags.join(' ')}`.toLowerCase();
        return keywords.every((kw) => searchText.includes(kw));
      });
    }

    // Filter by category
    if (criteria.category) {
      results = results.filter((asset) => asset.category === criteria.category);
    }

    // Filter by type
    if (criteria.type) {
      results = results.filter((asset) => asset.type === criteria.type);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((asset) =>
        criteria.tags.every((tag) => asset.tags.includes(tag))
      );
    }

    // Filter by author
    if (criteria.author) {
      results = results.filter((asset) => asset.author === criteria.author);
    }

    // Filter by date range
    if (criteria.dateFrom) {
      results = results.filter((asset) => asset.dateAdded >= criteria.dateFrom);
    }
    if (criteria.dateTo) {
      results = results.filter((asset) => asset.dateAdded <= criteria.dateTo);
    }

    // Sort results
    const sortBy = criteria.sortBy || 'dateAdded';
    const sortOrder = criteria.sortOrder || 'desc';

    results.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'usage') {
        aVal = this.usage.get(a.id)?.count || 0;
        bVal = this.usage.get(b.id)?.count || 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Limit results
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Get assets by category
   * @param {string} category - Category name
   * @returns {Array} Assets in category
   */
  getAssetsByCategory(category) {
    const assetIds = this.categories[category];
    if (!assetIds) return [];

    return Array.from(assetIds).map((id) => this.assets.get(id)).filter(Boolean);
  }

  /**
   * Get assets by tag
   * @param {string} tag - Tag name
   * @returns {Array} Tagged assets
   */
  getAssetsByTag(tag) {
    const assetIds = this.tags.get(tag);
    if (!assetIds) return [];

    return Array.from(assetIds).map((id) => this.assets.get(id)).filter(Boolean);
  }

  /**
   * Add tag to asset
   * @param {string} assetId - Asset ID
   * @param {string} tag - Tag name
   */
  addTag(assetId, tag) {
    if (!this.tags.has(tag)) {
      this.tags.set(tag, new Set());
    }
    this.tags.get(tag).add(assetId);

    if (!this.assetTags.has(assetId)) {
      this.assetTags.set(assetId, new Set());
    }
    this.assetTags.get(assetId).add(tag);
  }

  /**
   * Remove tag from asset
   * @param {string} assetId - Asset ID
   * @param {string} tag - Tag name
   */
  removeTag(assetId, tag) {
    const tagSet = this.tags.get(tag);
    if (tagSet) {
      tagSet.delete(assetId);
      if (tagSet.size === 0) {
        this.tags.delete(tag);
      }
    }

    const assetTagSet = this.assetTags.get(assetId);
    if (assetTagSet) {
      assetTagSet.delete(tag);
    }
  }

  /**
   * Update asset tags
   * @param {string} assetId - Asset ID
   * @param {Array} newTags - New tags
   */
  updateAssetTags(assetId, newTags) {
    // Remove old tags
    const oldTags = this.assetTags.get(assetId);
    if (oldTags) {
      for (const tag of oldTags) {
        this.removeTag(assetId, tag);
      }
    }

    // Add new tags
    for (const tag of newTags) {
      this.addTag(assetId, tag);
    }
  }

  /**
   * Get all tags
   * @returns {Array} List of tags with counts
   */
  getAllTags() {
    return Array.from(this.tags.entries()).map(([tag, assetIds]) => ({
      name: tag,
      count: assetIds.size,
    }));
  }

  /**
   * Track asset usage
   * @param {string} assetId - Asset ID
   * @param {string} context - Usage context (e.g., world_id, puzzle_id)
   */
  trackUsage(assetId, context = null) {
    const usage = this.usage.get(assetId);
    if (!usage) return;

    usage.count++;
    usage.lastUsed = Date.now();

    if (context && !usage.usedIn.includes(context)) {
      usage.usedIn.push(context);
    }

    this.updateStatistics();
  }

  /**
   * Get asset usage stats
   * @param {string} assetId - Asset ID
   * @returns {Object} Usage statistics
   */
  getUsageStats(assetId) {
    return this.usage.get(assetId) || { count: 0, lastUsed: null, usedIn: [] };
  }

  /**
   * Get most used assets
   * @param {number} limit - Number of assets to return
   * @returns {Array} Most used assets
   */
  getMostUsed(limit = 10) {
    const assetsWithUsage = Array.from(this.assets.values()).map((asset) => ({
      ...asset,
      usage: this.usage.get(asset.id) || { count: 0 },
    }));

    assetsWithUsage.sort((a, b) => b.usage.count - a.usage.count);

    return assetsWithUsage.slice(0, limit);
  }

  /**
   * Get recently added assets
   * @param {number} limit - Number of assets to return
   * @returns {Array} Recently added assets
   */
  getRecentlyAdded(limit = 10) {
    const assets = Array.from(this.assets.values());
    assets.sort((a, b) => b.dateAdded - a.dateAdded);
    return assets.slice(0, limit);
  }

  /**
   * Index asset for search
   * @param {Object} asset - Asset data
   */
  indexAsset(asset) {
    const keywords = this.extractKeywords(asset);

    for (const keyword of keywords) {
      if (!this.searchIndex.has(keyword)) {
        this.searchIndex.set(keyword, new Set());
      }
      this.searchIndex.get(keyword).add(asset.id);
    }
  }

  /**
   * Re-index asset
   * @param {Object} asset - Asset data
   */
  reindexAsset(asset) {
    this.removeFromSearchIndex(asset.id);
    this.indexAsset(asset);
  }

  /**
   * Remove asset from search index
   * @param {string} assetId - Asset ID
   */
  removeFromSearchIndex(assetId) {
    for (const [keyword, assetIds] of this.searchIndex.entries()) {
      assetIds.delete(assetId);
      if (assetIds.size === 0) {
        this.searchIndex.delete(keyword);
      }
    }
  }

  /**
   * Extract keywords from asset for indexing
   * @param {Object} asset - Asset data
   * @returns {Array} Keywords
   */
  extractKeywords(asset) {
    const text = `${asset.name} ${asset.description} ${asset.tags.join(' ')}`;
    const words = text.toLowerCase().match(/\w+/g) || [];

    // Remove duplicates
    return [...new Set(words)];
  }

  /**
   * Update statistics
   */
  updateStatistics() {
    this.stats.totalAssets = this.assets.size;
    this.stats.totalSize = Array.from(this.assets.values()).reduce(
      (sum, asset) => sum + asset.size,
      0
    );

    // Count by category
    this.stats.byCategory = {};
    for (const [category, assetIds] of Object.entries(this.categories)) {
      this.stats.byCategory[category] = assetIds.size;
    }

    // Most used (top 5)
    this.stats.mostUsed = this.getMostUsed(5).map((asset) => ({
      id: asset.id,
      name: asset.name,
      usage: asset.usage.count,
    }));

    // Recently added (top 5)
    this.stats.recentlyAdded = this.getRecentlyAdded(5).map((asset) => ({
      id: asset.id,
      name: asset.name,
      dateAdded: asset.dateAdded,
    }));
  }

  /**
   * Get statistics
   * @returns {Object} Library statistics
   */
  getStatistics() {
    return this.stats;
  }

  /**
   * Export asset library
   * @returns {Object} Exportable library data
   */
  exportLibrary() {
    return {
      assets: Array.from(this.assets.entries()),
      tags: Array.from(this.tags.entries()).map(([tag, assetIds]) => [
        tag,
        Array.from(assetIds),
      ]),
      usage: Array.from(this.usage.entries()),
      stats: this.stats,
      exportDate: Date.now(),
    };
  }

  /**
   * Import asset library
   * @param {Object} libraryData - Exported library data
   */
  importLibrary(libraryData) {
    // Clear existing data
    this.assets.clear();
    this.tags.clear();
    this.assetTags.clear();
    this.usage.clear();
    this.searchIndex.clear();

    for (const category of Object.values(this.categories)) {
      category.clear();
    }

    // Import assets
    for (const [assetId, asset] of libraryData.assets) {
      this.assets.set(assetId, asset);

      // Rebuild category index
      if (asset.category && this.categories[asset.category]) {
        this.categories[asset.category].add(assetId);
      }

      // Rebuild search index
      this.indexAsset(asset);
    }

    // Import tags
    for (const [tag, assetIds] of libraryData.tags) {
      this.tags.set(tag, new Set(assetIds));

      for (const assetId of assetIds) {
        if (!this.assetTags.has(assetId)) {
          this.assetTags.set(assetId, new Set());
        }
        this.assetTags.get(assetId).add(tag);
      }
    }

    // Import usage
    for (const [assetId, usage] of libraryData.usage) {
      this.usage.set(assetId, usage);
    }

    this.updateStatistics();
    logger.info(`Library imported: ${this.assets.size} assets`);
  }

  /**
   * Get duplicate assets (same name/size)
   * @returns {Array} Groups of duplicate assets
   */
  findDuplicates() {
    const duplicates = [];
    const seen = new Map();

    for (const asset of this.assets.values()) {
      const key = `${asset.name}_${asset.size}`;

      if (!seen.has(key)) {
        seen.set(key, []);
      }

      seen.get(key).push(asset);
    }

    for (const [key, assets] of seen.entries()) {
      if (assets.length > 1) {
        duplicates.push(assets);
      }
    }

    return duplicates;
  }

  /**
   * Clean unused assets (usage count = 0)
   * @param {number} maxAge - Maximum age in days for unused assets
   * @returns {Array} Deleted asset IDs
   */
  cleanUnusedAssets(maxAge = 30) {
    const deleted = [];
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [assetId, asset] of this.assets.entries()) {
      const usage = this.usage.get(assetId);
      const age = now - asset.dateAdded;

      if (usage.count === 0 && age > maxAgeMs) {
        this.deleteAsset(assetId);
        deleted.push(assetId);
      }
    }

    logger.info(`Cleaned ${deleted.length} unused assets`);
    return deleted;
  }

  /**
   * Generate thumbnail for asset
   * @param {string} assetId - Asset ID
   * @returns {Promise<string>} Thumbnail data URL
   */
  async generateThumbnail(assetId) {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    // For images, create a smaller version
    if (asset.type === 'image' && asset.data) {
      // This would use canvas to resize the image
      // Simplified version for now
      return asset.data; // Return original for now
    }

    // For other types, return placeholder
    return null;
  }

  /**
   * Save library to localStorage
   */
  saveToLocalStorage() {
    const data = this.exportLibrary();
    localStorage.setItem('somnium_asset_library', JSON.stringify(data));
    logger.info('Asset library saved to localStorage');
  }

  /**
   * Load library from localStorage
   */
  loadFromLocalStorage() {
    const data = localStorage.getItem('somnium_asset_library');
    if (!data) {
      logger.warn('No asset library found in localStorage');
      return false;
    }

    try {
      const libraryData = JSON.parse(data);
      this.importLibrary(libraryData);
      logger.info('Asset library loaded from localStorage');
      return true;
    } catch (error) {
      logger.error('Failed to load asset library:', error);
      return false;
    }
  }
}
