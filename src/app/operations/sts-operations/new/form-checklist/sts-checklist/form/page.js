"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const sidebarTabs = [
  {
    key: "documentation",
    label: "Documentation",
    href: "/operations/sts-operations/new",
  },
  {
    key: "compatibility",
    label: "Compatibility",
    href: "/operations/sts-operations/new/compatibility",
  },
  {
    key: "forms",
    label: "Forms and checklist",
    submodules: [
      {
        key: "sts-checklist",
        label: "STS Checklist",
        href: "/operations/sts-operations/new/form-checklist/sts-checklist/form",
      },
      {
        key: "jpo",
        label: "JPO",
        href: "/operations/sts-operations/new/form-checklist/jpo/form",
      },
      {
        key: "quotation",
        label: "Quotation",
        href: "/operations/sts-operations/new/form-checklist/quotations/form",
      },
      {
        key: "inspection-checklist",
        label: "Inspection Checklist",
        href: "/operations/sts-operations/new/form-checklist/inspection-checklist/form",
      },
    ],
  },
  {
    key: "cargos",
    label: "Cargo types",
    href: "/operations/sts-operations/new/cargos",
  },
  {
    key: "locations",
    label: "Locations",
    href: "/operations/sts-operations/new/locations",
  },
  {
    key: "mooring",
    label: "Mooring masters",
    href: "/operations/sts-operations/new/mooringmaster",
  },
];

