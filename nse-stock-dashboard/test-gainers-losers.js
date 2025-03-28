const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/nse/helpers/gainers-losers',
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
        console.log('Gainers count:', parsedData.data.gainers.length);
        console.log('Losers count:', parsedData.data.losers.length);

        // Examine the structure of a single gainer
        if (parsedData.data.gainers.length > 0) {
          console.log('\nFirst gainer object structure:');
          const firstGainer = parsedData.data.gainers[0];
          console.log(JSON.stringify(firstGainer, null, 2));

          // Safely access properties that might be null/undefined
          console.log('\nTop 3 Gainers (safely accessing properties):');
          parsedData.data.gainers.slice(0, 3).forEach(gainer => {
            const symbol = gainer.symbol || 'Unknown';
            const pChange = typeof gainer.pChange === 'number' ? gainer.pChange.toFixed(2) : 'N/A';
            const ltp = typeof gainer.ltp === 'number' ? gainer.ltp.toFixed(2) : 'N/A';
            console.log(`${symbol}: ${pChange}% (₹${ltp})`);
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
