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

export default function PoacCrossCompetencyListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        latestOnly: "true",
      });

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await fetch(
        `/api/qhse/cross-competency/list?${params.toString()}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load forms");
      }

      setForms(data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [currentPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchForms();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: "bg-slate-500/15 text-slate-300 border-slate-400/40",
      Submitted: "bg-blue-500/15 text-blue-300 border-blue-400/40",
      Reviewed: "bg-purple-500/15 text-purple-300 border-purple-400/40",
      Approved: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
    };

    const className = statusConfig[status] || statusConfig.Draft;

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] border ${className}`}
      >
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(forms.length / itemsPerPage) || 1;

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / POAC Cross Competency
            </p>
            <h1 className="text-2xl font-bold">
              POAC Cross Competency Forms
            </h1>
            <p className="text-xs text-slate-200 mt-1">
              View all POAC Cross Competency evaluation forms
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/poac/cross-competency/form"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              POAC Form
            </Link>
            <Link
              href="/qhse/poac/cross-competency/list"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              POAC List
            </Link>
          </div>
        </header>

        <main>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search by Form Code, Job Ref No, or POAC Name..."
                  className="w-full rounded-xl bg-slate-900/40 border border-white/15 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="rounded-xl bg-slate-900/40 border border-white/15 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-slate-300">Loading forms...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-slate-300 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "No forms found matching your criteria."
                    : "No POAC Cross Competency forms found."}
                </p>
                <Link
                  href="/qhse/poac/cross-competency/form"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  Create First Form
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-200 border-b border-white/10">
                        <th className="py-3 pr-4 font-semibold">Form Code</th>
                        <th className="py-3 pr-4 font-semibold">POAC Name</th>
                        <th className="py-3 pr-4 font-semibold">
                          Job Ref No
                        </th>
                        <th className="py-3 pr-4 font-semibold">
                          Evaluation Date
                        </th>
                        <th className="py-3 pr-4 font-semibold">Lead POAC</th>
                        <th className="py-3 pr-4 font-semibold">Version</th>
                        <th className="py-3 pr-4 font-semibold">Status</th>
                        <th className="py-3 pr-4 font-semibold">
                          Created At
                        </th>
                        <th className="py-3 pr-4 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((form) => (
                        <tr
                          key={form._id}
                          className="border-b border-white/5 hover:bg-white/5 transition"
                        >
                          <td className="py-3 pr-4">
                            <span className="font-mono text-sky-300">
                              {form.formCode || "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-slate-200">
                              {form.nameOfPOAC || "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-slate-200">
                              {form.jobRefNo || "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {formatDate(form.evaluationDate)}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-slate-200">
                              {form.leadPOAC || "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-slate-300 font-mono text-[10px]">
                              v{form.version || "1.0"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {getStatusBadge(form.status || "Draft")}
                          </td>
                          <td className="py-3 pr-4">
                            {formatDate(form.createdAt)}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/qhse/poac/cross-competency/${form._id}`}
                                className="inline-flex items-center rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300 transition"
                              >
                                View
                              </Link>
                              {form.status === "Draft" && (
                                <Link
                                  href={`/qhse/poac/cross-competency/form?edit=${form._id}`}
                                  className="inline-flex items-center rounded-full bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300 transition"
                                >
                                  Edit
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-300">
                      Showing page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


