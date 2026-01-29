import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MOCManagementChange from "@/lib/mongodb/models/qhse-moc/mocs-managementChange";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const query = {};
    if (year) {
      const yearNum = Number.parseInt(year, 10);
      query.initiationDate = {
        $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
        $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
      };
    }

    const moc = await MOCManagementChange.find(query)
      .populate("changeMadeBy", "name email")
      .sort({ createdAt: -1 });

    // Get available years from all MOCs
    const allMocs = await MOCManagementChange.find({
      initiationDate: { $exists: true, $ne: null },
    })
      .select("initiationDate")
      .lean();
    const years = [
      ...new Set(
        allMocs
          .map((m) => new Date(m.initiationDate).getFullYear())
          .filter((y) => !Number.isNaN(y))
      ),
    ].sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      data: moc,
      years: years.length > 0 ? years : [new Date().getFullYear()],
    });
  } catch (error) {
    console.error("MOC list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

