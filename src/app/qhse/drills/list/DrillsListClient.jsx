"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function DrillsListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/qhse/drill/list");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load drill data");
        }
        setRows(data.data || []);
      } catch (err) {
        setError(err.message || "Failed to load drill data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                QHSE / Drills
              </p>
              <h1 className="text-2xl font-bold">Drill Plans & Reports</h1>
              <p className="text-xs text-slate-200 mt-1">
                Year-wise drill plans with quarter-wise reports
              </p>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            <Link
              href="/qhse/drills/create/plan"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Create Plan
            </Link>
            <Link
              href="/qhse/drills/create/report"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Create Report
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-slate-300">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-300">No drill plans found.</div>
          ) : (
            rows.map((yearRow) => (
              <div
                key={yearRow.year}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {yearRow.year}{" "}
                      {yearRow.formCode ? `• ${yearRow.formCode}` : ""}
                    </h2>
                    <p className="text-xs text-slate-300">
                      Plan & reports grouped by quarter
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {QUARTERS.map((q) => {
                    const entry =
                      yearRow.quarters?.find((r) => r.quarter === q) || {};
                    const plan = entry.planItem;
                    const report = entry.report;
                    return (
                      <div
                        key={q}
                        className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">
                            {q}
                          </div>
                          {plan?.status && (
                            <span className="text-[11px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-200">
                              {plan.status}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400">Planned:</span>{" "}
                            {plan?.plannedDate
                              ? new Date(plan.plannedDate).toLocaleDateString()
                              : "—"}
                          </div>
                          <div>
                            <span className="text-slate-400">Topic:</span>{" "}
                            {plan?.topic || "—"}
                          </div>
                          <div>
                            <span className="text-slate-400">Instructor:</span>{" "}
                            {plan?.instructor || "—"}
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-3">
                          <div className="text-xs text-slate-400 mb-1">
                            Report
                          </div>
                          {report ? (
                            <div className="space-y-1 text-xs text-slate-200">
                              <div>
                                <span className="text-slate-400">
                                  Drill No:
                                </span>{" "}
                                {report.drillNo}
                              </div>
                              <div>
                                <span className="text-slate-400">Date:</span>{" "}
                                {report.drillDate
                                  ? new Date(
                                      report.drillDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                              <div>
                                <span className="text-slate-400">Status:</span>{" "}
                                {report.status || "—"}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">
                              No report yet.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
