import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist3A3B from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-003";
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
    const existing = await STSChecklist3A3B.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Handle signature file upload if provided
    const signatureFile = formData.get("signature");
    let signatureUrl = body.signature?.signature || existing.signature?.signature;

    if (signatureFile && typeof signatureFile !== "string" && signatureFile.name) {
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-003"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${signatureFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      signatureUrl = `/uploads/signatures/ops-ofd-003/${fileName}`;
    }

    // Prepare update data
    const updateData = {
      documentInfo: {
        formNo: body.formNo || existing.documentInfo?.formNo || "OPS-OFD-003",
        revisionNo: incrementRevisionForUpdate(existing.documentInfo?.revisionNo),
        issueDate: body.issueDate
          ? new Date(body.issueDate)
          : existing.documentInfo?.issueDate || new Date(),
        approvedBy: body.approvedBy || existing.documentInfo?.approvedBy || "JS",
      },
      transferInfo: {
        constantHeadingShip: body.constantHeadingShip || existing.transferInfo?.constantHeadingShip || "",
        manoeuvringShip: body.manoeuvringShip || existing.transferInfo?.manoeuvringShip || "",
        designatedPOACName: body.designatedPOACName || existing.transferInfo?.designatedPOACName || "",
        stsSuperintendentName: body.stsSuperintendentName || existing.transferInfo?.stsSuperintendentName || "",
        transferDate: body.transferDate
          ? new Date(body.transferDate)
          : existing.transferInfo?.transferDate,
        transferLocation: body.transferLocation || existing.transferInfo?.transferLocation || "",
      },
      checklist3A: (body.checklist3A || existing.checklist3A || []).map((item) => ({
        clNumber: item.clNumber,
        description: item.description || "",
        status: item.status === "YES" ? "YES" : "NO",
        remarks: item.remarks === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : (item.remarks || ""),
      })),
      checklist3B: (body.checklist3B || existing.checklist3B || []).map((item) => ({
        clNumber: item.clNumber,
        description: item.description || "",
        status: item.status === "YES" ? "YES" : "NO",
        remarks: item.remarks === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : (item.remarks || ""),
      })),
      signature: {
        rank: body.signature?.rank || existing.signature?.rank || "",
        signature: signatureUrl || "",
        date: body.signature?.date
          ? new Date(body.signature.date)
          : existing.signature?.date,
      },
      status: body.status || existing.status || "DRAFT",
      createdBy: body.createdBy || existing.createdBy || undefined,
    };

    const updatedChecklist = await STSChecklist3A3B.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "OPS-OFD-003 checklist updated successfully",
        data: updatedChecklist,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-003 update error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
