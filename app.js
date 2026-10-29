const express = require('express');
const _ = require('lodash');
const dayjs = require('dayjs');
const { exec } = require('child_process'); // Required for CWE-78 test case
 
const app = express();
 
// add change to test manual 
// ============================================================================
// INTENTIONAL VULNERABILITIES FOR CODEQL SCANNER TESTING
// DO NOT USE IN PRODUCTION
// ============================================================================
 
// 1. Command Injection (CWE-78) Test Case
// CodeQL should flag this: Untrusted 'req.query.target' flows into 'exec'
app.get('/ping', (req, res) => {
  const target = req.query.target;
 
  if (!target) {
    return res.status(400).send('Missing target parameter');
  }
 
  // VULNERABILITY: Untrusted input concatenated directly into shell command
  exec('ping -c 4 ' + target, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send(`Error: ${stderr || err.message}`);
    }
    res.send(`<pre>${stdout}</pre>`);
  });
});
 
// 2. Cross-Site Scripting (XSS) (CWE-79) Test Case
// CodeQL should flag this: Untrusted 'req.query.name' flows into HTML response without encoding
app.get('/greet', (req, res) => {
  const userName = req.query.name || 'Guest';
 
  // VULNERABILITY: Untrusted input interpolated directly into HTML without sanitization/encoding
  res.send(`
    <html>
      <head><title>Greeting</title></head>
      <body>
        <h1>Hello, ${userName}!</h1>
      </body>
    </html>
  `);
});
 
// ============================================================================
// ORIGINAL APPLICATION LOGIC
// ============================================================================
 
// API endpoint that exercises lodash and dayjs so we can verify updates don't break functionality
app.get('/api/stats', (req, res) => {
  const rawLaps = req.query.laps ? req.query.laps.split(',').map(Number) : [1.45, 1.32, 1.58, 1.25, 1.40];
 
  res.json({
    status: 'healthy',
    serverTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    metrics: {
      count: rawLaps.length,
      fastestLap: _.min(rawLaps),
      slowestLap: _.max(rawLaps),
      averageLap: _.round(_.mean(rawLaps), 2),
      totalTime: _.round(_.sum(rawLaps), 2)
    },
    versions: {
      lodash: _.VERSION
    }
  });
});
 
// Simple Frontend UI with Stopwatch + Chart.js Graph
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>Renovate Test Stopwatch</title></head>
<body>
  <h1>⏱️ Renovate Test Stopwatch</h1>
  <p>0.00s</p>
  <button>Start</button>
  <button>Record Lap</button>
  <button>Reset</button>
  <p>Click "Record Lap" while running to plot graph & test backend libraries.</p>
</body>
</html>
  `);
});
 
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));
}
 
module.exports = app;
 