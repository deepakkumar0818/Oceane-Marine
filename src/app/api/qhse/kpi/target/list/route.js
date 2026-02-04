import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import TargetKpi from "@/lib/mongodb/models/qhse-kpi/TargetKpi";

export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const all = await TargetKpi.find()
      .select("year formCode createdAt")
      .lean();
    const years = [
      ...new Set(
        all
          .map((i) => i.year)
          .filter((y) => typeof y === "number" && !Number.isNaN(y))
      ),
    ].sort((a, b) => b - a);

    let items;
    if (year) {
      const yr = Number.parseInt(year, 10);
      items = await TargetKpi.find({ year: yr })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      items = await TargetKpi.find().sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json({ success: true, data: items, years });
  } catch (error) {
    console.error("Target KPI list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
