const http = require('http');

// Use RELIANCE as our test stock
const symbol = 'RELIANCE';
const startDate = '2025-02-20'; // 1 month ago
const endDate = '2025-03-21';   // today

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/nse/equity/historical?symbol=${symbol}&startDate=${startDate}&endDate=${endDate}`,
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Response status:', res.statusCode);

      if (parsedData.success && parsedData.data) {
        const historicalData = parsedData.data;

        console.log(`\nHistorical Data for ${symbol} (${startDate} to ${endDate}):`);
        console.log(`Total data points: ${historicalData.length}`);

        if (historicalData.length > 0) {
          // Display data structure
          console.log('\nFirst data point structure:');
          console.log(JSON.stringify(historicalData[0], null, 2));

          // Show first 3 and last 3 data points (assuming data is ordered by date)
          console.log('\nFirst 3 data points:');
          historicalData.slice(0, 3).forEach(point => {
            const date = point.CH_TIMESTAMP || 'N/A';
            const open = typeof point.CH_OPENING_PRICE === 'number' ? point.CH_OPENING_PRICE.toFixed(2) : 'N/A';
            const close = typeof point.CH_CLOSING_PRICE === 'number' ? point.CH_CLOSING_PRICE.toFixed(2) : 'N/A';
            console.log(`${date}: Open: ₹${open}, Close: ₹${close}`);
          });

          if (historicalData.length > 3) {
            console.log('\nLast 3 data points:');
            historicalData.slice(-3).forEach(point => {
              const date = point.CH_TIMESTAMP || 'N/A';
              const open = typeof point.CH_OPENING_PRICE === 'number' ? point.CH_OPENING_PRICE.toFixed(2) : 'N/A';
              const close = typeof point.CH_CLOSING_PRICE === 'number' ? point.CH_CLOSING_PRICE.toFixed(2) : 'N/A';
              console.log(`${date}: Open: ₹${open}, Close: ₹${close}`);
            });
          }
        } else {
          console.log('No historical data available for the specified period.');
        }
      } else {
        console.log('Error or empty response:', parsedData);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.log('Raw data received (first 100 chars):', data.substring(0, 100) + '...');
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error);
});

req.end();
