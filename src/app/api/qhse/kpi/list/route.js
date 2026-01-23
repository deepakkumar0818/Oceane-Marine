import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import KpiUpload from "@/lib/mongodb/models/qhse-kpi/KpiUpload";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // Always compute available years
    const all = await KpiUpload.find().select("year createdAt").lean();
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
      items = await KpiUpload.find(
        { year: yr },
        { originalName: 1, url: 1, size: 1, mimeType: 1, createdAt: 1, year: 1 }
      ).sort({ createdAt: -1 });
    } else {
      items = await KpiUpload.find(
        {},
        { originalName: 1, url: 1, size: 1, mimeType: 1, createdAt: 1, year: 1 }
      ).sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, data: items, years });
  } catch (error) {
    console.error("KPI list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}