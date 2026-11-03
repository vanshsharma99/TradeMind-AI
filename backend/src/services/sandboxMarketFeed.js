import { encodeProtobufFeed } from '../websocket/protobuf/protobufDecoder.js';

let intervalTimer = null;
let niftyPrice = 24530.50;
let bankNiftyPrice = 52180.25;

/**
 * Generates an authentic binary Protobuf buffer containing simulated NIFTY and BANKNIFTY ticks
 */
export const generateSimulatedProtobufTick = async () => {
  // Realistic tick jitter (-0.08% to +0.08%)
  const niftyDelta = Number(((Math.random() - 0.49) * 4).toFixed(2));
  const bankNiftyDelta = Number(((Math.random() - 0.49) * 12).toFixed(2));

  niftyPrice = Math.max(20000, Number((niftyPrice + niftyDelta).toFixed(2)));
  bankNiftyPrice = Math.max(40000, Number((bankNiftyPrice + bankNiftyDelta).toFixed(2)));

  const now = Date.now();

  const payload = {
    type: 1, // live_feed
    currentTs: now,
    feeds: {
      'NSE_INDEX|Nifty 50': {
        fullFeed: {
          indexFF: {
            ltpc: {
              ltp: niftyPrice,
              ltt: now,
              ltq: 50,
              cp: 24480.00,
            },
            marketOHLC: {
              ohlc: [
                {
                  interval: '1d',
                  open: 24490.00,
                  high: 24590.00,
                  low: 24450.00,
                  close: 24480.00,
                  volume: 12500000,
                  ts: now,
                },
              ],
            },
            timestamp: now,
          },
        },
      },
      'NSE_INDEX|Nifty Bank': {
        fullFeed: {
          indexFF: {
            ltpc: {
              ltp: bankNiftyPrice,
              ltt: now,
              ltq: 15,
              cp: 52050.00,
            },
            marketOHLC: {
              ohlc: [
                {
                  interval: '1d',
                  open: 52080.00,
                  high: 52350.00,
                  low: 51980.00,
                  close: 52050.00,
                  volume: 8400000,
                  ts: now,
                },
              ],
            },
            timestamp: now,
          },
        },
      },
    },
  };

  const buffer = await encodeProtobufFeed(payload);
  return { buffer, isSimulated: true };
};

/**
 * Starts generating simulated Protobuf binary ticks
 */
export const startSandboxFeed = (onTickCallback, intervalMs = 1000) => {
  stopSandboxFeed();

  console.log('[Market Feed] 🧪 Sandbox Protobuf Tick Generator started (1 Hz tick stream)');

  intervalTimer = setInterval(async () => {
    try {
      const { buffer, isSimulated } = await generateSimulatedProtobufTick();
      if (onTickCallback) {
        onTickCallback(buffer, isSimulated);
      }
    } catch (err) {
      console.error('[Sandbox Feed Error]', err.message);
    }
  }, intervalMs);
};

export const stopSandboxFeed = () => {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('[Market Feed] 🧪 Sandbox Protobuf Tick Generator stopped');
  }
};
