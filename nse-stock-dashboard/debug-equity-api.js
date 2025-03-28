const http = require('http');
const fs = require('fs');

// Use HEROMOTOCO as test stock (from your screenshot)
const symbol = 'HEROMOTOCO';
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

        console.log('\n=== HEROMOTOCO API RESPONSE ANALYSIS ===');
        console.log('\nTop-level keys in response:');
        console.log(Object.keys(details));

        // Save the entire response to a file for thorough analysis
        fs.writeFileSync('equity-details-response.json', JSON.stringify(details, null, 2));
        console.log('\nFull response saved to equity-details-response.json');

        // Examine key parts of the response
        if (details.priceInfo && details.priceInfo.intraDayHighLow) {
          console.log('\nIntraday High/Low:');
          console.log(details.priceInfo.intraDayHighLow);
        }

        if (details.priceInfo && details.priceInfo.weekHighLow) {
          console.log('\n52 Week High/Low:');
          console.log(details.priceInfo.weekHighLow);
        }

        if (details.priceInfo && details.priceInfo.pPriceBand) {
          console.log('\nPrice Band:');
          console.log(details.priceInfo.pPriceBand);
        }

        // Check volume data
        console.log('\nVolume data:');
        if (details.priceInfo) {
          console.log({
            totalTradedVolume: details.priceInfo.totalTradedVolume,
            totalTradedValue: details.priceInfo.totalTradedValue,
          });
        }

        // Check for any other potentially useful data
        if (details.metadata) {
          console.log('\nMetadata sample:');
          console.log(JSON.stringify(details.metadata).substring(0, 500) + '...');
        }
      } else {
        console.log('Error or empty response:', parsedData);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.log('Raw data received (first 100 chars):', data.substring(0, 100));
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error);
});

req.end();
