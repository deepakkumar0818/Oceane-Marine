"use client";

import { useState } from "react";
import Link from "next/link";

export default function DefectPlanPage() {
  const [form, setForm] = useState({
    equipmentDefect: "",
    base: "",
    actionRequired: "",
    targetDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/qhse/defects-list/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create equipment defect");
      }

      setMessage("✅ Equipment defect created successfully with status OPEN!");
      setError(null);

      // Reset form
      setForm({
        equipmentDefect: "",
        base: "",
        actionRequired: "",
        targetDate: "",
      });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Something went wrong");
      setMessage(null);
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
              QHSE / Defects List
            </p>
            <h1 className="text-2xl font-bold">Create Equipment Defect</h1>
            <p className="text-xs text-slate-200 mt-1">
              Register a new equipment defect. Status will be{" "}
              <span className="font-semibold text-amber-300">OPEN</span> by default.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <Link
              href="/qhse/defects-list/create/plan"
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Create Defect
            </Link>
            <Link
              href="/qhse/defects-list/create/list"
              className="px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Defect List
            </Link>
          </div>
        </header>

        <main>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Status: <span className="text-emerald-300">Open</span>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Equipment Defect */}
              <div>
                <label
                  htmlFor="equipmentDefect"
                  className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 mb-1.5"
                >
                  Equipment Defect
                </label>
                <textarea
                  id="equipmentDefect"
                  className="w-full rounded-xl bg-slate-900/40 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  rows={3}
                  value={form.equipmentDefect}
                  onChange={(e) =>
                    handleChange("equipmentDefect", e.target.value)
                  }
                  placeholder="Describe the equipment defect"
                  required
                />
              </div>

              {/* Base + Target Date */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="base"
                    className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 mb-1.5"
                  >
                    Base
                  </label>
                  <input
                    id="base"
                    type="text"
                    className="w-full rounded-xl bg-slate-900/40 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    value={form.base}
                    onChange={(e) => handleChange("base", e.target.value)}
                    placeholder="Enter base / location"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetDate"
                    className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 mb-1.5"
                  >
                    Target Date
                  </label>
                  <input
                    id="targetDate"
                    type="date"
                    className="w-full rounded-xl bg-slate-900/40 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    value={form.targetDate}
                    onChange={(e) =>
                      handleChange("targetDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Action Required */}
              <div>
                <label
                  htmlFor="actionRequired"
                  className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 mb-1.5"
                >
                  Action Required
                </label>
                <textarea
                  id="actionRequired"
                  className="w-full rounded-xl bg-slate-900/40 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  rows={3}
                  value={form.actionRequired}
                  onChange={(e) =>
                    handleChange("actionRequired", e.target.value)
                  }
                  placeholder="Describe the corrective action required"
                  required
                />
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

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      equipmentDefect: "",
                      base: "",
                      actionRequired: "",
                      targetDate: "",
                    })
                  }
                  className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                  disabled={submitting}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-orange-500 hover:bg-orange-400 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Defect"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

