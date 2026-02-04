"use client";

import { useEffect, useState } from "react";

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) years.push(y);
  return years;
}

export default function ArchivePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  const yearOptions = getYearOptions();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/qhse/archive/list?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) throw new Error(data.error || "Failed to load");
        setItems(data.data || []);
        if (Array.isArray(data.years) && data.years.length > 0) {
          setAvailableYears(data.years);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [year]);

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE
            </p>
            <h1 className="text-2xl font-bold">Archive</h1>
            <p className="text-xs text-slate-200 mt-1">
              Year-wise list of files and documents removed from QHSE modules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-200">
              Year
            </span>
            <select
              className="theme-select rounded-full px-3 py-1 text-xs tracking-widest uppercase bg-slate-800 border border-white/20 text-white"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {(availableYears.length ? availableYears : yearOptions).map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-300 text-sm">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-300 text-sm">
              No archived files for this year.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200 border-collapse">
                <thead>
                  <tr className="bg-[#366092] text-white">
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide">
                      Module
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide">
                      Document type
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide">
                      Form code
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide min-w-[180px]">
                      Title
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-32">
                      Archived on
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-24">
                      File
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((row) => (
                    <tr
                      key={row._id}
                      className="hover:bg-white/5 bg-slate-800/30"
                    >
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.module || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.documentType || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2 font-mono text-sky-300">
                        {row.formCode || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.title || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.archivedAt
                          ? new Date(row.archivedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {(row.fileUrl || row.filePath) ? (
                          <a
                            href={row.fileUrl || row.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-300 hover:text-sky-200 text-xs font-semibold"
                          >
                            Download
                          </a>
                        ) : (
                          "—"
                        )}
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
