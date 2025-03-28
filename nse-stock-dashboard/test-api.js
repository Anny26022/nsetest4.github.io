const { NseIndia } = require('stock-nse-india');

const nseIndia = new NseIndia();

async function testHistoricalData() {
  try {
    console.log('Testing historical data API...');

    // Test with a popular stock
    const symbol = 'RELIANCE';
    console.log(`Fetching historical data for ${symbol}...`);

    // Set date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const dateRange = {
      start: startDate,
      end: endDate
    };

    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Attempt to fetch data
    const data = await nseIndia.getEquityHistoricalData(symbol, dateRange);

    if (data && data.data && Array.isArray(data.data)) {
      console.log(`Success! Received ${data.data.length} data points`);

      if (data.data.length > 0) {
        // Show a sample of the first data point
        console.log('Sample data point:');
        console.log(JSON.stringify(data.data[0], null, 2));
      } else {
        console.log('Received empty array, no historical data available');
      }
    } else {
      console.log('Received invalid data structure:', JSON.stringify(data).substring(0, 200));
    }

    // Try with a different stock
    const alternativeSymbol = 'TATAMOTORS';
    console.log(`\nTrying with another stock: ${alternativeSymbol}...`);
    const altData = await nseIndia.getEquityHistoricalData(alternativeSymbol, dateRange);

    if (altData && altData.data && Array.isArray(altData.data)) {
      console.log(`Success! Received ${altData.data.length} data points`);

      if (altData.data.length > 0) {
        // Show a sample of the first data point
        console.log('Sample data point:');
        console.log(JSON.stringify(altData.data[0], null, 2));
      } else {
        console.log('Received empty array, no historical data available');
      }
    } else {
      console.log('Received invalid data structure:', JSON.stringify(altData).substring(0, 200));
    }

    // Try without date range
    console.log(`\nTrying without date range for ${symbol}...`);
    const defaultData = await nseIndia.getEquityHistoricalData(symbol);

    if (defaultData && defaultData.data && Array.isArray(defaultData.data)) {
      console.log(`Success! Received ${defaultData.data.length} data points`);

      if (defaultData.data.length > 0) {
        // Show a sample of the first data point
        console.log('Sample data point:');
        console.log(JSON.stringify(defaultData.data[0], null, 2));
      } else {
        console.log('Received empty array, no historical data available');
      }
    } else {
      console.log('Received invalid data structure:', JSON.stringify(defaultData).substring(0, 200));
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testHistoricalData();
