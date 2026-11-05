import { aiDecisionEngineService } from '../services/aiDecisionEngineService.js';

/**
 * POST /api/v1/ai/generate-signal
 * Triggers autonomous multi-step decision engine analysis
 */
export const generateSignal = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', interval = '1m' } = req.body;
    const signal = await aiDecisionEngineService.generateDecision(symbol, interval);

    return res.status(200).json({
      success: true,
      data: signal,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `AI Decision Engine failed: ${err.message}`,
    });
  }
};

/**
 * GET /api/v1/ai/latest-signal
 * Retrieves latest active signal for a given symbol
 */
export const getLatestSignal = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50' } = req.query;
    const signal = await aiDecisionEngineService.getLatestSignal(symbol);

    return res.status(200).json({
      success: true,
      data: signal,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch latest signal: ${err.message}`,
    });
  }
};

/**
 * GET /api/v1/ai/history
 * Returns historical signals with execution status
 */
export const getSignalHistory = async (req, res) => {
  try {
    const { symbol, limit = 20 } = req.query;
    const history = await aiDecisionEngineService.getSignalHistory(symbol, parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch signal history: ${err.message}`,
    });
  }
};
