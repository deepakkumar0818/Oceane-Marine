"use client";

import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import QHSEPage from "./QHSE/page";

export default function QHSECharts() {
  const [nearMissStats, setNearMissStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
  });

  const [loading, setLoading] = useState(true);

  console.log("QHSECharts - nearMissStats:", nearMissStats);
  console.log("QHSECharts - loading:", loading);

  /* ===============================
     MEMOIZED CALLBACK TO PREVENT INFINITE LOOP
  ================================ */
  const handleStatsLoaded = useCallback((stats) => {
    setNearMissStats(stats);
    setLoading(false);
  }, []);

  const nearMissCard = {
    moduleName: "Near-Miss",
    label: "Near-Miss Reports",
    total: loading ? "..." : nearMissStats.total.toString(),
    pending: loading ? "..." : nearMissStats.pending.toString(),
    reviewed: loading ? "..." : nearMissStats.reviewed.toString(),
    tone: "sky",
  };

  return (
    <>
      {/* CHILD DOES FETCH AND SENDS DATA UP */}
      <QHSEPage onStatsLoaded={handleStatsLoaded} />

      {/* EXISTING UI — UNCHANGED */}
      <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">QHSE Dashboard</h2>
            <p className="text-sm text-slate-300">
              QHSE module statistics and overview.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            moduleName={nearMissCard.moduleName}
            label={nearMissCard.label}
            total={nearMissCard.total}
            pending={nearMissCard.pending}
            reviewed={nearMissCard.reviewed}
            tone={nearMissCard.tone}
            icon={nearMissCard.icon}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}

function ModuleCard({
  moduleName,
  label,
  total,
  pending,
  reviewed,
  tone = "sky",
  icon = "",
  loading = false,
}) {
  const toneClasses = {
    orange:
      "bg-gradient-to-br from-orange-500/25 via-orange-500/10 to-orange-500/5 text-orange-50 border-orange-400/40 shadow-orange-500/20 hover:shadow-orange-500/30 transition-shadow",
    sky: "bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 text-sky-50 border-sky-400/40 shadow-sky-500/20 hover:shadow-sky-500/30 transition-shadow",
    emerald:
      "bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-emerald-500/5 text-emerald-50 border-emerald-400/40 shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow",
  };

  return (
    <div
      className={`rounded-2xl border ${toneClasses[tone]} px-5 py-6 backdrop-blur shadow-lg hover:scale-[1.02] transition-transform`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-white/80 mb-1">
            {moduleName}
          </p>
          <p className="text-sm font-semibold text-white">{label}</p>
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {/* Statistics Display - Always show all three values */}
      <div className="space-y-4">
        {/* Total Count */}
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70 mb-1">
            Total Near-Misses
          </p>
          <p className={`text-4xl font-bold ${loading ? "animate-pulse" : ""}`}>
            {total}
          </p>
        </div>

        {/* Breakdown - Always visible */}
        <div className="space-y-3 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">
              Under Review
            </span>
            <span
              className={`text-2xl font-bold text-orange-200 ${
                loading ? "animate-pulse" : ""
              }`}
            >
              {pending}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">Reviewed</span>
            <span
              className={`text-2xl font-bold text-emerald-200 ${
                loading ? "animate-pulse" : ""
              }`}
            >
              {reviewed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

ModuleCard.propTypes = {
  moduleName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  total: PropTypes.string.isRequired,
  pending: PropTypes.string.isRequired,
  reviewed: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["orange", "sky", "emerald"]),
  icon: PropTypes.string,
  loading: PropTypes.bool,
};
