import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import TrainingPlan from "@/lib/mongodb/models/qhse-training/TrainingPlan";


export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    if (year) {
      const plan = await TrainingPlan.findOne({
        year: Number.parseInt(year, 10),
        status: "Approved",
      }).sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        data: plan || null,
        message: plan
          ? "Approved training plan found"
          : "No approved training plan for this year",
      });
    }

    // 👉 GET AVAILABLE YEARS (ONLY APPROVED PLANS)
    const plans = await TrainingPlan.find({ status: "Approved" }).select(
      "year"
    );

    const years = [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a);

    return NextResponse.json({ success: true, data: years });
  } catch (error) {
    console.error("Get Training Plan Error:", error);
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

    const { planItems } = body;

    if (!Array.isArray(planItems) || planItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "planItems array is required" },
        { status: 400 }
      );
    }

    const years = planItems.map((item) =>
      new Date(item.plannedDate).getFullYear()
    );

    if (new Set(years).size > 1) {
      return NextResponse.json(
        {
          success: false,
          error: "All plan items must belong to the same year",
        },
        { status: 400 }
      );
    }

    const newPlan = await TrainingPlan.create({
      planItems,
      status: "Approved",
    });

    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (error) {
    console.error("Training Plan Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
