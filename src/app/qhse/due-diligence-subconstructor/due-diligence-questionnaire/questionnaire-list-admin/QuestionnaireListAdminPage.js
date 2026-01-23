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

export default function QuestionnaireListAdminPage() {
  const [allForms, setAllForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Pending"); // Pending = Pending Review

  const fetchForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/qhse/due-diligence/due-diligence-questionnaire/list"
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load forms");
      }

      console.log("API Response:", data);

      // Handle both possible response structures
      const forms = data.supplierDueDiligences || data.data || [];
      setAllForms(forms);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load forms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Clear selected form if it no longer matches the active filter
  useEffect(() => {
    if (selectedForm) {
      const matchesFilter =
        filterStatus === "All" || selectedForm.status === filterStatus;
      if (!matchesFilter) {
        setSelectedForm(null);
      }
    }
  }, [filterStatus, selectedForm]);

  const handleApprove = async (formId) => {
    if (!confirm("Are you sure you want to approve this form?")) {
      return;
    }

    setApproving(formId);
    setError(null);
    try {
      const res = await fetch(
        `/api/qhse/due-diligence/due-diligence-questionnaire/${formId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Approved",
            approvedBy: null, // You can get this from auth context
          }),
        }
      );

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve form");
      }

      await fetchForms();
      setSelectedForm(null);
      alert("Form approved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (formId) => {
    if (!confirm("Are you sure you want to reject this form?")) {
      return;
    }

    setRejecting(formId);
    setError(null);
    try {
      const res = await fetch(
        `/api/qhse/due-diligence/due-diligence-questionnaire/${formId}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Rejected",
            approvedBy: null, 
          }),
        }
      );

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reject form");
      }

      await fetchForms();
      setSelectedForm(null);
      alert("Form rejected successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setRejecting(null);
    }
  };

  // Filter by status based on active tab
  const forms = allForms.filter((form) => {
    if (filterStatus === "All") return true;
    return form.status === filterStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = forms.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex-1 ml-72 pr-4">
      <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
        <header className="flex items-start gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
              QHSE / Due Diligence / Supplier Due Diligence Questionnaire
            </p>
            <h1 className="text-2xl font-bold">Admin Review</h1>
            <p className="text-xs text-slate-200 mt-1">
              Review and manage supplier due diligence forms.
            </p>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => {
              setFilterStatus("Pending");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filterStatus === "Pending"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStatus("Approved");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filterStatus === "Approved"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStatus("Rejected");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filterStatus === "Rejected"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Rejected
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterStatus("All");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filterStatus === "All"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            All
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <main className="space-y-6">
          {/* Detail Card - Shows when form is selected */}
          {selectedForm && (
            <div className="w-full rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-slate-900/95 via-emerald-950/95 to-slate-900/95 backdrop-blur-md shadow-xl shadow-emerald-900/40">
              <div className="flex items-center justify-between p-6 border-b border-emerald-500/35">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-sky-50 tracking-wide">
                      Form Details
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      FORM CODE:{" "}
                      <span className="font-mono text-sky-300">
                        {selectedForm.formCode || "—"}
                      </span>
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border ${
                      selectedForm.status === "Approved"
                        ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/50"
                        : selectedForm.status === "Rejected"
                        ? "bg-red-500/15 text-red-200 border-red-400/50"
                        : "bg-sky-500/15 text-sky-200 border-sky-400/50"
                    }`}
                  >
                    {selectedForm.status || "Pending"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 transition text-slate-100 text-xl font-bold border border-slate-600/60"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Supplier Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Supplier Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Company/Person Incharge: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.inchargeNameAndCompany || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Contact: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.contactDetails || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Registration: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.companyRegistrationDetails || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Parent Company: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.parentCompanyDetails || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Subsidiaries: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.hasSubsidiaries
                          ? selectedForm.supplierDetails?.subsidiariesDetails || "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Employees: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.employeeCount ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Business Activities: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.businessActivities || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Operating Locations: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.operatingLocations || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Payment Terms: </span>
                      <span className="text-white">
                        {selectedForm.supplierDetails?.paymentTerms || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal & Financial Declarations */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Legal & Financial Declarations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Missing Licenses: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.missingLicenses ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Criminal Offence History: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.criminalOffenceHistory
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Insolvency Status: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.insolvencyStatus ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Business Misconduct: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.businessMisconduct ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400">Unpaid Statutory Payments: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.unpaidStatutoryPayments
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400">Declaration Details: </span>
                      <span className="text-white">
                        {selectedForm.legalDeclarations?.declarationDetails || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insurance Details */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Insurance Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">P&I: </span>
                      <span className="text-white">
                        {selectedForm.insuranceDetails?.pAndI || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Workers Compensation: </span>
                      <span className="text-white">
                        {selectedForm.insuranceDetails?.workersCompensation || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Public Liability: </span>
                      <span className="text-white">
                        {selectedForm.insuranceDetails?.publicLiability || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Other Insurance: </span>
                      <span className="text-white">
                        {selectedForm.insuranceDetails?.otherInsurance || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quality & Compliance */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Quality & Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">QMS Registered: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.qualityManagementSystem?.registered
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">QMS Accredited By: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.qualityManagementSystem
                          ?.accreditedBy || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Environmental Policy: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.environmentalPolicy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ESG Programme: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.esgProgramme ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Other Certifications: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.otherCertifications || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ISO Certification: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.isoCertification || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Drug & Alcohol Policy: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.drugAlcoholPolicy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Health & Safety Policy: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.healthSafetyPolicy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Incidents Last 2 Years: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.incidentsLastTwoYears ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400">Incident Details: </span>
                      <span className="text-white">
                        {selectedForm.complianceDetails?.incidentDetails || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ethics & Governance */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Ethics & Governance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Ethical Conduct Policy: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.ethicalConductPolicy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Equality & Diversity Policy: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.equalityDiversityPolicy
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Subcontracting: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.subcontracting ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Subcontracting Details: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.subcontractingDetails || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Due Diligence For Subcontractors: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.dueDiligenceForSubcontractors
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Anti-Corruption Acknowledged: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.antiCorruptionAcknowledged
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Modern Slavery Acknowledged: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.modernSlaveryAcknowledged
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Sanctions Exposure: </span>
                      <span className="text-white">
                        {selectedForm.ethicsAndGovernance?.sanctionsExposure ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial & Data Protection */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h3 className="text-base font-semibold text-white border-b border-white/10 pb-2">
                    Financial & Data Protection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Credit Rating Details: </span>
                      <span className="text-white">
                        {selectedForm.financialAndData?.creditRatingDetails || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Turnover Last Two Years: </span>
                      <span className="text-white">
                        {selectedForm.financialAndData?.turnoverLastTwoYears || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Data Protection Policy: </span>
                      <span className="text-white">
                        {selectedForm.financialAndData?.dataProtectionPolicy ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400">Banker Details: </span>
                      <span className="text-white">
                        {selectedForm.financialAndData?.bankerDetails?.name || "—"},{" "}
                        {selectedForm.financialAndData?.bankerDetails?.branch || ""},{" "}
                        {selectedForm.financialAndData?.bankerDetails?.contactDetails || ""},{" "}
                        {selectedForm.financialAndData?.bankerDetails?.ibanOrAccountNumber ||
                          ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Buttons - Only show for Pending forms */}
                {selectedForm.status === "Pending" ? (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedForm(null)}
                      className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedForm._id)}
                      disabled={rejecting === selectedForm._id || approving === selectedForm._id}
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60"
                    >
                      {rejecting === selectedForm._id ? "Rejecting..." : "Reject Form"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedForm._id)}
                      disabled={approving === selectedForm._id || rejecting === selectedForm._id}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition disabled:opacity-60"
                    >
                      {approving === selectedForm._id ? "Approving..." : "Approve Form"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedForm(null)}
                      className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold transition"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table Section - Only show when no form is selected */}
          {!selectedForm && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-slate-100">Loading forms…</div>
                </div>
              ) : forms.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-slate-100">
                    No{" "}
                    {filterStatus === "All"
                      ? ""
                      : filterStatus === "Submitted"
                      ? "pending"
                      : filterStatus.toLowerCase()}
                    {" "}
                    forms found.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-200 border-b border-white/10">
                          <th className="py-3 pr-4 font-semibold">Form Code</th>
                          <th className="py-3 pr-4 font-semibold">
                            Company Name
                          </th>
                          <th className="py-3 pr-4 font-semibold">Contact</th>
                          <th className="py-3 pr-4 font-semibold">
                            Submitted At
                          </th>
                          <th className="py-3 pr-4 font-semibold">Status</th>
                          <th className="py-3 pr-4 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentForms.map((form) => (
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
                              <div className="max-w-xs">
                                <p className="text-slate-200">
                                  {form.supplierDetails
                                    ?.inchargeNameAndCompany || "—"}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              {form.supplierDetails?.contactDetails || "—"}
                            </td>
                            <td className="py-3 pr-4">
                              {formatDate(form.updatedAt)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border ${
                                  form.status === "Approved"
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                                    : form.status === "Rejected"
                                    ? "bg-red-500/20 text-red-300 border-red-400/50"
                                    : "bg-blue-500/20 text-blue-300 border-blue-400/50"
                                }`}
                              >
                                {form.status || "Pending"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedForm(form)}
                                  className="text-sky-400 hover:text-sky-300 transition text-[10px] font-medium uppercase tracking-wider px-3 py-1 rounded border border-sky-400/30 hover:bg-sky-400/10"
                                >
                                  View Details
                                </button>
                                {form.status === "Pending" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApprove(form._id)}
                                      disabled={approving === form._id || rejecting === form._id}
                                      className="text-emerald-400 hover:text-emerald-300 transition text-[10px] font-medium uppercase tracking-wider px-3 py-1 rounded border border-emerald-400/30 hover:bg-emerald-400/10 disabled:opacity-40"
                                    >
                                      {approving === form._id
                                        ? "Approving..."
                                        : "Approve"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReject(form._id)}
                                      disabled={rejecting === form._id || approving === form._id}
                                      className="text-red-400 hover:text-red-300 transition text-[10px] font-medium uppercase tracking-wider px-3 py-1 rounded border border-red-400/30 hover:bg-red-400/10 disabled:opacity-40"
                                    >
                                      {rejecting === form._id
                                        ? "Rejecting..."
                                        : "Reject"}
                                    </button>
                                  </>
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
                      <div className="text-xs text-slate-300">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(endIndex, forms.length)} of {forms.length}{" "}
                        {filterStatus === "All"
                          ? ""
                          : filterStatus === "Pending"
                          ? "pending "
                          : `${filterStatus.toLowerCase()} `}
                        forms
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 &&
                                  page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              const showEllipsisBefore =
                                index > 0 && array[index - 1] !== page - 1;
                              return (
                                <div
                                  key={page}
                                  className="flex items-center gap-1"
                                >
                                  {showEllipsisBefore && (
                                    <span className="text-slate-400 px-1">
                                      …
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                                      currentPage === page
                                        ? "bg-orange-500 text-white border-orange-500"
                                        : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
