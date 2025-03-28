import { NextResponse } from 'next/server';
import { NseIndia } from 'stock-nse-india';

// Create instance of NseIndia with updated options
const nseIndia = new NseIndia();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Log the request for debugging
    console.log(`Fetching equity details for symbol: ${symbol}`);

    try {
      // Fetch both equity details and trade info
      const details = await nseIndia.getEquityDetails(symbol);

      try {
        // Add trade info to details object
        const tradeInfo = await nseIndia.getEquityTradeInfo(symbol);

        // Combine both responses
        const combinedData = {
          ...details,
          tradeInfo: tradeInfo
        };

        // Log data structure to help debug
        console.log('API Response Keys:', Object.keys(combinedData));

        // Log volume-related data locations
        console.log('Volume data locations found:', {
          priceInfoVolume: details.priceInfo?.totalTradedVolume,
          metadataVolume: details.metadata?.totalTradedVolume,
          marketDeptOrderBookVolume: combinedData.marketDeptOrderBook?.tradeInfo?.totalTradedVolume,
          tradeInfoVolume: tradeInfo?.marketDeptOrderBook?.tradeInfo?.totalTradedVolume,
          securityWiseDPVolume: tradeInfo?.securityWiseDP?.quantityTraded
        });

        // Return the combined data
        return NextResponse.json({ success: true, data: combinedData });
      } catch (tradeInfoError) {
        console.warn(`Error fetching trade info for ${symbol}:`, tradeInfoError);
        // If trade info fails, still return the equity details
        return NextResponse.json({ success: true, data: details });
      }
    } catch (apiError) {
      console.error(`Error from NSE API for ${symbol}:`, apiError);

      // Handle specific API errors
      const errorMessage = apiError.toString().includes('401')
        ? 'NSE API authentication failed - API service may have changed'
        : `Failed to fetch equity details for ${symbol}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching equity details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equity details' },
      { status: 500 }
    );
  }
}
