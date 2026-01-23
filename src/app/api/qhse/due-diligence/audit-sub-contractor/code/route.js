import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import Counter from "@/lib/mongodb/models/generateFormCode";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  await connectDB();

  try {
    const counter = await Counter.findOne({
      key: "SUB_CONTRACTOR_AUDIT",
    });

    const nextSeq = (counter?.seq || 0) + 1;

    return NextResponse.json(
      {
        success: true,
        formCode: `QAF-SUD-${String(nextSeq).padStart(3, "0")}`,
        version: "1.0",
        revisionDate: new Date(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
