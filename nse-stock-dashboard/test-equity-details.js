const http = require('http');

// Use RELIANCE as our test stock
const symbol = 'RELIANCE';
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/nse/equity/details?symbol=${symbol}`,
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
        const details = parsedData.data;

        console.log(`\nEquity Details for ${symbol}:`);

        if (details.info) {
          console.log(`\nBasic Info:`);
          console.log(`Symbol: ${details.info.symbol || 'N/A'}`);
          console.log(`Company Name: ${details.info.companyName || 'N/A'}`);
          console.log(`Industry: ${details.info.industry || 'N/A'}`);
          console.log(`Series: ${details.info.series || 'N/A'}`);
          console.log(`ISIN: ${details.info.isin || 'N/A'}`);
        }

        if (details.priceInfo) {
          console.log(`\nPrice Info:`);
          console.log(`Last Price: ₹${details.priceInfo.lastPrice?.toFixed(2) || 'N/A'}`);
          console.log(`Change: ${details.priceInfo.change >= 0 ? '+' : ''}${details.priceInfo.change?.toFixed(2) || 'N/A'} (${details.priceInfo.pChange >= 0 ? '+' : ''}${details.priceInfo.pChange?.toFixed(2) || 'N/A'}%)`);
          console.log(`Day Range: ₹${details.priceInfo.low?.toFixed(2) || 'N/A'} - ₹${details.priceInfo.high?.toFixed(2) || 'N/A'}`);
          console.log(`Volume: ${details.priceInfo.totalTradedVolume?.toLocaleString() || 'N/A'}`);
        }

        // Print the raw data structure for debugging
        console.log('\nFor debugging - First level keys in the response:');
        console.log(Object.keys(details));
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
