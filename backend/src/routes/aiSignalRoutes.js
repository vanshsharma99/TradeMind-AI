import express from 'express';
import { 
  generateSignal, 
  getLatestSignal, 
  getSignalHistory 
} from '../controllers/aiSignalController.js';

const router = express.Router();

router.post('/generate-signal', generateSignal);
router.get('/latest-signal', getLatestSignal);
router.get('/history', getSignalHistory);

export default router;
