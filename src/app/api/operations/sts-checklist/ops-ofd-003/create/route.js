import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist3A3B from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-003";
import { getNextRevisionForCreate } from "../../revision";
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
    let signatureUrl = body.signature?.signature;

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

    const revisionNo = await getNextRevisionForCreate(STSChecklist3A3B);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        formNo: body.formNo || "OPS-OFD-003",
        revisionNo,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        approvedBy: body.approvedBy || "JS",
      },
      transferInfo: {
        constantHeadingShip: body.constantHeadingShip || "",
        manoeuvringShip: body.manoeuvringShip || "",
        designatedPOACName: body.designatedPOACName || "",
        stsSuperintendentName: body.stsSuperintendentName || "",
        transferDate: body.transferDate ? new Date(body.transferDate) : undefined,
        transferLocation: body.transferLocation || "",
      },
      checklist3A: (body.checklist3A || []).map((item) => ({
        clNumber: item.clNumber,
        description: item.description || "",
        status: item.status === "YES" ? "YES" : "NO",
        remarks: item.remarks === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : (item.remarks || ""),
      })),
      checklist3B: (body.checklist3B || []).map((item) => ({
        clNumber: item.clNumber,
        description: item.description || "",
        status: item.status === "YES" ? "YES" : "NO",
        remarks: item.remarks === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : (item.remarks || ""),
      })),
      signature: {
        rank: body.signature?.rank || "",
        signature: signatureUrl || "",
        date: body.signature?.date ? new Date(body.signature.date) : undefined,
      },
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklist3A3B.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-003 checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-003 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
