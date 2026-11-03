import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  HistogramSeries, 
  ColorType, 
  CrosshairMode 
} from 'lightweight-charts';

export default function TradingViewChart({ 
  candles = [], 
  symbol = 'NIFTY 50', 
  interval = '1m',
  height = 380 
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Initialize Chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E14' },
        textColor: '#8892B0',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#161E2E' },
        horzLines: { color: '#161E2E' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1E2638',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#1E2638',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    // Filter duplicates and sort ascending
    const uniqueMap = new Map();
    candles.forEach((c) => {
      uniqueMap.set(c.time, c);
    });

    const sortedCandles = Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);

    const candleData = sortedCandles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = sortedCandles.map((c) => ({
      time: c.time,
      value: c.volume || 100,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    }));

    try {
      candleSeriesRef.current.setData(candleData);
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData);
      }
      chartRef.current?.timeScale().fitContent();
    } catch (err) {
      console.warn('[TradingView Chart Data Warning]', err.message);
    }
  }, [candles]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#1E2638] bg-[#0B0E14]">
      {/* Top Chart Header / Watermark */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center space-x-2">
        <span className="text-xs font-bold font-mono text-white tracking-wider">
          {symbol.replace('NSE_INDEX|', '')}
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A2234] text-blue-400 border border-blue-500/20">
          {interval}
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          TradingView Lightweight Charts™
        </span>
      </div>

      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
