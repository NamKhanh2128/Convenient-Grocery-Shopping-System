const http = require('http');

const data = JSON.stringify({
  plan_type: 'weekly',
  start_date: '2026-06-08',
  end_date: '2026-06-14',
  items: [{ recipe_id: 1, meal_date: '2026-06-08', meal_type: 'dinner' }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/meal-plans',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mock-token-1',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