export default function StsChecklistFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const editId = searchParams?.get("edit");
  const fileInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("forms");
  const [expandedModules, setExpandedModules] = useState(new Set(["forms"]));
  const sidebarRef = useRef(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    uploadedBy: "",
  });
  const [formCode, setFormCode] = useState("");
  const [existingRecord, setExistingRecord] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch existing record if editing
  useEffect(() => {
    if (editId) {
      const fetchRecord = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/operations/form-checklist/sts-checklist/list");
          const data = await res.json();
          if (res.ok && data.data) {
            const record = data.data.find((r) => r._id === editId);
            if (record) {
              setExistingRecord(record);
              setFormCode(record.formCode);
              setForm({
                date: record.date
                  ? new Date(record.date).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
                uploadedBy: record.uploadedBy?.name || "",
              });
            } else {
              setError("Record not found");
            }
          }
        } catch (err) {
          setError("Failed to load record");
        } finally {
          setLoading(false);
        }
      };
      fetchRecord();
    } else {
      // Auto-generate formCode on mount for new record
      const fetchFormCode = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/operations/form-checklist/sts-checklist/code");
          const data = await res.json();
          if (res.ok && data.success) {
            setFormCode(data.formCode);
          }
        } catch (err) {
          setError("Failed to generate form code");
        } finally {
          setLoading(false);
        }
      };
      fetchFormCode();
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 25 * 1024 * 1024) {
        setError("File size exceeds 25MB limit");
        return;
      }
      setFile(droppedFile);
      setError("");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!form.date) {
      setError("Please select a date");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!form.uploadedBy?.trim()) {
      setError("Please enter your name");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("date", form.date);
      formData.append("uploadedBy", form.uploadedBy.trim());

      const apiUrl = editId
        ? `/api/operations/form-checklist/sts-checklist/${editId}/update`
        : "/api/operations/form-checklist/sts-checklist/create";

      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setSuccess(
        editId
          ? `File updated successfully! New version created: ${data.version}`
          : `File uploaded successfully! Version: ${data.version}`
      );
      setFile(null);
      setForm({
        date: new Date().toISOString().split("T")[0],
        uploadedBy: "",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        router.push("/operations/sts-operations/new/form-checklist/sts-checklist/list");
      }, 2000);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Left Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/20 shadow-2xl backdrop-blur-md z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "300px" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h2 className="text-lg font-bold text-white">Operations Modules</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition hover:scale-110"
              aria-label="Close sidebar"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent transition-all duration-200">
            <div className="space-y-1.5">
              {sidebarTabs.map((tab) => (
                <div key={tab.key} className="space-y-1">
                  {tab.submodules ? (
                    <>
                      <button
                        onClick={() => {
                          setExpandedModules((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(tab.key)) {
                              newSet.delete(tab.key);
                            } else {
                              newSet.add(tab.key);
                            }
                            return newSet;
                          });
                        }}
                        className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                          activeTab === tab.key
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 scale-[1.02]"
                            : "text-white/90 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 hover:scale-[1.01]"
                        }`}
                      >
                        <span className="flex-1">{tab.label}</span>
                        <span
                          className={`text-sm transition-transform ${
                            expandedModules.has(tab.key) ? "rotate-90" : ""
                          }`}
                        >
                          ▶
                        </span>
                        {activeTab === tab.key && (
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                        )}
                      </button>
                      {expandedModules.has(tab.key) && (
                        <div className="ml-4 space-y-1 mt-1.5 pl-4 border-l-2 border-orange-500/30">
                          {tab.submodules.map((submodule) => {
                            const isActiveSub =
                              pathname.startsWith(submodule.href.split("/form")[0]) ||
                              pathname.startsWith(submodule.href.split("/list")[0]);
                            return (
                              <Link
                                key={submodule.key}
                                href={submodule.href}
                                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                                  isActiveSub
                                    ? "bg-white/20 text-white border-orange-400/50 shadow-md"
                                    : "text-white/80 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-xs">▸</span>
                                  {submodule.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={tab.href}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                        activeTab === tab.key
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 scale-[1.02]"
                          : "text-white/90 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 hover:scale-[1.01]"
                      }`}
                    >
                      <span className="flex-1">{tab.label}</span>
                      {activeTab === tab.key && (
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-800/50">
            <p className="text-[10px] text-slate-400 text-center">
              Operations Management System
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition border border-orange-400/30 shadow-lg shadow-orange-500/30 hover:scale-110"
          aria-label="Open sidebar"
        >
          <span className="text-white text-xl">☰</span>
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 ml-0 md:ml-72">
        <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              Operations / Forms & Checklist / STS Checklist
            </p>
            <h1 className="text-2xl font-bold text-white">
              {editId ? "Update STS Checklist" : "STS Checklist"}
            </h1>
            <p className="text-xs text-slate-200 mt-1">
              {editId
                ? "Upload updated file to create a new version. Current version will be preserved."
                : "Upload STS Checklist file. Form code and version will be auto-generated."}
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/operations/sts-operations/new/form-checklist/sts-checklist/form"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              STS Checklist Form
            </Link>
            <Link
              href="/operations/sts-operations/new/form-checklist/sts-checklist/list"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              STS Checklist List
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-4 py-3 text-emerald-200 text-sm font-medium">
            {success}
          </div>
        )}

        {loading && (
          <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl px-4 py-3 text-blue-200 text-sm font-medium">
            Generating form code...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">
              Basic Information
            </h2>

            {existingRecord && (
              <div className="bg-sky-950/40 border border-sky-500/40 rounded-lg px-4 py-3 text-sm space-y-2">
                {existingRecord.formCode && (
                  <p className="text-sky-200">
                    <span className="font-semibold">Form Code:</span>{" "}
                    <span className="font-mono">{existingRecord.formCode}</span>
                  </p>
                )}
                <p className="text-sky-200">
                  <span className="font-semibold">Current Version:</span> v
                  {existingRecord.version}
                </p>
                <p className="text-sky-300/80 text-xs mt-1">
                  Uploading a new file will create version{" "}
                  {(Number.parseFloat(existingRecord.version) + 0.1).toFixed(1)}
                </p>
              </div>
            )}

            {!existingRecord && formCode && (
              <div className="bg-sky-950/40 border border-sky-500/40 rounded-lg px-4 py-3 text-sm">
                <p className="text-sky-200">
                  <span className="font-semibold">Form Code:</span>{" "}
                  <span className="font-mono">{formCode}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-white/90 mb-2"
                >
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="uploadedBy"
                  className="block text-sm font-medium text-white/90 mb-2"
                >
                  Uploaded By <span className="text-red-400">*</span>
                </label>
                <input
                  id="uploadedBy"
                  type="text"
                  name="uploadedBy"
                  value={form.uploadedBy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">
              File Upload
            </h2>

            <div className="space-y-4">
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-sky-500/50 transition cursor-pointer bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
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
                    <div>
                      <p className="text-sm font-medium text-white mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">
                        Maximum file size: 25MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                        <p className="text-sm font-medium text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="shrink-0 ml-4 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition"
                  >
                    Change File
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
            <Link
              href="/operations/sts-operations/new/form-checklist/sts-checklist/list"
              className="px-6 py-3 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading || loading || !file || !form.uploadedBy?.trim() || !form.date}
              className="px-6 py-3 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? editId
                  ? "Creating New Version..."
                  : "Uploading..."
                : editId
                ? "Create New Version"
                : "Upload File"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

