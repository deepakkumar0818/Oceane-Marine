import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import STSTransferLocationQuest from "@/lib/mongodb/models/qhse-form-checklist/StsTransferLocationQuest";

export const runtime = "nodejs";

/* =========================
   VERSION CALCULATION
   Per Location (CORRECT)
========================= */
function getNextVersion(latestVersion) {
  if (!latestVersion) return "1.0";
  return (parseFloat(latestVersion) + 0.1).toFixed(1);
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const locationName = formData.get("locationName");
    const uploadedByName = formData.get("uploadedByName");
    const uploadedByUserId = formData.get("uploadedByUserId");

    /* =========================
       VALIDATIONS
    ========================= */
    if (!file || !locationName) {
      return NextResponse.json(
        { error: "File and locationName are required" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only Word (.docx) files are allowed" },
        { status: 400 }
      );
    }

    /* =========================
       FETCH LATEST VERSION
       (PER LOCATION)
    ========================= */
    const latestRecord = await STSTransferLocationQuest.findOne({
      locationName,
    }).sort({ uploadedAt: -1 });

    const nextVersion = getNextVersion(latestRecord?.version);

    /* =========================
       FILE STORAGE
    ========================= */
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "sts-transfer-location-quest",
      locationName.replace(/\s+/g, "_"),
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullFilePath = path.join(uploadDir, uniqueFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullFilePath, buffer);

    /* =========================
       DATABASE ENTRY
    ========================= */
    const record = await STSTransferLocationQuest.create({
      filePath: `uploads/sts-transfer-location-quest/${locationName.replace(
        /\s+/g,
        "_"
      )}/v${nextVersion}/${uniqueFileName}`,
      version: nextVersion,
      date: new Date(),
      locationName,
      uploadedBy: {
        userId: uploadedByUserId || null,
        name: uploadedByName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "STS Transfer Location Questionnaire uploaded successfully",
      data: record,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
