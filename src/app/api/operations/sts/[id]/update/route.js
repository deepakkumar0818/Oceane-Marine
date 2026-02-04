import { NextResponse } from "next/server";
import cloudinary from "@/lib/config/claudinary";
import { connectDB } from "@/lib/config/connection";
import StsOperation from "@/lib/mongodb/models/StsOperation";
import path from "node:path";

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const existing = await StsOperation.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    if (!existing.isLatest) {
      return NextResponse.json(
        { error: "Only latest version can be updated" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const body = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") body[key] = value;
    });

    const fileFields = [
      "jpo",
      "stblSSQ",
      "ssSSQ",
      "stblIndemnity",
      "ssIndemnity",
      "standingOrder",
      "stsEquipChecklistPriorOps",
      "stsEquipChecklistAfterOps",
      "checklist1",
      "checklist2",
      "checklist3AB",
      "checklist4AF",
      "checklist5AC",
      "checklist6AB",
      "checklist7",
      "stblMasterFeedback",
      "ssMasterFeedback",
      "stsTimesheet",
      "hourlyChecks",
      "incidentReporting",
    ];

    const uploadedFiles = {};

    // Basic file validation
    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
    const ALLOWED_EXTENSIONS = new Set([
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".gif",
      ".doc",
      ".docx",
      ".xlsx",
    ]);
    const ALLOWED_MIME_TYPES = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream", // Allow this as fallback, we'll validate by extension
    ]);

    const RAW_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xlsx"]);

    for (const field of fileFields) {
      const file = formData.get(field);
      if (!file || typeof file === "string") continue;

      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `${field} exceeds 25MB limit` },
          { status: 400 }
        );
      }

      // Validate by extension and mime
      const fileExtension = path.extname(file.name || "").toLowerCase();
      const mime = (file.type || "").toLowerCase();

      const extAllowed =
        !fileExtension || ALLOWED_EXTENSIONS.has(fileExtension);
      const mimeAllowed =
        !mime ||
        (ALLOWED_MIME_TYPES.has(mime) &&
          (mime === "application/octet-stream"
            ? ALLOWED_EXTENSIONS.has(fileExtension)
            : true));

      if (!(extAllowed && mimeAllowed)) {
        return NextResponse.json(
          {
            error: `${field} type not allowed. Allowed: PDF, PNG, JPG, JPEG, WEBP, GIF, DOC, DOCX, XLSX`,
            detail: { name: file.name, ext: fileExtension, mime },
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const isRaw = RAW_EXTENSIONS.has(fileExtension);

      let uploaded;
      if (isRaw) {
        uploaded = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "oceane/sts",
              resource_type: "raw",
              filename_override: file.name.replace(/\.[^.]+$/, ""),
              use_filename: true,
              unique_filename: true,
              type: "upload",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });
      } else {
        // Images → direct stream upload (same as create route)
        uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "oceane/sts",
              resource_type: "image",
            },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(buffer);
        });
      }

      uploadedFiles[field] = uploaded.secure_url;
    }

    // GET LAST VERSION OF THIS OPERATION
    const lastVersion = await StsOperation.findOne({
      parentOperationId: existing.parentOperationId,
    }).sort({ version: -1 });

    const newVersionNumber = Number((lastVersion.version + 0.1).toFixed(1));

    // Mark previous versions as NOT latest
    await StsOperation.updateMany(
      { parentOperationId: existing.parentOperationId },
      { $set: { isLatest: false } }
    );

    // CREATE NEW VERSION ENTRY
    const newVersion = await StsOperation.create({
      ...existing.toObject(),
      ...body,
      ...uploadedFiles,
      _id: undefined, // important: create new document, NOT overwrite
      version: newVersionNumber,
      isLatest: true,
    });

    return NextResponse.json({
      success: true,
      message: "New version created",
      data: newVersion,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
