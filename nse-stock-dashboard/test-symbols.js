const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/nse/symbols',
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
        console.log('Data count:', parsedData.data.length);
        console.log('First 10 symbols:', parsedData.data.slice(0, 10));
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
