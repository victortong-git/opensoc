const express = require('express');
const router = express.Router();
const {
  // Tactics
  getMitreTactics,
  getMitreTacticById,
  createMitreTactic,
  
  // Techniques
  getMitreTechniques,
  getMitreTechniqueById,
  createMitreTechnique,
  
  // Procedures
  getMitreProcedures,
  getMitreProcedureById,
  createMitreProcedure,
  updateMitreProcedure,
  deleteMitreProcedure,
  
  // Statistics
  getTTPStats,
} = require('../controllers/ttp.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// TTP Statistics
router.get('/stats', getTTPStats);

// MITRE Tactics routes
router.get('/tactics', getMitreTactics);
router.get('/tactics/:id', getMitreTacticById);
router.post('/tactics', createMitreTactic);

// MITRE Techniques routes
router.get('/techniques', getMitreTechniques);
router.get('/techniques/:id', getMitreTechniqueById);
router.post('/techniques', createMitreTechnique);

// MITRE Procedures routes
router.get('/procedures', getMitreProcedures);
router.get('/procedures/:id', getMitreProcedureById);
router.post('/procedures', createMitreProcedure);
router.put('/procedures/:id', updateMitreProcedure);
router.delete('/procedures/:id', deleteMitreProcedure);

module.exports = router;