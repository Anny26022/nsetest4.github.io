import { NextResponse } from 'next/server';
import { NseIndia } from 'stock-nse-india';

// Create instance of NseIndia
const nseIndia = new NseIndia();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const index = searchParams.get('index');

    if (!index) {
      return NextResponse.json(
        { success: false, error: 'Index parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching details for index: ${index}`);

    try {
      // Get data from NSE API
      const data = await nseIndia.getEquityStockIndices(index);
      console.log(`Successfully fetched index data with keys: ${Object.keys(data).join(', ')}`);

      return NextResponse.json({ success: true, data });
    } catch (apiError) {
      console.error(`Error from NSE API for index ${index}:`, apiError);

      // Handle specific API errors
      const errorMessage = apiError.toString().includes('401')
        ? 'NSE API authentication failed - API service may have changed'
        : `Failed to fetch details for index ${index}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching index details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch index details' },
      { status: 500 }
    );
  }
}
