import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import StsBaseAuditReport from "@/lib/mongodb/models/qhse-form-checklist/StsBaseAuditReport";

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
    const description = formData.get("description");
    const uploadedByName = formData.get("uploadedBy");

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const latestRecord = await StsBaseAuditReport.findOne({}).sort({
      uploadedAt: -1,
    });

    const nextVersion = getNextVersion(latestRecord?.version);

    /* Create folder for this version */
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "sts-base-audit",
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    /* Save file */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, buffer);

    /* Store metadata in MongoDB */
    const record = await StsBaseAuditReport.create({
      description,
      filePath: `uploads/sts-base-audit/v${nextVersion}/${file.name}`,
      version: nextVersion,
      date: new Date(),
      uploadedBy: { name: uploadedByName },
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
