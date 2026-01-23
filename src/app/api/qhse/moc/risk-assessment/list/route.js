import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MOCRiskAssessment from "@/lib/mongodb/models/qhse-moc/mocs-riskAssessment";

export async function GET() {
  await connectDB();
  try {
    const uploads = await MOCRiskAssessment.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: uploads });
  } catch (error) {
    console.error("Risk Assessment list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

