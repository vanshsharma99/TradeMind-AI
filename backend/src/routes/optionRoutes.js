import express from 'express';
import {
  getOptionChain,
  getAvailableExpiries,
  getOptionAnalytics,
} from '../controllers/optionChainController.js';

const router = express.Router();

router.get('/chain', getOptionChain);
router.get('/expiries', getAvailableExpiries);
router.get('/analytics', getOptionAnalytics);

export default router;
