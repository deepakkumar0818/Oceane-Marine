import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import Counter from "@/lib/mongodb/models/generateFormCode";

/** Returns the next form code that will be assigned on save (preview only, does not increment). */
export async function GET() {
  await connectDB();

  try {
    const counter = await Counter.findOne({ key: "QHSE_TARGET_KPI" }).lean();
    const nextSeq = (counter?.seq ?? 0) + 1;
    const formCode = `QHSE-TKPI-${String(nextSeq).padStart(4, "0")}`;
    return NextResponse.json({ success: true, formCode });
  } catch (error) {
    console.error("Target KPI code error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
