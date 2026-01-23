
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import RiskAssessment from "@/lib/mongodb/models/qhse-risk-assessment/RiskAssessment";

export async function GET() {
  await connectDB();
  try {
    const items = await RiskAssessment.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}