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
    const documentKey = formData.get("documentKey"); 
    const uploadedBy = formData.get("uploadedBy");

    if (!file || !documentKey) {
      return NextResponse.json(
        { error: "File and documentKey are required" },
        { status: 400 }
      );
    }

    /* 1️⃣ Get latest version of THIS document */
    const latest = await StsBaseAuditReport.findOne({ documentKey }).sort({
      uploadedAt: -1,
    });

    const nextVersion = getNextVersion(latest?.version);

    /* 2️⃣ Create folder */
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "sts-base-audit",
      documentKey,
      `v${nextVersion}`
    );

    fs.mkdirSync(uploadDir, { recursive: true });

    /* 3️⃣ Save file */
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, buffer);

    /* 4️⃣ Save new DB record */
    const record = await StsBaseAuditReport.create({
      documentKey,
      filePath: `uploads/sts-base-audit/${documentKey}/v${nextVersion}/${file.name}`,
      version: nextVersion,
      date: new Date(),
      uploadedBy: { name: uploadedBy },
    });

    return NextResponse.json({
      message: "Document updated successfully",
      version: nextVersion,
      data: record,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
