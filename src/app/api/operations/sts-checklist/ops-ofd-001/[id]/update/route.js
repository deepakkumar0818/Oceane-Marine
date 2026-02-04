import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklistOne from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-001";
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

    // Get existing checklist
    const existing = await STSChecklistOne.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Handle signature file upload if provided
    const signatureFile = formData.get("signature");
    let signatureUrl = body.signatureBlock?.signature || existing.signatureBlock?.signature;

    if (signatureFile && typeof signatureFile !== "string" && signatureFile.name) {
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-001"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${signatureFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      signatureUrl = `/uploads/signatures/ops-ofd-001/${fileName}`;
    }

    const revisionNo = incrementRevisionForUpdate(existing.revisionNo);

    // Prepare update data
    const updateData = {
      formNo: body.formNo || existing.formNo || "OPS-OFD-001",
      revisionNo,
      revisionDate: body.revisionDate
        ? new Date(body.revisionDate)
        : existing.revisionDate,
      approvedBy: body.approvedBy || existing.approvedBy || "JS",
      page: body.page || existing.page || "",
      vesselDetails: {
        vesselName: body.vesselName || existing.vesselDetails?.vesselName || "",
        shipOperator: body.shipsOperator || existing.vesselDetails?.shipOperator || "",
        charterer: body.charterer || existing.vesselDetails?.charterer || "",
        stsOrganizer: body.stsOrganizer || existing.vesselDetails?.stsOrganizer || "",
        plannedTransferDateTime: body.plannedDateAndTime
          ? new Date(body.plannedDateAndTime)
          : existing.vesselDetails?.plannedTransferDateTime,
        transferLocation: body.transferLocation || existing.vesselDetails?.transferLocation || "",
        cargo: body.cargo || existing.vesselDetails?.cargo || "",
        constantHeadingOrBerthedShip:
          body.constantHeadingShip || existing.vesselDetails?.constantHeadingOrBerthedShip || "",
        manoeuvringOrOuterShip:
          body.maneuveringShip || existing.vesselDetails?.manoeuvringOrOuterShip || "",
        poacOrStsSuperintendent:
          body.poacStsSuperintendent || existing.vesselDetails?.poacOrStsSuperintendent || "",
        applicableJointPlanOperation:
          body.applicableSpecificJointPlanOperation ||
          existing.vesselDetails?.applicableJointPlanOperation ||
          "",
      },
      genericChecks: (body.genericChecks || existing.genericChecks || []).map((check) => ({
        clNumber: check.id || check.clNumber,
        description: check.description || "",
        status: check.status ? "YES" : check.notApplicable ? "NOT_APPLICABLE" : "NO",
        remarks: check.userRemark || check.remarks || "",
      })),
      signatureBlock: {
        name: body.signature?.name || existing.signatureBlock?.name || "",
        rank: body.signature?.rank || existing.signatureBlock?.rank || "",
        signature: signatureUrl || "",
        date: body.signature?.date
          ? new Date(body.signature.date)
          : existing.signatureBlock?.date,
      },
      status: body.status || existing.status || "DRAFT",
      createdBy: body.createdBy || existing.createdBy || undefined,
    };

    const updatedChecklist = await STSChecklistOne.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "OPS-OFD-001 checklist updated successfully",
        data: updatedChecklist,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-001 update error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
