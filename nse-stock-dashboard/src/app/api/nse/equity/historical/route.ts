import { NseIndia } from 'stock-nse-india';
import { NextResponse } from 'next/server';

const nseIndia = new NseIndia();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching historical data for ${symbol} from ${startDate} to ${endDate}`);

    let dateRange = undefined;

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    try {
      const data = await nseIndia.getEquityHistoricalData(symbol, dateRange);

      // The API sometimes returns different response structures
      // Try to normalize the structure
      let normalizedData;

      if (Array.isArray(data)) {
        // Handle case where response is an array
        console.log(`Data is an array with ${data.length} items`);

        // Check if the first item has a data property that is an array
        if (data[0] && data[0].data && Array.isArray(data[0].data)) {
          normalizedData = {
            data: data[0].data,
            meta: data[0].meta || {
              fromDate: startDate || '',
              toDate: endDate || '',
              series: [],
              symbols: [symbol]
            }
          };
        } else {
          // If it's just an array of historical records
          normalizedData = {
            data: data,
            meta: {
              fromDate: startDate || '',
              toDate: endDate || '',
              series: [],
              symbols: [symbol]
            }
          };
        }
      } else if (data && data.data && Array.isArray(data.data)) {
        // Standard response format
        normalizedData = data;
      } else if (data && typeof data === 'object') {
        // Some other object format, try to extract data
        console.log(`Received object data format with keys: ${Object.keys(data).join(', ')}`);

        // Look for array properties that might contain historical data
        const dataKeys = ['data', 'candles', 'records', 'history'];
        let foundData = null;

        for (const key of dataKeys) {
          if (data[key] && Array.isArray(data[key])) {
            foundData = data[key];
            console.log(`Found data array in key: ${key} with ${foundData.length} items`);
            break;
          }
        }

        if (foundData) {
          normalizedData = {
            data: foundData,
            meta: {
              fromDate: startDate || '',
              toDate: endDate || '',
              series: [],
              symbols: [symbol]
            }
          };
        } else {
          // No recognized data arrays found
          // Look for any array property that might contain the historical data
          const arrayProps = Object.entries(data)
            .filter(([_, value]) => Array.isArray(value))
            .map(([key, value]) => ({ key, length: (value as any[]).length }));

          if (arrayProps.length > 0) {
            // Use the largest array found
            const largestArray = arrayProps.sort((a, b) => b.length - a.length)[0];
            console.log(`Using '${largestArray.key}' with ${largestArray.length} items as data`);

            normalizedData = {
              data: data[largestArray.key],
              meta: {
                fromDate: startDate || '',
                toDate: endDate || '',
                series: [],
                symbols: [symbol]
              }
            };
          } else {
            // No arrays found, return empty data
            normalizedData = {
              data: [],
              meta: {
                fromDate: startDate || '',
                toDate: endDate || '',
                series: [],
                symbols: [symbol]
              }
            };
          }
        }
      } else {
        // Fallback for unexpected formats
        console.log('Unexpected data format:', typeof data);
        normalizedData = {
          data: [],
          meta: {
            fromDate: startDate || '',
            toDate: endDate || '',
            series: [],
            symbols: [symbol]
          }
        };
      }

      console.log(`Normalized data has ${normalizedData.data.length} data points`);

      // Check if we actually have data
      if (normalizedData.data.length === 0) {
        console.log('No historical data available after normalization');
      }

      return NextResponse.json({ success: true, data: normalizedData });
    } catch (fetchError) {
      console.error(`Error fetching data from NSE API for ${symbol}:`, fetchError);

      // Handle specific API errors
      const errorMessage = fetchError.toString().includes('401')
        ? 'NSE API authentication failed - API service may have changed'
        : `Failed to fetch historical data from NSE API for ${symbol}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error fetching historical data:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
