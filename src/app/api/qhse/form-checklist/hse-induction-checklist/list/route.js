import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import HseInductionChecklist from "@/lib/mongodb/models/qhse-form-checklist/HseInductionChecklist";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  await connectDB();
  try {
    const forms = await HseInductionChecklist.find()
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(
      { success: true, data: forms },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("HSE Induction Checklist List Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
