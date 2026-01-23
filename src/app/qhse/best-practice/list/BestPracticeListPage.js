"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BestPracticeListPage() {
  const [bestPractices, setBestPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/qhse/best-practice/list");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setBestPractices(data.bestPractices || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Best Practices
            </p>
            <h1 className="text-2xl font-bold">Best Practices List</h1>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/best-practice/create"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Create Best Practice
            </Link>
            <Link
              href="/qhse/best-practice/list"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Best Practice List
            </Link>
          </div>
        </header>

        <main>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl">
            {error && (
              <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            {loading ? (
              <p className="text-sm text-slate-100">Loading...</p>
            ) : bestPractices.length === 0 ? (
              <p className="text-sm text-slate-100">No records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-200 border-b border-white/10">
                      <th className="py-3 pr-4 font-semibold">Form Code</th>
                      <th className="py-3 pr-4 font-semibold">Event Date</th>
                      <th className="py-3 pr-4 font-semibold">Description</th>
                      <th className="py-3 pr-4 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestPractices.map((practice) => (
                      <tr
                        key={practice._id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-3 pr-4">
                          <span className="font-mono text-sky-300">
                            {practice.formCode || "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(practice.eventDate)}
                        </td>
                        <td className="py-3 pr-4 max-w-2xl">
                          <p className="text-slate-200">
                            {practice.description || "—"}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(practice.createdAt)}
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

