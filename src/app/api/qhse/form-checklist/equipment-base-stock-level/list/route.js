import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsEquipmentBaseStockLevel from "@/lib/mongodb/models/qhse-form-checklist/StsEquipmentBaseStockLevel";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // Build query
    const query = {};
    
    // Filter by year if provided (using revisionDate)
    if (year) {
      const yearNum = Number.parseInt(year, 10);
      const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${yearNum + 1}-01-01T00:00:00.000Z`);
      query.revisionDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const records = await StsEquipmentBaseStockLevel.find(query)
      .sort({ revisionDate: -1, createdAt: -1 })
      .lean();

    // Get available years from all records
    const allRecords = await StsEquipmentBaseStockLevel.find({ revisionDate: { $exists: true, $ne: null } })
      .select("revisionDate")
      .lean();

    const yearsSet = new Set();
    allRecords.forEach((record) => {
      if (record.revisionDate) {
        const recordYear = new Date(record.revisionDate).getFullYear();
        yearsSet.add(recordYear);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({ 
      success: true, 
      data: records,
      years: years.length > 0 ? years : [new Date().getFullYear()],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
