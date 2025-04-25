import express from 'express';
import graphController from '../controllers/graphController.js';

const router = express.Router();

// Grafik oluşturma ve getirme
router.post('/graph', graphController.createGraph);
router.get('/graph', graphController.getConceptNetwork);

// Kavram ilişkileri
router.get('/concepts/:concept/relations', graphController.getConceptRelations);

// Kavram karşılaştırma
router.post('/concepts/compare', graphController.compareConcepts);

export default router; 