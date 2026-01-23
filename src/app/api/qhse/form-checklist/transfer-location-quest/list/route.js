import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSTransferLocationQuest from "@/lib/mongodb/models/qhse-form-checklist/StsTransferLocationQuest";

export async function GET() {
  await connectDB();
  try {
    const list = await STSTransferLocationQuest.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
