/**
 * Chart.js visualizations for all pages.
 * Reads from window.PITCH_DATA (set by data.js).
 */
(function () {
  'use strict';

  function waitForChart(fn) {
    if (typeof Chart === 'undefined') { setTimeout(function () { waitForChart(fn); }, 50); return; }
    fn();
  }

  var D = window.PITCH_DATA || {};

  // ── Chart.js defaults ──────────────────────────────────────────
  function setDefaults() {
    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = 'rgba(42,53,80,0.5)';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.plugins.legend.display = true;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'line';
    Chart.defaults.plugins.legend.labels.padding = 20;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17,24,39,0.95)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(57,210,192,0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 12;
  }

  // ── Log-scale comparison chart builder ─────────────────────────
  function renderComparisonChart(canvasId, updatedId, dataKey) {
    var data = D[dataKey];
    var ctx = document.getElementById(canvasId);
    if (!ctx || !data || !data.dates) return;

    // Set "Last updated" text
    var upEl = document.getElementById(updatedId);
    if (upEl) upEl.textContent = 'Last updated: ' + data.last_updated;

    var stratGrad = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    stratGrad.addColorStop(0, 'rgba(57,210,192,0.12)');
    stratGrad.addColorStop(1, 'rgba(57,210,192,0.0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.dates,
        datasets: [
          {
            label: data.label || 'Strategy',
            data: data.strategy,
            borderColor: '#39d2c0',
            borderWidth: 2,
            backgroundColor: stratGrad,
            fill: true,
            pointRadius: 0,
            pointHitRadius: 8,
            tension: 0.1,
          },
          {
            label: 'SPY',
            data: data.spy,
            borderColor: '#58a6ff',
            borderWidth: 1.5,
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 0,
            pointHitRadius: 8,
            tension: 0.1,
            borderDash: [6, 3],
          },
          {
            label: 'QQQ',
            data: data.qqq,
            borderColor: '#bc8cff',
            borderWidth: 1.5,
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 0,
            pointHitRadius: 8,
            tension: 0.1,
            borderDash: [6, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { left: 8, right: 12, top: 8, bottom: 8 } },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 8,
              font: { size: 11 },
              maxRotation: 0,
              autoSkipPadding: 20,
            },
          },
          y: {
            type: 'logarithmic',
            grid: { color: 'rgba(42,53,80,0.3)' },
            afterFit: function (axis) { axis.width = 70; },
            ticks: {
              callback: function (v) {
                if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
                return '$' + v;
              },
              font: { size: 11 },
              maxTicksLimit: 8,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (item) {
                return item.dataset.label + ': $' + item.raw.toLocaleString('en-US', { maximumFractionDigits: 0 });
              },
            },
          },
          legend: {
            position: 'top',
            align: 'end',
          },
        },
      },
    });
  }

  // ── Quality Gate Table ─────────────────────────────────────────
  function renderQualityGate() {
    var data = D.quality_gate;
    var tbody = document.querySelector('#gate-table tbody');
    if (!tbody || !data) return;

    var defs = [
      { key: 'cagr_min', name: 'CAGR', c: 'Min', pct: true },
      { key: 'max_drawdown_max', name: 'Max Drawdown', c: 'Max', pct: true },
      { key: 'calmar_min', name: 'Calmar Ratio', c: 'Min' },
      { key: 'sharpe_min', name: 'Sharpe Ratio', c: 'Min' },
      { key: 'z_score_min', name: 'Z-Score', c: 'Min' },
      { key: 'p_value_max', name: 'P-Value', c: 'Max' },
      { key: 'profit_factor_min', name: 'Profit Factor', c: 'Min' },
      { key: 'win_rate_min', name: 'Win Rate', c: 'Min', wpct: true },
    ];

    var html = '';
    defs.forEach(function (d) {
      var l1 = data.layer1[d.key];
      var l2 = data.layer2[d.key];
      var l1s = d.pct ? (l1 * 100).toFixed(0) + '%' : d.wpct ? l1 + '%' : l1;
      var l2s = d.pct ? (l2 * 100).toFixed(0) + '%' : d.wpct ? l2 + '%' : l2;
      html += '<tr><td class="metric-name">' + d.name + '</td><td>' + d.c + '</td><td class="l1-val">' + l1s + '</td><td class="l2-val">' + l2s + '</td></tr>';
    });
    tbody.innerHTML = html;
  }

  // ── Strategy Table ─────────────────────────────────────────────
  var stratData = [];
  var sortCol = 'calmar';
  var sortDir = 'desc';

  function renderStrategyTable() {
    var data = D.strategies;
    if (!data) return;

    // Update pipeline stats
    var el;
    el = document.getElementById('stat-attempted'); if (el) el.textContent = data.total_attempted;
    el = document.getElementById('stat-passed'); if (el) el.textContent = data.total_passed;
    el = document.getElementById('stat-graveyard'); if (el) el.textContent = data.total_graveyard;
    el = document.getElementById('funnel-total'); if (el) el.textContent = data.total_attempted;
    el = document.getElementById('funnel-passed'); if (el) el.textContent = data.total_passed;
    el = document.getElementById('funnel-graveyard'); if (el) el.textContent = data.total_graveyard;

    stratData = data.passed.map(function (s) {
      return {
        id: s.id,
        direction: s.direction || 'long',
        status: s.status,
        cagr: s.metrics ? s.metrics.cagr : 0,
        calmar: s.metrics ? s.metrics.calmar : 0,
        sharpe: s.metrics ? s.metrics.sharpe : 0,
        z_score: s.metrics ? s.metrics.z_score : 0,
        win_rate: s.metrics ? s.metrics.win_rate : 0,
      };
    });

    document.querySelectorAll('#strategy-table th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.dataset.sort;
        if (sortCol === col) sortDir = sortDir === 'desc' ? 'asc' : 'desc';
        else { sortCol = col; sortDir = 'desc'; }
        renderStratRows();
      });
    });
    renderStratRows();
  }

  function renderStratRows() {
    var sorted = stratData.slice().sort(function (a, b) {
      var va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    document.querySelectorAll('#strategy-table th[data-sort]').forEach(function (th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === sortCol) th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    });

    var tbody = document.querySelector('#strategy-table tbody');
    if (!tbody) return;
    var html = '';
    sorted.forEach(function (s) {
      var dir = s.direction === 'short' ? '<span class="badge badge-short">Short</span>' : '<span class="badge badge-long">Long</span>';
      html += '<tr><td class="strat-name">' + s.id + '</td><td>' + dir + '</td>'
        + '<td class="metric-cell">' + (s.cagr * 100).toFixed(1) + '%</td>'
        + '<td class="metric-cell">' + s.calmar.toFixed(3) + '</td>'
        + '<td class="metric-cell">' + s.sharpe.toFixed(3) + '</td>'
        + '<td class="metric-cell">' + s.z_score.toFixed(2) + '</td>'
        + '<td class="metric-cell">' + s.win_rate.toFixed(1) + '%</td></tr>';
    });
    tbody.innerHTML = html;
  }

  // ── Failure Modes Chart ────────────────────────────────────────
  function renderFailureModes() {
    var data = D.strategies;
    var ctx = document.getElementById('failure-chart');
    if (!ctx || !data) return;

    var modes = (data.common_failure_modes || []).slice().sort(function (a, b) { return b.count - a.count; });
    var labels = modes.map(function (m) { return m.metric.replace(/_/g, ' ').toUpperCase(); });
    var counts = modes.map(function (m) { return m.count; });
    var palette = { 'CALMAR': '#bc8cff', 'CAGR': '#39d2c0', 'Z SCORE': '#58a6ff', 'SHARPE': '#d29922', 'P VALUE': '#f85149', 'MAX DRAWDOWN': '#3fb950' };
    var colors = labels.map(function (l) { return palette[l] || '#8b949e'; });

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: counts, backgroundColor: colors.map(function (c) { return c + '40'; }), borderColor: colors, borderWidth: 1.5, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (i) { return i.raw + ' failures'; } } } },
        scales: {
          x: { grid: { color: 'rgba(42,53,80,0.3)' }, title: { display: true, text: 'Failure Count', font: { size: 11 }, color: '#5a6577' } },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' } } },
        },
      },
    });
  }

  // ── Pie Charts ──────────────────────────────────────────────────
  function renderPieChart(canvasId, pieData) {
    var ctx = document.getElementById(canvasId);
    if (!ctx || !pieData) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: pieData.labels,
        datasets: [{
          data: pieData.values,
          backgroundColor: pieData.colors.map(function (c) { return c + 'cc'; }),
          borderColor: pieData.colors,
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: function (item) { return item.label + ': ' + item.raw + '%'; },
            },
          },
        },
      },
    });
  }

  // ── Monthly Returns Heatmap ────────────────────────────────────
  function renderHeatmap() {
    var data = D.monthly_returns;
    var table = document.getElementById('monthly-heatmap');
    if (!table || !data) return;

    var html = '<thead><tr><th></th>';
    data.months.forEach(function (m) { html += '<th>' + m + '</th>'; });
    html += '<th>Year</th></tr></thead><tbody>';

    data.years.forEach(function (year, yi) {
      html += '<tr><td class="year-cell">' + year + '</td>';
      data.matrix[yi].forEach(function (val) {
        if (val === null) {
          html += '<td class="return-cell" style="background:transparent">-</td>';
        } else {
          var color = val >= 0
            ? 'rgba(63,185,80,' + Math.min(Math.abs(val) / 15, 0.7) + ')'
            : 'rgba(248,81,73,' + Math.min(Math.abs(val) / 15, 0.7) + ')';
          var textColor = Math.abs(val) > 5 ? '#e6edf3' : (val >= 0 ? '#3fb950' : '#f85149');
          html += '<td class="return-cell" style="background:' + color + ';color:' + textColor + '">'
            + val.toFixed(1) + '</td>';
        }
      });
      var yr = data.yearly_returns[yi];
      if (yr !== null) {
        var yColor = yr >= 0 ? '#3fb950' : '#f85149';
        html += '<td class="yearly-total" style="color:' + yColor + '">' + yr.toFixed(1) + '%</td>';
      } else {
        html += '<td class="yearly-total">-</td>';
      }
      html += '</tr>';
    });
    html += '</tbody>';
    table.innerHTML = html;
  }

  function renderPieCharts() {
    var pie = D.pie;
    if (!pie) return;
    if (pie.flagship) {
      renderPieChart('pie-assets-flagship', pie.flagship.asset_classes);
      renderPieChart('pie-types-flagship', pie.flagship.strategy_types);
    }
    if (pie.lowrisk) {
      renderPieChart('pie-assets-lowrisk', pie.lowrisk.asset_classes);
      renderPieChart('pie-types-lowrisk', pie.lowrisk.strategy_types);
    }
  }

  // ── Init ───────────────────────────────────────────────────────
  waitForChart(function () {
    setDefaults();
    // index.html
    renderComparisonChart('hedge-chart', 'hedge-updated', 'hedge');
    renderHeatmap();
    // strategies.html
    renderComparisonChart('hedge-chart-2', 'hedge-updated-2', 'hedge');
    renderComparisonChart('legacy-chart', 'legacy-updated', 'legacy');
    renderPieCharts();
    // ai.html
    renderQualityGate();
    renderStrategyTable();
    renderFailureModes();
  });
})();
