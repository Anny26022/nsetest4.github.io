import { NseIndia } from 'stock-nse-india';
import { NextResponse } from 'next/server';

// Create instance of NseIndia
const nseIndia = new NseIndia();

// Define interface for symbol with company name
export interface SymbolWithCompany {
  symbol: string;
  companyName: string;
}

// Define a cache for popular stocks with company names
const popularStocksMap: Record<string, string> = {
  "RELIANCE": "Reliance Industries Limited",
  "TCS": "Tata Consultancy Services Limited",
  "HDFCBANK": "HDFC Bank Limited",
  "INFY": "Infosys Limited",
  "ICICIBANK": "ICICI Bank Limited",
  "HINDUNILVR": "Hindustan Unilever Limited",
  "ITC": "ITC Limited",
  "SBIN": "State Bank of India",
  "BAJFINANCE": "Bajaj Finance Limited",
  "BHARTIARTL": "Bharti Airtel Limited",
  "KOTAKBANK": "Kotak Mahindra Bank Limited",
  "AXISBANK": "Axis Bank Limited",
  "MARUTI": "Maruti Suzuki India Limited",
  "HCLTECH": "HCL Technologies Limited",
  "ASIANPAINT": "Asian Paints Limited",
  "WIPRO": "Wipro Limited",
  "LT": "Larsen & Toubro Limited",
  "SUNPHARMA": "Sun Pharmaceutical Industries Limited",
  "TATAMOTORS": "Tata Motors Limited",
  "ULTRACEMCO": "UltraTech Cement Limited",
  "ADANIENT": "Adani Enterprises Limited",
  "TATASTEEL": "Tata Steel Limited",
  "NTPC": "NTPC Limited",
  "POWERGRID": "Power Grid Corporation of India Limited",
  "NESTLEIND": "Nestle India Limited",
  "TITAN": "Titan Company Limited",
  "BAJAJFINSV": "Bajaj Finserv Limited",
  "JSWSTEEL": "JSW Steel Limited",
  "GRASIM": "Grasim Industries Limited",
  "HEROMOTOCO": "Hero MotoCorp Limited"
};

export async function GET() {
  try {
    console.log('Fetching all stock symbols...');
    // Get all stock symbols
    const symbols = await nseIndia.getAllStockSymbols();

    console.log(`Successfully fetched ${symbols.length} symbols`);

    // Map each symbol to include company name (if available)
    const symbolsWithCompany = symbols.map(symbol => {
      return {
        symbol,
        companyName: popularStocksMap[symbol] || ''
      };
    });

    return NextResponse.json({
      success: true,
      data: symbolsWithCompany
    });
  } catch (error) {
    console.error('Error fetching stock symbols:', error);

    // If the error is due to 401 Unauthorized, provide a more specific message
    const errorMessage = error.toString().includes('401')
      ? 'NSE API authentication failed - API service may have changed'
      : 'Failed to fetch stock symbols';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
