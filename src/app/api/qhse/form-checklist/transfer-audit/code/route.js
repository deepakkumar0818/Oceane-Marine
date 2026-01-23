import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import Counter from "@/lib/mongodb/models/generateFormCode";

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
    const counter = await Counter.findOneAndUpdate(
      { key: "STS_TRANSFER_AUDIT" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;
    const version = "1.0";

    return NextResponse.json(
      {
        success: true,
        formCode: formCode,
        version: version,
        revisionDate: new Date(),
      },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Form Code Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
