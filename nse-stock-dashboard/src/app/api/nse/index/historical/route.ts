import { NextResponse } from 'next/server';
import { NseIndia } from 'stock-nse-india';

// Create instance of NseIndia
const nseIndia = new NseIndia();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!index) {
      return NextResponse.json(
        { success: false, error: 'Index parameter is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching historical data for index: ${index} from ${startDate} to ${endDate}`);

    try {
      // Create date range object for the API
      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };

      // Get data from NSE API
      const data = await nseIndia.getIndexHistoricalData(index, dateRange);
      console.log(`Successfully fetched index historical data`);

      // Normalize the data structure
      let normalizedData;

      if (Array.isArray(data)) {
        normalizedData = {
          data,
          meta: {
            fromDate: startDate,
            toDate: endDate,
            indexName: index
          }
        };
      } else if (data && typeof data === 'object') {
        // The data might be in a different format
        // Look for array properties that might contain historical data
        const dataKeys = ['data', 'candles', 'records', 'history'];
        let foundData = null;

        for (const key of dataKeys) {
          if (data[key] && Array.isArray(data[key])) {
            foundData = data[key];
            console.log(`Found historical data array in key: ${key} with ${foundData.length} items`);
            break;
          }
        }

        if (foundData) {
          normalizedData = {
            data: foundData,
            meta: data.meta || {
              fromDate: startDate,
              toDate: endDate,
              indexName: index
            }
          };
        } else {
          // Use the data as is
          normalizedData = data;
        }
      } else {
        normalizedData = {
          data: [],
          meta: {
            fromDate: startDate,
            toDate: endDate,
            indexName: index
          }
        };
      }

      return NextResponse.json({ success: true, data: normalizedData });
    } catch (apiError) {
      console.error(`Error from NSE API for index ${index}:`, apiError);

      // Handle specific API errors
      const errorMessage = apiError.toString().includes('401')
        ? 'NSE API authentication failed - API service may have changed'
        : `Failed to fetch historical data for index ${index}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching index historical data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch index historical data' },
      { status: 500 }
    );
  }
}
