import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import QhseArchive from "@/lib/mongodb/models/qhse-archive/QhseArchive";

export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const all = await QhseArchive.find().select("year").lean();
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
      items = await QhseArchive.find({ year: yr })
        .sort({ archivedAt: -1 })
        .lean();
    } else {
      const currentYear = new Date().getFullYear();
      items = await QhseArchive.find({
        year: years.length ? years[0] : currentYear,
      })
        .sort({ archivedAt: -1 })
        .lean();
    }

    return NextResponse.json({ success: true, data: items, years });
  } catch (error) {
    console.error("Archive list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
