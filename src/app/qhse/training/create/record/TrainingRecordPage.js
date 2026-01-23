"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ---------------- helpers ---------------- */

// Generate dynamic years
function getYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i < currentYear; i++) years.push(i);
  for (let i = currentYear; i <= currentYear + 5; i++) years.push(i);
  return years;
}

const MONTH_PAIRS = [
  { label: "Jan–Feb", key: "Jan-Feb" },
  { label: "Mar–Apr", key: "Mar-Apr" },
  { label: "May–Jun", key: "May-Jun" },
  { label: "Jul–Aug", key: "Jul-Aug" },
  { label: "Sep–Oct", key: "Sep-Oct" },
  { label: "Nov–Dec", key: "Nov-Dec" },
];

// Normalize date to yyyy-mm-dd
const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

/* ---------------- component ---------------- */

export default function TrainingRecordPage({ hideSidebar = false }) {
  const currentYear = new Date().getFullYear();
  const initialYears = getYears();

  const [availableYears, setAvailableYears] = useState(initialYears);
  const [loadingYears, setLoadingYears] = useState(true);
  const [year, setYear] = useState(currentYear);
  const [selectedPair, setSelectedPair] = useState(0);

  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [creatingFor, setCreatingFor] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState(null);

  const [formData, setFormData] = useState({
    actualTrainingDate: new Date().toISOString().slice(0, 10),
    trainees: [{ name: "", role: "" }],
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  /* ---------------- effects ---------------- */

  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      try {
        const res = await fetch("/api/qhse/training/plan");
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          const merged = Array.from(
            new Set([...initialYears, ...data.data])
          ).sort((a, b) => b - a);
          setAvailableYears(merged);
          if (!merged.includes(year)) setYear(merged[0]);
        }
      } finally {
        setLoadingYears(false);
      }
    };
    loadYears();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPlan = async () => {
      setPlanLoading(true);
      setPlanError(null);
      setCreatingFor(null);
      try {
        const res = await fetch(`/api/qhse/training/plan?year=${year}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "No approved plan for this year");
        }
        if (active) setPlan(data.data);
      } catch (err) {
        if (active) {
          setPlan(null);
          setPlanError(err.message);
        }
      } finally {
        if (active) setPlanLoading(false);
      }
    };
    fetchPlan();
    return () => {
      active = false;
    };
  }, [year]);

  // Fetch records when year changes
  useEffect(() => {
    if (!year) return;
    let active = true;
    const fetchRecords = async () => {
      setLoadingRecords(true);
      setRecordsError(null);
      try {
        const res = await fetch(`/api/qhse/training/record?year=${year}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load training records");
        }
        if (active) setRecords(data.data || []);
      } catch (err) {
        if (active) {
          setRecordsError(err.message);
          setRecords([]);
        }
      } finally {
        if (active) setLoadingRecords(false);
      }
    };
    fetchRecords();
    return () => {
      active = false;
    };
  }, [year]);

  /* ---------------- handlers ---------------- */

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTraineeChange = (index, field, value) => {
    setFormData((prev) => {
      const trainees = [...prev.trainees];
      trainees[index] = { ...trainees[index], [field]: value };
      return { ...prev, trainees };
    });
  };

  const addTrainee = () => {
    setFormData((prev) => ({
      ...prev,
      trainees: [...prev.trainees, { name: "", role: "" }],
    }));
  };

  const removeTrainee = (index) => {
    setFormData((prev) => ({
      ...prev,
      trainees: prev.trainees.filter((_, i) => i !== index),
    }));
  };

  const applyPlanItem = (item, monthPairIndex) => {
    if (!item) return;
    setFormData((prev) => ({
      ...prev,
      actualTrainingDate: toDateInputValue(item.plannedDate),
    }));
    setAttachmentFile(null);
    // Store the month pair index with the item for validation
    setCreatingFor({ ...item, _monthPairIndex: monthPairIndex });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const validTrainees = formData.trainees.filter(
        (t) => t.name.trim() && t.role.trim()
      );

      if (
        !formData.actualTrainingDate ||
        validTrainees.length === 0
      ) {
        throw new Error("Please fill all required fields.");
      }

      const attendance = validTrainees.map((t) => ({
        traineeName: t.name.trim(),
        role: t.role.trim(),
      }));

      // Validate that the plannedDate month matches the expected month pair
      const expectedMonthPairIndex = creatingFor._monthPairIndex;
      if (expectedMonthPairIndex !== undefined && expectedMonthPairIndex !== null) {
        const plannedDateMonth = new Date(creatingFor.plannedDate).getMonth();
        const expectedMonths = MONTH_PAIRS[expectedMonthPairIndex].key.split("-").map((m) => {
          const monthMap = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
          };
          return monthMap[m];
        });
        if (!expectedMonths.includes(plannedDateMonth)) {
          throw new Error(`Planned date month (${plannedDateMonth}) does not match selected month pair (${MONTH_PAIRS[expectedMonthPairIndex].label})`);
        }
      }

      // Create FormData for file upload
      const submitFormData = new FormData();
      submitFormData.append("trainingPlanId", plan._id);
      // Ensure plannedDate is in ISO string format (YYYY-MM-DD)
      const plannedDateStr = creatingFor.plannedDate 
        ? (typeof creatingFor.plannedDate === 'string' 
            ? creatingFor.plannedDate 
            : new Date(creatingFor.plannedDate).toISOString().split("T")[0])
        : "";
      submitFormData.append("plannedDate", plannedDateStr);
      submitFormData.append("topic", creatingFor.topic);
      submitFormData.append("instructor", creatingFor.instructor);
      submitFormData.append("actualTrainingDate", formData.actualTrainingDate);
      submitFormData.append("attendance", JSON.stringify(attendance));
      
      if (attachmentFile) {
        submitFormData.append("attachment", attachmentFile);
      }

      const res = await fetch("/api/qhse/training/record", {
        method: "POST",
        body: submitFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create training record");
      }

      setMessage("✅ Training record saved successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      // Reset form
      setFormData({
        actualTrainingDate: new Date().toISOString().slice(0, 10),
        trainees: [{ name: "", role: "" }],
      });
      setAttachmentFile(null);
      setCreatingFor(null);
      
      // Refresh plan and records
      const refreshRes = await fetch(`/api/qhse/training/plan?year=${year}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.success) {
        setPlan(refreshData.data);
      }
      
      // Refresh records list
      const recordsRes = await fetch(`/api/qhse/training/record?year=${year}`);
      const recordsData = await recordsRes.json();
      if (recordsRes.ok && recordsData.success) {
        setRecords(recordsData.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  const content = (
    <div className="flex-1 ml-72 pr-4">
      <div className="flex-1">
        <div className="mx-auto max-w-[95%] pl-4 pr-4 py-10 space-y-6">
          <header className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
                  QHSE / Training
                </p>
                <h1 className="text-2xl font-bold">Training Record</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-200">
                  Year
                </span>
                <select
                  className="theme-select rounded-full px-3 py-1 text-xs tracking-widest uppercase"
                  value={year || ""}
                  onChange={(e) => setYear(Number(e.target.value))}
                  disabled={loadingYears || availableYears.length === 0}
                >
                  {loadingYears ? (
                    <option>Loading...</option>
                  ) : availableYears.length === 0 ? (
                    <option>No data</option>
                  ) : (
                    availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
                <Link
                  href="/qhse/training/create/plan"
                  className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
                >
                  Training Matrix
                </Link>
                <Link
                  href="/qhse/training/create/record"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
                >
                  Training Record
                </Link>
              </div>
            </div>
          </header>

          {/* Plan list and create-record trigger */}
          <div className="rounded-2xl border border-white/10 bg-[#0b2740]/70 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-lg font-semibold">Monthly Training Plan</h2>
              <div className="flex items-center gap-3">
                {plan && (
                  <span className="text-xs px-2 py-1 rounded-lg border border-white/15 bg-white/5 text-slate-200">
                    Plan year: {plan.year}
                  </span>
                )}
                <span className="text-xs text-slate-300">
                  Select a month pair to create record
                </span>
              </div>
            </div>
            {planLoading && (
              <p className="text-sm text-slate-200">Loading plan…</p>
            )}
            {planError && (
              <div className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3">
                {planError}
              </div>
            )}
            {plan && plan.year !== year && (
              <div className="text-sm text-amber-200 bg-amber-950/40 border border-amber-500/40 rounded-lg px-4 py-2">
                Plan year ({plan.year}) differs from selected year ({year}).
                Switch the selector to match.
              </div>
            )}
            {plan && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {MONTH_PAIRS.map((pair, idx) => {
                  // Match plan item to month pair based on the month of plannedDate
                  // Plan items might not be in array order if some months weren't filled
                  const item = plan.planItems?.find((pi) => {
                    if (!pi?.plannedDate) return false;
                    const month = new Date(pi.plannedDate).getMonth(); // 0-11
                    // Check if this plan item's month belongs to the current month pair
                    const pairMonths = pair.key.split("-").map((m) => {
                      const monthMap = {
                        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
                      };
                      return monthMap[m];
                    });
                    return pairMonths.includes(month);
                  }) || null;
                  
                  return (
                    <div
                      key={pair.key}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{pair.label}</span>
                        <span className="text-xs text-slate-300">
                          {item ? toDateInputValue(item.plannedDate) : "—"}
                        </span>
                      </div>
                      <p className="text-sm text-white/90">
                        {item?.topic || "No plan"}
                      </p>
                      <p className="text-xs text-slate-300">
                        {item?.instructor || ""}
                      </p>
                      <button
                        type="button"
                        disabled={!item}
                        onClick={() => item && applyPlanItem(item, idx)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-orange-400/60 text-orange-200 hover:bg-orange-500/10 disabled:opacity-50"
                      >
                        {item ? "Create record" : "Not planned"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {creatingFor && (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-6"
            >
              {/* Form Fields */}
              <div className="rounded-2xl border border-white/10 bg-[#0b2740]/80 p-6 space-y-6">
                {/* General Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➕</span>
                      <h2 className="text-lg font-semibold">
                        Training record details
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreatingFor(null)}
                      className="text-xs text-slate-200 hover:text-white"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="topic"
                        className="block text-sm font-semibold text-white/90"
                      >
                        Topic :
                      </label>
                      <input
                        id="topic"
                        type="text"
                        value={creatingFor.topic || ""}
                        disabled
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60 placeholder:text-white/50 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="instructor"
                        className="block text-sm font-semibold text-white/90"
                      >
                        Instructor :
                      </label>
                      <input
                        id="instructor"
                        type="text"
                        value={creatingFor.instructor || ""}
                        disabled
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60 placeholder:text-white/50 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="planned-date"
                        className="block text-sm font-semibold text-white/90"
                      >
                        Planned Date :
                      </label>
                      <div className="relative">
                        <input
                          id="planned-date"
                          type="date"
                          value={toDateInputValue(creatingFor.plannedDate)}
                          disabled
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="actual-date"
                        className="block text-sm font-semibold text-white/90"
                      >
                        Actual Training Date :
                      </label>
                      <div className="relative">
                        <input
                          id="actual-date"
                          type="date"
                          value={formData.actualTrainingDate}
                          onChange={(e) =>
                            handleFieldChange("actualTrainingDate", e.target.value)
                          }
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attachment Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold">Attachment</h2>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="attachment"
                      className="block text-sm font-semibold text-white/90"
                    >
                      Upload Document :
                    </label>
                    <input
                      id="attachment"
                      type="file"
                      onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none"
                    />
                    {attachmentFile && (
                      <p className="text-xs text-slate-300">
                        Selected: {attachmentFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trainees Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold">Trainees</h2>
                    <button
                      type="button"
                      onClick={addTrainee}
                      className="px-3 py-1 rounded-lg border border-white/20 bg-white/5 text-xs font-semibold hover:bg-white/10 transition"
                    >
                      + Add Trainee
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.trainees.map((trainee, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1 grid gap-3 md:grid-cols-2">
                          <input
                            type="text"
                            value={trainee.name}
                            onChange={(e) =>
                              handleTraineeChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Trainee Name"
                            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none"
                          />
                          <input
                            type="text"
                            value={trainee.role}
                            onChange={(e) =>
                              handleTraineeChange(
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            placeholder="Role (e.g., Engineer, Manager)"
                            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition outline-none"
                          />
                        </div>
                        {formData.trainees.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTrainee(index)}
                            className="px-3 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="text-base text-emerald-300 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-lg px-6 py-4 flex items-center gap-3 shadow-lg shadow-emerald-500/20">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">{message}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-orange-500 text-sm font-semibold uppercase tracking-[0.2em] shadow-lg shadow-orange-500/40 hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Training Record"}
                </button>
              </div>
            </form>
          )}

          {/* Records List Section */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Training Records for {year}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Plan & records grouped by month pairs
                </p>
              </div>
              {loadingRecords && (
                <span className="text-xs text-slate-300">Loading…</span>
              )}
            </div>

            {recordsError && (
              <div className="text-sm text-red-300 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-3">
                {recordsError}
              </div>
            )}

            {!loadingRecords && !recordsError && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {MONTH_PAIRS.map((pair, idx) => {
                  // Match plan item to month pair based on the month of plannedDate
                  const planItem = plan?.planItems?.find((pi) => {
                    if (!pi?.plannedDate) return false;
                    const month = new Date(pi.plannedDate).getMonth(); // 0-11
                    // Check if this plan item's month belongs to the current month pair
                    const pairMonths = pair.key.split("-").map((m) => {
                      const monthMap = {
                        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
                        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
                      };
                      return monthMap[m];
                    });
                    return pairMonths.includes(month);
                  }) || null;
                  
                  // Find record for this plan item by matching exact plannedDate
                  let record = null;
                  if (planItem && planItem.plannedDate) {
                    const planDateStr = new Date(planItem.plannedDate).toISOString().split("T")[0];
                    record = records.find((r) => {
                      if (!r.plannedDate) return false;
                      const recordDateStr = new Date(r.plannedDate).toISOString().split("T")[0];
                      return recordDateStr === planDateStr;
                    }) || null;
                  }

                  // Only show card if there's a plan item
                  if (!planItem) return null;

                  return (
                    <div
                      key={pair.key}
                      className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {pair.label}
                        </div>
                        {record?.status && (
                          <span className="text-[11px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-200">
                            {record.status}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-400">Planned:</span>{" "}
                          {planItem.plannedDate
                            ? new Date(planItem.plannedDate).toLocaleDateString()
                            : "—"}
                        </div>
                        <div>
                          <span className="text-slate-400">Topic:</span>{" "}
                          {planItem.topic || "—"}
                        </div>
                        <div>
                          <span className="text-slate-400">Instructor:</span>{" "}
                          {planItem.instructor || "—"}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <div className="text-xs text-slate-400 mb-1">
                          Record
                        </div>
                        {record ? (
                          <div className="space-y-1 text-xs text-slate-200">
                            <div>
                              <span className="text-slate-400">Form Code:</span>{" "}
                              {record.formCode || "—"}
                            </div>
                            <div>
                              <span className="text-slate-400">Actual:</span>{" "}
                              {record.actualTrainingDate
                                ? new Date(
                                    record.actualTrainingDate
                                  ).toLocaleDateString()
                                : "—"}
                            </div>
                            <div>
                              <span className="text-slate-400">Status:</span>{" "}
                              {record.status || "—"}
                            </div>
                            {record.attendance && record.attendance.length > 0 && (
                              <div>
                                <span className="text-slate-400">Trainees:</span>{" "}
                                {record.attendance.length}
                              </div>
                            )}
                            {record.attachment?.fileName && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(
                                        `/api/qhse/training/record/${record._id}/download`
                                      );
                                      if (!res.ok) {
                                        throw new Error("Failed to download file");
                                      }
                                      const blob = await res.blob();
                                      const url = globalThis.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = record.attachment.fileName;
                                      document.body.appendChild(a);
                                      a.click();
                                      globalThis.URL.revokeObjectURL(url);
                                      a.remove();
                                    } catch (err) {
                                      alert(err.message || "Failed to download file");
                                    }
                                  }}
                                  className="text-xs text-sky-300 hover:text-sky-200 font-medium px-2 py-1 rounded border border-sky-400/30 hover:bg-sky-400/10 transition"
                                >
                                  📥 Download: {record.attachment.fileName}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">
                            No record yet.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingRecords && !recordsError && records.length === 0 && (
              <div className="text-sm text-slate-300 text-center py-8">
                No training records found for {year}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (hideSidebar) {
    return content;
  }

  return content;
}
