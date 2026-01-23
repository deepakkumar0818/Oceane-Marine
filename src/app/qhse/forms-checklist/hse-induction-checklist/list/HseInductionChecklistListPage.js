"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QhseSidebar from "../../../components/QhseSidebar";

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

function getStatusBadge(status) {
  const statusConfig = {
    Pending: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-300",
      label: "Pending Review",
    },
    Approved: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/50",
      text: "text-emerald-300",
      label: "Approved",
    },
    Rejected: {
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      text: "text-red-300",
      label: "Rejected",
    },
  };

  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

// Question mappings for HSE Checklist
const hseChecklistQuestions = {
  hsePolicy: "HSE Policy",
  facilityTour:
    "A facility tour including a discussion of the types of processes performed, location of bulletin boards for postings, breakrooms, restrooms, First-Aid cabinets, fire-fighting equipment, evacuation routes & assembly areas",
  reportingFire: "Reporting fire",
  occupationalHazards: "Occupational Hazards",
  injuryIllnessNearMissReporting:
    "The procedure for reporting an industrial injury, illness, near-miss accident, or an unsafe condition",
  emergencyActionPlan: "The facility Emergency Action Plan",
  wasteManagementProcedures: "Waste Management Procedures",
  ppeRequirements:
    "PPE (Personal Protective Equipment) requirements by area including the proper use, care & maintenance of such equipment",
  hazcomMsds:
    "(HazCom) - Location of MSDS sheets, summary of hazardous chemicals on site",
  spillReportingProcedures:
    "The procedure for reporting spills, and the importance of keeping containers covered",
  ergonomicsAwareness: "Ergonomics (awareness)",
  housekeepingExpectations:
    "The importance and expectations for good housekeeping",
  disciplinaryProcedure:
    "The disciplinary procedure for Safety and Environmental Violations",
};

// Question mappings for Job Specific Checklist
const jobSpecificChecklistQuestions = {
  safeOperationOfToolsMachinery:
    "Safe operation of any tools/machinery that may be required",
  trainingAndCertificationRequirements:
    "Training & certification requirements prior to driving a forklift or other motorized equipment",
  riskAssessmentOverview: "Risk Assessment overview",
  safeLiftingAndBackInjuryPrevention: "Safe Lifting & Back Injury Prevention",
  craneOperationAndSlingInspection: "Safe crane operation & sling inspection",
  loadingUnloadingHandlingProcedures:
    "Procedures for safely loading/unloading and handling of equipment",
};

