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
      { key: "SUPPLIER_DUE_DILIGENCE_QUESTIONNAIRE" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const formCode = `QAF-SDD-${String(counter.seq).padStart(3, "0")}`;

    // Fix: Check if counter.version exists before parsing
    let version;
    if (counter.version) {
      try {
        // Parse version and increment by 0.1
        const versionValue =
          typeof counter.version === "string"
            ? JSON.parse(counter.version)
            : counter.version;
        version = (parseFloat(versionValue) + 0.1).toFixed(1);
      } catch (parseError) {
        // If parsing fails, start from 1.0
        version = "1.0";
      }
    } else {
      // If version doesn't exist, start from 1.0
      version = "1.0";
    }

    // Save the updated version back to database
    await Counter.findOneAndUpdate(
      { key: "SUPPLIER_DUE_DILIGENCE_QUESTIONNAIRE" },
      { $set: { version: JSON.stringify(parseFloat(version)) } },
      { new: true }
    );

    const revisionDate = new Date();

    return NextResponse.json(
      {
        success: true,
        formCode: formCode,
        version: version,
        revisionDate: revisionDate,
      },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Supplier Due Diligence Questionnaire Code Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
