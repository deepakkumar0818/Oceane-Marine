// list/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import AuditInspectionPlanner from "@/lib/mongodb/models/qhse-audit-inspection/AuditInspectionPlanner";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const query = {};
    if (year) {
      const yearNum = Number.parseInt(year, 10);
      query.issueDate = {
        $gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
        $lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
      };
    }

    const list = await AuditInspectionPlanner.find(query).sort({
      createdAt: -1,
    });

    // Get available years from all planners
    const allPlanners = await AuditInspectionPlanner.find({
      issueDate: { $exists: true, $ne: null },
    })
      .select("issueDate")
      .lean();
    const years = [
      ...new Set(
        allPlanners
          .map((p) => new Date(p.issueDate).getFullYear())
          .filter((y) => !Number.isNaN(y))
      ),
    ].sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      data: list,
      years: years.length > 0 ? years : [new Date().getFullYear()],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}