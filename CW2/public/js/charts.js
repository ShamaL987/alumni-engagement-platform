(function () {
  const palette = [
    '#2563eb', '#16a34a', '#f97316', '#9333ea', '#dc2626',
    '#0891b2', '#ca8a04', '#4f46e5', '#db2777', '#475569',
    '#65a30d', '#0d9488'
  ];

  function parseValues(canvas) {
    try {
      const raw = canvas.dataset.values || '[]';
      return JSON.parse(canvas.dataset.encoded === 'true' ? decodeURIComponent(raw) : raw);
    } catch {
      return [];
    }
  }

  function makeChart(canvas) {
    const values = parseValues(canvas);
    const type = canvas.dataset.chart || 'bar';
    const labels = values.map((item) => item.label);
    const data = values.map((item) => Number(item.value || item.percentage || 0));

    new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [{
          label: canvas.closest('.chart-card')?.querySelector('h2')?.textContent || 'Metric',
          data,
          borderWidth: 2,
          tension: 0.35,
          backgroundColor: palette,
          borderColor: palette
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        plugins: {
          legend: { display: ['pie', 'doughnut', 'radar'].includes(type), position: 'bottom' },
          tooltip: { enabled: true }
        },
        scales: ['pie', 'doughnut', 'radar'].includes(type) ? {} : {
          x: { ticks: { maxRotation: 45, minRotation: 0 } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  document.querySelectorAll('canvas[data-chart]').forEach(makeChart);
})();
