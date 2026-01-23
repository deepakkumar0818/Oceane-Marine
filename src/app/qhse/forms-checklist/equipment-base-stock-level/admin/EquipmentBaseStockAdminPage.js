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

function getStatusBadge(status) {
  const map = {
    PENDING: {
      label: "Pending Review",
      classes:
        "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
    },
    APPROVED: {
      label: "Approved",
      classes:
        "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
    },
    REJECTED: {
      label: "Rejected",
      classes: "bg-red-500/20 border-red-500/50 text-red-300",
    },
    DRAFT: {
      label: "Draft",
      classes:
        "bg-slate-700/40 border-slate-400/60 text-slate-100",
    },
  };

  const cfg = map[status] || map.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

export default function EquipmentBaseStockAdminPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("PENDING"); // PENDING, APPROVED, REJECTED, ALL
  const [actionId, setActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchForms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "/api/qhse/form-checklist/equipment-base-stock-level/list"
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
  }, []);

  // Admin should not see drafts anywhere
  const visibleForms = forms.filter((form) => form.status !== "DRAFT");

  const filteredForms = visibleForms.filter((form) => {
    if (filter === "ALL") return true;
    return form.status === filter;
  });

  const handleApproval = async (id, nextStatus) => {
    const confirmationMessage =
      nextStatus === "APPROVED"
        ? "Are you sure you want to APPROVE this equipment base stock form?"
        : "Are you sure you want to REJECT this equipment base stock form?";

    if (!confirm(confirmationMessage)) return;

    setActionId(id);
    setError("");
    try {
      const res = await fetch(
        `/api/qhse/form-checklist/equipment-base-stock-level/${id}/approval`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(
          data.error || data.message || "Failed to update approval status"
        );
      }
      await fetchForms();
    } catch (err) {
      setError(err.message || "Failed to update approval status");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 ml-72 flex items-center justify-center">
        <p className="text-white/60">Loading forms for review...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Forms & Checklist / STS Equipment Base Stock Level
            </p>
            <h1 className="text-2xl font-bold">
              Equipment Base Stock – Admin Review
            </h1>
            <p className="text-xs text-slate-200 mt-1">
              Review submitted equipment base stock level forms and approve or reject.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/forms-checklist/equipment-base-stock-level/form"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Base Stock Form
            </Link>
            <Link
              href="/qhse/forms-checklist/equipment-base-stock-level/list"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Base Stock List
            </Link>
            <Link
              href="/qhse/forms-checklist/equipment-base-stock-level/admin"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Base Stock Admin
            </Link>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((key) => {
            const labelMap = {
              PENDING: "Pending Review",
              APPROVED: "Approved",
              REJECTED: "Rejected",
              ALL: "All",
            };
            const active = filter === key;
            const base =
              "px-4 py-2 rounded-lg text-sm font-medium transition border";
            let activeClass =
              "bg-slate-700/50 text-white/80 border-sky-400/40";
            if (key === "PENDING") {
              activeClass =
                "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
            } else if (key === "APPROVED") {
              activeClass =
                "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
            } else if (key === "REJECTED") {
              activeClass =
                "bg-red-500/20 text-red-300 border-red-500/50";
            }
            const inactiveClass =
              "bg-slate-800/40 text-white/70 border-slate-500/40 hover:bg-slate-700/60";

            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`${base} ${active ? activeClass : inactiveClass}`}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>

        {/* List */}
        {(() => {
          if (filteredForms.length === 0) {
            let message = "No equipment base stock forms found.";
            if (filter === "PENDING") {
              message = "No forms pending review.";
            } else if (filter === "APPROVED") {
              message = "No approved forms.";
            } else if (filter === "REJECTED") {
              message = "No rejected forms.";
            }
            return (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <p className="text-white/60 text-sm">{message}</p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <div
                  key={form._id}
                  className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 space-y-3 hover:border-white/20 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-sm font-semibold text-white/90 truncate max-w-sm">
                          {form.formCode || "Uncoded Form"}
                        </h2>
                        {getStatusBadge(form.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] text-white/50">
                        <span>
                          Revision Date: {formatDate(form.revisionDate)}
                        </span>
                        <span>
                          Created: {formatDate(form.createdAt)} • Updated:{" "}
                          {formatDate(form.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expandedId === form._id ? null : form._id
                          )
                        }
                        className="px-4 py-2 rounded-full text-xs font-semibold border border-white/25 bg-white/10 text-white/90 hover:bg-white/20 transition"
                      >
                        {expandedId === form._id ? "Hide" : "View"}
                      </button>

                      {form.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproval(form._id, "APPROVED")}
                            disabled={actionId === form._id}
                            className="px-4 py-2 rounded-full text-xs font-semibold border border-emerald-400/60 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionId === form._id
                              ? "Approving..."
                              : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproval(form._id, "REJECTED")}
                            disabled={actionId === form._id}
                            className="px-4 py-2 rounded-full text-xs font-semibold border border-red-400/60 bg-red-500/20 text-red-100 hover:bg-red-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionId === form._id
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedId === form._id && (
                    <div className="border-t border-white/10 pt-3 space-y-3 text-sm text-white/80">
                      {Array.isArray(form.equipmentCategories) &&
                      form.equipmentCategories.length > 0 ? (
                        form.equipmentCategories.map((cat, idx) => (
                          <div
                            key={`${cat.categoryName || "cat"}-${idx}`}
                            className="rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="px-4 py-2 bg-amber-100/70 text-slate-900 text-xs font-semibold flex justify-between">
                              <span>
                                {cat.categoryName || "Category"}
                                {cat.subCategory ? ` – ${cat.subCategory}` : ""}
                              </span>
                              <span className="text-[10px] text-slate-800">
                                Items: {cat.items?.length || 0}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-white/10 text-white/80">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold">
                                      Equipment
                                    </th>
                                    <th className="px-3 py-2 text-center font-semibold">
                                      In Use
                                    </th>
                                    <th className="px-3 py-2 text-center font-semibold">
                                      Spare
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                      Comments
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                      Condition
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(cat.items || []).map((item, itemIdx) => (
                                    <tr
                                      key={`${cat.categoryName || "cat"}-${
                                        item?.name || "item"
                                      }-${itemIdx}`}
                                      className="border-t border-white/5"
                                    >
                                      <td className="px-3 py-2 text-white/90">
                                        {item?.name || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-center text-white/80">
                                        {item?.quantityInUse ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 text-center text-white/80">
                                        {item?.quantitySpare ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 text-white/70">
                                        {item?.additionalComments || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-white/80">
                                        {item?.overallCondition || "Not Assessed"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-white/60 text-xs">
                          No equipment details provided.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}


