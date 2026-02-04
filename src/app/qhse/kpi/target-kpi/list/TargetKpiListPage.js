"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function getYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 5; i++) years.push(i);
  return years;
}

export default function TargetKpiListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/qhse/kpi/target/list?year=${year}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setItems(data.data || []);
        if (Array.isArray(data.years) && data.years.length > 0) {
          setAvailableYears(data.years);
          if (!data.years.includes(year)) setYear(data.years[0] ?? year);
        } else {
          setAvailableYears(getYears());
        }
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  const years = availableYears.length > 0 ? availableYears : getYears();

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / KPI / Target KPI
            </p>
            <h1 className="text-2xl font-bold">Target KPI List</h1>
            <p className="text-xs text-slate-200 mt-1">
              Saved Target KPIs. Filter by year.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-200">
                Year
              </span>
              <select
                className="theme-select rounded-full px-3 py-1 text-xs tracking-widest uppercase bg-slate-800 border border-white/20 text-white"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
                <Link
                  href="/qhse/kpi/create"
                  className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  KPI
                </Link>
                <Link
                  href="/qhse/kpi/target-kpi/form"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
                >
                  Target KPI
                </Link>
              </div>
              <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
                <Link
                  href="/qhse/kpi/target-kpi/form"
                  className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  Form
                </Link>
                <Link
                  href="/qhse/kpi/target-kpi/list"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
                >
                  List
                </Link>
              </div>
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
            <p className="text-sm text-slate-300">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-300">
              No Target KPIs for this year. Create one from Target KPI form.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200">
                <thead className="text-xs uppercase tracking-wide text-slate-300 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Form code</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono font-medium text-sky-300">
                        {item.formCode || "—"}
                      </td>
                      <td className="px-4 py-3">{item.year ?? "—"}</td>
                      <td className="px-4 py-3">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/qhse/kpi/target-kpi/view/${String(item._id ?? "")}`}
                          className="text-sky-300 hover:text-sky-200 text-xs font-semibold"
                        >
                          View
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
