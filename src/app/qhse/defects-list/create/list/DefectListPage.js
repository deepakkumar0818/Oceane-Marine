"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

// Generate dynamic years
function getYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i < currentYear; i++) years.push(i);
  for (let i = currentYear; i <= currentYear + 5; i++) years.push(i);
  return years;
}

export default function DefectListPage() {
  const currentYear = new Date().getFullYear();
  const initialYears = getYears();
  
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [availableYears, setAvailableYears] = useState(initialYears);
  const [loadingYears, setLoadingYears] = useState(true);
  const [year, setYear] = useState(currentYear);

  // Fetch available years
  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      try {
        const res = await fetch("/api/qhse/defects-list/list");
        const data = await res.json();
        if (res.ok && Array.isArray(data.years)) {
          const merged = Array.from(
            new Set([...initialYears, ...data.years])
          ).sort((a, b) => b - a);
          setAvailableYears(merged);
          if (merged.length > 0 && !merged.includes(year)) {
            setYear(merged[0]);
          }
        }
      } finally {
        setLoadingYears(false);
      }
    };
    loadYears();
  }, []);

  const fetchDefects = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = year 
        ? `/api/qhse/defects-list/list?year=${year}`
        : "/api/qhse/defects-list/list";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load defects list");
      }
      setDefects(data.equipmentDefects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [year]);

  const handleClose = async (id) => {
    setActionLoadingId(id);
    setActionMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/qhse/defects-list/${id}/update`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to close defect");
      }
      setActionMessage("Defect closed successfully.");
      // Refresh list
      await fetchDefects();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Defects List
            </p>
            <h1 className="text-2xl font-bold">Equipment Defects List</h1>
            <p className="text-xs text-slate-200 mt-1">
              View all recorded equipment defects, their status, and completion dates. You can close open defects from here.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-200">
                Year
              </span>
              <select
                className="theme-select rounded-full px-3 py-1 text-xs tracking-widest uppercase"
                value={year || ""}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={loadingYears || availableYears.length === 0}
              >
                {(() => {
                  if (loadingYears) return <option>Loading...</option>;
                  if (availableYears.length === 0) return <option>No data</option>;
                  return availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
              <Link
                href="/qhse/defects-list/create/plan"
                className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Create Defect
              </Link>
              <Link
                href="/qhse/defects-list/create/list"
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
              >
                Defect List
              </Link>
            </div>
          </div>
        </header>

        <main>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-4">
            {error && (
              <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {actionMessage && (
              <p className="text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-3 py-2">
                {actionMessage}
              </p>
            )}

            {loading ? (
              <p className="text-sm text-slate-100">Loading defects…</p>
            ) : defects.length === 0 ? (
              <p className="text-sm text-slate-100">
                {year ? `No equipment defects found for ${year}.` : "No equipment defects found."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-200 border-b border-white/10">
                      <th className="py-2 pr-4">Form Code</th>
                      <th className="py-2 pr-4">Equipment Defect</th>
                      <th className="py-2 pr-4">Base</th>
                      <th className="py-2 pr-4">Action Required</th>
                      <th className="py-2 pr-4">Target Date</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Completion Date</th>
                      <th className="py-2 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defects.map((defect) => (
                      <tr
                        key={defect._id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-2 pr-4">
                          {defect.formCode || "—"}
                        </td>
                        <td className="py-2 pr-4 max-w-xs">
                          <p className="line-clamp-2">
                            {defect.equipmentDefect}
                          </p>
                        </td>
                        <td className="py-2 pr-4">{defect.base}</td>
                        <td className="py-2 pr-4 max-w-xs">
                          <p className="line-clamp-2">
                            {defect.actionRequired}
                          </p>
                        </td>
                        <td className="py-2 pr-4">
                          {formatDate(defect.targetDate)}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                              defect.status === "Closed"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/40"
                                : "bg-amber-500/15 text-amber-300 border border-amber-400/40"
                            }`}
                          >
                            {defect.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {formatDate(defect.completionDate)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {defect.status === "Open" ? (
                            <button
                              type="button"
                              onClick={() => handleClose(defect._id)}
                              className="inline-flex items-center rounded-full bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] shadow disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={actionLoadingId === defect._id}
                            >
                              {actionLoadingId === defect._id
                                ? "Closing..."
                                : "Close"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

