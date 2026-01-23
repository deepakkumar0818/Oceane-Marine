import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import STSTransferLocationQuest from "@/lib/mongodb/models/qhse-form-checklist/StsTransferLocationQuest";

export const runtime = "nodejs";

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
        { error: "Only .docx files are allowed" },
        { status: 400 }
      );
    }

    /* =========================
       GET LATEST VERSION
       (LOCATION-WISE)
    ========================= */
    const latest = await STSTransferLocationQuest.findOne({
      locationName,
    }).sort({ uploadedAt: -1 });

    const nextVersion = getNextVersion(latest?.version);

    /* =========================
       CREATE STORAGE PATH
    ========================= */
    const safeLocation = locationName.replace(/\s+/g, "_");

    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "sts-transfer-location-quest",
      safeLocation,
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    /* =========================
       SAVE FILE
    ========================= */
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullPath = path.join(uploadDir, uniqueFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullPath, buffer);

    /* =========================
       SAVE DB RECORD
    ========================= */
    const record = await STSTransferLocationQuest.create({
      locationName,
      filePath: `uploads/sts-transfer-location-quest/${safeLocation}/v${nextVersion}/${uniqueFileName}`,
      version: nextVersion,
      date: new Date(),
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
    console.error("STS Transfer Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
