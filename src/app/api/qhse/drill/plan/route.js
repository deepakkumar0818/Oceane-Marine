import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import DrillPlan from "@/lib/mongodb/models/qhse-drill/DrillPlan";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const getQuarterFromDate = (date) => {
  const d = new Date(date);
  const m = d.getMonth();
  return QUARTERS[Math.floor(m / 3)];
};

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    if (year) {
      // Get drill plan for specific year that has at least one approved planItem
      const plan = await DrillPlan.findOne({
        year: Number.parseInt(year, 10),
        "planItems.status": "Approved",
      }).sort({ createdAt: -1 });

      if (!plan) {
        return NextResponse.json(
          { success: false, error: "No approved drill plan found for this year" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: plan });
    } else {
      // Get all available years (years that have at least one approved planItem)
      const plans = await DrillPlan.find({
        "planItems.status": "Approved",
      }).select("year");
      const years = [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a);

      return NextResponse.json({ success: true, data: years });
    }
  } catch (error) {
    console.error("Get Drill Plan Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { planItems, year } = body;

    if (!Array.isArray(planItems) || planItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "planItems array is required" },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        { success: false, error: "year is required" },
        { status: 400 }
      );
    }

    // Ensure all planned dates belong to the same year
    const years = planItems.map(item =>
      new Date(item.plannedDate).getFullYear()
    );
    if (new Set(years).size > 1) {
      return NextResponse.json(
        { success: false, error: "All plan items must belong to the same year" },
        { status: 400 }
      );
    }

    // Ensure each planItem has status "Draft" (default in schema, but being explicit)
    const normalizedPlanItems = planItems.map((item) => {
      const plannedDate = new Date(item.plannedDate);
      return {
        plannedDate,
        quarter: item.quarter || getQuarterFromDate(plannedDate),
        topic: item.topic?.trim(),
        instructor: item.instructor?.trim(),
        description: item.description?.trim(),
        status: item.status || "Draft",
      };
    });

    // Ensure model is properly initialized
    const DrillPlanModel = DrillPlan || (await import("@/lib/mongodb/models/qhse-drill/DrillPlan")).default;
    
    const newPlan = await DrillPlanModel.create({
      year: Number.parseInt(year, 10),
      planItems: normalizedPlanItems,
    });

    return NextResponse.json(
      { success: true, data: newPlan },
      { status: 201 }
    );
  } catch (error) {
    console.error("Drill Plan Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}