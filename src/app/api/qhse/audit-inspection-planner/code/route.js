// code/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import Counter from "@/lib/mongodb/models/generateFormCode";
import AuditInspectionPlanner from "@/lib/mongodb/models/qhse-audit-inspection/AuditInspectionPlanner";

export async function GET() {
  await connectDB();

  try {
    // Peek without incrementing the counter
    const counter = await Counter.findOne({
      key: "AUDIT_INSPECTION_PLANNER",
    });

    const nextSeq = (counter?.seq || 0) + 1;

    // Calculate next version based on existing form count
    const formCount = await AuditInspectionPlanner.countDocuments();
    const nextVersion = (formCount + 1).toFixed(1);

    return NextResponse.json(
      {
        success: true,
        formCode: `QAF-OFD-${String(nextSeq).padStart(3, "0")}`,
        version: nextVersion,
        revisionDate: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
