import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import KpiUpload from "@/lib/mongodb/models/qhse-kpi/KpiUpload";
import path from "node:path";
import fs from "node:fs/promises";

const ALLOWED_EXT = new Set([".pdf", ".xlsx", ".xls", ".csv", ".doc", ".docx"]);
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !file.name || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 25MB limit" },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Allowed: PDF, Excel (.xlsx, .xls), CSV, Word (.doc, .docx)",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store locally under public/uploads/kpi
    const uploadDir = path.join(process.cwd(), "public", "uploads", "kpi");
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await fs.writeFile(filePath, buffer);
    const publicUrl = `/uploads/kpi/${safeName}`;

    const year = Number.parseInt(formData.get("year"), 10);

    const record = await KpiUpload.create({
      originalName: file.name,
      url: publicUrl,
      localPath: filePath,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      year: Number.isNaN(year) ? undefined : year,
    });

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully",
        data: record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("KPI Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload file",
      },
      { status: 500 }
    );
  }
}


