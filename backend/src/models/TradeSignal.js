import mongoose from 'mongoose';

const tradeSignalSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['BUY_CALL', 'BUY_PUT', 'NO_TRADE'],
      required: true,
    },
    instrument: {
      type: String,
      required: true,
    },
    expiry: {
      type: String,
      required: true,
    },
    strikePrice: {
      type: Number,
      required: true,
    },
    spotPriceAtSignal: {
      type: Number,
      required: true,
    },
    entryMin: {
      type: Number,
      required: true,
    },
    entryMax: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    riskReward: {
      type: Number,
      required: true,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    timeHorizon: {
      type: String,
      enum: ['INTRADAY', 'SCALP', 'SWING'],
      default: 'INTRADAY',
    },
    technicalConfluence: {
      rsi: Number,
      emaCross: String,
      emaSpread: Number,
      vwapPosition: String,
      macdMomentum: String,
      volumeStatus: String,
      pcr: Number,
      maxPain: Number,
    },
    detailedReasoning: {
      type: String,
      required: true,
    },
    riskWarning: {
      type: String,
      default: '',
    },
    modelUsed: {
      type: String,
      default: 'quantitative-deterministic-agent',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TARGET_HIT', 'STOPLOSS_HIT', 'EXPIRED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const TradeSignal = mongoose.model('TradeSignal', tradeSignalSchema);
