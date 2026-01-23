"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const defaultCategories = [
  { key: "stsBaseAudit", title: "STS Base Audit" },
  { key: "stsTransferAudit", title: "STS Transfer Audit" },
  { key: "poacCrossCompetency", title: "POAC Cross Competency Evaluation" },
  { key: "supportCraftInspection", title: "STS Support Craft Inspection" },
  { key: "officeInternalAudit", title: "Office Internal Audit" },
];

const columns = [
  { key: "description", label: "Audit / Inspection Description" },
  { key: "frequency", label: "Frequency" },
  { key: "dueBy", label: "Due by" },
  { key: "status", label: "Status" },
  { key: "auditorName", label: "Auditor Name" },
  { key: "auditDate", label: "Audit Date" },
  { key: "remarks", label: "Remarks" },
  { key: "file", label: "File Upload" },
];

export default function AuditInspectionPlannerFormPage() {
  const [formMeta] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    approvedBy: "JS",
  });
  const [formCode, setFormCode] = useState("");
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("Draft");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rowsByCategory, setRowsByCategory] = useState(() =>
    Object.fromEntries(defaultCategories.map((c) => [c.key, []]))
  );
  const [filesByRowId, setFilesByRowId] = useState({});

  const categories = useMemo(
    () =>
      defaultCategories.map((cat) => ({
        ...cat,
        rows: rowsByCategory[cat.key] || [],
      })),
    [rowsByCategory]
  );

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const res = await fetch("/api/qhse/audit-inspection-planner/code");
        const data = await res.json();
        if (res.ok && data.formCode) {
          setFormCode(data.formCode);
          setVersion(data.version || "1.0");
        } else {
          setError(data.error || "Failed to generate form code");
        }
      } catch (err) {
        setError(err.message || "Failed to generate form code");
      }
    };
    fetchCode();
  }, []);

  const addRow = (catKey) => {
    const rowId = crypto.randomUUID();
    setRowsByCategory((prev) => ({
      ...prev,
      [catKey]: [
        ...(prev[catKey] || []),
        {
          id: rowId,
          rowId: rowId,
          description: "",
          frequency: "",
          dueBy: "",
          status: "",
          auditorName: "",
          auditDate: "",
          remarks: "",
        },
      ],
    }));
  };

  const updateCell = (catKey, rowId, field, value) => {
    setRowsByCategory((prev) => ({
      ...prev,
      [catKey]: (prev[catKey] || []).map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleFileChange = (rowId, file) => {
    if (file) {
      // Validate file size (25MB max)
      if (file.size > 25 * 1024 * 1024) {
        setError(`File size exceeds 25MB limit for this row`);
        return;
      }

      // Validate file type
      const allowedExts = [".pdf", ".xlsx", ".xls", ".csv", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
      const ext = "." + file.name.split(".").pop().toLowerCase();
      if (!allowedExts.includes(ext)) {
        setError(`Invalid file type. Allowed: ${allowedExts.join(", ")}`);
        return;
      }

      setFilesByRowId((prev) => ({
        ...prev,
        [rowId]: file,
      }));
      setError("");
    }
  };

  const handleRemoveFile = (rowId) => {
    setFilesByRowId((prev) => {
      const newFiles = { ...prev };
      delete newFiles[rowId];
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Prepare form data
      const formData = new FormData();

      // Prepare categories with rowId
      const categoriesData = categories.map((cat) => ({
        key: cat.key,
        title: cat.title,
        rows: (cat.rows || []).map(({ id, ...rest }) => ({
          ...rest,
          rowId: rest.rowId || id, // Ensure rowId is present
        })),
      }));

      // Add JSON data
      const payload = {
        issueDate: formMeta.issueDate,
        approvedBy: formMeta.approvedBy,
        categories: categoriesData,
      };

      formData.append("data", JSON.stringify(payload));

      // Add files
      Object.entries(filesByRowId).forEach(([rowId, file]) => {
        if (file) {
          formData.append(`file_${rowId}`, file);
        }
      });

      const res = await fetch("/api/qhse/audit-inspection-planner/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save planner");

      setSuccess(`Planner saved successfully. Form code: ${data?.data?.formCode || "—"}`);
      // update displayed formCode with the server-assigned value
      if (data?.data?.formCode) {
        setFormCode(data.data.formCode);
      }

      // Clear files after successful submission
      setFilesByRowId({});

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to save planner");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Audit & Inspection Planner
            </p>
            <h1 className="text-2xl font-bold">Audit & Inspection Planner</h1>
            <p className="text-xs text-slate-200 mt-1">
              Auto-generated form code and row-by-row planner per category
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/audit-inspection-planner/form"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Planner Form
            </Link>
            <Link
              href="/qhse/audit-inspection-planner/list"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Planner List
            </Link>
          </div>
        </header>

        {(error || success) && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              error
                ? "bg-red-950/40 border-red-500/40 text-red-200"
                : "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
            }`}
          >
            {error || success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap gap-4 justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Form Metadata</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Issue Date {formMeta.issueDate} • Approved by {formMeta.approvedBy}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">Form Code</p>
                <p className="text-xl font-bold text-white">{formCode || "—"}</p>
                <p className="text-xs text-slate-400">Version {version}</p>
              </div>
            </div>
          </section>

          {categories.map((cat) => (
            <section
              key={cat.key}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="bg-white/10 px-6 py-3 font-semibold text-white">
                {cat.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-200 border-b border-white/10 bg-white/5">
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 font-semibold">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cat.rows || []).map((row) => {
                      const rowId = row.rowId || row.id;
                      const file = filesByRowId[rowId];
                      return (
                        <tr key={row.id} className="border-b border-white/5">
                          {columns.map((col) => {
                            if (col.key === "file") {
                              return (
                                <td key={col.key} className="px-4 py-2 min-w-[180px]">
                                  <div className="space-y-2">
                                    {file ? (
                                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                                        <div className="flex-shrink-0">
                                          <svg
                                            className="h-5 w-5 text-emerald-400"
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
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-white truncate font-medium">
                                            {file.name}
                                          </p>
                                          <p className="text-[10px] text-slate-400">
                                            {formatFileSize(file.size)}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveFile(rowId)}
                                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 transition flex-shrink-0"
                                          title="Remove file"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="block">
                                        <input
                                          type="file"
                                          onChange={(e) =>
                                            handleFileChange(rowId, e.target.files?.[0] || null)
                                          }
                                          accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png"
                                          className="hidden"
                                        />
                                        <div className="cursor-pointer px-3 py-2 rounded-lg bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-white/30 transition text-xs text-white text-center flex items-center justify-center gap-1.5">
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
                                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                          </svg>
                                          Upload File
                                        </div>
                                      </label>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={col.key} className="px-4 py-2">
                                <input
                                  type={col.key === "auditDate" ? "date" : "text"}
                                  value={row[col.key] || ""}
                                  onChange={(e) =>
                                    updateCell(cat.key, row.id, col.key, e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-xs"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => addRow(cat.key)}
                  className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition"
                >
                  + Add Row
                </button>
              </div>
            </section>
          ))}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            <Link
              href="/qhse/audit-inspection-planner/list"
              className="px-6 py-3 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Planner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

