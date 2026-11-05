import { aiDecisionEngineService } from './services/aiDecisionEngineService.js';
import { TradeSignal } from './models/TradeSignal.js';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

const runAiAgentTests = async () => {
  await connectDB();
  console.log('\n--- 🧪 Starting Phase 8 AI Decision Engine Verification Tests ---');

  try {
    // -------------------------------------------------------------
    // Test 1: Consolidated Market Context Aggregation
    // -------------------------------------------------------------
    console.log('[Test 1] Gathering multi-modal market context (Indicators + Option Chain)...');
    const context = await aiDecisionEngineService.gatherMarketContext('NSE_INDEX|Nifty 50', '1m');
    console.log('Context Aggregated:', {
      symbol: context.symbol,
      spotPrice: context.spotPrice,
      rsi: context.indicators?.rsi?.value,
      emaTrend: context.indicators?.ema?.trend,
      confluenceScore: context.confluence?.score,
      pcr: context.optionAnalytics?.pcr,
      expiryDate: context.expiryDate,
      strikesCount: context.strikes?.length,
    });

    if (!context.symbol || !context.spotPrice || !context.confluence) {
      throw new Error('Market context missing required analytical components');
    }
    console.log('✅ Test 1 Passed: Real-time multi-modal market context aggregated.');

    // -------------------------------------------------------------
    // Test 2: Risk:Reward Mathematical Guardrails
    // -------------------------------------------------------------
    console.log('\n[Test 2] Testing institutional Risk:Reward mathematical validator...');
    
    // Case A: High R:R trade (Risk 20 pts, Reward 40 pts -> R:R 2.0 -> Should Pass)
    const validTrade = aiDecisionEngineService.evaluateRiskReward(150, 130, 190);
    console.log('Valid Trade Evaluation:', validTrade);
    if (!validTrade.valid || validTrade.ratio !== 2.0) {
      throw new Error('Risk-reward validator failed to approve valid 2.0 R:R trade');
    }

    // Case B: Substandard R:R trade (Risk 20 pts, Reward 20 pts -> R:R 1.0 -> Should Reject)
    const invalidTrade = aiDecisionEngineService.evaluateRiskReward(150, 130, 170);
    console.log('Invalid Trade Evaluation:', invalidTrade);
    if (invalidTrade.valid || invalidTrade.ratio !== 1.0) {
      throw new Error('Risk-reward validator failed to reject substandard 1.0 R:R trade');
    }
    console.log('✅ Test 2 Passed: Risk:Reward guardrails (>= 1:1.5) mathematically verified.');

    // -------------------------------------------------------------
    // Test 3: Autonomous Trade Setup & Thesis Generation
    // -------------------------------------------------------------
    console.log('\n[Test 3] Deriving structured trade setup & narrative thesis...');
    const setup = aiDecisionEngineService.deriveTradeSetup(context);
    console.log('Derived Trade Setup:', {
      action: setup.action,
      instrument: setup.instrument,
      strikePrice: setup.strikePrice,
      entryRange: `[${setup.entryMin}, ${setup.entryMax}]`,
      stopLoss: setup.stopLoss,
      target: setup.target,
      riskReward: setup.riskReward,
      confidenceScore: setup.confidenceScore,
    });

    if (!setup.action || !['BUY_CALL', 'BUY_PUT', 'NO_TRADE'].includes(setup.action)) {
      throw new Error(`Invalid action derived: ${setup.action}`);
    }

    const thesis = await aiDecisionEngineService.generateAiThesis(setup, context);
    console.log('Agent Thesis Output:', {
      modelUsed: thesis.modelUsed,
      detailedReasoning: thesis.detailedReasoning.substring(0, 120) + '...',
      riskWarning: thesis.riskWarning,
    });

    if (!thesis.detailedReasoning || !thesis.modelUsed) {
      throw new Error('AI Agent failed to produce structured narrative thesis');
    }
    console.log('✅ Test 3 Passed: Structured setup and AI thesis generated successfully.');

    // -------------------------------------------------------------
    // Test 4: End-to-End Decision Generation & MongoDB Persistence
    // -------------------------------------------------------------
    console.log('\n[Test 4] Generating full decision document and persisting to MongoDB...');
    const savedSignal = await aiDecisionEngineService.generateDecision('NSE_INDEX|Nifty 50');
    console.log('Persisted TradeSignal Document:', {
      id: savedSignal._id,
      symbol: savedSignal.symbol,
      action: savedSignal.action,
      instrument: savedSignal.instrument,
      entryRange: `[${savedSignal.entryMin}, ${savedSignal.entryMax}]`,
      sl: savedSignal.stopLoss,
      target: savedSignal.target,
      rr: savedSignal.riskReward,
      confidence: savedSignal.confidenceScore,
      modelUsed: savedSignal.modelUsed,
      createdAt: savedSignal.createdAt,
    });

    if (!savedSignal._id || savedSignal.symbol !== 'NSE_INDEX|Nifty 50') {
      throw new Error('Failed to persist valid TradeSignal to MongoDB');
    }
    console.log('✅ Test 4 Passed: Autonomous decision persisted in MongoDB TradeSignal collection.');

    // -------------------------------------------------------------
    // Test 5: Retrieval & Historical Querying
    // -------------------------------------------------------------
    console.log('\n[Test 5] Querying latest signal and historical signals log...');
    const latest = await aiDecisionEngineService.getLatestSignal('NSE_INDEX|Nifty 50');
    const history = await aiDecisionEngineService.getSignalHistory('NSE_INDEX|Nifty 50', 5);
    console.log(`Latest Signal Action: ${latest.action}, History Log Count: ${history.length}`);

    if (!latest || history.length === 0) {
      throw new Error('Failed to retrieve signals from history');
    }
    console.log('✅ Test 5 Passed: Signal retrieval and historical ledger operational.');

    // -------------------------------------------------------------
    // Test 6: REST API Endpoint GET /api/v1/ai/latest-signal
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing REST API GET /api/v1/ai/latest-signal...');
    const res = await fetch('http://localhost:5000/api/v1/ai/latest-signal?symbol=NSE_INDEX|Nifty 50');
    const json = await res.json();
    console.log('REST API Response Status:', json.success, 'Action:', json.data?.action);

    if (!json.success || !json.data?.action) {
      throw new Error('AI Signal REST API returned invalid response');
    }
    console.log('✅ Test 6 Passed: AI Signal REST API endpoints operational.');

    console.log('\n🎉 ALL PHASE 8 AI DECISION ENGINE TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Phase 8 Test Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runAiAgentTests();
