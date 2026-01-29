import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import TrainingPlan from "@/lib/mongodb/models/qhse-training/TrainingPlan";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const monthPair = searchParams.get("monthPair"); // Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec

    if (!planId || !monthPair) {
      return NextResponse.json(
        { success: false, error: "planId and monthPair are required" },
        { status: 400 }
      );
    }

    const validMonthPairs = ["Jan-Feb", "Mar-Apr", "May-Jun", "Jul-Aug", "Sep-Oct", "Nov-Dec"];
    if (!validMonthPairs.includes(monthPair)) {
      return NextResponse.json(
        { success: false, error: `Invalid month pair. Must be one of: ${validMonthPairs.join(", ")}` },
        { status: 400 }
      );
    }

    const plan = await TrainingPlan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Training plan not found" },
        { status: 404 }
      );
    }

    const monthPairFile = plan.monthPairFiles?.[monthPair];
    if (!monthPairFile || !monthPairFile.filePath) {
      return NextResponse.json(
        { success: false, error: `No file found for ${monthPair}` },
        { status: 404 }
      );
    }

    // Fetch the file from Cloudinary URL
    const fileResponse = await fetch(monthPairFile.filePath);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch file from storage" },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileName = monthPairFile.fileName || `training-matrix-${monthPair}.pdf`;

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download Month Pair File Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

