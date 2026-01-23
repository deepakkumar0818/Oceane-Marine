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

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export default function RiskAssessmentListPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUpload, setSelectedUpload] = useState(null);

  const fetchUploads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qhse/moc/risk-assessment/list");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load uploads");
      }
      setUploads(data.data || []);
      if (selectedUpload) {
        const updated = (data.data || []).find(
          (u) => u._id === selectedUpload._id
        );
        if (updated) setSelectedUpload(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // Group uploads by date
  const groupByDate = (uploads) => {
    const grouped = {};
    uploads.forEach((upload) => {
      const date = new Date(upload.createdAt || upload.uploadedAt);
      const dateKey = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(upload);
    });
    return grouped;
  };

  // Sort dates in descending order (newest first)
  const sortedDateGroups = Object.entries(groupByDate(uploads)).sort(
    (a, b) => {
      // Get the first upload's date from each group for comparison
      const dateA = new Date(a[1][0]?.createdAt || a[1][0]?.uploadedAt || 0);
      const dateB = new Date(b[1][0]?.createdAt || b[1][0]?.uploadedAt || 0);
      return dateB - dateA;
    }
  );

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download file");
    }
  };

  const handleDelete = async (uploadId) => {
    if (!confirm("Are you sure you want to delete this upload?")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/qhse/moc/risk-assessment/${uploadId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete upload");
      }

      await fetchUploads();
      setSelectedUpload(null);
      alert("Upload deleted successfully!");
    } catch (err) {
      setError(err.message);
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
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / MOC / Risk Assessment
            </p>
            <h1 className="text-2xl font-bold">My Uploads</h1>
            <p className="text-xs text-slate-200 mt-1">
              View and manage your uploaded risk assessment files
            </p>
          </div>

          {/* Top-right Form/List toggle */}
          {!selectedUpload && (
            <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
              <Link
                href="/qhse/moc/risk-assessment/form"
                className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Risk Form
              </Link>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition cursor-default"
              >
                Risk List
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        <main className="space-y-6">
          {uploads.length === 0 ? (
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-white/60 mb-2">No uploads found</p>
              <p className="text-sm text-slate-400 mb-4">
                Start by uploading your risk assessment files
              </p>
              <Link
                href="/qhse/moc/risk-assessment/form"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition"
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
                Upload Files
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDateGroups.map(([date, dateUploads]) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <h2 className="text-sm font-semibold text-sky-300 uppercase tracking-wider px-4">
                      {date}
                    </h2>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>

                  {/* Files for this date */}
                  <div className="space-y-3">
                    {dateUploads.map((upload) => (
                      <div
                        key={upload._id}
                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/50">
                                <svg
                                  className="h-6 w-6 text-sky-400"
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
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-white truncate">
                                  {upload.title || "Risk Assessment Upload"}
                                </h3>
                                <span className="text-xs text-slate-400">
                                  {formatDateTime(upload.createdAt || upload.uploadedAt)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                <span>
                                  {upload.files?.length || 0} file
                                  {(upload.files?.length || 0) !== 1 ? "s" : ""}
                                </span>
                                {upload.totalSize && (
                                  <span>
                                    Total: {formatFileSize(upload.totalSize)}
                                  </span>
                                )}
                              </div>
                              {upload.files && upload.files.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {upload.files.map((file, index) => (
                                    <div
                                      key={file._id || index}
                                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <svg
                                          className="h-4 w-4 text-sky-400 shrink-0"
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
                                        <span className="text-xs text-white truncate">
                                          {file.name || file.filename || `File ${index + 1}`}
                                        </span>
                                        {file.size && (
                                          <span className="text-xs text-slate-400 shrink-0">
                                            ({formatFileSize(file.size)})
                                          </span>
                                        )}
                                      </div>
                                      {file.url && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDownload(file.url, file.name || file.filename)
                                          }
                                          className="shrink-0 ml-2 px-3 py-1 text-xs rounded-lg border border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition"
                                        >
                                          Download
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDelete(upload._id)}
                              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                              aria-label="Delete upload"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


