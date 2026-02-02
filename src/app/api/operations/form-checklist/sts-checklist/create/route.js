import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import StsChecklist from "@/lib/mongodb/models/operations-form-checklist/StsChecklist";

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
    const date = formData.get("date");
    const uploadedByName = formData.get("uploadedBy");

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Get latest version to determine next version
    const latestRecord = await StsChecklist.findOne({}).sort({
      uploadedAt: -1,
    });

    const nextVersion = getNextVersion(latestRecord?.version);

    // Create folder for this version
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "operations",
      "sts-checklist",
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    // Store metadata in MongoDB
    const record = await StsChecklist.create({
      filePath: `uploads/operations/sts-checklist/v${nextVersion}/${uniqueFileName}`,
      version: nextVersion,
      date: new Date(date),
      uploadedBy: { name: uploadedByName || "" },
    });

    return NextResponse.json({
      message: "File uploaded successfully",
      version: nextVersion,
      data: record,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

