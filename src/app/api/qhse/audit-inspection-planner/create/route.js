import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/config/connection";
import AuditInspectionPlanner from "@/lib/mongodb/models/qhse-audit-inspection/AuditInspectionPlanner";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "audit-inspection-rows"
);

const ALLOWED_EXT = new Set([
  ".pdf",
  ".xlsx",
  ".xls",
  ".csv",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
]);

const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const rawData = formData.get("data");

    if (!rawData) {
      return NextResponse.json({ error: "Form data missing" }, { status: 400 });
    }

    const body = JSON.parse(rawData);
    const { issueDate, approvedBy, categories } = body;

    if (!issueDate || !approvedBy || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    // Ensure upload folder exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    /* ======================================
       Process row files & inject into rows
    ======================================= */
    for (const cat of categories) {
      for (const row of cat.rows) {
        const file = formData.get(`file_${row.rowId}`);

        if (file && typeof file !== "string") {
          if (file.size > MAX_SIZE) {
            return NextResponse.json(
              { error: `File too large for row ${row.rowId}` },
              { status: 400 }
            );
          }

          const ext = path.extname(file.name).toLowerCase();
          if (!ALLOWED_EXT.has(ext)) {
            return NextResponse.json(
              { error: `Invalid file type for row ${row.rowId}` },
              { status: 400 }
            );
          }

          const safeName = `${Date.now()}-${row.rowId}-${file.name.replace(
            /\s+/g,
            "_"
          )}`;
          const filePath = path.join(UPLOAD_DIR, safeName);

          const buffer = Buffer.from(await file.arrayBuffer());
          fs.writeFileSync(filePath, buffer);

          row.fileUrl = `/uploads/audit-inspection-rows/${safeName}`;
          row.fileName = file.name;
          row.fileUploadedAt = new Date();
        }
      }
    }

    /* ======================================
       Auto-generate version based on form count
    ======================================= */
    const formCount = await AuditInspectionPlanner.countDocuments();
    const nextVersion = (formCount + 1).toFixed(1);

    /* ======================================
       Save full form
    ======================================= */
    const record = await AuditInspectionPlanner.create({
      issueDate,
      approvedBy,
      categories,
      status: "Draft",
      version: nextVersion,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
