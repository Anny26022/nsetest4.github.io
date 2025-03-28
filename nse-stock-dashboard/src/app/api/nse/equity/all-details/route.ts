import { NseIndia } from 'stock-nse-india';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Parse symbols from query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const limitParam = searchParams.get('limit');

    const limit = limitParam ? parseInt(limitParam, 10) : 15; // Default to 15 symbols

    const nseIndia = new NseIndia();

    // Get all symbols if none are specified
    let symbols: string[] = [];

    if (symbolsParam) {
      // If symbols are provided, parse and use them
      symbols = symbolsParam.split(',').map(s => s.trim());
    } else {
      // Otherwise, get all symbols and limit them
      const allSymbols = await nseIndia.getAllStockSymbols();
      symbols = allSymbols.slice(0, limit);
    }

    // Fetch details for each symbol
    const detailsPromises = symbols.map(async (symbol) => {
      try {
        const details = await nseIndia.getEquityDetails(symbol);

        // Extract only the required data we need - symbol, volume, traded value, VWAP, PE ratio
        return {
          symbol: details.info.symbol,
          companyName: details.info.companyName,
          tradingVolume: details.priceInfo?.totalTradedVolume ||
                        (details.metadata?.totalTradedVolume ? parseInt(details.metadata.totalTradedVolume) : undefined),
          tradedValue: details.priceInfo?.totalTradedValue,
          vwap: details.priceInfo?.vwap,
          peRatio: details.securityInfo?.pe || details.metadata?.pdSymbolPe,
          lastPrice: details.priceInfo?.lastPrice,
          change: details.priceInfo?.change,
          pChange: details.priceInfo?.pChange,
          series: details.info?.series || details.metadata?.series
        };
      } catch (error) {
        console.error(`Error fetching details for ${symbol}:`, error);
        return {
          symbol,
          error: 'Failed to fetch details'
        };
      }
    });

    const results = await Promise.all(detailsPromises);

    return Response.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in all equity details API:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch equity details',
    }, { status: 500 });
  }
}
