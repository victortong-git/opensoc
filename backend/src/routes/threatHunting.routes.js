const express = require('express');
const router = express.Router();
const {
  // New simplified methods
  getThreatHunts,
  getThreatHuntById,
  createThreatHunt,
  updateThreatHunt,
  deleteThreatHunt,
  getThreatHuntingStats,
  getHuntTypes,
  cloneThreatHunt,
  
  // TTP management
  addHuntTTPs,
  getHuntTTPs,
  
  // Report management
  generateHuntReport,
  getHuntReports,
  
  // AI enhancement
  enhanceThreatHuntContent,
  
  // MITRE ATTACK enhancement
  enhanceThreatHuntWithMitre,
  getMitreEnhancement,
  clearMitreEnhancement,
  
  // Backwards compatibility aliases
  getThreatHuntingEvents,
  getThreatHuntingEventById,
  createThreatHuntingEvent,
  updateThreatHuntingEvent,
  deleteThreatHuntingEvent,
  cloneThreatHuntingEvent,
  
  // Legacy methods to maintain
  // getAssetsForHunting,  // TODO: Implement
  // getMitreTechniquesForHunting,  // TODO: Implement
  // enhanceAllThreatHuntContent,  // TODO: Implement
} = require('../controllers/threatHunting.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// === NEW PROFESSIONAL THREAT HUNTING ROUTES ===

// Hunt metadata and types
router.get('/types', getHuntTypes);
router.get('/stats', getThreatHuntingStats);

// Core hunt management (new simplified API)
router.get('/hunts', getThreatHunts);
router.get('/hunts/:id', getThreatHuntById);
router.post('/hunts', createThreatHunt);
router.put('/hunts/:id', updateThreatHunt);
router.delete('/hunts/:id', deleteThreatHunt);
router.post('/hunts/:id/clone', cloneThreatHunt);

// TTP management for MITRE ATT&CK integration
router.get('/hunts/:id/ttps', getHuntTTPs);
router.post('/hunts/:id/ttps', addHuntTTPs);

// Professional reporting
router.get('/hunts/:id/reports', getHuntReports);
router.post('/hunts/:id/reports', generateHuntReport);

// AI enhancement
router.post('/hunts/:id/enhance-content', enhanceThreatHuntContent);

// MITRE ATTACK enhancement with tool calling
router.post('/hunts/:id/mitre-enhance', enhanceThreatHuntWithMitre);
router.get('/hunts/:id/mitre-enhance', getMitreEnhancement);
router.delete('/hunts/:id/mitre-enhance', clearMitreEnhancement);

// === BACKWARDS COMPATIBILITY ROUTES ===
// Legacy threat hunting events API (aliases to new methods)
router.get('/', getThreatHuntingEvents);
// router.get('/assets', getAssetsForHunting);  // TODO: Implement
// router.get('/mitre-techniques', getMitreTechniquesForHunting);  // TODO: Implement  
router.post('/', createThreatHuntingEvent);
router.post('/:id/clone', cloneThreatHuntingEvent);
// router.post('/:id/enhance-all-content', enhanceAllThreatHuntContent);  // TODO: Implement
router.put('/:id', updateThreatHuntingEvent);
router.delete('/:id', deleteThreatHuntingEvent);

// IMPORTANT: Keep broad /:id route LAST to avoid conflicts with specific routes above
router.get('/:id', getThreatHuntingEventById);

module.exports = router;