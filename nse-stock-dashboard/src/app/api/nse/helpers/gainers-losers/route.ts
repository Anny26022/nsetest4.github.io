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

// Helper function to get gainers and losers
async function getGainersAndLosers(indexSymbol: string) {
  try {
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

    // Filter and sort gainers (stocks with positive change)
    const gainers = stocks
      .filter(stock => stock.pChange > 0)
      .sort((a, b) => b.pChange - a.pChange)
      .slice(0, 10);

    // Filter and sort losers (stocks with negative change)
    const losers = stocks
      .filter(stock => stock.pChange < 0)
      .sort((a, b) => a.pChange - b.pChange)
      .slice(0, 10);

    return { gainers, losers };
  } catch (error) {
    console.error('Error processing gainers and losers:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index') || 'NIFTY 50';

    const gainersAndLosers = await getGainersAndLosers(index);
    
    // Create response with cache control headers optimized for SWR
    const response = NextResponse.json(
      { 
        success: true, 
        data: gainersAndLosers,
        timestamp: new Date().toISOString() 
      },
      {
        headers: {
          'Cache-Control': `s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  } catch (error: unknown) {
    console.error(`Error fetching gainers and losers:`, error);

    const errorMessage = error instanceof Error && error.message.includes('401')
      ? 'NSE API authentication failed'
      : error instanceof Error && error.message
        ? error.message
        : 'Failed to fetch gainers and losers';

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
