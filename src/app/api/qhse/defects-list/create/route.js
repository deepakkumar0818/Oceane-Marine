import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import EquipmentDefect from "@/lib/mongodb/models/qhse-defect/EquipmentDefect";

export async function POST(req) {
  await connectDB();

  try {
    const { equipmentDefect, base, actionRequired, targetDate } =
      await req.json();
    if (!equipmentDefect || !base || !actionRequired || !targetDate) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const newEquipmentDefect = await new EquipmentDefect({
      equipmentDefect,
      base,
      actionRequired,
      targetDate,
      status: "Open",
      createdBy: req.user?.id || null,
    }).save();

    return NextResponse.json(
      {
        message: "Equipment defect created successfully",
        data: newEquipmentDefect,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
