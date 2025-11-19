/**
 * Somnium API Server
 * Backend for cloud saves, social sharing, and authentication
 *
 * Usage: node server/api-server.js
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory data stores (in production, use a real database)
const users = new Map();
const saves = new Map();    // userId -> Map(slot -> saveData)
const shared = new Map();   // shareId -> sharedContent
const tokens = new Map();   // token -> userId

// Storage directory
const STORAGE_DIR = path.join(__dirname, 'storage');

// Initialize storage
async function initStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'saves'), { recursive: true });
    await fs.mkdir(path.join(STORAGE_DIR, 'shared'), { recursive: true });
    console.log('[API] Storage initialized');
  } catch (error) {
    console.error('[API] Storage initialization failed:', error);
  }
}

// Utility functions
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const userId = tokens.get(token);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = userId;
  req.user = users.get(userId);
  next();
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = generateId();
    const user = {
      id: userId,
      email,
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.set(userId, user);
    saves.set(userId, new Map());

    const token = generateToken();
    tokens.set(token, userId);

    console.log(`[API] User registered: ${username} (${userId})`);

    res.json({
      success: true,
      userId,
      username,
      token,
    });
  } catch (error) {
    console.error('[API] Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = Array.from(users.values()).find(u => u.email === email);

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    tokens.set(token, user.id);

    console.log(`[API] User logged in: ${user.username}`);

    res.json({
      success: true,
      userId: user.id,
      username: user.username,
      token,
    });
  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/verify
 * Verify authentication token
 */
app.post('/api/auth/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    userId: req.userId,
    username: req.user.username,
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
app.post('/api/auth/logout', authenticate, (req, res) => {
  // Remove token
  for (const [token, userId] of tokens.entries()) {
    if (userId === req.userId) {
      tokens.delete(token);
      break;
    }
  }

  res.json({ success: true });
});

// ============================================================================
// CLOUD SAVE ROUTES
// ============================================================================

/**
 * GET /api/saves
 * Get all saves for authenticated user
 */
app.get('/api/saves', authenticate, async (req, res) => {
  try {
    const userSaves = saves.get(req.userId) || new Map();

    const savesArray = Array.from(userSaves.entries()).map(([slot, data]) => ({
      slot: parseInt(slot),
      timestamp: data.timestamp,
      worldTitle: data.worldTitle,
      currentRoom: data.currentRoom,
      score: data.score,
    }));

    res.json({
      success: true,
      saves: savesArray,
    });
  } catch (error) {
    console.error('[API] Get saves error:', error);
    res.status(500).json({ error: 'Failed to get saves' });
  }
});

/**
 * GET /api/saves/:slot
 * Get specific save
 */
app.get('/api/saves/:slot', authenticate, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const userSaves = saves.get(req.userId) || new Map();
    const saveData = userSaves.get(slot);

    if (!saveData) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({
      success: true,
      save: saveData,
    });
  } catch (error) {
    console.error('[API] Get save error:', error);
    res.status(500).json({ error: 'Failed to get save' });
  }
});

/**
 * PUT /api/saves/:slot
 * Upload/update save
 */
app.put('/api/saves/:slot', authenticate, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const saveData = req.body;

    if (!saveData) {
      return res.status(400).json({ error: 'No save data provided' });
    }

    let userSaves = saves.get(req.userId);
    if (!userSaves) {
      userSaves = new Map();
      saves.set(req.userId, userSaves);
    }

    userSaves.set(slot, {
      ...saveData,
      uploadedAt: new Date().toISOString(),
    });

    // Persist to disk
    const savePath = path.join(STORAGE_DIR, 'saves', `${req.userId}_${slot}.json`);
    await fs.writeFile(savePath, JSON.stringify(saveData, null, 2));

    console.log(`[API] Save uploaded: User ${req.userId}, Slot ${slot}`);

    res.json({
      success: true,
      slot,
      timestamp: saveData.timestamp,
    });
  } catch (error) {
    console.error('[API] Upload save error:', error);
    res.status(500).json({ error: 'Failed to upload save' });
  }
});

/**
 * DELETE /api/saves/:slot
 * Delete save
 */
