import { NextResponse } from 'next/server';
import { NseIndia } from 'stock-nse-india';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'RELIANCE'; // Default to RELIANCE if no symbol provided

    console.log(`Debug endpoint - Fetching data for ${symbol}`);

    const nseIndia = new NseIndia();

    // Collect all available data for this symbol
    const results: Record<string, any> = {
      symbol,
      timestamp: new Date().toISOString(),
    };

    try {
      // Equity details - main data source
      const equityDetails = await nseIndia.getEquityDetails(symbol);
      results.equityDetails = equityDetails;

      // Log structure to console
      console.log('Equity Details Structure:', JSON.stringify({
        keys: Object.keys(equityDetails),
        infoKeys: Object.keys(equityDetails.info || {}),
        priceInfoKeys: Object.keys(equityDetails.priceInfo || {}),
        securityInfoKeys: Object.keys(equityDetails.securityInfo || {}),
        metadataKeys: Object.keys(equityDetails.metadata || {})
      }, null, 2));

      // Check if marketDeptOrderBook exists
      if (equityDetails.marketDeptOrderBook) {
        console.log('marketDeptOrderBook found, keys:',
                    Object.keys(equityDetails.marketDeptOrderBook));
      } else {
        console.log('marketDeptOrderBook not found in equityDetails');
      }

      // Extract some potentially relevant data specifically
      results.volumeLocations = {
        priceInfoVolume: equityDetails.priceInfo?.totalTradedVolume,
        metadataVolume: equityDetails.metadata?.totalTradedVolume,
        marketDeptOrderBookVolume: equityDetails.marketDeptOrderBook?.tradeInfo?.totalTradedVolume
      };

      results.tradedValueLocations = {
        priceInfoValue: equityDetails.priceInfo?.totalTradedValue,
        metadataValue: equityDetails.metadata?.totalTradedValue,
        marketDeptOrderBookValue: equityDetails.marketDeptOrderBook?.tradeInfo?.totalTradedValue
      };

      results.peRatioLocations = {
        securityInfoPE: equityDetails.securityInfo?.pe,
        metadataPdSymbolPe: equityDetails.metadata?.pdSymbolPe,
        infoPE: equityDetails.info?.pe
      };
    } catch (equityError) {
      console.error(`Error fetching equity details: ${equityError}`);
      results.equityDetailsError = `${equityError}`;
    }

    try {
      // Trade info - may contain volume data
      const tradeInfo = await nseIndia.getEquityTradeInfo(symbol);
      results.tradeInfo = tradeInfo;

      // Log structure
      console.log('Trade Info Structure:',
                  Object.keys(tradeInfo || {}));

      // Check for volume-related data
      if (tradeInfo?.marketDeptOrderBook?.tradeInfo) {
        console.log('Trade Info volume data:',
                    tradeInfo.marketDeptOrderBook.tradeInfo);
      }
    } catch (tradeError) {
      console.error(`Error fetching trade info: ${tradeError}`);
      results.tradeInfoError = `${tradeError}`;
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: `Debug endpoint error: ${error}`
    }, { status: 500 });
  }
}
