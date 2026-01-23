"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function KpiListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [years, setYears] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  // Fetch available years once (no filter) and default to latest if available
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch(`/api/qhse/kpi/list`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.years) && data.years.length > 0) {
          setYears(data.years);
          setYear(data.years[0]);
        }
      } catch (err) {
        // ignore years fetch error; handled in items fetch
      }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    if (!year) return;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/qhse/kpi/list?year=${year ?? ""}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load files");
        setItems(data.data || []);
      } catch (err) {
        setError(err.message || "Failed to load files");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / KPI
            </p>
            <h1 className="text-2xl font-bold">HSE Objectives & Targets</h1>
            <p className="text-xs text-slate-200 mt-1">Uploaded files</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-200">
                Year
              </span>
              <select
                className="theme-select rounded-full px-3 py-1 text-xs tracking-widest uppercase"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {(years.length ? years : [year]).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/kpi/create"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              KPI Upload
            </Link>
            <Link
              href="/qhse/kpi/list"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              KPI List
            </Link>
          </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          {loading ? (
            <p className="text-sm text-slate-300">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-300">No uploads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200">
                <thead className="text-xs uppercase tracking-wide text-slate-300 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">File name</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-white">
                        {item.originalName || item.filename || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.size
                          ? `${(item.size / 1024).toFixed(1)} KB`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <Link
                          href={`/api/qhse/kpi/${item._id}/download`}
                          className="text-sky-300 hover:text-sky-200 text-xs font-semibold"
                        >
                          Download
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
