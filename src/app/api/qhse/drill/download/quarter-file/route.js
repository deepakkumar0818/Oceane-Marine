import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import DrillPlan from "@/lib/mongodb/models/qhse-drill/DrillPlan";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const quarter = searchParams.get("quarter"); // Q1, Q2, Q3, or Q4

    if (!planId || !quarter) {
      return NextResponse.json(
        { success: false, error: "planId and quarter are required" },
        { status: 400 }
      );
    }

    if (!["Q1", "Q2", "Q3", "Q4"].includes(quarter)) {
      return NextResponse.json(
        { success: false, error: "Invalid quarter. Must be Q1, Q2, Q3, or Q4" },
        { status: 400 }
      );
    }

    const plan = await DrillPlan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Drill plan not found" },
        { status: 404 }
      );
    }

    const quarterFile = plan.quarterFiles?.[quarter];
    if (!quarterFile || !quarterFile.filePath) {
      return NextResponse.json(
        { success: false, error: `No file found for ${quarter}` },
        { status: 404 }
      );
    }

    // Fetch the file from Cloudinary URL
    const fileResponse = await fetch(quarterFile.filePath);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch file from storage" },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileName = quarterFile.fileName || `drill-matrix-${quarter}.pdf`;

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download Quarter File Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

