"use client";

import { useState, useEffect } from "react";

// Note: Install chart.js and react-chartjs-2 for charts:
// npm install chart.js react-chartjs-2
// Uncomment the chart imports below after installation
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";
// import { Bar, Line, Doughnut } from "react-chartjs-2";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// Generate years: current year and 5 years back
function getYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function QhseDashboardContent() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [stats, setStats] = useState({
    kpi: { completed: 0 },
    dueDiligence: { completed: 0, pending: 0, total: 0 },
    nearMiss: { total: 0, pendingReview: 0, reviewed: 0 },
  });
  const [nearMissQuarterly, setNearMissQuarterly] = useState({
    Q1: 0,
    Q2: 0,
    Q3: 0,
    Q4: 0,
  });
  const [baseAudits, setBaseAudits] = useState({
    locations: {
      Dubai: 0,
      Fujairah: 0,
      Khorfakkan: 0,
      Sohar: 0,
      Mombasa: 0,
      "Tanjung Bruas": 0,
    },
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("year", selectedYear.toString());
      if (selectedMonth) {
        params.append("month", selectedMonth.toString());
      }

      // Fetch main stats, quarterly near miss, and base audits
      const [statsRes, quarterlyRes, baseAuditsRes] = await Promise.all([
        fetch(`/api/qhse/dashboard/stats?${params.toString()}`),
        fetch(`/api/qhse/dashboard/near-miss-quarterly?year=${selectedYear}`),
        fetch(`/api/qhse/dashboard/base-audits?year=${selectedYear}`),
      ]);

      const statsData = await statsRes.json();
      const quarterlyData = await quarterlyRes.json();
      const baseAuditsData = await baseAuditsRes.json();

      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData.error || "Failed to fetch statistics");
      }

      setStats(statsData.data);

      if (quarterlyData.success) {
        setNearMissQuarterly(quarterlyData.data);
      }

      if (baseAuditsData.success) {
        setBaseAudits(baseAuditsData.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  const handleYearChange = (year) => {
    setSelectedYear(Number(year));
    setSelectedMonth(null);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month === "all" ? null : Number(month));
  };

  // Chart data
  const barChartData = {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Near Miss Reports",
        data: [
          nearMissQuarterly.Q1,
          nearMissQuarterly.Q2,
          nearMissQuarterly.Q3,
          nearMissQuarterly.Q4,
        ],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels: ["Completed", "Pending", "In Progress"],
    datasets: [
      {
        data: [
          stats.dueDiligence.completed,
          stats.dueDiligence.pending,
          stats.dueDiligence.total -
            stats.dueDiligence.completed -
            stats.dueDiligence.pending,
        ],
        backgroundColor: [
          "rgba(251, 146, 60, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(251, 146, 60, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const lineChartData = {
    labels: [
      "Dubai",
      "Fujairah",
      "Khorfakkan",
      "Sohar",
      "Mombasa",
      "Tanjung Bruas",
    ],
    datasets: [
      {
        label: "Base Audits",
        data: [
          baseAudits.locations.Dubai || 0,
          baseAudits.locations.Fujairah || 0,
          baseAudits.locations.Khorfakkan || 0,
          baseAudits.locations.Sohar || 0,
          baseAudits.locations.Mombasa || 0,
          baseAudits.locations["Tanjung Bruas"] || 0,
        ],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "rgba(255, 255, 255, 0.9)",
          font: {
            size: 12,
            weight: "500",
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "rgba(255, 255, 255, 1)",
        bodyColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "rgba(255, 255, 255, 0.9)",
          font: {
            size: 11,
            weight: "500",
          },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "rgba(255, 255, 255, 1)",
        bodyColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="w-full max-w-[95%] mx-auto pl-4 pr-4 py-10 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
              QHSE Management System
            </p>
            <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              QHSE Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Quality Health and Safety Environment Overview
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-200">
                Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                {getYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-200">
                Month:
              </label>
              <select
                value={selectedMonth || "all"}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="all">All Months</option>
                {MONTHS.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {error && (
          <div className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* KPI Completed Card */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-indigo-900/40 backdrop-blur-md shadow-2xl p-6 hover:shadow-purple-500/20 transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/30">
                    <svg
                      className="w-6 h-6 text-purple-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs uppercase tracking-wider text-purple-300 mb-2">
                  KPI Completed
                </h3>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats.kpi.completed}
                </p>
                <p className="text-xs text-slate-300">
                  {selectedMonth
                    ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
                    : `Year ${selectedYear}`}
                </p>
              </div>

              {/* Due Diligence Card */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-900/40 via-teal-800/30 to-cyan-900/40 backdrop-blur-md shadow-2xl p-6 hover:shadow-emerald-500/20 transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/30">
                    <svg
                      className="w-6 h-6 text-emerald-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs uppercase tracking-wider text-emerald-300 mb-2">
                  Due Diligence
                </h3>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats.dueDiligence.completed}
                </p>
                <p className="text-xs text-slate-300">
                  Pending: {stats.dueDiligence.pending}
                </p>
              </div>

              {/* Near Miss Card */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-amber-900/40 via-yellow-800/30 to-orange-900/40 backdrop-blur-md shadow-2xl p-6 hover:shadow-amber-500/20 transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/30">
                    <svg
                      className="w-6 h-6 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xs uppercase tracking-wider text-amber-300 mb-2">
                  Near Miss Raised
                </h3>
                <p className="text-3xl font-bold text-white mb-1">
                  {stats.nearMiss.total}
                </p>
                <p className="text-xs text-slate-300">
                  Pending Review: {stats.nearMiss.pendingReview}
                </p>
              </div>

            </div>

            {/* Charts Section */}
            {/* First Row - Near Miss and Due Diligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Bar Chart - Near Miss by Quarter */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Near Miss Reports (Quarter-wise)
                </h2>
                <div className="h-80 flex items-end justify-around gap-2 px-4">
                  {barChartData.labels.map((label, idx) => {
                    const value = barChartData.datasets[0].data[idx];
                    const maxValue = Math.max(...barChartData.datasets[0].data);
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-white/10 rounded-t-lg relative" style={{ height: `${height}%` }}>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"></div>
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white">
                            {value}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-300">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doughnut Chart - Due Diligence Status */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Due Diligence Status
                </h2>
                <div className="h-80 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-72 h-72">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                      {(() => {
                        const total = doughnutChartData.datasets[0].data.reduce((a, b) => a + b, 0);
                        let currentAngle = 0;
                        return doughnutChartData.datasets[0].data.map((value, idx) => {
                          const percentage = total > 0 ? (value / total) * 100 : 0;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;
                          const endAngle = currentAngle;
                          const largeArcFlag = angle > 180 ? 1 : 0;
                          const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                          const colors = ["#fb923c", "#8b5cf6", "#3b82f6", "#ef4444"];
                          return (
                            <path
                              key={idx}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={colors[idx] || "#6b7280"}
                              stroke="rgba(0, 0, 0, 0.3)"
                              strokeWidth="1"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-white">{doughnutChartData.datasets[0].data.reduce((a, b) => a + b, 0)}</p>
                        <p className="text-sm text-slate-300">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {doughnutChartData.labels.map((label, idx) => {
                      const value = doughnutChartData.datasets[0].data[idx];
                      const colors = ["#fb923c", "#8b5cf6", "#3b82f6", "#ef4444"];
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] || "#6b7280" }}></div>
                          <span className="text-xs text-slate-300">{label}: {value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Second Row - Base Audits Full Width */}
            <div className="mt-6">
              {/* Line Chart - Base Audits */}
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">
                    Base Audits
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-slate-300">By Location</span>
                  </div>
                </div>
                <div className="h-96 relative pb-8 pt-2">
                  <svg viewBox="0 0 1000 350" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="lineGradientQhse" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
                        <stop offset="50%" stopColor="rgba(59, 130, 246, 0.2)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.05)" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const y = 40 + (i * 50);
                      return (
                        <line
                          key={i}
                          x1="80"
                          y1={y}
                          x2="920"
                          y2={y}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="1"
                        />
                      );
                    })}
                    
                    {/* Background fill area */}
                    {(() => {
                      const data = lineChartData.datasets[0].data;
                      const maxValue = Math.max(...data, 1);
                      const chartHeight = 250;
                      const chartTop = 40;
                      const points = data.map((value, idx) => {
                        const x = 80 + (idx / (data.length - 1)) * 840;
                        const y = chartTop + chartHeight - (value / maxValue) * chartHeight;
                        return `${x},${y}`;
                      }).join(" ");
                      const bottomY = chartTop + chartHeight;
                      return (
                        <polygon
                          points={`80,${bottomY} ${points} 920,${bottomY}`}
                          fill="url(#lineGradientQhse)"
                        />
                      );
                    })()}
                    
                    {/* Line */}
                    <polyline
                      points={lineChartData.datasets[0].data.map((value, idx) => {
                        const maxValue = Math.max(...lineChartData.datasets[0].data, 1);
                        const chartHeight = 250;
                        const chartTop = 40;
                        const x = 80 + (idx / (lineChartData.datasets[0].data.length - 1)) * 840;
                        const y = chartTop + chartHeight - (value / maxValue) * chartHeight;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="rgba(59, 130, 246, 1)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                    
                    {/* Data points */}
                    {lineChartData.datasets[0].data.map((value, idx) => {
                      const maxValue = Math.max(...lineChartData.datasets[0].data, 1);
                      const chartHeight = 250;
                      const chartTop = 40;
                      const x = 80 + (idx / (lineChartData.datasets[0].data.length - 1)) * 840;
                      const y = chartTop + chartHeight - (value / maxValue) * chartHeight;
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r="9"
                            fill="rgba(59, 130, 246, 1)"
                            stroke="#fff"
                            strokeWidth="3"
                            className="drop-shadow-lg"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#fff"
                          />
                          <text
                            x={x}
                            y={y - 25}
                            textAnchor="middle"
                            fill="rgba(255, 255, 255, 0.95)"
                            fontSize="15"
                            fontWeight="700"
                            className="drop-shadow-md"
                          >
                            {value}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* X-axis labels */}
                    {lineChartData.labels.map((label, idx) => {
                      const x = 80 + (idx / (lineChartData.labels.length - 1)) * 840;
                      return (
                        <g key={label}>
                          <text
                            x={x}
                            y="320"
                            textAnchor="middle"
                            fill="rgba(255, 255, 255, 0.8)"
                            fontSize="13"
                            fontWeight="600"
                            className="uppercase tracking-wide"
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

