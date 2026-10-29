const express = require('express');
const _ = require('lodash');
const dayjs = require('dayjs');
const { exec } = require('child_process'); // Required for CWE-78 test case
 
const app = express();
 
// ============================================================================
// INTENTIONAL SECURITY VULNERABILITIES FOR CODEQL SCANNER TESTING
// DO NOT USE IN PRODUCTION
// ============================================================================
 
// 1. Command Injection (CWE-78) Test Case
app.get('/ping', (req, res) => {
  const target = req.query.target;
 
  if (!target) {
    return res.status(400).send('Missing target parameter');
  }
 
  exec('ping -c 4 ' + target, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send(`Error: ${stderr || err.message}`);
    }
    res.send(`<pre>${stdout}</pre>`);
  });
});
 
// 2. Cross-Site Scripting (XSS) (CWE-79) Test Case
app.get('/greet', (req, res) => {
  const userName = req.query.name || 'Guest';
  res.send(`
    <html>
      <head><title>Greeting</title></head>
      <body>
        <h1>Hello, ${userName}!</h1>
      </body>
    </html>
  `);
});

// 3. Code Injection (CWE-95) Test Case
app.get('/evaluate', (req, res) => {
  const expr = req.query.expr;
 
  if (!expr) {
    return res.status(400).send('Missing expr parameter');
  }
 
  try {
    const result = eval(expr);
    res.send(`Result: ${result}`);
  } catch (e) {
    res.status(500).send(`Evaluation error: ${e.message}`);
  }
});

// ============================================================================
// INTENTIONAL NON-SECURITY CODEQL ERRORS/WARNINGS (Correctness/Maintainability)
// Designed to fail branch protection settings that block on ANY CodeQL alert.
// ============================================================================

// 4. Useless Assignment (CodeQL: js/useless-assignment-to-local)
// WARNING: The value 'processing' is assigned to 'status' but never read before being overwritten.
app.get('/test-useless-assignment', (req, res) => {
  let status = 'pending';
  status = 'processing'; // CodeQL will flag this as a useless assignment
  status = 'complete';
  res.send(`Status: ${status}`);
});

// 5. Unreachable Code (CodeQL: js/unreachable-code)
// WARNING: Statements after a 'return' or 'res.send' are never executed.
app.get('/test-unreachable-code', (req, res) => {
  res.json({ message: 'Finished' });
  const deadVariable = 'This is unreachable'; // CodeQL will flag this as unreachable code
  console.log(deadVariable);
});

// 6. Missing Await / Promise Misuse (CodeQL: js/missing-await)
// WARNING: Accessing a property on a Promise object as if it were the resolved value.
app.get('/test-missing-await', async (req, res) => {
  const fetchData = () => Promise.resolve({ data: 'hello' });
  const result = fetchData();
  const length = result.data.length; // CodeQL will flag: Property access on Promise, likely missing 'await'
  res.send(`Length: ${length}`);
});

// 7. Division by Zero (CodeQL: js/division-by-zero)
// WARNING: Division by a constant zero.
app.get('/test-divide-by-zero', (req, res) => {
  const numerator = 100;
  const denominator = 0;
  const calc = numerator / denominator; // CodeQL will flag this as division by zero
  res.send(`Calculation result: ${calc}`);
});

// 8. Duplicate Branch Condition (CodeQL: js/duplicate-branch-condition)
// WARNING: The condition is duplicated in the else-if chain, making the second branch dead code.
app.get('/test-duplicate-condition', (req, res) => {
  const role = req.query.role || 'user';
  if (role === 'admin') {
    res.send('Admin access granted');
  } else if (role === 'admin') { // CodeQL will flag this as a duplicate branch condition
    res.send('This will never be reached');
  } else {
    res.send('Regular user access');
  }
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