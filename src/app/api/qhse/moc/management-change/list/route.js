import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MOCManagementChange from "@/lib/mongodb/models/qhse-moc/mocs-managementChange";

export async function GET() {
  await connectDB();
  try {
    const moc = await MOCManagementChange.find()
      .populate("changeMadeBy", "name email")
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: moc });
  } catch (error) {
    console.error("MOC list error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

