import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import KpiUpload from "@/lib/mongodb/models/qhse-kpi/KpiUpload";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(_req, { params }) {
  await connectDB();

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const record = await KpiUpload.findById(id);
    if (!record) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // If localPath exists, serve the local file
    if (record.localPath) {
      const fileBuffer = await fs.readFile(record.localPath);
      const filename = record.originalName || path.basename(record.localPath) || "file";
      const mime =
        record.mimeType && record.mimeType !== "binary/octet-stream"
          ? record.mimeType
          : "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Fallback: if a URL exists (old Cloudinary uploads), redirect to it
    if (record.url) {
      return NextResponse.redirect(record.url);
    }

    return NextResponse.json(
      { success: false, error: "File location unavailable" },
      { status: 404 }
    );
  } catch (error) {
    console.error("KPI download error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


