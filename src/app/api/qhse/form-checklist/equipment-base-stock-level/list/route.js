import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsEquipmentBaseStockLevel from "@/lib/mongodb/models/qhse-form-checklist/StsEquipmentBaseStockLevel";

export async function GET() {
  await connectDB();
  try {
    const records = await StsEquipmentBaseStockLevel.find().sort({
      createdAt: -1,
    });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
