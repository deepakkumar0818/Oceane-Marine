import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import RiskAssessment from "@/lib/mongodb/models/qhse-risk-assessment/RiskAssessment";

export const runtime = "nodejs";

export async function POST(req) {
  await connectDB();
  try {
    const form = await req.formData();
    const locationName = form.get("locationName");
    const version = form.get("version");
    const file = form.get("file");

    if (!locationName) {
      return NextResponse.json({ error: "locationName is required" }, { status: 400 });
    }
    if (!version) {
      return NextResponse.json({ error: "version is required" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "uploads", "risk-assessment");
    fs.mkdirSync(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const relPath = path.join("uploads", "risk-assessment", fileName);
    const absFsPath = path.join(process.cwd(), relPath);
    fs.writeFileSync(absFsPath, buffer);

    const record = await RiskAssessment.create({
      locationName,
      version,
      filePath: relPath,
      fileName,
      mimeType: file.type,
      fileSize: file.size,
    });

    return NextResponse.json({ message: "Saved", data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}