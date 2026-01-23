import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import NewBaseSetupChecklist from "@/lib/mongodb/models/qhse-form-checklist/NewBaseSetupChecklist";

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
    const baseName = formData.get("baseName");
    const uploadedByName = formData.get("uploadedByName");
    const uploadedByUserId = formData.get("uploadedByUserId");

    /* ---------- VALIDATION ---------- */
    if (!file || !baseName) {
      return NextResponse.json(
        { error: "File and baseName are required" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Only .docx files are allowed" },
        { status: 400 }
      );
    }

    /* ---------- FETCH LATEST VERSION (PER BASE) ---------- */
    const latest = await NewBaseSetupChecklist.findOne({
      baseName,
    }).sort({ uploadedAt: -1 });

    const nextVersion = getNextVersion(latest?.version);

    /* ---------- FILE STORAGE ---------- */
    const safeBase = baseName.replace(/\s+/g, "_");

    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "new-base-setup-checklist",
      safeBase,
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullPath = path.join(uploadDir, uniqueFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(fullPath, buffer);

    const record = await NewBaseSetupChecklist.create({
      baseName,
      filePath: `uploads/new-base-setup-checklist/${safeBase}/v${nextVersion}/${uniqueFileName}`,
      version: nextVersion,
      date: new Date(),
      uploadedBy: {
        userId: uploadedByUserId || null,
        name: uploadedByName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New Base Setup Checklist uploaded successfully",
      data: record,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
