import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsEquipmentBaseStockLevel from "@/lib/mongodb/models/qhse-form-checklist/StsEquipmentBaseStockLevel";

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { equipmentCategories, revisionDate, status } = body;

    if (!equipmentCategories || !Array.isArray(equipmentCategories)) {
      return NextResponse.json(
        { message: "equipmentCategories is required" },
        { status: 400 }
      );
    }

    /* ---------------------------
       TEMP USER (until auth added)
    ---------------------------- */
    const systemUser = {
      _id: "000000000000000000000001",
      name: "System User",
      role: "EMPLOYEE",
    };

    const form = await StsEquipmentBaseStockLevel.create({
      revisionDate: revisionDate || new Date(),
      equipmentCategories,
      status: status || "PENDING",

      filledBy: {
        user: systemUser._id,
        name: systemUser.name,
        roleAtSubmission: systemUser.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Form created successfully",
        data: form,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Form Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create form",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
