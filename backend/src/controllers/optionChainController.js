import { optionChainService } from '../services/optionChainService.js';

export const getOptionChain = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', expiry } = req.query;
    const data = await optionChainService.getOptionChain(symbol, expiry);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch option chain: ${err.message}`,
    });
  }
};

export const getAvailableExpiries = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50' } = req.query;
    const expiries = await optionChainService.getAvailableExpiries(symbol);

    return res.status(200).json({
      success: true,
      symbol,
      expiries,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getOptionAnalytics = async (req, res) => {
  try {
    const { symbol = 'NSE_INDEX|Nifty 50', expiry } = req.query;
    const chain = await optionChainService.getOptionChain(symbol, expiry);

    return res.status(200).json({
      success: true,
      data: chain.analytics,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
