import { NextResponse } from 'next/server';
import { NseIndia } from 'stock-nse-india';

// Create instance of NseIndia
const nseIndia = new NseIndia();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const isPreOpen = searchParams.get('isPreOpen') === 'true';

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching intraday data for ${symbol}${isPreOpen ? ' (pre-open)' : ''}`);

    try {
      // Fetch intraday data
      const data = await nseIndia.getEquityIntradayData(symbol, isPreOpen);
      console.log(`Successfully fetched intraday data for ${symbol}`);

      return NextResponse.json({ success: true, data });
    } catch (apiError) {
      console.error(`Error from NSE API for intraday data for ${symbol}:`, apiError);

      // Handle specific API errors
      const errorMessage = apiError.toString().includes('401')
        ? 'NSE API authentication failed - API service may have changed'
        : `Failed to fetch intraday data for ${symbol}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch intraday data' },
      { status: 500 }
    );
  }
}
