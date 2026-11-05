import express from 'express';
import { 
  getIndicators, 
  getConfluence, 
  getIndicatorSeries 
} from '../controllers/indicatorController.js';

const router = express.Router();

router.get('/', getIndicators);
router.get('/confluence', getConfluence);
router.get('/series', getIndicatorSeries);

export default router;
