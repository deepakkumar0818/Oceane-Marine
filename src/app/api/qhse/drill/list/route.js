import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import DrillPlan from "@/lib/mongodb/models/qhse-drill/DrillPlan";
import DrillReport from "@/lib/mongodb/models/qhse-drill/DrillReport";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const deriveQuarter = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth();
  return QUARTERS[Math.floor(m / 3)] || null;
};

export async function GET() {
  await connectDB();
  try {
    // Only include Approved plan items (per requirement) but keep the plan container
    const plans = await DrillPlan.find({ "planItems.status": "Approved" })
      .sort({ year: -1 })
      .lean();

    // All reports (latest drillDate wins)
    const reports = await DrillReport.find({}).sort({ drillDate: -1 }).lean();

    // Build a year → quarter map seeded from plans
    const yearMap = new Map();
    plans.forEach((plan) => {
      yearMap.set(plan.year, {
        year: plan.year,
        planId: plan._id,
        formCode: plan.formCode,
        quarters: QUARTERS.map((q) => ({
          quarter: q,
          planItem: plan.planItems?.find((p) => p.quarter === q) || null,
          report: null,
        })),
      });
    });

    // Merge reports; include years that have reports even if no plan
    reports.forEach((r) => {
      const normalizedYear =
        r.year || (r.drillDate ? new Date(r.drillDate).getFullYear() : null);
      const normalizedQuarter =
        r.quarter || (r.drillDate ? deriveQuarter(r.drillDate) : null);
      if (!normalizedYear || !normalizedQuarter) return;

      if (!yearMap.has(normalizedYear)) {
        yearMap.set(normalizedYear, {
          year: normalizedYear,
          planId: null,
          formCode: null,
          quarters: QUARTERS.map((q) => ({
            quarter: q,
            planItem: null,
            report: null,
          })),
        });
      }
      const entry = yearMap.get(normalizedYear);
      const idx = QUARTERS.indexOf(normalizedQuarter);
      if (idx >= 0) {
        const existing = entry.quarters[idx].report;
        // keep the latest by drillDate
        if (
          !existing ||
          (r.drillDate &&
            existing?.drillDate &&
            new Date(r.drillDate) > new Date(existing.drillDate))
        ) {
          entry.quarters[idx].report = {
            ...r,
            year: normalizedYear,
            quarter: normalizedQuarter,
          };
        }
      }
    });

    // Sort years desc
    const data = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Drill list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

