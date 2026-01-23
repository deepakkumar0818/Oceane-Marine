import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSTransferAudit from "@/lib/mongodb/models/qhse-form-checklist/StsTransferAudit";
import path from "path";
import fs from "fs/promises";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const body = JSON.parse(formData.get("data"));
    const signatureFile = formData.get("signature");

    if (!signatureFile) {
      return NextResponse.json(
        { error: "Signature is required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const bytes = await signatureFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public/uploads/signatures/transfer-audit"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${signatureFile.name}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const signatureUrl = `/uploads/signatures/transfer-audit/${fileName}`;

    if (
      !body.header.locationName ||
      !body.header.date ||
      !body.header.jobNo ||
      !body.header.dischargingVessel ||
      !body.header.receivingVessel
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const formPayload = {
      ...body,
      completedBy: {
        ...body.completedBy,
        signatureUrl,
      },
      status: "Pending",
      version: body.version || "1.0",
    };

    const newAudit = await STSTransferAudit.create(formPayload);

    return NextResponse.json(
      {
        message: "STS Transfer Audit created successfully",
        data: newAudit,
      },
      { status: 201, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
