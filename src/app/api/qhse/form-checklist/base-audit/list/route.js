import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsBaseAuditReport from "@/lib/mongodb/models/qhse-form-checklist/StsBaseAuditReport";

export async function GET() {
  await connectDB();
  try {
    const list = await StsBaseAuditReport.find();
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
