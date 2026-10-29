const http = require('http');
const assert = require('assert');
const app = require('./app');

const server = app.listen(0, () => {
  const port = server.address().port;

  http.get(`http://localhost:${port}/api/stats?laps=1.5,2.5,3.5`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        assert.strictEqual(res.statusCode, 200, 'Expected status code 200');
        const parsed = JSON.parse(rawData);

        assert.strictEqual(parsed.status, 'healthy');
        assert.strictEqual(parsed.metrics.fastestLap, 1.5);
        assert.strictEqual(parsed.metrics.slowestLap, 3.5);
        assert.strictEqual(parsed.metrics.averageLap, 2.5);
        assert.ok(parsed.serverTime, 'Expected serverTime from dayjs');

        console.log('✅ Smoke test passed! App works properly with current dependency versions.');
        server.close(() => process.exit(0));
      } catch (err) {
        console.error('❌ Test failed:', err.message);
        server.close(() => process.exit(1));
      }
    });
  }).on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    server.close(() => process.exit(1));
  });
});