export default function HseInductionChecklistListPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formToReject, setFormToReject] = useState(null);
  const [filter, setFilter] = useState("pending"); // "pending", "approved", "rejected", "all"

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/qhse/form-checklist/hse-induction-checklist/list"
      );

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(
          `Server returned non-JSON response. Status: ${res.status}`
        );
      }

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

  // Filter forms based on selected filter
  const filteredForms = forms.filter((form) => {
    if (filter === "pending") return form.status === "Pending";
    if (filter === "approved") return form.status === "Approved";
    if (filter === "rejected") return form.status === "Rejected";
    return true; // "all"
  });

  // Clear selected form if it doesn't match current filter
  useEffect(() => {
    if (selectedForm) {
      const isVisible = filteredForms.some((f) => f._id === selectedForm._id);
      if (!isVisible) {
        setSelectedForm(null);
      }
    }
  }, [filter, filteredForms, selectedForm]);

  const handleApprove = async (formId) => {
    if (
      !confirm("Are you sure you want to approve this HSE Induction Checklist?")
    ) {
      return;
    }

    setApproving(formId);
    setError(null);
    try {
      const res = await fetch(
        `/api/qhse/form-checklist/hse-induction-checklist/${formId}/approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: "admin", // Replace with actual user ID from auth
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve checklist");
      }

      await fetchForms();
      // Update selected form if it's the one that was approved
      if (selectedForm?._id === formId && data.data) {
        setSelectedForm(data.data);
      }
      alert("HSE Induction Checklist approved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setRejecting(formToReject._id);
    setError(null);
    try {
      const res = await fetch(
        `/api/qhse/form-checklist/hse-induction-checklist/${formToReject._id}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectionReason: rejectionReason,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject checklist");
      }

      await fetchForms();
      // Update selected form if it's the one that was rejected
      if (selectedForm?._id === formToReject._id && data.data) {
        setSelectedForm(data.data);
      }
      setShowRejectModal(false);
      setRejectionReason("");
      setFormToReject(null);
      alert("HSE Induction Checklist rejected successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setRejecting(null);
    }
  };

  const openRejectModal = (form) => {
    setFormToReject(form);
    setShowRejectModal(true);
    setRejectionReason("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex">
        <QhseSidebar />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 ml-72 pr-4">
        <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
          <header className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                  QHSE / Forms & Checklist / HSE Induction Checklist
                </p>
                <h1 className="text-2xl font-bold">HSE Induction Checklist</h1>
                <p className="text-xs text-slate-200 mt-1">
                  View all HSE induction checklist reports
                </p>
              </div>
            </div>
          </header>

          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-3 text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "pending"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                  : "bg-slate-700/50 text-white/70 border border-sky-400/30 hover:bg-slate-700/70"
              }`}
            >
              Pending Review
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "approved"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "bg-slate-700/50 text-white/70 border border-sky-400/30 hover:bg-slate-700/70"
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "rejected"
                  ? "bg-red-500/20 text-red-300 border border-red-500/50"
                  : "bg-slate-700/50 text-white/70 border border-sky-400/30 hover:bg-slate-700/70"
              }`}
            >
              Rejected
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "all"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/50"
                  : "bg-slate-700/50 text-white/70 border border-sky-400/30 hover:bg-slate-700/70"
              }`}
            >
              All
            </button>
          </div>

          {!error && filteredForms.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-white/60 text-sm">
                {filter === "pending"
                  ? "No pending forms found"
                  : filter === "approved"
                  ? "No approved forms found"
                  : filter === "rejected"
                  ? "No rejected forms found"
                  : "No HSE induction checklists found"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <div
                  key={form._id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition"
                >
                  <button
                    onClick={() =>
                      setSelectedForm(
                        selectedForm?._id === form._id ? null : form
                      )
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-white/90">
                            {form.formCode || form.formNo || "N/A"}
                          </span>
                          {getStatusBadge(form.status)}
                          {(form.version || form.revisionNo) && (
                            <span className="text-xs text-white/50">
                              v{form.version || form.revisionNo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>
                            Employee: {form.employeeOrContractorName || "—"}
                          </span>
                          <span>Date: {formatDate(form.dateOfInduction)}</span>
                          <span>Location: {form.location || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-white/40 text-lg">
                      {selectedForm?._id === form._id ? "▲" : "▼"}
                    </span>
                  </button>

                  {selectedForm?._id === form._id && (
                    <div className="border-t border-white/10 px-6 py-6 space-y-6">
                      {/* Employee/Contractor Details */}
                      <div>
                        <h3 className="text-sm font-semibold text-white/90 mb-3">
                          Employee / Contractor Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Name:</span>
                            <span className="ml-2 text-white/90">
                              {form.employeeOrContractorName || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60">
                              Date of Induction:
                            </span>
                            <span className="ml-2 text-white/90">
                              {formatDate(form.dateOfInduction)}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60">Location:</span>
                            <span className="ml-2 text-white/90">
                              {form.location || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/60">Form Code:</span>
                            <span className="ml-2 text-white/90">
                              {form.formCode || form.formNo || "—"}
                            </span>
                          </div>
                          {(form.version || form.revisionNo) && (
                            <div>
                              <span className="text-white/60">Version:</span>
                              <span className="ml-2 text-white/90">
                                {form.version || form.revisionNo}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-white/60">Status:</span>
                            <span className="ml-2">
                              {getStatusBadge(form.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* HSE Checklist */}
                      <div>
                        <h3 className="text-sm font-semibold text-white/90 mb-3">
                          HSE Policy Checklist
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(hseChecklistQuestions).map(
                            ([key, question]) => (
                              <div
                                key={key}
                                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-white/90">
                                    {question}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {form.hseChecklist?.[key] ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300">
                                      ✓ Discussed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 border border-gray-500/50 text-gray-400">
                                      ✗ Not Discussed
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Job Specific Checklist */}
                      <div>
                        <h3 className="text-sm font-semibold text-white/90 mb-3">
                          As appropriate by job function & facility operation
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(jobSpecificChecklistQuestions).map(
                            ([key, question]) => (
                              <div
                                key={key}
                                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-white/90">
                                    {question}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  {form.jobSpecificChecklist?.[key] ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300">
                                      ✓ Discussed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 border border-gray-500/50 text-gray-400">
                                      ✗ Not Discussed
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Signatures */}
                      {(form.signatures?.employeeSignature ||
                        form.signatures?.inductionGivenBySignature) && (
                        <div>
                          <h3 className="text-sm font-semibold text-white/90 mb-3">
                            Signatures
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {form.signatures.employeeSignature && (
                              <div>
                                <span className="text-white/60">
                                  Employee Signature:
                                </span>
                                <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                                  <img
                                    src={form.signatures.employeeSignature}
                                    alt="Employee Signature"
                                    className="max-h-20 object-contain"
                                  />
                                  {form.signatures.employeeSignatureDate && (
                                    <p className="text-xs text-white/50 mt-1">
                                      Date:{" "}
                                      {formatDate(
                                        form.signatures.employeeSignatureDate
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {form.signatures.inductionGivenBySignature && (
                              <div>
                                <span className="text-white/60">
                                  Signature of Person Giving Induction:
                                </span>
                                <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                                  <img
                                    src={
                                      form.signatures.inductionGivenBySignature
                                    }
                                    alt="Induction Given By Signature"
                                    className="max-h-20 object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
                          {form.submittedBy && (
                            <div>
                              <span>Submitted By:</span>
                              <span className="ml-2 text-white/90">
                                {form.submittedBy}
                              </span>
                            </div>
                          )}
                          {form.createdAt && (
                            <div>
                              <span>Created:</span>
                              <span className="ml-2 text-white/90">
                                {formatDateTime(form.createdAt)}
                              </span>
                            </div>
                          )}
                          {form.updatedAt && (
                            <div>
                              <span>Last Updated:</span>
                              <span className="ml-2 text-white/90">
                                {formatDateTime(form.updatedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {form.status === "Rejected" && form.rejectionReason && (
                        <div className="pt-4 border-t border-white/10">
                          <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-300 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-200">
                              {form.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Admin Actions */}
                      {form.status === "Pending" && (
                        <div className="pt-4 border-t border-white/10 flex gap-3">
                          <button
                            onClick={() => handleApprove(form._id)}
                            disabled={approving === form._id}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approving === form._id
                              ? "Approving..."
                              : "✓ Approve"}
                          </button>
                          <button
                            onClick={() => openRejectModal(form)}
                            disabled={approving === form._id}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-semibold text-sm hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Reject HSE Induction Checklist
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Please provide a reason for rejecting this checklist:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setFormToReject(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 font-semibold text-sm hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejecting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 font-semibold text-sm hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
