import { NseIndia } from 'stock-nse-india';
import { NextResponse } from 'next/server';
import { NseApiResponse, NseStockData, IndexEquityInfo } from '@/types/nse';

// Create a new instance of NseIndia
const nseIndia = new NseIndia();

// Cache duration in seconds (1 minute)
const CACHE_DURATION = 60;

// Helper function to normalize number values
function normalizeNumber(value: number | string | undefined): number {
  if (typeof value === 'undefined') return 0;
  if (typeof value === 'number') return value;
  // Remove commas and convert to number
  return Number(value.toString().replace(/,/g, '')) || 0;
}

// Helper function to format volume with Indian number system
function formatVolume(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

// Helper function to format value in crores
function formatValueInCrores(value: number): string {
  return (value / 10000000).toFixed(2);
}

async function getMostActive(indexSymbol: string) {
  try {
    // Get most active stocks using the equity indices data
    const response = await nseIndia.getEquityStockIndices(indexSymbol);
    const apiResponse = response as unknown as NseApiResponse;

    if (!apiResponse?.data?.length) {
      throw new Error('No data available from NSE API');
    }

    // Process all stocks
    const stocks = apiResponse.data.map((stock: NseStockData): IndexEquityInfo => {
      // Get raw values and normalize them
      const turnoverValue = normalizeNumber(stock.totalTradedValue || stock.turnover);
      const volumeValue = normalizeNumber(stock.totalTradedVolume || stock.tradedQuantity || stock.volume);

      return {
        symbol: stock.symbol,
        series: stock.series || 'EQ',
        ltp: normalizeNumber(stock.lastPrice || stock.ltp),
        change: normalizeNumber(stock.change),
        pChange: normalizeNumber(stock.pChange),
        tradedQuantity: formatVolume(volumeValue),
        turnover: formatValueInCrores(turnoverValue),
        previousClose: normalizeNumber(stock.previousClose),
        dayHigh: normalizeNumber(stock.dayHigh || stock.high),
        dayLow: normalizeNumber(stock.dayLow || stock.low)
      };
    });

    // Sort by value (turnover)
    const byValue = [...stocks]
      .sort((a, b) => {
        const valueA = normalizeNumber(a.turnover);
        const valueB = normalizeNumber(b.turnover);
        return valueB - valueA;
      })
      .slice(0, 10);

    // Sort by volume (traded quantity)
    const byVolume = [...stocks]
      .sort((a, b) => {
        const volumeA = normalizeNumber(a.tradedQuantity);
        const volumeB = normalizeNumber(b.tradedQuantity);
        return volumeB - volumeA;
      })
      .slice(0, 10);

    return { byValue, byVolume };
  } catch (error) {
    console.error('Error processing most active equities:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index') || 'NIFTY 50';

    const mostActive = await getMostActive(index);
    
    // Create response with cache control headers
    const response = NextResponse.json(
      { success: true, data: mostActive },
      {
        headers: {
          'Cache-Control': `s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  } catch (error: unknown) {
    console.error(`Error fetching most active equities:`, error);

    const errorMessage = error instanceof Error && error.message.includes('401')
      ? 'NSE API authentication failed'
      : error instanceof Error && error.message
        ? error.message
        : 'Failed to fetch most active equities';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { 
        status: error instanceof Error && error.message.includes('401') ? 401 : 500,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
