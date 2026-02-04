"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { buildDocumentHtml030, buildDocumentHtml030B } from "./documentTemplate";

const sidebarTabs = [
  { key: "documentation", label: "Documentation", href: "/operations/sts-operations/new" },
  { key: "compatibility", label: "Compatibility", href: "/operations/sts-operations/new/compatibility" },
  {
    key: "forms",
    label: "Forms and checklist",
    submodules: [
      { key: "sts-checklist", label: "STS Checklist", href: "/operations/sts-operations/new/form-checklist/sts-checklist" },
      { key: "jpo", label: "JPO", href: "/operations/sts-operations/new/form-checklist/jpo/form" },
      { key: "quotation", label: "Quotation", href: "/operations/sts-operations/new/form-checklist/quotations/sts-form" },
      { key: "inspection-checklist", label: "Inspection Checklist", href: "/operations/sts-operations/new/form-checklist/inspection-checklist/form" },
      { key: "manual", label: "Manual", href: "/operations/sts-operations/new/form-checklist/manual/form" },
    ],
  },
  { key: "cargos", label: "Cargo types", href: "/operations/sts-operations/new/cargos" },
  { key: "locations", label: "Locations", href: "/operations/sts-operations/new/locations" },
  { key: "mooring", label: "Mooring masters", href: "/operations/sts-operations/new/mooringmaster" },
];

const emptyForm = () => ({
  formType: "OPS-OFD-030",
  formNo: "",
  issueDate: "",
  clientName: "",
  attn: "",
  proposalDate: "",
  projectName: "",
  jobRef: "",
  dischargingShip: "",
  receivingShip: "",
  operationDate: "",
  location: "",
  cargo: "",
  quantity: "",
  quantityUnit: "BBLS",
  lumpSum: "",
  thereafter: "",
  freeTime: "",
  availability: "",
  paymentTerms: "",
  primaryFenders: "",
  secondaryFenders: "",
  fenderMoorings: "",
  hoses: "",
  supportCraft: "",
  personnelTransferBasket: "",
  baseInfoLocation: "",
  acceptanceClientName: "",
  personInCharge: "",
  acceptanceDate: "",
  designatedAdvisor: "",
  dailyRate: "",
  managementFee: "",
  flightsTravel: "",
  localLogistics: "",
  communicationCharges: "",
  acceptanceName: "",
  acceptanceAddress: "",
  acceptanceEmail: "",
  acceptanceTelephone: "",
  authorizedSignatoryFor: "",
  acceptanceDate030B: "",
});

function toFormData(record) {
  if (!record) return emptyForm();
  const d = record;
  return {
    formType: d.formType || "OPS-OFD-030",
    formNo: d.formNo ?? "",
    issueDate: d.issueDate ? new Date(d.issueDate).toISOString().split("T")[0] : "",
    clientName: d.clientName ?? "",
    attn: d.attn ?? "",
    proposalDate: d.proposalDate ? new Date(d.proposalDate).toISOString().split("T")[0] : "",
    projectName: d.projectName ?? "",
    jobRef: d.jobRef ?? "",
    dischargingShip: d.dischargingShip ?? "",
    receivingShip: d.receivingShip ?? "",
    operationDate: d.operationDate ? new Date(d.operationDate).toISOString().split("T")[0] : "",
    location: d.location ?? "",
    cargo: d.cargo ?? "",
    quantity: d.quantity ?? "",
    quantityUnit: d.quantityUnit ?? "BBLS",
    lumpSum: d.lumpSum ?? "",
    thereafter: d.thereafter ?? "",
    freeTime: d.freeTime ?? "",
    availability: d.availability ?? "",
    paymentTerms: d.paymentTerms ?? "",
    primaryFenders: d.primaryFenders ?? "",
    secondaryFenders: d.secondaryFenders ?? "",
    fenderMoorings: d.fenderMoorings ?? "",
    hoses: d.hoses ?? "",
    supportCraft: d.supportCraft ?? "",
    personnelTransferBasket: d.personnelTransferBasket ?? "",
    baseInfoLocation: d.baseInfoLocation ?? "",
    acceptanceClientName: d.acceptanceClientName ?? "",
    personInCharge: d.personInCharge ?? "",
    acceptanceDate: d.acceptanceDate ? new Date(d.acceptanceDate).toISOString().split("T")[0] : "",
    designatedAdvisor: d.designatedAdvisor ?? "",
    dailyRate: d.dailyRate ?? "",
    managementFee: d.managementFee ?? "",
    flightsTravel: d.flightsTravel ?? "",
    localLogistics: d.localLogistics ?? "",
    communicationCharges: d.communicationCharges ?? "",
    acceptanceName: d.acceptanceName ?? "",
    acceptanceAddress: d.acceptanceAddress ?? "",
    acceptanceEmail: d.acceptanceEmail ?? "",
    acceptanceTelephone: d.acceptanceTelephone ?? "",
    authorizedSignatoryFor: d.authorizedSignatoryFor ?? "",
    acceptanceDate030B: d.acceptanceDate030B ? new Date(d.acceptanceDate030B).toISOString().split("T")[0] : "",
  };
}

