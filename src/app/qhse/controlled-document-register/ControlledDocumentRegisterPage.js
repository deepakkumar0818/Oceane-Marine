"use client";

import { useEffect, useState } from "react";

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 3; y <= currentYear + 2; y++) years.push(y);
  return years;
}

export default function ControlledDocumentRegisterPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [seeding, setSeeding] = useState(false);

  const yearOptions = getYearOptions();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/qhse/controlled-document-register/list?year=${year}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.data || []);
      if (Array.isArray(data.years) && data.years.length > 0) {
        setAvailableYears(data.years);
      }
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    try {
      const res = await fetch("/api/qhse/controlled-document-register/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      await fetchData();
    } catch (err) {
      setError(err.message || "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE
            </p>
            <h1 className="text-2xl font-bold">Controlled document register</h1>
            <p className="text-xs text-slate-200 mt-1">
              Index of all QHSE forms and documents. Filter by year.
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
                {(availableYears.length ? availableYears : yearOptions).map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>
            {items.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="rounded-full bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {seeding ? "Loading…" : "Load default register"}
              </button>
            )}
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
              No documents for this year. Use &quot;Load default register&quot;
              to load the standard QHSE document list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-slate-200 border-collapse">
                <thead>
                  <tr className="bg-[#366092] text-white">
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-12">
                      No
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide">
                      Form code
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide min-w-[200px]">
                      Title
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-16">
                      Version
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-24">
                      Effective date
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-24">
                      Last revised
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-16">
                      Author
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-20">
                      Type
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-16">
                      Rev
                    </th>
                    <th className="border border-slate-400/50 px-3 py-2.5 font-semibold uppercase tracking-wide w-20">
                      Format
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((row, index) => (
                    <tr
                      key={row._id}
                      className="hover:bg-white/5 bg-slate-800/30"
                    >
                      <td className="border border-slate-400/40 px-3 py-2">
                        {index + 1}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2 font-mono text-sky-300">
                        {row.formCode || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.title || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.version || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.effectiveDate || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.lastRevisedDate || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.author || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.department || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.revisionNumber || "—"}
                      </td>
                      <td className="border border-slate-400/40 px-3 py-2">
                        {row.format || "—"}
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
