import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsBaseAuditReport from "@/lib/mongodb/models/qhse-form-checklist/StsBaseAuditReport";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // Build query
    const query = {};
    
    // Filter by year if provided
    if (year) {
      const yearNum = Number.parseInt(year, 10);
      const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${yearNum + 1}-01-01T00:00:00.000Z`);
      query.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const list = await StsBaseAuditReport.find(query)
      .sort({ date: -1, uploadedAt: -1 })
      .lean();

    // Get available years from all reports
    const allReports = await StsBaseAuditReport.find({ date: { $exists: true, $ne: null } })
      .select("date")
      .lean();

    const yearsSet = new Set();
    allReports.forEach((report) => {
      if (report.date) {
        const reportYear = new Date(report.date).getFullYear();
        yearsSet.add(reportYear);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({ 
      success: true, 
      data: list,
      years: years.length > 0 ? years : [new Date().getFullYear()],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
