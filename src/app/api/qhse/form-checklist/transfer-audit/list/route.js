import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsTransferAudit from "@/lib/mongodb/models/qhse-form-checklist/StsTransferAudit";


export async function GET() {
  await connectDB();
  try {
    const forms = await StsTransferAudit.find()
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    console.error("Transfer Audit list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

