"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuditInspectionPlannerListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(null);
  const [year, setYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (year) {
        params.append("year", year.toString());
      }
      const url = `/api/qhse/audit-inspection-planner/list${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load planners");
      setItems(data.data || []);
      if (data.years && data.years.length > 0) {
        setAvailableYears(data.years);
      }
    } catch (err) {
      setError(err.message || "Failed to load planners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  useEffect(() => {
    const fetchYears = async () => {
      setLoadingYears(true);
      try {
        const res = await fetch("/api/qhse/audit-inspection-planner/list");
        const data = await res.json();
        if (res.ok && data.years) {
          setAvailableYears(data.years);
        } else {
          setAvailableYears(getYears());
        }
      } catch (err) {
        setAvailableYears(getYears());
      } finally {
        setLoadingYears(false);
      }
    };
    fetchYears();
  }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    setError("");
    try {
      const res = await fetch("/api/qhse/audit-inspection-planner/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Approved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 ml-72 flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Audit & Inspection Planner
            </p>
            <h1 className="text-2xl font-bold">Audit & Inspection Planners</h1>
            <p className="text-xs text-slate-200 mt-1">View saved planners</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Year Filter */}
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
                {availableYears.length === 0 ? (
                  <option>No data</option>
                ) : (
                  availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
              <Link
                href="/qhse/audit-inspection-planner/form"
                className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Planner Form
              </Link>
              <Link
                href="/qhse/audit-inspection-planner/list"
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
              >
                Planner List
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <main>
          {items.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5">
              <p className="text-white/60 mb-2">
                {year ? `No planners found for ${year}` : "No planners found"}
              </p>
              <Link
                href="/qhse/audit-inspection-planner/form"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition"
              >
                Create Planner
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-200 border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 font-semibold">Form Code</th>
                      <th className="px-6 py-4 font-semibold">Version</th>
                      <th className="px-6 py-4 font-semibold">Rev</th>
                      <th className="px-6 py-4 font-semibold">Issue Date</th>
                      <th className="px-6 py-4 font-semibold">Categories / Rows</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Created</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b border-white/5">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sky-300">{item.formCode}</span>
                        </td>
                        <td className="px-6 py-4">v{item.version}</td>
                        <td className="px-6 py-4">{item.rev}</td>
                        <td className="px-6 py-4">
                          {item.issueDate ? new Date(item.issueDate).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {(item.categories || []).map((cat) => (
                            <div key={cat.key} className="text-xs text-slate-200">
                              {cat.title}: {(cat.rows || []).length} rows
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4">{item.status}</td>
                        <td className="px-6 py-4 text-right">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString("en-GB")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/qhse/audit-inspection-planner/view/${item._id}`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-blue-400/40 text-blue-200 bg-blue-500/15 hover:bg-blue-500/25"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleApprove(item._id)}
                              disabled={item.status === "Approved" || approving === item._id}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${
                                item.status === "Approved"
                                  ? "opacity-60 cursor-not-allowed border-white/10 text-white/60"
                                  : "bg-emerald-500/15 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25"
                              } ${approving === item._id ? "animate-pulse" : ""}`}
                            >
                              {approving === item._id ? "Approving..." : "Approve"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

