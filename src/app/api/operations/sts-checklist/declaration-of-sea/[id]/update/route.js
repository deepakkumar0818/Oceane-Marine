import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSDeclaration from "@/lib/mongodb/models/operation-sts-checklist/DeclarationOfSea";
import { incrementRevisionForUpdate } from "../../../revision";

export async function POST(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await STSDeclaration.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Declaration not found" },
        { status: 404 }
      );
    }

    const revisionNo = incrementRevisionForUpdate(existing.revisionNo);

    const updatedDeclaration = await STSDeclaration.findByIdAndUpdate(
      id,
      {
        ...body,
        revisionNo,
        formNo: existing.formNo || body.formNo,
        version: body.version || existing.version || "1.0",
        status: body.status || existing.status || "Pending",
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Declaration updated successfully.",
      data: updatedDeclaration,
      revisionNo,
    });
  } catch (error) {
    console.error("Declaration of Sea update error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

