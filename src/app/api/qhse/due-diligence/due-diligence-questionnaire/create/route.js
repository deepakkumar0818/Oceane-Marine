import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import SupplierDueDiligence from "@/lib/mongodb/models/qhse-due-diligence/SupplierDueDiligence";
import path from "path";
import fs from "fs/promises";

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

    // -------------------------
    // 1. Parse JSON data
    // -------------------------
    const body = JSON.parse(formData.get("data"));

    // -------------------------
    // 2. Get signature file
    // -------------------------
    const signatureFile = formData.get("signature");

    if (!signatureFile) {
      return NextResponse.json(
        { error: "Signature is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // -------------------------
    // 3. Save signature file
    // -------------------------
    const bytes = await signatureFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public/uploads/signatures/due-diligence-questionnaire"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${signatureFile.name}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const signatureUrl = `/uploads/signatures/due-diligence-questionnaire/${fileName}`;

    const record = await SupplierDueDiligence.create({
      ...body,
      completedBy: {
        ...body.completedBy,
        signatureUrl,
      },
      status: "Pending",
    });

    return NextResponse.json(
      { success: true, data: record },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
