import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let FeedResponse = null;
let isLoaded = false;

/**
 * Initializes and compiles the Protobuf schema
 */
export const initProtobuf = async () => {
  if (isLoaded && FeedResponse) {
    return FeedResponse;
  }

  const protoPath = path.resolve(__dirname, 'MarketDataFeed.proto');
  const root = await protobuf.load(protoPath);
  FeedResponse = root.lookupType('com.upstox.marketdatafeeder.rpc.proto.FeedResponse');
  isLoaded = true;
  return FeedResponse;
};

/**
 * Decodes a binary buffer into a JSON object using the Upstox Protobuf schema
 */
export const decodeProtobufFeed = async (buffer) => {
  if (!FeedResponse) {
    await initProtobuf();
  }

  try {
    const uint8Array = new Uint8Array(buffer);
    const decodedMessage = FeedResponse.decode(uint8Array);
    return FeedResponse.toObject(decodedMessage, {
      longs: Number,
      enums: String,
      bytes: String,
      defaults: true,
      arrays: true,
      objects: true,
      oneofs: true,
    });
  } catch (err) {
    throw new Error(`Protobuf Decoding Error: ${err.message}`);
  }
};

/**
 * Encodes a JSON object into a binary Protobuf buffer (Used for realistic test sandbox feed)
 */
export const encodeProtobufFeed = async (payload) => {
  if (!FeedResponse) {
    await initProtobuf();
  }

  try {
    const errMsg = FeedResponse.verify(payload);
    if (errMsg) throw new Error(`Protobuf verification failed: ${errMsg}`);

    const message = FeedResponse.create(payload);
    return FeedResponse.encode(message).finish();
  } catch (err) {
    throw new Error(`Protobuf Encoding Error: ${err.message}`);
  }
};

/**
 * Normalizes parsed feeds into a unified clean market tick structure
 */
export const normalizeFeedTick = (instrumentKey, feedData) => {
  let ltp = 0;
  let cp = 0;
  let volume = 0;
  let oi = 0;
  let timestamp = Date.now();
  let greeks = null;
  let depth = null;

  if (feedData.ltpc) {
    ltp = feedData.ltpc.ltp || 0;
    cp = feedData.ltpc.cp || 0;
    timestamp = feedData.ltpc.ltt || timestamp;
  }

  if (feedData.fullFeed?.indexFF) {
    const indexFF = feedData.fullFeed.indexFF;
    if (indexFF.ltpc) {
      ltp = indexFF.ltpc.ltp || ltp;
      cp = indexFF.ltpc.cp || cp;
    }
    timestamp = indexFF.timestamp || timestamp;
  }

  if (feedData.fullFeed?.marketFF) {
    const mff = feedData.fullFeed.marketFF;
    if (mff.ltpc) {
      ltp = mff.ltpc.ltp || ltp;
      cp = mff.ltpc.cp || cp;
    }
    volume = mff.volume || 0;
    oi = mff.oi || 0;
    timestamp = mff.timestamp || timestamp;

    if (mff.marketLevel?.bidAskQuote) {
      depth = mff.marketLevel.bidAskQuote;
    }
  }

  if (feedData.optionGreeks) {
    greeks = feedData.optionGreeks;
  }

  const change = cp > 0 ? Number((ltp - cp).toFixed(2)) : 0;
  const changePercent = cp > 0 ? Number(((change / cp) * 100).toFixed(2)) : 0;

  return {
    instrumentKey,
    ltp,
    closePrice: cp,
    change,
    changePercent,
    volume,
    oi,
    greeks,
    depth,
    timestamp,
  };
};
