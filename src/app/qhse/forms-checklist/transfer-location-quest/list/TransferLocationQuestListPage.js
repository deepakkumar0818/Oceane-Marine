"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransferLocationQuestListPage() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/qhse/form-checklist/transfer-location-quest/list"
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load forms");
      }
      // Sort by uploadedAt descending (newest first)
      const sorted = (data.data || []).sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
      setForms(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDownload = async (form) => {
    setDownloading(form._id);
    try {
      const res = await fetch(
        `/api/qhse/form-checklist/transfer-location-quest/${form._id}/download`
      );

      if (!res.ok) {
        throw new Error("Failed to download file");
      }

      // Get blob and create download
      const blob = await res.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `transfer-location-quest-v${form.version}.docx`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError(err.message || "Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  const handleEdit = (form) => {
    // Navigate to form with form data for editing (creates new version)
    router.push(
      `/qhse/forms-checklist/transfer-location-quest/form?edit=${form._id}`
    );
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
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Forms & Checklist / Transfer Location Quest
            </p>
            <h1 className="text-2xl font-bold">Transfer Location Questionnaires</h1>
            <p className="text-xs text-slate-200 mt-1">
              View and manage all transfer location questionnaires
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/forms-checklist/transfer-location-quest/form"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              TLQ Form
            </Link>
            <Link
              href="/qhse/forms-checklist/transfer-location-quest/list"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              TLQ List
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <main>
          {forms.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/20 border border-sky-500/50">
                  <svg
                    className="h-8 w-8 text-sky-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-white/60 mb-2">No questionnaires found</p>
              <p className="text-sm text-slate-400 mb-4">
                Start by uploading your first transfer location questionnaire
              </p>
              <Link
                href="/qhse/forms-checklist/transfer-location-quest/form"
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload Questionnaire
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-200 border-b border-white/10 bg-white/5">
                      <th className="px-6 py-4 font-semibold">Form Code</th>
                      <th className="px-6 py-4 font-semibold">
                        Location Name
                      </th>
                      <th className="px-6 py-4 font-semibold">Version</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Uploaded By</th>
                      <th className="px-6 py-4 font-semibold">Uploaded At</th>
                      <th className="px-6 py-4 font-semibold text-right">
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
                        <td className="px-6 py-4">
                          <span className="font-mono text-sky-300">
                            {form.formCode || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200">
                            {form.locationName || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sky-300">
                            v{form.version || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatDate(form.date)}</td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200">
                            {form.uploadedBy?.name || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {formatDateTime(form.uploadedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownload(form)}
                              disabled={downloading === form._id}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {downloading === form._id ? (
                                <>
                                  <svg
                                    className="h-3 w-3 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  Download
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEdit(form)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-300 transition"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
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