app.delete('/api/saves/:slot', authenticate, async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const userSaves = saves.get(req.userId);

    if (!userSaves || !userSaves.has(slot)) {
      return res.status(404).json({ error: 'Save not found' });
    }

    userSaves.delete(slot);

    // Delete from disk
    const savePath = path.join(STORAGE_DIR, 'saves', `${req.userId}_${slot}.json`);
    await fs.unlink(savePath).catch(() => {});

    console.log(`[API] Save deleted: User ${req.userId}, Slot ${slot}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[API] Delete save error:', error);
    res.status(500).json({ error: 'Failed to delete save' });
  }
});

/**
 * GET /api/saves/check-updates
 * Check for cloud save updates
 */
app.get('/api/saves/check-updates', authenticate, async (req, res) => {
  try {
    const userSaves = saves.get(req.userId) || new Map();

    res.json({
      success: true,
      hasUpdates: userSaves.size > 0,
      count: userSaves.size,
    });
  } catch (error) {
    console.error('[API] Check updates error:', error);
    res.status(500).json({ error: 'Failed to check updates' });
  }
});

// ============================================================================
// SOCIAL SHARING ROUTES
// ============================================================================

/**
 * POST /api/share
 * Share content (save, world, achievement, screenshot)
 */
app.post('/api/share', async (req, res) => {
  try {
    const { type, title, description, data, public: isPublic, tags } = req.body;

    if (!type || !title || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const shareId = generateId();
    const shareData = {
      id: shareId,
      type,
      title,
      description,
      content: JSON.parse(data),
      public: isPublic !== false,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      views: 0,
      ratings: [],
      averageRating: 0,
    };

    shared.set(shareId, shareData);

    // Persist to disk
    const sharePath = path.join(STORAGE_DIR, 'shared', `${shareId}.json`);
    await fs.writeFile(sharePath, JSON.stringify(shareData, null, 2));

    console.log(`[API] Content shared: ${type} - ${title} (${shareId})`);

    res.json({
      success: true,
      id: shareId,
      url: `/shared/${shareId}`,
    });
  } catch (error) {
    console.error('[API] Share error:', error);
    res.status(500).json({ error: 'Failed to share content' });
  }
});

/**
 * GET /api/share/:id
 * Get shared content
 */
app.get('/api/share/:id', async (req, res) => {
  try {
    const shareId = req.params.id;
    const shareData = shared.get(shareId);

    if (!shareData) {
      return res.status(404).json({ error: 'Shared content not found' });
    }

    // Increment views
    shareData.views++;

    res.json({
      success: true,
      type: shareData.type,
      content: shareData.content,
      metadata: {
        title: shareData.title,
        description: shareData.description,
        createdAt: shareData.createdAt,
        views: shareData.views,
        averageRating: shareData.averageRating,
        tags: shareData.tags,
      },
    });
  } catch (error) {
    console.error('[API] Get shared content error:', error);
    res.status(500).json({ error: 'Failed to get shared content' });
  }
});

/**
 * GET /api/share
 * Browse shared content
 */
app.get('/api/share', async (req, res) => {
  try {
    const { type, genre, sort = 'popular', page = 1 } = req.query;

    let items = Array.from(shared.values()).filter(item => item.public);

    // Filter by type
    if (type) {
      items = items.filter(item => item.type === type);
    }

    // Filter by genre
    if (genre && type === 'world') {
      items = items.filter(item => item.content.metadata?.genre === genre);
    }

    // Sort
    if (sort === 'popular') {
      items.sort((a, b) => b.views - a.views);
    } else if (sort === 'recent') {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'rating') {
      items.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Paginate
    const perPage = 20;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    res.json({
      success: true,
      worlds: paginatedItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        createdAt: item.createdAt,
        views: item.views,
        averageRating: item.averageRating,
        tags: item.tags,
      })),
      total: items.length,
      page: parseInt(page),
      pages: Math.ceil(items.length / perPage),
    });
  } catch (error) {
    console.error('[API] Browse shared content error:', error);
    res.status(500).json({ error: 'Failed to browse shared content' });
  }
});

/**
 * POST /api/share/:id/rate
 * Rate shared content
 */
app.post('/api/share/:id/rate', async (req, res) => {
  try {
    const shareId = req.params.id;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const shareData = shared.get(shareId);

    if (!shareData) {
      return res.status(404).json({ error: 'Shared content not found' });
    }

    shareData.ratings.push(rating);
    shareData.averageRating =
      shareData.ratings.reduce((a, b) => a + b, 0) / shareData.ratings.length;

    res.json({
      success: true,
      averageRating: shareData.averageRating,
      totalRatings: shareData.ratings.length,
    });
  } catch (error) {
    console.error('[API] Rate content error:', error);
    res.status(500).json({ error: 'Failed to rate content' });
  }
});

/**
 * POST /api/share/:id/report
 * Report inappropriate content
 */
app.post('/api/share/:id/report', async (req, res) => {
  try {
    const shareId = req.params.id;
    const { reason } = req.body;

    console.log(`[API] Content reported: ${shareId} - ${reason}`);

    // In production, store reports and implement moderation
    res.json({ success: true });
  } catch (error) {
    console.error('[API] Report content error:', error);
    res.status(500).json({ error: 'Failed to report content' });
  }
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/stats
 * Server statistics
 */
app.get('/api/stats', (req, res) => {
  res.json({
    users: users.size,
    saves: Array.from(saves.values()).reduce((total, userSaves) => total + userSaves.size, 0),
    sharedContent: shared.size,
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  await initStorage();

  app.listen(PORT, () => {
    console.log(`[API] Somnium API Server listening on port ${PORT}`);
    console.log(`[API] Health check: http://localhost:${PORT}/api/health`);
  });
}

start();

module.exports = app;
