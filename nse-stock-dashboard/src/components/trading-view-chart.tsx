'use client';

import { useEffect, useRef } from 'react';

// Track if the library script is loading
let tvScriptLoadingPromise: Promise<void> | null = null;

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number;
  width?: string | number;
  exchange?: 'NSE' | 'BSE';
}

export default function TradingViewChart({ 
  symbol, 
  theme = 'light',
  autosize = true,
  height = 500,
  width = '100%',
  exchange = 'NSE'
}: TradingViewChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const loadTradingViewScript = () => {
      if (!tvScriptLoadingPromise) {
        tvScriptLoadingPromise = new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.id = 'tradingview-widget-loading-script';
          script.src = 'https://s3.tradingview.com/tv.js';
          script.type = 'text/javascript';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      return tvScriptLoadingPromise;
    };

    const createSimpleWidget = () => {
      if (chartRef.current && 'TradingView' in window) {
        // Clear previous chart if any
        chartRef.current.innerHTML = '';
        
        // Create unique container ID for this chart
        const containerId = `tradingview-widget-${exchange}-${symbol}`;
        const container = document.createElement('div');
        container.id = containerId;
        container.style.height = '100%';
        container.style.width = '100%';
        chartRef.current.appendChild(container);
        
        try {
          // Create a simple widget
          const widget = new (window as any).TradingView.widget({
            autosize: true, // Always use autosize for better responsiveness
            symbol: `${exchange}:${symbol}`,
            interval: 'D',
            timezone: 'Asia/Kolkata',
            theme: theme,
            style: '1', // Candlestick chart style
            locale: 'in',
            toolbar_bg: theme === 'dark' ? '#2a2e39' : '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: containerId,
            hide_side_toolbar: true,
            hide_top_toolbar: false,
            withdateranges: true,
            save_image: false,
            show_popup_button: false,
            // Enable persistent settings
            saved_data: localStorage.getItem(`tradingview_settings_${exchange}_${symbol}`),
            
            // Simple default studies
            studies: [
              'MASimple@tv-basicstudies', // Simple moving average
            ],
            
            studies_overrides: {
              "volume.volume.color.0": "#26a69a", // Green volume bars
              "volume.volume.color.1": "#ef5350", // Red volume bars
              "volume.volume.transparency": 50,
              "volume.show ma": false,
              "MASimple.plot.color": "#2196F3", // Blue line
              "MASimple.plot.linewidth": 2,
            },
            
            // Chart appearance
            overrides: {
              // Candlestick colors and appearance
              "mainSeriesProperties.candleStyle.upColor": "#26a69a", // Green candles
              "mainSeriesProperties.candleStyle.downColor": "#ef5350", // Red candles
              "mainSeriesProperties.candleStyle.drawWick": true,
              "mainSeriesProperties.candleStyle.drawBorder": true,
              "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
              "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
              "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
              "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
              // Chart appearance
              "paneProperties.background": theme === 'dark' ? "#131722" : "#ffffff",
              "paneProperties.vertGridProperties.color": theme === 'dark' ? "#363c4e" : "#e0e3eb",
              "paneProperties.horzGridProperties.color": theme === 'dark' ? "#363c4e" : "#e0e3eb",
              "scalesProperties.textColor": theme === 'dark' ? "#d1d4dc" : "#333",
              "scalesProperties.lineColor": theme === 'dark' ? "#363c4e" : "#e0e3eb",
              // Volume panel
              "volumePaneSize": 20, // Size of volume panel at bottom
              // Right margin - make it smaller to show more price data
              "rightOffset": 3,
              "leftOffset": 3,
              // Improve price scale visibility
              "scalesProperties.showLeftScale": false,
              "scalesProperties.showRightScale": true,
              "scalesProperties.fontSize": 12,
            },
            
            // Disable most features to keep it simple
            disabled_features: [
              "header_symbol_search",
              "header_compare",
              "header_undo_redo",
              "header_saveload",
              "use_localstorage_for_settings",
              "header_indicators",
              "header_chart_type",
              "header_settings",
              "header_screenshot",
              "header_fullscreen_button",
              "timeframes_toolbar",
              "show_interval_dialog_on_key_press",
              "chart_crosshair_menu",
              "display_market_status",
              "context_menus",
              "edit_buttons_in_legend",
              "border_around_the_chart",
              "control_bar",
            ],
            
            // Enable only essential features
            enabled_features: [
              "move_logo_to_main_pane",
              "create_volume_indicator_by_default",
              "volume_force_overlay",
              "save_chart_properties_to_local_storage",
            ],
            
            // Save user settings when chart is modified
            onChartReady: function() {
              const widget = (window as any).tvWidget;
              if (widget) {
                widget.subscribe('onAutoSaveNeeded', function() {
                  widget.save(function(data: string) {
                    localStorage.setItem(`tradingview_settings_${exchange}_${symbol}`, data);
                  });
                });
              }
            }
          });
          
          // Save reference to the widget
          widgetRef.current = widget;
          
        } catch (error) {
          console.error('Error creating TradingView chart:', error);
        }
      }
    };

    // Load the script first
    loadTradingViewScript().then(() => {
      // Create the widget
      createSimpleWidget();
    });

    // Cleanup function
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
          widgetRef.current = null;
        } catch (e) {
          console.error('Error removing TradingView widget:', e);
        }
      }
    };
  }, [symbol, theme, autosize, height, width, exchange]);

  return (
    <div className="tradingview-chart-container" style={{ width: '100%', height: '100%' }}>
      <div 
        ref={chartRef}
        style={{ 
          height: '100%',
          width: '100%',
          margin: 0,
        }} 
      />
    </div>
  );
}
