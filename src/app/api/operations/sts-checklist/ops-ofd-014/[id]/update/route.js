import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSEquipmentChecklist from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-014";
import { incrementRevisionForUpdate } from "../../../revision";
import fs from "fs/promises";
import path from "path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const formData = await req.formData();
    const dataStr = formData.get("data");

    if (!dataStr) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = JSON.parse(dataStr);

    const existing = await STSEquipmentChecklist.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Equipment checklist not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Handle signature file upload if provided
    const signatureFile = formData.get("signature");
    let signatureUrl = body.signatureBlock?.mooringMasterSignature || existing.signatureBlock?.mooringMasterSignature;

    if (signatureFile && typeof signatureFile !== "string" && signatureFile.name) {
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-014"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${signatureFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      signatureUrl = `/uploads/signatures/ops-ofd-014/${fileName}`;
    }

    const revisionNo = incrementRevisionForUpdate(existing.documentInfo?.revisionNo);

    const updateData = {
      documentInfo: {
        ...(body.documentInfo || existing.documentInfo || {}),
        revisionNo,
      },
      jobInfo: body.jobInfo || existing.jobInfo || {},
      fenderEquipment: body.fenderEquipment || existing.fenderEquipment || [],
      hoseEquipment: body.hoseEquipment || existing.hoseEquipment || [],
      otherEquipment: body.otherEquipment || existing.otherEquipment || [],
      remarks: body.remarks || existing.remarks || "",
      signatureBlock: {
        mooringMasterSignature: signatureUrl || "",
      },
      status: body.status || existing.status || "DRAFT",
      createdBy: body.createdBy || existing.createdBy || undefined,
    };

    const updatedChecklist = await STSEquipmentChecklist.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "OPS-OFD-014 equipment checklist updated successfully",
        data: updatedChecklist,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-014 update error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
