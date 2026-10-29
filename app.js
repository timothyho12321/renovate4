const express = require('express');
const _ = require('lodash');
const dayjs = require('dayjs');

const app = express();

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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Renovate Test: Stopwatch & Lap Graph</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 650px; margin: 40px auto; text-align: center; background: #f8fafc; color: #1e293b; }
    .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .timer { font-size: 3.5rem; font-weight: 700; font-variant-numeric: tabular-nums; margin: 16px 0; color: #0f172a; }
    button { font-size: 1rem; padding: 10px 20px; margin: 5px; cursor: pointer; border: none; border-radius: 6px; font-weight: 600; }
    .btn-start { background: #2563eb; color: white; }
    .btn-lap { background: #10b981; color: white; }
    .btn-reset { background: #ef4444; color: white; }
    .stats-box { margin-top: 15px; padding: 10px; background: #f1f5f9; border-radius: 8px; font-size: 0.9rem; }
    canvas { margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>⏱️ Renovate Test Stopwatch</h2>
    <div class="timer" id="display">0.00s</div>
    <div>
      <button class="btn-start" onclick="toggleTimer()" id="startBtn">Start</button>
      <button class="btn-lap" onclick="recordLap()">Record Lap</button>
      <button class="btn-reset" onclick="resetTimer()">Reset</button>
    </div>
    <div class="stats-box" id="stats">Click "Record Lap" while running to plot graph & test backend libraries.</div>
    <canvas id="lapChart" height="120"></canvas>
  </div>

  <script>
    let startTime = 0, elapsed = 0, interval = null;
    const laps = [];
    const ctx = document.getElementById('lapChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Lap Time (seconds)',
          data: [],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0.3
        }]
      }
    });

    function toggleTimer() {
      const btn = document.getElementById('startBtn');
      if (interval) {
        clearInterval(interval);
        interval = null;
        btn.textContent = 'Resume';
      } else {
        startTime = Date.now() - elapsed;
        interval = setInterval(() => {
          elapsed = Date.now() - startTime;
          document.getElementById('display').textContent = (elapsed / 1000).toFixed(2) + 's';
        }, 50);
        btn.textContent = 'Pause';
      }
    }

    async function recordLap() {
      if (elapsed === 0) return;
      const lapSec = Number((elapsed / 1000).toFixed(2));
      laps.push(lapSec);
      chart.data.labels.push('Lap ' + laps.length);
      chart.data.datasets[0].data.push(lapSec);
      chart.update();

      const res = await fetch('/api/stats?laps=' + laps.join(','));
      const data = await res.json();
      document.getElementById('stats').innerHTML = 
        '<b>Fastest:</b> ' + data.metrics.fastestLap + 's | ' +
        '<b>Average:</b> ' + data.metrics.averageLap + 's | ' +
        '<b>Lodash Version:</b> ' + data.versions.lodash;
    }

    function resetTimer() {
      clearInterval(interval);
      interval = null;
      elapsed = 0;
      laps.length = 0;
      document.getElementById('display').textContent = '0.00s';
      document.getElementById('startBtn').textContent = 'Start';
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
    }
  </script>
</body>
</html>
  `);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));
}

module.exports = app;