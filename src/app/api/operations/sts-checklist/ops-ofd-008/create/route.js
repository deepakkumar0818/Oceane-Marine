import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist8 from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-008";
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

    // Handle signature and stamp file uploads if provided
    const signatureFile = formData.get("signature");
    const stampFile = formData.get("stamp");
    let signatureUrl = body.signatureBlock?.signatureImage;
    let stampUrl = body.signatureBlock?.stampImage;

    if (signatureFile && typeof signatureFile !== "string" && signatureFile.name) {
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-008"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${signatureFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      signatureUrl = `/uploads/signatures/ops-ofd-008/${fileName}`;
    }

    if (stampFile && typeof stampFile !== "string" && stampFile.name) {
      const bytes = await stampFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-008"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${stampFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      stampUrl = `/uploads/signatures/ops-ofd-008/${fileName}`;
    }

    // Prepare the document data
    const documentData = {
      documentInfo: body.documentInfo || {
        formNo: "OPS-OFD-008",
        revisionNo: "",
        revisionDate: new Date(),
        approvedBy: "JS",
      },
      jobReference: body.jobReference || "",
      masterName: body.masterName || "",
      vesselName: body.vesselName || "",
      signedDate: body.signedDate ? new Date(body.signedDate) : undefined,
      signedTime: body.signedTime || "",
      timeZoneLabel: body.timeZoneLabel || "LT",
      signatureBlock: {
        signatureImage: signatureUrl || "",
        stampImage: stampUrl || "",
      },
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklist8.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-008 checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-008 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