function toPayload(form) {
  const p = { ...form };
  if (p.proposalDate) p.proposalDate = new Date(p.proposalDate).toISOString();
  if (p.issueDate) p.issueDate = new Date(p.issueDate).toISOString();
  if (p.operationDate) p.operationDate = new Date(p.operationDate).toISOString();
  if (p.acceptanceDate) p.acceptanceDate = new Date(p.acceptanceDate).toISOString();
  if (p.acceptanceDate030B) p.acceptanceDate030B = new Date(p.acceptanceDate030B).toISOString();
  return p;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none";
const labelClass = "block text-sm font-medium text-white/90 mb-1.5";

export default function StsQuotationFormPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("edit");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("forms");
  const [expandedModules, setExpandedModules] = useState(new Set(["forms"]));
  const [form, setForm] = useState(emptyForm());
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/master/locations/list")
      .then((r) => r.json())
      .then((data) => setLocations(data.locations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    fetch(`/api/operations/form-checklist/sts-quotation-form/${editId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setForm(toFormData(data.data));
        else setError("Quotation not found");
      })
      .catch(() => setError("Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [editId]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const url = editId
        ? `/api/operations/form-checklist/sts-quotation-form/${editId}/update`
        : "/api/operations/form-checklist/sts-quotation-form/create";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess(editId ? "Quotation updated." : "Quotation saved.");
      if (!editId && data.data?._id) {
        setTimeout(() => router.push(`/operations/sts-operations/new/form-checklist/quotations/sts-form?edit=${data.data._id}`), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const html =
      form.formType === "OPS-OFD-030B"
        ? buildDocumentHtml030B(toPayload(form))
        : buildDocumentHtml030(toPayload(form));
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <p className="text-white/60">Loading quotation…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/20 shadow-2xl z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "300px" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent">
            <h2 className="text-lg font-bold text-white">Operations</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              aria-label="Close sidebar"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1.5">
              {sidebarTabs.map((tab) =>
                tab.submodules ? (
                  <div key={tab.key}>
                    <button
                      onClick={() =>
                        setExpandedModules((prev) => {
                          const next = new Set(prev);
                          if (next.has(tab.key)) next.delete(tab.key);
                          else next.add(tab.key);
                          return next;
                        })
                      }
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium ${
                        activeTab === tab.key ? "bg-orange-500 text-white" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex-1">{tab.label}</span>
                      <span className={expandedModules.has(tab.key) ? "rotate-90" : ""}>▶</span>
                    </button>
                    {expandedModules.has(tab.key) && (
                      <div className="ml-4 mt-1 pl-4 border-l-2 border-orange-500/30 space-y-1">
                        {tab.submodules.map((sub) => (
                          <Link
                            key={sub.key}
                            href={sub.href}
                            className={`block px-4 py-2.5 rounded-lg text-sm ${
                              pathname?.startsWith(sub.href) ? "bg-orange-500/90 text-white" : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={`block px-4 py-3 rounded-xl text-base font-medium ${
                      activeTab === tab.key ? "bg-orange-500 text-white" : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500"
          aria-label="Open sidebar"
        >
          <span className="text-white text-xl">☰</span>
        </button>
      )}

      <div className="flex-1 min-w-0 ml-0 md:ml-72 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-300">Operations / Quotation</p>
              <h1 className="text-2xl font-bold text-white">
                {editId ? "Edit STS Quotation" : "New STS Quotation"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/operations/sts-operations/new/form-checklist/quotations/list"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
              >
                ← Back to List
              </Link>
              <Link
                href="/operations/sts-operations/new/form-checklist/quotations/sts-form"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
              >
                New
              </Link>
            </div>
          </header>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form type (only when creating) */}
            {!editId && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                  Quotation Type
                </h2>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      checked={form.formType === "OPS-OFD-030"}
                      onChange={() => setField("formType", "OPS-OFD-030")}
                      className="rounded border-white/20 text-orange-500"
                    />
                    <span className="text-white">OPS-OFD-030 – STS Job Quotation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      checked={form.formType === "OPS-OFD-030B"}
                      onChange={() => setField("formType", "OPS-OFD-030B")}
                      className="rounded border-white/20 text-orange-500"
                    />
                    <span className="text-white">OPS-OFD-030B – STS Advisor Quotation</span>
                  </label>
                </div>
              </section>
            )}

            {/* Common fields */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                Client & Proposal (First page / Cover)
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Form No</label>
                  <input
                    type="text"
                    value={form.formNo}
                    onChange={(e) => setField("formNo", e.target.value)}
                    className={inputClass}
                    placeholder={form.formType === "OPS-OFD-030B" ? "e.g. OPS-OFD-030B" : "e.g. Form No. OPS-OFD-030 / Rev 1.2"}
                  />
                </div>
                <div>
                  <label className={labelClass}>Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setField("issueDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Client Name</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => setField("clientName", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Glencore"
                  />
                </div>
                <div>
                  <label className={labelClass}>Attn</label>
                  <input
                    type="text"
                    value={form.attn}
                    onChange={(e) => setField("attn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Capt Sawant"
                  />
                </div>
                <div>
                  <label className={labelClass}>Proposal Date</label>
                  <input
                    type="date"
                    value={form.proposalDate}
                    onChange={(e) => setField("proposalDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Project Name (optional)</label>
                  <input
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setField("projectName", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* OPS-OFD-030 fields */}
            {form.formType === "OPS-OFD-030" && (
              <>
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                    Cost of Operation
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Job Ref #</label>
                      <input type="text" value={form.jobRef} onChange={(e) => setField("jobRef", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Discharging ship(s)</label>
                      <input type="text" value={form.dischargingShip} onChange={(e) => setField("dischargingShip", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Receiving ship(s)</label>
                      <input type="text" value={form.receivingShip} onChange={(e) => setField("receivingShip", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={form.operationDate} onChange={(e) => setField("operationDate", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <select
                        value={form.location}
                        onChange={(e) => setField("location", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select location</option>
                        {locations.map((loc) => (
                          <option key={loc._id} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Cargo</label>
                      <input type="text" value={form.cargo} onChange={(e) => setField("cargo", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input type="text" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)} className={inputClass} placeholder="e.g. 50000" />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity Unit</label>
                      <input type="text" value={form.quantityUnit} onChange={(e) => setField("quantityUnit", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Lump sum (USD)</label>
                      <input type="text" value={form.lumpSum} onChange={(e) => setField("lumpSum", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Thereafter (USD/HR)</label>
                      <input type="text" value={form.thereafter} onChange={(e) => setField("thereafter", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Free time</label>
                      <input type="text" value={form.freeTime} onChange={(e) => setField("freeTime", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Availability</label>
                      <input type="text" value={form.availability} onChange={(e) => setField("availability", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Payment terms</label>
                      <input type="text" value={form.paymentTerms} onChange={(e) => setField("paymentTerms", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                    STS Equipment
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Primary Fenders</label>
                      <input type="text" value={form.primaryFenders} onChange={(e) => setField("primaryFenders", e.target.value)} className={inputClass} placeholder="e.g. xx Fenders of 3.3m x 6.5m Yokohama Pneumatic fenders" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Secondary Fenders</label>
                      <input type="text" value={form.secondaryFenders} onChange={(e) => setField("secondaryFenders", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Fender Moorings</label>
                      <input type="text" value={form.fenderMoorings} onChange={(e) => setField("fenderMoorings", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Hoses</label>
                      <input type="text" value={form.hoses} onChange={(e) => setField("hoses", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Support Craft</label>
                      <input type="text" value={form.supportCraft} onChange={(e) => setField("supportCraft", e.target.value)} className={inputClass} placeholder="e.g. Not Applicable" />
                    </div>
                    <div>
                      <label className={labelClass}>Personnel Transfer Basket</label>
                      <input type="text" value={form.personnelTransferBasket} onChange={(e) => setField("personnelTransferBasket", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Base info / Location</label>
                      <input type="text" value={form.baseInfoLocation} onChange={(e) => setField("baseInfoLocation", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                    Acceptance (Client)
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Client Name (Company)</label>
                      <input type="text" value={form.acceptanceClientName} onChange={(e) => setField("acceptanceClientName", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Person In Charge</label>
                      <input type="text" value={form.personInCharge} onChange={(e) => setField("personInCharge", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Acceptance Date</label>
                      <input type="date" value={form.acceptanceDate} onChange={(e) => setField("acceptanceDate", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* OPS-OFD-030B fields */}
            {form.formType === "OPS-OFD-030B" && (
              <>
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                    POAC Service Charges
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Designated STS Advisor</label>
                      <input type="text" value={form.designatedAdvisor} onChange={(e) => setField("designatedAdvisor", e.target.value)} className={inputClass} placeholder="e.g. Capt Diptiman Guha" />
                    </div>
                    <div>
                      <label className={labelClass}>Daily Rate (USD)</label>
                      <input type="text" value={form.dailyRate} onChange={(e) => setField("dailyRate", e.target.value)} className={inputClass} placeholder="e.g. 2,450.00" />
                    </div>
                    <div>
                      <label className={labelClass}>Management Fee (USD)</label>
                      <input type="text" value={form.managementFee} onChange={(e) => setField("managementFee", e.target.value)} className={inputClass} placeholder="e.g. 5,000.00" />
                    </div>
                    <div>
                      <label className={labelClass}>Flights & Travel</label>
                      <input type="text" value={form.flightsTravel} onChange={(e) => setField("flightsTravel", e.target.value)} className={inputClass} placeholder="e.g. Cost + 10% Admin Fee" />
                    </div>
                    <div>
                      <label className={labelClass}>Local Logistics (UAE)</label>
                      <input type="text" value={form.localLogistics} onChange={(e) => setField("localLogistics", e.target.value)} className={inputClass} placeholder="Client's Account" />
                    </div>
                    <div>
                      <label className={labelClass}>Communication Charges</label>
                      <input type="text" value={form.communicationCharges} onChange={(e) => setField("communicationCharges", e.target.value)} className={inputClass} placeholder="e.g. Approx. USD 50 per day" />
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">
                    Acceptance
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input type="text" value={form.acceptanceName} onChange={(e) => setField("acceptanceName", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={form.acceptanceDate030B} onChange={(e) => setField("acceptanceDate030B", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Address</label>
                      <input type="text" value={form.acceptanceAddress} onChange={(e) => setField("acceptanceAddress", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={form.acceptanceEmail} onChange={(e) => setField("acceptanceEmail", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Telephone</label>
                      <input type="text" value={form.acceptanceTelephone} onChange={(e) => setField("acceptanceTelephone", e.target.value)} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>As authorized signatory for</label>
                      <input type="text" value={form.authorizedSignatoryFor} onChange={(e) => setField("authorizedSignatoryFor", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </section>
              </>
            )}

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : editId ? "Update Quotation" : "Save Quotation"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
              >
                Download / Print
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
