"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";

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
        href: "/operations/sts-operations/new/form-checklist/sts-checklist",
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
      {
        key: "manual",
        label: "Manual",
        href: "/operations/sts-operations/new/form-checklist/manual/form",
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

const FORM_TITLES = {
  'ops-ofd-001': 'OPS-OFD-001 - Before Operation Commence',
  'ops-ofd-001a': 'OPS-OFD-001A - Ship Standard Questionnaire',
  'ops-ofd-002': 'OPS-OFD-002 - Before Run In & Mooring',
  'ops-ofd-003': 'OPS-OFD-003 - Before Cargo Transfer (3A & 3B)',
  'ops-ofd-004': 'OPS-OFD-004 - Pre-Transfer Agreements (4A-4F)',
  'ops-ofd-005': 'OPS-OFD-005 - During Transfer (5A-5C)',
  'ops-ofd-005b': 'OPS-OFD-005B - Before Disconnection & Unmooring',
  'ops-ofd-005c': 'OPS-OFD-005C - Terminal Transfer Checklist',
  'ops-ofd-008': 'OPS-OFD-008 - Master Declaration',
  'ops-ofd-009': 'OPS-OFD-009 - Mooring Master\'s Job Report',
  'ops-ofd-011': 'OPS-OFD-011 - STS Standing Order',
  'ops-ofd-014': 'OPS-OFD-014 - Equipment Checklist',
  'ops-ofd-015': 'OPS-OFD-015 - Hourly Quantity Log',
  'ops-ofd-018': 'OPS-OFD-018 - STS Timesheet',
  'ops-ofd-029': 'OPS-OFD-029 - Mooring Master Expense Sheet',
};

const API_BASE_URL = '/api/operations/sts-checklist';

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { formPath, id } = params;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("forms");
  const [expandedModules, setExpandedModules] = useState(new Set(["forms"]));
  const sidebarRef = useRef(null);

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, [formPath, id]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/${formPath}/list`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch form data');
      }

      const result = await response.json();

      if (result.success) {
        const form = result.data.find((f) => f._id === id);
        if (form) {
          setFormData(form);
        } else {
          throw new Error('Form not found');
        }
      } else {
        throw new Error(result.error || 'Failed to fetch form data');
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!isNaN(key) && Array.isArray(current)) {
          const index = parseInt(key, 10);
          if (!current[index]) {
            current[index] = {};
          }
          current = current[index];
        } else {
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      }
      
      const lastKey = keys[keys.length - 1];
      if (!isNaN(lastKey) && Array.isArray(current)) {
        const index = parseInt(lastKey, 10);
        current[index] = value;
      } else {
        current[lastKey] = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const formDataToSend = new FormData();
      
      const cleanData = JSON.parse(JSON.stringify(formData));
      delete cleanData._id;
      delete cleanData.__v;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.createdBy;

      formDataToSend.append('data', JSON.stringify(cleanData));

      const response = await fetch(
        `${API_BASE_URL}/${formPath}/${id}/update`,
        {
          method: 'POST',
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update form');
      }

      const result = await response.json();
      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/operations/sts-operations/new/form-checklist/sts-checklist/${formPath}/view/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating form:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderEditableField = (label, path, value, type = 'text') => {
    const displayPath = path.split('.').pop();
    
    if (type === 'date') {
      const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-1 capitalize">
            {label || displayPath.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleInputChange(path, e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
          />
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-1 capitalize">
            {label || displayPath.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(path, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
            rows={4}
          />
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/80 mb-1 capitalize">
            {label || displayPath.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(path, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
          >
            <option value="">Select...</option>
            {['DRAFT', 'SUBMITTED', 'APPROVED', 'SIGNED', 'ARCHIVED', 'FINALIZED', 'PENDING', 'PAID'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/80 mb-1 capitalize">
          {label || displayPath.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type={type}
          value={value || ''}
          onChange={(e) => handleInputChange(path, e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
        />
      </div>
    );
  };

  const renderEditableObject = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

    const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'signature', 'signatureBlock', 'signatureImage', 'stampImage', 'shipStampImage', 'mooringMasterSignature'];
    
    return Object.entries(obj).map(([key, value]) => {
      if (skipFields.includes(key)) return null;
      
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        return renderEditableField(key, path, '', 'text');
      }
      
      if (typeof value === 'string') {
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          return renderEditableField(key, path, value, 'date');
        }
        if (value.length > 100) {
          return renderEditableField(key, path, value, 'textarea');
        }
        return renderEditableField(key, path, value, 'text');
      }
      
      if (typeof value === 'number') {
        return renderEditableField(key, path, value, 'number');
      }
      
      if (typeof value === 'boolean') {
        return (
          <div key={key} className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleInputChange(path, e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-white/80 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          </div>
        );
      }
      
      if (Array.isArray(value)) {
        return (
          <div key={key} className="mb-6 border border-white/10 rounded p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()} ({value.length} items)
            </h3>
            {value.map((item, index) => (
              <div key={index} className="mb-4 border-l-2 border-white/20 pl-4">
                <div className="text-xs text-white/50 mb-2 font-semibold">Item {index + 1}</div>
                {typeof item === 'object' && item !== null && !Array.isArray(item)
                  ? renderEditableObject(item, `${path}.${index}`)
                  : typeof item === 'object' && Array.isArray(item)
                  ? (
                    <div className="text-white/50 text-sm">Nested arrays not editable</div>
                  )
                  : renderEditableField(`${key}[${index}]`, `${path}.${index}`, item)}
              </div>
            ))}
          </div>
        );
      }
      
      if (typeof value === 'object') {
        return (
          <div key={key} className="mb-6 border border-white/10 rounded p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            {renderEditableObject(value, path)}
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex">
        <div className="flex-1 min-w-0 ml-0 md:ml-72">
          <div className="flex items-center justify-center h-screen">
            <p className="text-white/60">Loading form data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-transparent text-white flex">
        <div className="flex-1 min-w-0 ml-0 md:ml-72">
          <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10">
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
              Error: {error}
            </div>
            <Link
              href={`/operations/sts-operations/new/form-checklist/sts-checklist/${formPath}/list`}
              className="mt-4 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

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
                            const basePath = submodule.href.replace(/\/form$|\/list$/, "") || submodule.href;
                            const pathNorm = pathname.replace(/\/$/, "");
                            const isActiveSub =
                              pathNorm === basePath ||
                              pathNorm.startsWith(basePath + "/form") ||
                              pathNorm.startsWith(basePath + "/list");
                            return (
                              <Link
                                key={submodule.key}
                                href={submodule.href}
                                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                                  isActiveSub
                                    ? "bg-gradient-to-r from-orange-500/90 to-orange-600/90 text-white border-orange-400 shadow-lg"
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
              <Link
                href={`/operations/sts-operations/new/form-checklist/sts-checklist/${formPath}/list`}
                className="text-xs text-sky-300 hover:text-sky-200 mb-2 inline-block"
              >
                ← Back to List
              </Link>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                Operations / Forms & Checklist / STS Checklist
              </p>
              <h1 className="text-2xl font-bold text-white">Edit Form</h1>
              <p className="text-xs text-slate-200 mt-1">
                Form ID: <span className="font-mono text-orange-400">{id.substring(0, 12)}...</span>
              </p>
            </div>
          </header>

          {success && (
            <div className="bg-green-950/40 border border-green-500/40 rounded-xl px-4 py-3 text-green-200 text-sm font-medium">
              Form updated successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {renderEditableField('Status', 'status', formData.status, 'select')}

            <div className="space-y-6">
              {renderEditableObject(formData)}
            </div>

            <div className="mt-8 flex gap-4 justify-end border-t border-white/10 pt-6">
              <Link
                href={`/operations/sts-operations/new/form-checklist/sts-checklist/${formPath}/view/${id}`}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
