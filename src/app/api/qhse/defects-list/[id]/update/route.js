import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import EquipmentDefect from "@/lib/mongodb/models/qhse-defect/EquipmentDefect";

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const equipmentDefect = await EquipmentDefect.findById(id);
    if (!equipmentDefect) {
      return NextResponse.json(
        { error: "Equipment defect not found" },
        { status: 404 }
      );
    }
    if (equipmentDefect.status === "Closed") {
      return NextResponse.json(
        { error: "Equipment defect already closed" },
        { status: 400 }
      );
    }

    equipmentDefect.status = "Closed";
    equipmentDefect.completionDate = new Date();
    equipmentDefect.closedBy = req.user?.id;
    await equipmentDefect.save();

    return NextResponse.json(
      {
        message: "Equipment defect closed successfully",
        data: equipmentDefect,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
