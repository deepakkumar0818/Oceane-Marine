import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklistOne from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-001";
import fs from "fs/promises";
import path from "path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const dataStr = formData.get("data");
    
    if (!dataStr) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = JSON.parse(dataStr);

    // Handle signature file upload if provided
    const signatureFile = formData.get("signature");
    let signatureUrl = body.signatureBlock?.signature;

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

    // Prepare the document data
    const documentData = {
      formNo: body.formNo || "OPS-OFD-001",
      revisionNo: body.revisionNo || "",
      revisionDate: body.revisionDate ? new Date(body.revisionDate) : undefined,
      approvedBy: body.approvedBy || "JS",
      page: body.page || "",
      vesselDetails: {
        vesselName: body.vesselName || "",
        shipOperator: body.shipsOperator || "",
        charterer: body.charterer || "",
        stsOrganizer: body.stsOrganizer || "",
        plannedTransferDateTime: body.plannedDateAndTime
          ? new Date(body.plannedDateAndTime)
          : undefined,
        transferLocation: body.transferLocation || "",
        cargo: body.cargo || "",
        constantHeadingOrBerthedShip: body.constantHeadingShip || "",
        manoeuvringOrOuterShip: body.maneuveringShip || "",
        poacOrStsSuperintendent: body.poacStsSuperintendent || "",
        applicableJointPlanOperation:
          body.applicableSpecificJointPlanOperation || "",
      },
      genericChecks: (body.genericChecks || []).map((check) => ({
        clNumber: check.id || check.clNumber,
        description: check.description || "",
        status: check.status ? "YES" : check.notApplicable ? "NOT_APPLICABLE" : "NO",
        remarks: check.userRemark || check.remarks || "",
      })),
      signatureBlock: {
        name: body.signature?.name || "",
        rank: body.signature?.rank || "",
        signature: signatureUrl || "",
        date: body.signature?.date ? new Date(body.signature.date) : undefined,
      },
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklistOne.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-001 checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-001 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
