const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/nse/helpers/most-active',
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

      if (parsedData.success) {
        console.log('Most active by value count:', parsedData.data.byValue.length);
        console.log('Most active by volume count:', parsedData.data.byVolume.length);

        // Examine the structure of a single item
        if (parsedData.data.byValue.length > 0) {
          console.log('\nFirst most active by value object structure:');
          const firstByValue = parsedData.data.byValue[0];
          console.log(JSON.stringify(firstByValue, null, 2));

          // Output top 3 most active by value
          console.log('\nTop 3 Most Active by Value:');
          parsedData.data.byValue.slice(0, 3).forEach(stock => {
            const symbol = stock.symbol || 'Unknown';
            const turnover = typeof stock.turnover === 'string' ? parseFloat(stock.turnover).toLocaleString() : 'N/A';
            const ltp = typeof stock.ltp === 'number' ? stock.ltp.toFixed(2) : 'N/A';
            console.log(`${symbol}: ₹${ltp} (Turnover: ₹${turnover})`);
          });
        }
      } else {
        console.log('Error response:', parsedData);
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
