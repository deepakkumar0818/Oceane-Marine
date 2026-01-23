import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import EquipmentDefect from "@/lib/mongodb/models/qhse-defect/EquipmentDefect";

export async function GET() {
  await connectDB();
  try {
    const equipmentDefects = await EquipmentDefect.find();
    return NextResponse.json({ equipmentDefects });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
